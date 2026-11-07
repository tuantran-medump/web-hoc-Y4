import type { ContentBlock, Exam, ExamSection, ParseIssue, ParseResult, Question, Station } from '@/types';

const blocks = (md: string): ContentBlock[] => md.trim() ? [{ type: 'text', md: md.trim() }] : [];
const number = (s: string) => Number(s.replace(',', '.'));

/** Markers are recognized only at the start of a line. Duplicate question numbers retain distinct IDs. */
export function parseExamText(rawText: string): ParseResult {
  const now = new Date().toISOString();
  const exam: Exam = { id: crypto.randomUUID(), title: '', subject: '', tags: [], mode: 'standard', durationSec: 0,
    sections: [], questions: {}, createdAt: now, updatedAt: now, version: 1 };
  const issues: ParseIssue[] = [];
  let question: Question | undefined;
  let section: ExamSection | undefined;
  let station: Station | undefined;
  let target: ContentBlock[] | undefined;
  let page = 1;
  let pendingCaption: string | undefined;
  const add = (text: string) => {
    if (!target || !text.trim()) return;
    if (text.startsWith('|')) {
      if (/^\|[\s:|\-]+\|$/.test(text)) return;
      const cells = text.replace(/^\||\|$/g, '').split('|').map(s => s.trim());
      const last = target.at(-1);
      if (last?.type === 'table') last.rows.push(cells);
      else target.push({ type: 'table', rows: [cells], hasHeader: true, caption: pendingCaption });
      pendingCaption = undefined;
    } else {
      const last = target.at(-1);
      if (last?.type === 'text') last.md += '\n' + text;
      else target.push(...blocks(text));
    }
  };
  for (const raw of rawText.normalize('NFC').replace(/\r/g, '').split('\n')) {
    page += (raw.match(/\f/g) ?? []).length;
    const line = raw.replace(/\f/g, '').trim();
    if (!line || line === '---') continue;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^ĐỀ:\s*(.*)$/i))) { exam.title = m[1]; continue; }
    if ((m = line.match(/^MÔN:\s*(.*)$/i))) { exam.subject = m[1]; continue; }
    if ((m = line.match(/^THỜI GIAN:\s*([\d.,]+)/i))) { exam.durationSec = number(m[1]) * 60; continue; }
    if ((m = line.match(/^CHẾ ĐỘ:\s*(.*)$/i))) { exam.mode = /^Trạm/i.test(m[1]) ? 'station' : 'standard'; continue; }
    if ((m = line.match(/^TAG:\s*(.*)$/i))) { (question ?? exam).tags = m[1].split(',').map(s => s.trim()).filter(Boolean); continue; }
    if ((m = line.match(/^PHẦN\s+[IVXLCDM]+\.\s*(.*)$/i))) {
      section = { id: crypto.randomUUID(), title: line, questionIds: [] }; exam.sections.push(section);
      question = undefined; target = undefined; pendingCaption = undefined; continue;
    }
    if ((m = line.match(/^TRẠM\s+\d+(?:\s*\(([\d.,]+)\s*phút\))?\.\s*(.*)$/i))) {
      station = { id: crypto.randomUUID(), title: m[2], durationSec: m[1] ? number(m[1]) * 60 : 0, scenario: [], questionIds: [] };
      (exam.stations ??= []).push(station); question = undefined; target = station.scenario; pendingCaption = undefined;
      if (!station.durationSec) issues.push({ level: 'error', message: `Trạm ${m[2]} thiếu thời gian.` });
      continue;
    }
    if ((m = line.match(/^Tình huống:\s*(.*)$/i))) { target = station?.scenario; add(m[1]); continue; }
    if ((m = line.match(/^Câu\s+(\d+)(?:\s*\(([\d.,]+)\s*điểm\))?\.\s*(.*)$/i))) {
      question = { id: crypto.randomUUID(), number: Number(m[1]), type: 'essay', points: m[2] ? number(m[2]) : 1,
        stem: blocks(m[3]), tags: [], sourcePage: page };
      exam.questions[question.id] = question;
      if (!section) { section = { id: crypto.randomUUID(), title: 'Câu hỏi', questionIds: [] }; exam.sections.push(section); }
      section.questionIds.push(question.id); station?.questionIds.push(question.id); target = question.stem; pendingCaption = undefined; continue;
    }
    if (!question) { add(line); continue; }
    if ((m = line.match(/^([A-F])\.\s*(.*)$/))) {
      const choice = { key: m[1], content: blocks(m[2]) }; (question.choices ??= []).push(choice);
      question.type = (question.correctKeys?.length ?? 0) > 1 ? 'mcq_multi' : 'mcq_single'; target = choice.content; continue;
    }
    if ((m = line.match(/^Đ\/S:\s*(.*)$/i))) { question.type = 'true_false'; target = question.stem; add(m[1]); continue; }
    if ((m = line.match(/^Đáp án mẫu:\s*(.*)$/i))) { question.modelAnswer = blocks(m[1]); target = question.modelAnswer; continue; }
    if ((m = line.match(/^Đáp án:\s*(.*)$/i))) {
      question.correctKeys = m[1].split(',').map(s => s.trim()).filter(Boolean).map(s => /^đúng$/i.test(s) ? 'Đúng' : /^sai$/i.test(s) ? 'Sai' : s.toUpperCase());
      if (question.type !== 'true_false') question.type = question.correctKeys.length > 1 ? 'mcq_multi' : 'mcq_single';
      target = undefined; continue;
    }
    if (/^Barem:/i.test(line)) { question.rubric ??= []; target = undefined; continue; }
    if ((m = line.match(/^-\s*Ý\s+\d+\s*\(([\d.,]+)\s*đ\):\s*(.*)$/i))) {
      (question.rubric ??= []).push({ id: crypto.randomUUID(), label: m[2], points: number(m[1]) }); continue;
    }
    if ((m = line.match(/^Ghi chú:\s*(.*)$/i))) { question.note = blocks(m[1]); target = question.note; continue; }
    if (/^Bảng\s+\d+:/i.test(line)) { pendingCaption = line; continue; }
    if (/^Hình\s+\d+:/i.test(line)) {
      issues.push({ level: 'warning', questionNumber: question.number, page, message: `${line} — kiểm tra và bổ sung ảnh gốc.` });
    }
    add(line);
  }
  if (!exam.title) issues.push({ level: 'error', message: 'Thiếu tên đề (ĐỀ:).' });
  if (!Object.keys(exam.questions).length) issues.push({ level: 'error', message: 'Không tìm thấy câu hỏi; PDF scan cần OCR.' });
  if (exam.mode === 'station') {
    exam.durationSec = (exam.stations ?? []).reduce((s, t) => s + t.durationSec, 0);
    if (!exam.stations?.length) issues.push({ level: 'error', message: 'Đề trạm không có trạm.' });
  }
  if (exam.durationSec <= 0) issues.push({ level: 'error', message: 'Thiếu thời gian làm bài.' });
  const seen = new Set<number>();
  Object.values(exam.questions).forEach((q, index) => {
    const issue = (message: string) => issues.push({ level: 'error', questionNumber: q.number, page: q.sourcePage, message });
    if (seen.has(q.number)) issue('Đánh số câu trùng.');
    if (q.number !== index + 1) issue('Đánh số câu không liên tục.');
    seen.add(q.number);
    if (q.type === 'essay') { if (!q.modelAnswer?.length) issue('Thiếu đáp án mẫu.'); }
    else {
      if (!q.correctKeys?.length || q.correctKeys.includes('?')) issue('Thiếu đáp án.');
      const allowed = q.type === 'true_false' ? ['Đúng', 'Sai'] : (q.choices ?? []).map(c => c.key);
      if (q.correctKeys?.some(k => !allowed.includes(k))) issue('Đáp án không nằm trong lựa chọn.');
      if (new Set(q.choices?.map(c => c.key)).size !== q.choices?.length && q.choices) issue('Lựa chọn bị trùng.');
    }
    if (q.rubric?.length && Math.abs(q.rubric.reduce((s, r) => s + r.points, 0) - q.points) > 1e-6) issue('Tổng điểm barem khác điểm câu.');
  });
  return { exam, issues };
}

