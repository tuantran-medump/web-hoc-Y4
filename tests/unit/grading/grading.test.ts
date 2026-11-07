import { expect, it } from 'vitest';
import { parseExamText } from '@/lib/exam-parser';
import { examSamples } from '@/server/db/seed';
import { gradeChoices } from '@/server/exam/grading';
it('awards exact single, multiple, true/false answers and excludes essay points', () => {
  const e = parseExamText(examSamples[0]).exam; const [single, multi, tf, essay] = Object.values(e.questions);
  const result = gradeChoices(e, { [single.id]: { kind: 'choice', keys: ['B'] }, [multi.id]: { kind: 'choice', keys: ['D', 'A'] }, [tf.id]: { kind: 'choice', keys: ['Đúng'] }, [essay.id]: { kind: 'essay', text: 'Test' } });
  expect(result.autoScore).toBe(3); expect(result.perQuestion[essay.id]).toBeUndefined();
});
it('gives zero for partial, duplicate, extra, missing or wrong-kind answers', () => {
  const e = parseExamText(examSamples[0]).exam; const multi = Object.values(e.questions)[1];
  for (const keys of [['A'], ['A', 'D', 'B'], ['A', 'A'], []]) expect(gradeChoices(e, { [multi.id]: { kind: 'choice', keys } }).autoScore).toBe(0);
  expect(gradeChoices(e, { [multi.id]: { kind: 'essay', text: 'A, D' } }).autoScore).toBe(0);
});
