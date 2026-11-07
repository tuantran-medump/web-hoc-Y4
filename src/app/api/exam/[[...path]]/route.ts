import { db } from '@/server/db';
import { examService as service } from '@/server/exam';
import { handle, success } from '@/server/exam/http';
import { object, requireValue, ServiceError } from '@/server/exam/validation';
import { parseExamText } from '@/lib/exam-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path?: string[] }> };
async function route(req: Request, context: Context) {
  return handle(async () => {
    const p = (await context.params).path ?? []; const method = req.method;
    const url = new URL(req.url);
    if (p.length === 0) {
      if (method === 'GET') {
        const query = url.searchParams.get('q')?.toLocaleLowerCase() ?? '';
        return db.examRepository.list(url.searchParams.get('deleted') === 'true').filter(e => `${e.title} ${e.subject} ${e.tags.join(' ')}`.toLocaleLowerCase().includes(query) && (!url.searchParams.has('subject') || e.subject === url.searchParams.get('subject')) && (!url.searchParams.has('tag') || e.tags.includes(url.searchParams.get('tag')!)));
      }
      if (method === 'POST') return success(service.createExam(await req.json()), 201);
    }
    if (p[0] === 'parse' && p.length === 1 && method === 'POST') { const body: unknown = await req.json(); requireValue(object(body) && typeof body.text === 'string', 'Cần text.'); return parseExamText(body.text); }
    if (p[0] === 'backup' && p.length === 1 && method === 'GET') return db.backup();
    if (p[0] === 'restore' && p.length === 1 && method === 'POST') return db.restoreBackup(await req.json());
    if (p[0] === 'attempts') {
      if (p.length === 1 && method === 'GET') return db.attemptRepository.list(url.searchParams.get('examId') ?? undefined);
      if (p.length === 1 && method === 'POST') return success(service.createAttempt(await req.json()), 201);
      if (p.length === 2 && method === 'GET') return service.getAttempt(p[1]);
      if (p.length === 2 && method === 'PATCH') return service.saveAttempt(p[1], await req.json());
      if (p.length === 3 && p[2] === 'submit' && method === 'POST') return service.submitAttempt(p[1]);
    } else if (p.length === 1) {
      if (method === 'GET') return service.getExam(p[0]);
      if (method === 'PATCH') return service.updateExam(p[0], await req.json());
      if (method === 'DELETE') return db.examRepository.softDelete(p[0]);
    } else if (p.length === 2 && p[1] === 'restore' && method === 'POST') return db.examRepository.restore(p[0]);
    else if (p.length === 3 && p[1] === 'questions' && method === 'PATCH') return service.editAnswer(p[0], p[2], await req.json());
    else if (p.length === 2 && p[1] === 'edits' && method === 'GET') { service.getExam(p[0]); return db.examRepository.edits(p[0]); }
    else if (p.length === 4 && p[1] === 'edits' && p[3] === 'undo' && method === 'POST') { const body: unknown = await req.json(); requireValue(object(body), 'Cần version.'); return service.undoEdit(p[0], p[2], body.version); }
    throw new ServiceError('Không tìm thấy endpoint hoặc phương thức không hỗ trợ.', 404);
  });
}
export { route as GET, route as POST, route as PATCH, route as DELETE };
