import { examSamples, librarySample } from './seed';
import type { AnswerEdit, Attempt, DashboardBoardState, Exam, ExamBackupPayload, LibraryDoc } from '@/types';
import { parseExamText } from '@/lib/exam-parser';
import { assertBackup, assertExam, requireValue } from '@/server/exam/validation';

export interface ExamRepository {
  list(deleted?: boolean): Exam[]; get(id: string, includeDeleted?: boolean): Exam | undefined;
  save(exam: Exam): Exam; softDelete(id: string): Exam; restore(id: string): Exam;
  edits(examId: string): AnswerEdit[]; addEdit(edit: AnswerEdit): void;
}
export interface AttemptRepository { list(examId?: string): Attempt[]; get(id: string): Attempt | undefined; save(attempt: Attempt): Attempt }
export interface BoardRepository { get(): DashboardBoardState; save(board: DashboardBoardState): DashboardBoardState }
export interface LibraryEntry { doc: LibraryDoc; markdown: string; sharedSources: string }
export interface LibraryRepository { list(deleted?: boolean): LibraryDoc[]; get(id: string): LibraryEntry | undefined; save(entry: LibraryEntry): void }
const clone = <T>(v: T): T => structuredClone(v);

export function createMemoryDatabase(seed = true) {
  const exams = new Map<string, Exam>(); const attempts = new Map<string, Attempt>();
  const edits = new Map<string, AnswerEdit>(); const library = new Map<string, LibraryEntry>();
  // Immutable snapshots keep an ongoing attempt tied to its original answer key.
  const versions = new Map<string, Exam>();
  let board: DashboardBoardState = { columns: [{ id: 'study', title: 'Học tập', order: 0 }], cards: [
    { id: 'exam', columnId: 'study', order: 0, title: 'Thi thử Y4', kind: 'app', href: '/thi' },
    { id: 'library', columnId: 'study', order: 1, title: 'Thư viện Y4', kind: 'app', href: '/tai-lieu' },
  ], updatedAt: new Date().toISOString() };
  const examRepository: ExamRepository = {
    list: (deleted = false) => clone([...exams.values()].filter(e => Boolean(e.deletedAt) === deleted)),
    get: (id, includeDeleted = false) => { const e = exams.get(id); return e && (!e.deletedAt || includeDeleted) ? clone(e) : undefined; },
    save: e => { assertExam(e); exams.set(e.id, clone(e)); versions.set(`${e.id}:${e.version}`, clone(e)); return clone(e); },
    softDelete: id => { const e = examRepository.get(id); requireValue(e, 'Không tìm thấy đề.', 404); e.deletedAt = new Date().toISOString(); e.updatedAt = e.deletedAt; exams.set(id, clone(e)); return e; },
    restore: id => { const e = examRepository.get(id, true); requireValue(e, 'Không tìm thấy đề.', 404); requireValue(!e.deletedAt || Date.now() - Date.parse(e.deletedAt) <= 30 * 86400000, 'Đã quá 30 ngày khôi phục.', 409); e.deletedAt = null; e.updatedAt = new Date().toISOString(); exams.set(id, clone(e)); return e; },
    edits: id => clone([...edits.values()].filter(e => e.examId === id)),
    addEdit: e => { edits.set(e.id, clone(e)); },
  };
  const attemptRepository: AttemptRepository = {
    list: id => clone([...attempts.values()].filter(a => !id || a.examId === id)),
    get: id => { const a = attempts.get(id); return a ? clone(a) : undefined; },
    save: a => { attempts.set(a.id, clone(a)); return clone(a); },
  };
  const boardRepository: BoardRepository = { get: () => clone(board), save: value => { board = clone(value); return clone(board); } };
  const libraryRepository: LibraryRepository = {
    list: (deleted = false) => clone([...library.values()].map(e => e.doc).filter(d => Boolean(d.deletedAt) === deleted)),
    get: id => { const e = library.get(id); return e ? clone(e) : undefined; },
    save: entry => { library.set(entry.doc.id, clone(entry)); },
  };
  const backup = (): ExamBackupPayload => ({ version: 1, exportedAt: new Date().toISOString(), exams: clone([...exams.values()]), attempts: attemptRepository.list(), answerEdits: clone([...edits.values()]) });
  const restoreBackup = (payload: unknown) => {
    assertBackup(payload);
    // Validate everything before mutation; additive restore refuses overwrites.
    requireValue(payload.exams.every(e => !exams.has(e.id)) && payload.attempts.every(a => !attempts.has(a.id)) && payload.answerEdits.every(e => !edits.has(e.id)), 'Bản sao lưu trùng ID dữ liệu hiện có.', 409);
    const snapshots: Exam[] = [];
    for (const a of payload.attempts) {
      const current = payload.exams.find(e => e.id === a.examId)!;
      requireValue(a.examVersion <= current.version, 'Bài làm tham chiếu phiên bản đề không hợp lệ.');
      if (a.examVersion === current.version) continue;
      const snapshot = clone(current);
      const history = payload.answerEdits.filter(edit => edit.examId === current.id);
      // Revision is part of the opaque edit ID, preserving snapshots within the fixed backup contract.
      const revisions = history.map(edit => ({ edit, revision: Number(edit.id.match(/_v(\d+)$/)?.[1]) }));
      requireValue(revisions.every(item => Number.isInteger(item.revision) && item.revision > 1 && item.revision <= current.version), 'Lịch sử thiếu phiên bản để khôi phục bài làm cũ.');
      for (const { edit } of revisions.filter(item => item.revision > a.examVersion).sort((a, b) => b.revision - a.revision)) {
        const q = snapshot.questions[edit.questionId];
        if (edit.before === null) delete q[edit.field];
        else Object.assign(q, { [edit.field]: clone(edit.before) });
        if (q.type.startsWith('mcq')) q.type = (q.correctKeys?.length ?? 0) > 1 ? 'mcq_multi' : 'mcq_single';
      }
      snapshot.version = a.examVersion; assertExam(snapshot); snapshots.push(snapshot);
    }
    payload.exams.forEach(e => examRepository.save(e)); payload.attempts.forEach(a => attemptRepository.save(a)); payload.answerEdits.forEach(e => examRepository.addEdit(e));
    snapshots.forEach(e => versions.set(`${e.id}:${e.version}`, clone(e)));
    return { exams: payload.exams.length, attempts: payload.attempts.length, answerEdits: payload.answerEdits.length };
  };
  if (seed) {
    examSamples.forEach((s, i) => { const e = parseExamText(s).exam; e.id = `sample-exam-${i + 1}`; examRepository.save(e); });
    const md = librarySample;
    if (md) libraryRepository.save({ doc: { id: 'sample-library', driveFileId: 'sample-library', title: 'Suy tim mạn — Chẩn đoán và điều trị', folderPath: 'Noi-khoa', tags: ['noi-khoa', 'tim-mach'], driveModifiedTime: new Date().toISOString(), syncedAt: new Date().toISOString(), contentHash: 'sample' }, markdown: md, sharedSources: '' });
  }
  return { examRepository, attemptRepository, boardRepository, libraryRepository, backup, restoreBackup,
    examVersion: (id: string, version: number) => { const e = versions.get(`${id}:${version}`); return e ? clone(e) : undefined; } };
}
export type Database = ReturnType<typeof createMemoryDatabase>;
const globalDb = globalThis as typeof globalThis & { y4Database?: Database };
export const db = globalDb.y4Database ??= createMemoryDatabase();
