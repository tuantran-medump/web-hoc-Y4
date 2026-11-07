import { describe, expect, it } from 'vitest';
import { parseExamPdf, parseExamText, type PdfDocument } from '@/lib/exam-parser';
import { examSamples } from '@/server/db/seed';
describe('exam parser', () => {
  it('parses all question types and sections from the real sample', () => {
    const { exam, issues } = parseExamText(examSamples[0]);
    expect(Object.values(exam.questions).map(q => q.type)).toEqual(['mcq_single', 'mcq_multi', 'true_false', 'essay']);
    expect(exam.sections).toHaveLength(2);
    expect(Object.values(exam.questions)[3].rubric?.reduce((s, r) => s + r.points, 0)).toBe(3);
    expect(Object.values(exam.questions)[3].stem.some(b => b.type === 'table' && b.rows.length === 4)).toBe(true);
    expect(issues.filter(i => i.level === 'error')).toEqual([]);
  });
  it('parses station timing and scenarios', () => {
    const { exam, issues } = parseExamText(examSamples[1]);
    expect(exam.mode).toBe('station'); expect(exam.durationSec).toBe(600);
    expect(exam.stations?.map(s => s.questionIds.length)).toEqual([1, 1]);
    expect(exam.stations?.[0].scenario.length).toBeGreaterThan(0);
    expect(issues.filter(i => i.level === 'error')).toEqual([]);
  });
  it('reports duplicate/nonsequential numbers, absent answers, invalid keys and rubric totals without losing questions', () => {
    const { exam, issues } = parseExamText(`ĐỀ: Bad\nTHỜI GIAN: 10 phút\nCâu 2.\nA. Một\nB. Hai\nĐáp án: F\nCâu 2 (3 điểm).\nĐáp án mẫu: X\nBarem:\n- Ý 1 (1 đ): X\nCâu 4.\nA. X\nB. Y`);
    expect(Object.keys(exam.questions)).toHaveLength(3);
    for (const text of ['trùng', 'không liên tục', 'không nằm', 'barem', 'Thiếu đáp án']) expect(issues.some(i => i.message.includes(text))).toBe(true);
  });
  it('reports missing station time and understands comma decimal points', () => {
    const result = parseExamText('ĐỀ: Trạm\nCHẾ ĐỘ: Trạm\nTRẠM 1. Test\nCâu 1 (0,5 điểm).\nĐáp án mẫu: Test');
    expect(Object.values(result.exam.questions)[0].points).toBe(.5);
    expect(result.issues.some(i => i.message.includes('thiếu thời gian'))).toBe(true);
  });
  it('reads PDF coordinate lines, tracks pages and releases the document', async () => {
    let destroyed = false;
    const pdf: PdfDocument = { numPages: 2, getPage: async n => ({ getTextContent: async () => ({ items: (n === 1 ? ['ĐỀ: PDF', 'THỜI GIAN: 5 phút', 'Câu 1.', 'Đáp án mẫu: Một'] : ['Câu 2.', 'Đáp án mẫu: Hai']).map((str, i) => ({ str, transform: [1, 0, 0, 1, 0, 800 - i * 20] })) }) }), destroy: async () => { destroyed = true; } };
    const result = await parseExamPdf(new ArrayBuffer(1), async () => pdf);
    expect(Object.values(result.exam.questions).map(q => q.sourcePage)).toEqual([1, 2]); expect(destroyed).toBe(true);
  });
  it('fails clearly when PDF dependency is not wired', async () => { await expect(parseExamPdf(new ArrayBuffer(1))).rejects.toThrow('PDF loader'); });
});
