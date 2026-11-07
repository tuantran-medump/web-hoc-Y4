import { expect, it } from 'vitest';
import { GET, POST, PATCH, DELETE } from '@/app/api/exam/[[...path]]/route';
import { db } from '@/server/db';
import { POST as sync } from '@/app/api/library/sync/route';
import { GET as docs } from '@/app/api/library/docs/route';
import { GET as image } from '@/app/api/library/image/[fileId]/route';
const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });
const request = (method: string, body?: unknown) => new Request('http://localhost/api/exam', { method, ...(body !== undefined ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) });
it('responds with typed envelopes, validates malformed JSON and returns 404 for unknown resources', async () => {
  const response = await GET(request('GET'), ctx()); expect(response.status).toBe(200); expect((await response.json()).data).toHaveLength(2);
  const invalid = await POST(request('POST', { title: 'Bad' }), ctx()); expect(invalid.status).toBe(400);
  const malformed = await POST(new Request('http://localhost', { method: 'POST', body: '{' }), ctx()); expect(malformed.status).toBe(400);
  expect((await GET(request('GET'), ctx('missing'))).status).toBe(404);
});
it('exercises create, edit, attempt save/submit, soft delete, trash and restore through routes', async () => {
  const e = { ...db.examRepository.list()[0], id: crypto.randomUUID() };
  expect((await POST(request('POST', e), ctx())).status).toBe(201);
  const q = Object.values(e.questions)[0];
  expect((await PATCH(request('PATCH', { field: 'correctKeys', value: ['A'], version: 1 }), ctx(e.id, 'questions', q.id))).status).toBe(200);
  const created = await POST(request('POST', { examId: e.id, mode: 'exam' }), ctx('attempts')); const a = (await created.json()).data;
  expect((await PATCH(request('PATCH', { answers: { [q.id]: { kind: 'choice', keys: ['A'] } } }), ctx('attempts', a.id))).status).toBe(200);
  const submitted = await POST(request('POST'), ctx('attempts', a.id, 'submit')); expect((await submitted.json()).data.autoScore).toBe(1);
  expect((await DELETE(request('DELETE'), ctx(e.id))).status).toBe(200);
  expect((await GET(request('GET'), ctx(e.id))).status).toBe(404);
  expect((await POST(request('POST'), ctx(e.id, 'restore'))).status).toBe(200);
});
it('lists seeded library docs and refuses arbitrary image proxying', async () => {
  expect((await (await docs(new Request('http://localhost/api/library/docs'))).json()).data).toHaveLength(1);
  expect((await image(new Request('http://localhost'), { params: Promise.resolve({ fileId: 'arbitrary-drive-id' }) })).status).toBe(404);
});
it('reports missing Drive configuration without disclosing credentials', async () => {
  const response = await sync(); expect(response.status).toBe(503); expect((await response.json()).success).toBe(false);
});
