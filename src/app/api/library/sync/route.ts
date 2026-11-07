import { libraryService } from '@/server/library';
import { handle } from '@/server/exam/http';
export const runtime = 'nodejs';
export async function POST() { return handle(() => libraryService.sync()); }
