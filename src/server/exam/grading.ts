import type { AnswerValue, Exam } from '@/types';

/** Exact set comparison: duplicate or extra selected keys never earn points. Essays are self graded. */
export function gradeChoices(exam: Exam, answers: Record<string, AnswerValue>): { autoScore: number; perQuestion: Record<string, number> } {
  const perQuestion: Record<string, number> = {};
  let autoScore = 0;
  for (const q of Object.values(exam.questions)) {
    if (q.type === 'essay') continue;
    const answer = answers[q.id];
    const expected = q.correctKeys ?? [];
    const keys = answer?.kind === 'choice' ? answer.keys : [];
    const correct = expected.length > 0 && keys.length === expected.length && new Set(keys).size === keys.length && expected.every(k => keys.includes(k));
    const score = correct ? q.points : 0;
    perQuestion[q.id] = score; autoScore += score;
  }
  return { autoScore, perQuestion };
}
