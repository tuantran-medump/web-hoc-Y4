import type { AnswerEdit, AnswerEditableField, AnswerValue, Attempt, Exam, SelfGrade } from '@/types';
import { db, type Database } from '@/server/db';
import { gradeChoices } from './grading';
import { assertExam, isQuestion, object, requireValue } from './validation';

const now = () => new Date().toISOString();
export function createExamService(database: Database = db) {
  const { examRepository: exams, attemptRepository: attempts } = database;
  const getExam = (id: string) => { const e = exams.get(id); requireValue(e, 'Không tìm thấy đề.', 404); return e; };
  const getAttempt = (id: string) => { const a = attempts.get(id); requireValue(a, 'Không tìm thấy bài làm.', 404); return a; };
  const snapshot = (a: Attempt) => { const e = database.examVersion(a.examId, a.examVersion); requireValue(e, 'Không còn phiên bản đề của bài làm này.', 409); return e; };
  function createExam(input: unknown) {
    assertExam(input); requireValue(!exams.get(input.id, true), 'ID đề đã tồn tại.', 409);
    return exams.save({ ...input, createdAt: now(), updatedAt: now(), deletedAt: null, version: 1 });
  }
  function updateExam(id: string, input: unknown) {
    const current = getExam(id); requireValue(object(input), 'Dữ liệu không hợp lệ.');
    requireValue(Object.keys(input).every(k => ['title', 'subject', 'tags', 'durationSec', 'version'].includes(k)), 'Chỉ sửa metadata; câu hỏi phải sửa qua API lịch sử.');
    requireValue(input.version === current.version, 'Đề đã thay đổi; tải lại trước khi lưu.', 409);
    const result = { ...current, ...input, id, version: current.version + 1, updatedAt: now() }; assertExam(result);
    return exams.save(result);
  }
  function editAnswer(id: string, questionId: string, input: unknown) {
    const e = getExam(id); requireValue(Object.hasOwn(e.questions, questionId), 'Không tìm thấy câu.', 404); const q = e.questions[questionId];
    requireValue(object(input) && typeof input.field === 'string' && Object.hasOwn(input, 'value'), 'Cần field và value.');
    requireValue(input.version === e.version, 'Đề đã thay đổi; tải lại trước khi sửa.', 409);
    const fields: AnswerEditableField[] = ['correctKeys', 'modelAnswer', 'rubric', 'note', 'stem', 'choices'];
    requireValue(fields.includes(input.field as AnswerEditableField), 'Không được sửa trường này.');
    const field = input.field as AnswerEditableField;
    const changed = { ...q, [field]: input.value };
    if (field === 'correctKeys' && q.type.startsWith('mcq') && Array.isArray(input.value)) changed.type = input.value.length > 1 ? 'mcq_multi' : 'mcq_single';
    requireValue(isQuestion(changed), 'Nội dung câu hỏi/đáp án không hợp lệ.');
    const edit: AnswerEdit = { id: `${crypto.randomUUID()}_v${e.version + 1}`, examId: id, questionId, field, before: q[field] ?? null, after: input.value, editedAt: now() };
    e.questions[questionId] = changed; e.version++; e.updatedAt = edit.editedAt;
    const result = exams.save(e); exams.addEdit(edit); return { exam: result, edit };
  }
  function undoEdit(id: string, editId: string, version: unknown) {
    const e = getExam(id); const edit = exams.edits(id).find(item => item.id === editId);
    requireValue(edit, 'Không tìm thấy lịch sử.', 404);
    const q = e.questions[edit.questionId];
    requireValue(q && version === e.version && JSON.stringify(q[edit.field] ?? null) === JSON.stringify(edit.after), 'Không thể hoàn tác vì nội dung đã thay đổi.', 409);
    // Null represents a previously absent optional field in the JSON history.
    if (edit.before === null) {
      const changed = { ...q }; delete changed[edit.field];
      requireValue(isQuestion(changed), 'Không thể xoá trường bắt buộc.', 409);
      const reverse: AnswerEdit = { ...edit, id: `${crypto.randomUUID()}_v${e.version + 1}`, before: edit.after, after: null, editedAt: now() };
      e.questions[q.id] = changed; e.version++; e.updatedAt = now(); exams.save(e); exams.addEdit(reverse); return { exam: e, edit: reverse };
    }
    return editAnswer(id, edit.questionId, { field: edit.field, value: edit.before, version });
  }
  function createAttempt(input: unknown) {
    requireValue(object(input) && typeof input.examId === 'string' && (input.mode === 'exam' || input.mode === 'practice'), 'Cần examId và mode exam/practice.');
    const e = getExam(input.examId); const started = Date.now();
    const a: Attempt = { id: crypto.randomUUID(), examId: e.id, examVersion: e.version, mode: input.mode, startedAt: new Date(started).toISOString(), endsAt: new Date(started + e.durationSec * 1000).toISOString(), answers: {}, flagged: [], selfGrades: {}, status: 'in_progress' };
    if (e.mode === 'station' && e.stations?.length) { a.currentStationIndex = 0; a.stationEndsAt = new Date(started + e.stations[0].durationSec * 1000).toISOString(); }
    return attempts.save(a);
  }
  function saveAttempt(id: string, input: unknown) {
    const a = getAttempt(id); const e = snapshot(a); requireValue(object(input), 'Dữ liệu không hợp lệ.');
    requireValue(Object.keys(input).every(k => ['answers', 'flagged', 'selfGrades', 'action'].includes(k)), 'Trường bài làm không được phép thay đổi.');
    const running = a.status === 'in_progress';
    const expired = Date.now() >= Date.parse(a.endsAt) && a.pausedRemainingSec == null;
    const station = e.stations?.[a.currentStationIndex ?? 0];
    if (input.answers !== undefined || input.flagged !== undefined) {
      requireValue(running && !expired && a.pausedRemainingSec == null, 'Không thể sửa bài đã nộp, tạm dừng hoặc hết giờ.', 409);
      if (input.answers !== undefined) {
        requireValue(object(input.answers), 'answers không hợp lệ.');
        for (const [qid, value] of Object.entries(input.answers)) {
          requireValue(Object.hasOwn(e.questions, qid) && object(value), 'Câu trả lời không hợp lệ.'); const q = e.questions[qid];
          if (station && a.mode === 'exam') requireValue(station.questionIds.includes(qid) && Date.now() < Date.parse(a.stationEndsAt!), 'Trạm không còn được sửa.', 409);
          if (q.type === 'essay') requireValue(value.kind === 'essay' && typeof value.text === 'string', 'Cần đáp án tự luận.');
          else {
            const allowed = q.type === 'true_false' ? ['Đúng', 'Sai'] : (q.choices ?? []).map(c => c.key);
            requireValue(value.kind === 'choice' && Array.isArray(value.keys) && value.keys.every(k => typeof k === 'string' && allowed.includes(k)) && new Set(value.keys).size === value.keys.length && (q.type === 'mcq_multi' || value.keys.length <= 1), 'Lựa chọn không hợp lệ.');
          }
          a.answers[qid] = structuredClone(value) as AnswerValue;
        }
      }
      if (input.flagged !== undefined) { requireValue(Array.isArray(input.flagged) && input.flagged.every(id => typeof id === 'string' && Object.hasOwn(e.questions, id)), 'Cờ không hợp lệ.'); a.flagged = [...new Set(input.flagged as string[])]; }
    }
    if (input.action !== undefined) {
      requireValue(running && ['pause', 'resume', 'next_station'].includes(String(input.action)), 'Thao tác không hợp lệ.', 409);
      if (input.action === 'pause') {
        requireValue(a.mode === 'practice' && a.pausedRemainingSec == null && !expired, 'Chỉ tạm dừng bài luyện tập đang chạy.', 409);
        a.pausedRemainingSec = Math.max(0, (Date.parse(a.endsAt) - Date.now()) / 1000);
      } else if (input.action === 'resume') {
        requireValue(a.mode === 'practice' && a.pausedRemainingSec != null, 'Bài chưa tạm dừng.', 409);
        const delta = Date.now() + a.pausedRemainingSec * 1000 - Date.parse(a.endsAt);
        a.endsAt = new Date(Date.parse(a.endsAt) + delta).toISOString();
        if (a.stationEndsAt) a.stationEndsAt = new Date(Date.parse(a.stationEndsAt) + delta).toISOString();
        a.pausedRemainingSec = null;
      } else {
        requireValue(station && a.pausedRemainingSec == null && !expired, 'Không thể chuyển trạm.', 409);
        requireValue(a.mode === 'practice' || Date.now() >= Date.parse(a.stationEndsAt!), 'Trạm hiện tại chưa hết giờ.', 409);
        const index = (a.currentStationIndex ?? 0) + 1; requireValue(e.stations?.[index], 'Đã ở trạm cuối.', 409);
        const start = a.mode === 'exam' ? Date.parse(a.stationEndsAt!) : Date.now();
        a.currentStationIndex = index; a.stationEndsAt = new Date(start + e.stations[index].durationSec * 1000).toISOString();
      }
    }
    if (input.selfGrades !== undefined) {
      requireValue(!running || a.mode === 'practice', 'Chỉ tự chấm sau khi nộp bài.', 409);
      requireValue(object(input.selfGrades), 'Điểm tự chấm không hợp lệ.');
      for (const [qid, value] of Object.entries(input.selfGrades)) {
        requireValue(Object.hasOwn(e.questions, qid), 'Câu tự chấm không tồn tại.'); const q = e.questions[qid];
        requireValue(q?.type === 'essay' && object(value) && Array.isArray(value.checkedRubricIds) && value.checkedRubricIds.every(id => typeof id === 'string' && q.rubric?.some(r => r.id === id)) && (value.comment === undefined || typeof value.comment === 'string'), 'Barem không hợp lệ.');
        const checked = [...new Set(value.checkedRubricIds as string[])];
        const grade: SelfGrade = { checkedRubricIds: checked, score: (q.rubric ?? []).filter(r => checked.includes(r.id)).reduce((s, r) => s + r.points, 0), comment: value.comment as string | undefined };
        a.selfGrades[qid] = grade;
      }
      if (!running) finishGrade(a, e);
    }
    return attempts.save(a);
  }
  function finishGrade(a: Attempt, e: Exam) {
    a.autoScore = gradeChoices(e, a.answers).autoScore;
    a.totalScore = a.autoScore + Object.values(a.selfGrades).reduce((s, g) => s + g.score, 0);
    a.status = Object.values(e.questions).filter(q => q.type === 'essay').every(q => Object.hasOwn(a.selfGrades, q.id)) ? 'graded' : 'submitted';
  }
  function submitAttempt(id: string) {
    const a = getAttempt(id); if (a.status !== 'in_progress') return a;
    const e = snapshot(a); a.submittedAt = now(); a.pausedRemainingSec = null; finishGrade(a, e); return attempts.save(a);
  }
  return { getExam, createExam, updateExam, editAnswer, undoEdit, getAttempt, createAttempt, saveAttempt, submitAttempt };
}
export const examService = createExamService();
