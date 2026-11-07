import type { AnswerEdit, Attempt, ContentBlock, Exam, ExamBackupPayload, Question } from '@/types';

export class ServiceError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function requireValue(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new ServiceError(message, status);
}
export const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(str);
const id = (v: unknown): v is string => str(v) && /^[a-zA-Z0-9_-]+$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const date = (v: unknown) => str(v) && Number.isFinite(Date.parse(v));
const unique = (v: string[]) => new Set(v).size === v.length;
const safeUrl = (v: unknown) => str(v) && (/^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v) || /^\.\//.test(v));
export function isBlocks(v: unknown): v is ContentBlock[] {
  return Array.isArray(v) && v.every(b => object(b) && (
    (b.type === 'text' && str(b.md)) ||
    (b.type === 'image' && safeUrl(b.src) && (b.alt === undefined || str(b.alt)) && (b.width === undefined || finite(b.width)) && (b.height === undefined || finite(b.height))) ||
    (b.type === 'table' && Array.isArray(b.rows) && b.rows.every(strings) && typeof b.hasHeader === 'boolean' && (b.caption === undefined || str(b.caption)) && (b.fallbackImage === undefined || safeUrl(b.fallbackImage)))
  ));
}
export function isQuestion(v: unknown): v is Question {
  if (!object(v) || !id(v.id) || !Number.isInteger(v.number) || Number(v.number) < 1 || !finite(v.points) || !isBlocks(v.stem) || !strings(v.tags)) return false;
  if (v.note !== undefined && !isBlocks(v.note)) return false;
  if (v.modelAnswer !== undefined && !isBlocks(v.modelAnswer)) return false;
  if (v.rubric !== undefined && (!Array.isArray(v.rubric) || !v.rubric.every(r => object(r) && str(r.id) && str(r.label) && finite(r.points)))) return false;
  if (Array.isArray(v.rubric)) {
    const rubric = v.rubric as Array<{ id: string; points: number }>;
    if (!unique(rubric.map(r => r.id)) || Math.abs(rubric.reduce((s, r) => s + r.points, 0) - v.points) > 1e-6) return false;
  }
  if (v.type === 'essay') return true;
  if (!strings(v.correctKeys) || !v.correctKeys.length || !unique(v.correctKeys)) return false;
  if (v.type === 'true_false') return v.correctKeys.length === 1 && ['Đúng', 'Sai'].includes(v.correctKeys[0]);
  if (v.type !== 'mcq_single' && v.type !== 'mcq_multi') return false;
  if (!Array.isArray(v.choices) || v.choices.length < 2 || !v.choices.every(c => object(c) && str(c.key) && /^[A-F]$/.test(c.key) && isBlocks(c.content))) return false;
  const choices = v.choices as Array<{ key: string }>;
  return unique(choices.map(c => c.key)) && v.correctKeys.every(k => choices.some(c => c.key === k)) && (v.type !== 'mcq_single' || v.correctKeys.length === 1);
}
export function isExam(v: unknown): v is Exam {
  if (!object(v) || !id(v.id) || !str(v.title) || !v.title.trim() || !str(v.subject) || !strings(v.tags) || !finite(v.durationSec) || v.durationSec <= 0 || !date(v.createdAt) || !date(v.updatedAt) || !Number.isInteger(v.version) || Number(v.version) < 1 || !object(v.questions)) return false;
  if (v.deletedAt !== undefined && v.deletedAt !== null && !date(v.deletedAt)) return false;
  const questions = v.questions;
  if (!Object.keys(questions).length || !Object.entries(questions).every(([k, q]) => isQuestion(q) && k === q.id)) return false;
  const qs = Object.values(questions) as Question[];
  if (new Set(qs.map(q => q.number)).size !== qs.length) return false;
  const refs = (s: unknown) => object(s) && str(s.id) && str(s.title) && strings(s.questionIds) && unique(s.questionIds) && s.questionIds.every(id => Object.hasOwn(questions, id));
  if (!Array.isArray(v.sections) || !v.sections.every(refs)) return false;
  if (v.mode === 'standard') return true;
  if (v.mode !== 'station' || !Array.isArray(v.stations) || !v.stations.length) return false;
  return v.stations.every(s => refs(s) && object(s) && finite(s.durationSec) && s.durationSec > 0 && isBlocks(s.scenario));
}
export function assertExam(v: unknown): asserts v is Exam { requireValue(isExam(v), 'Đề thi không hợp lệ.'); }
export function assertAttempt(v: unknown): asserts v is Attempt {
  requireValue(object(v) && str(v.id) && str(v.examId) && Number.isInteger(v.examVersion) && Number(v.examVersion) > 0 && ['exam', 'practice'].includes(String(v.mode)) && date(v.startedAt) && date(v.endsAt) && object(v.answers) && object(v.selfGrades) && strings(v.flagged) && ['in_progress', 'submitted', 'graded'].includes(String(v.status)), 'Bài làm không hợp lệ.');
  for (const a of Object.values(v.answers as Record<string, unknown>)) requireValue(object(a) && ((a.kind === 'choice' && strings(a.keys) && unique(a.keys)) || (a.kind === 'essay' && str(a.text))), 'Đáp án bài làm không hợp lệ.');
  for (const g of Object.values(v.selfGrades as Record<string, unknown>)) requireValue(object(g) && strings(g.checkedRubricIds) && finite(g.score) && (g.comment === undefined || str(g.comment)), 'Điểm tự chấm không hợp lệ.');
  for (const k of ['autoScore', 'totalScore', 'currentStationIndex']) requireValue(v[k] === undefined || finite(v[k]), 'Số liệu bài làm không hợp lệ.');
  requireValue(v.pausedRemainingSec === undefined || v.pausedRemainingSec === null || (v.mode === 'practice' && finite(v.pausedRemainingSec)), 'Trạng thái tạm dừng không hợp lệ.');
  requireValue(v.stationEndsAt === undefined || date(v.stationEndsAt), 'Thời gian trạm không hợp lệ.');
  requireValue(v.currentStationIndex === undefined || Number.isInteger(v.currentStationIndex), 'Chỉ số trạm không hợp lệ.');
  requireValue(Date.parse(String(v.endsAt)) >= Date.parse(String(v.startedAt)), 'Mốc kết thúc trước khi bắt đầu.');
  requireValue(v.submittedAt === undefined || date(v.submittedAt), 'Ngày nộp không hợp lệ.');
}
export function assertBackup(v: unknown): asserts v is ExamBackupPayload {
  requireValue(object(v) && v.version === 1 && date(v.exportedAt) && Array.isArray(v.exams) && Array.isArray(v.attempts) && Array.isArray(v.answerEdits), 'Bản sao lưu không hợp lệ hoặc phiên bản không hỗ trợ.');
  v.exams.forEach(assertExam); v.attempts.forEach(assertAttempt);
  const exams = v.exams as Exam[]; const attempts = v.attempts as Attempt[];
  requireValue(unique(exams.map(e => e.id)) && unique(attempts.map(a => a.id)), 'ID bị trùng trong bản sao lưu.');
  for (const a of attempts) requireValue(exams.some(e => e.id === a.examId), 'Bài làm tham chiếu đề không tồn tại.');
  for (const edit of v.answerEdits) {
    requireValue(object(edit) && str(edit.id) && str(edit.examId) && str(edit.questionId) && ['correctKeys', 'modelAnswer', 'rubric', 'note', 'stem', 'choices'].includes(String(edit.field)) && date(edit.editedAt), 'Lịch sử chỉnh sửa không hợp lệ.');
    requireValue(exams.some(e => e.id === edit.examId && Object.hasOwn(e.questions, String(edit.questionId))), 'Lịch sử tham chiếu câu không tồn tại.');
  }
  requireValue(unique((v.answerEdits as AnswerEdit[]).map(e => e.id)), 'ID lịch sử bị trùng.');
}
