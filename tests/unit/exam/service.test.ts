import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryDatabase } from '@/server/db';
import { createExamService } from '@/server/exam';
function setup() { const db = createMemoryDatabase(); const service = createExamService(db); const e = db.examRepository.list()[0]; return { db, service, e, q: Object.values(e.questions)[0] }; }
afterEach(() => vi.useRealTimers());
describe('exam service', () => {
  it('records edits, rejects stale versions, undoes and preserves attempt answer snapshots', () => {
    const { db, service, e, q } = setup();
    const a = service.createAttempt({ examId: e.id, mode: 'exam' }); service.saveAttempt(a.id, { answers: { [q.id]: { kind: 'choice', keys: ['B'] } } });
    const edited = service.editAnswer(e.id, q.id, { field: 'correctKeys', value: ['A'], version: e.version });
    expect(edited.exam.version).toBe(2); expect(db.examRepository.edits(e.id)[0].before).toEqual(['B']);
    expect(() => service.editAnswer(e.id, q.id, { field: 'correctKeys', value: ['C'], version: 1 })).toThrow('thay đổi');
    expect(service.submitAttempt(a.id).autoScore).toBe(1);
    expect(service.undoEdit(e.id, edited.edit.id, 2).exam.questions[q.id].correctKeys).toEqual(['B']);
    expect(db.examRepository.edits(e.id)).toHaveLength(2);
  });
  it('rejects invalid edits and unsafe input without mutating history', () => {
    const { db, service, e, q } = setup();
    expect(() => service.editAnswer(e.id, q.id, { field: 'correctKeys', value: ['F'], version: 1 })).toThrow();
    expect(() => service.updateExam(e.id, { questions: {}, version: 1 })).toThrow(); expect(db.examRepository.edits(e.id)).toHaveLength(0);
  });
  it('locks submitted answers, computes rubric score itself and submits idempotently', () => {
    const { service, e, q } = setup(); const essay = Object.values(e.questions)[3];
    const a = service.createAttempt({ examId: e.id, mode: 'exam' }); service.submitAttempt(a.id);
    expect(() => service.saveAttempt(a.id, { answers: { [q.id]: { kind: 'choice', keys: ['B'] } } })).toThrow();
    const result = service.saveAttempt(a.id, { selfGrades: { [essay.id]: { checkedRubricIds: [essay.rubric![0].id, essay.rubric![0].id], score: 999 } } });
    expect(result.totalScore).toBe(1); expect(result.status).toBe('graded'); expect(service.submitAttempt(a.id)).toEqual(result);
  });
  it('saves multiple answers atomically when one is invalid', () => {
    const { service, e, q } = setup(); const a = service.createAttempt({ examId: e.id, mode: 'exam' });
    expect(() => service.saveAttempt(a.id, { answers: { [q.id]: { kind: 'choice', keys: ['B'] }, missing: { kind: 'choice', keys: ['A'] } } })).toThrow();
    expect(service.getAttempt(a.id).answers).toEqual({});
  });
});
describe('server timing', () => {
  it('enforces absolute expiry and derives pause/resume times for practice only', () => {
    vi.useFakeTimers(); const { service, e, q } = setup();
    const a = service.createAttempt({ examId: e.id, mode: 'practice' }); vi.advanceTimersByTime(60000);
    const paused = service.saveAttempt(a.id, { action: 'pause' }); expect(paused.pausedRemainingSec).toBe(1740);
    vi.advanceTimersByTime(3600000); const resumed = service.saveAttempt(a.id, { action: 'resume' });
    expect(Date.parse(resumed.endsAt) - Date.now()).toBe(1740000);
    vi.advanceTimersByTime(1740000);
    expect(() => service.saveAttempt(a.id, { answers: { [q.id]: { kind: 'choice', keys: ['B'] } } })).toThrow('hết giờ');
    expect(service.submitAttempt(a.id).status).toBe('submitted');
    const examAttempt = service.createAttempt({ examId: e.id, mode: 'exam' }); expect(() => service.saveAttempt(examAttempt.id, { action: 'pause' })).toThrow();
  });
  it('preserves OSCE boundaries when the next-station request is delayed', () => {
    vi.useFakeTimers(); const db = createMemoryDatabase(); const service = createExamService(db); const e = db.examRepository.list()[1];
    const a = service.createAttempt({ examId: e.id, mode: 'exam' });
    expect(() => service.saveAttempt(a.id, { action: 'next_station' })).toThrow();
    vi.advanceTimersByTime(350000); const next = service.saveAttempt(a.id, { action: 'next_station' });
    expect(next.currentStationIndex).toBe(1); expect(Date.parse(next.stationEndsAt!) - Date.now()).toBe(250000);
  });
});
