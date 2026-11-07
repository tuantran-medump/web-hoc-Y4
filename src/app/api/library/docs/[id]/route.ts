import { libraryService } from '@/server/library';
import { handle } from '@/server/exam/http';
export const dynamic = 'force-dynamic';
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) { return handle(async () => libraryService.getDoc((await ctx.params).id)); }