export interface PdfPageText { items: Array<{ str?: string; transform?: number[]; hasEOL?: boolean }> }
export interface PdfDocument { numPages: number; getPage(n: number): Promise<{ getTextContent(): Promise<PdfPageText> }>; destroy(): Promise<void> }
export type PdfLoader = (data: Uint8Array) => Promise<PdfDocument>;

/** Inject the pdfjs loader from the app's dependency boundary. No server-only imports in this parser. */
export async function parseExamPdf(file: ArrayBuffer, loadPdf?: PdfLoader): Promise<ParseResult> {
  if (!loadPdf) throw new Error('Chưa cấu hình PDF loader. Orchestrator cần cài pdfjs-dist và truyền loader getDocument().promise.');
  const doc = await loadPdf(new Uint8Array(file));
  try {
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const { items } = await (await doc.getPage(n)).getTextContent();
      let y: number | undefined; let line = ''; const lines: string[] = [];
      for (const item of items) {
        if (typeof item.str !== 'string') continue;
        const nextY = item.transform?.[5];
        if (line && y !== undefined && nextY !== undefined && Math.abs(y - nextY) > 2) { lines.push(line); line = ''; }
        line += (line ? ' ' : '') + item.str; y = nextY;
        if (item.hasEOL) { lines.push(line); line = ''; y = undefined; }
      }
      if (line) lines.push(line);
      pages.push(lines.join('\n'));
    }
    const result = parseExamText(pages.join('\n\f\n'));
    result.issues.push({ level: 'warning', message: 'PDF hiện trích lớp chữ; ảnh và bảng theo tọa độ cần kiểm tra trên bản gốc.' });
    return result;
  } finally { await doc.destroy(); }
}
