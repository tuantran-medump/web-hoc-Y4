import { describe, expect, it } from 'vitest';
import { createMemoryDatabase } from '@/server/db';
import { createExamService } from '@/server/exam';
describe('memory repositories', () => {
  it('seeds actual Y4 examples and returns isolated copies', () => {
    const db = createMemoryDatabase(); expect(db.examRepository.list()).toHaveLength(2); expect(db.libraryRepository.list()).toHaveLength(1);
    const e = db.examRepository.list()[0]; e.title = 'changed'; expect(db.examRepository.get(e.id)?.title).not.toBe('changed');
    const board = db.boardRepository.get(); board.cards[0].title = 'changed'; expect(db.boardRepository.get().cards[0].title).not.toBe('changed');
  });
  it('soft deletes and restores without losing attempts or history', () => {
    const db = createMemoryDatabase(); const e = db.examRepository.list()[0]; const service = createExamService(db); const a = service.createAttempt({ examId: e.id, mode: 'exam' });
    db.examRepository.softDelete(e.id); expect(db.examRepository.get(e.id)).toBeUndefined(); expect(db.examRepository.list(true)).toHaveLength(1);
    expect(db.attemptRepository.get(a.id)).toBeDefined(); db.examRepository.restore(e.id); expect(db.examRepository.get(e.id)?.deletedAt).toBeNull();
  });
  it('round trips JSON and refuses invalid or conflicting restore atomically', () => {
    const source = createMemoryDatabase(); const backup = JSON.parse(JSON.stringify(source.backup()));
    const target = createMemoryDatabase(false); expect(target.restoreBackup(backup).exams).toBe(2);
    expect(() => target.restoreBackup(backup)).toThrow('trùng'); expect(target.examRepository.list()).toHaveLength(2);
    const invalid = structuredClone(backup); invalid.exams[1].questions = {}; const empty = createMemoryDatabase(false);
    expect(() => empty.restoreBackup(invalid)).toThrow(); expect(empty.examRepository.list()).toHaveLength(0);
  });
  it('preserves an in-progress attempt answer key across backup after editing the exam', () => {
    const source = createMemoryDatabase(); const service = createExamService(source); const e = source.examRepository.list()[0]; const q = Object.values(e.questions)[0];
    const a = service.createAttempt({ examId: e.id, mode: 'exam' });
    service.saveAttempt(a.id, { answers: { [q.id]: { kind: 'choice', keys: ['B'] } } });
    service.editAnswer(e.id, q.id, { field: 'correctKeys', value: ['A'], version: 1 });
    service.updateExam(e.id, { title: 'New title', version: 2 });
    const restored = createMemoryDatabase(false); restored.restoreBackup(JSON.parse(JSON.stringify(source.backup())));
    expect(createExamService(restored).submitAttempt(a.id).autoScore).toBe(1);
  });
});
