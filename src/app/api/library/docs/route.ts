import { db } from '@/server/db';
import { handle } from '@/server/exam/http';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  return handle(() => {
    const params = new URL(req.url).searchParams; const query = params.get('q')?.toLocaleLowerCase() ?? '';
    return db.libraryRepository.list(params.get('deleted') === 'true').filter(d => `${d.title} ${d.tags.join(' ')}`.toLocaleLowerCase().includes(query) && (!params.has('tag') || d.tags.includes(params.get('tag')!)) && (!params.has('folder') || d.folderPath === params.get('folder')));
  });
}
