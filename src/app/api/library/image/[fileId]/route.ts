import { libraryService } from '@/server/library';
import { handle } from '@/server/exam/http';
export const runtime = 'nodejs';
export async function GET(req: Request, ctx: { params: Promise<{ fileId: string }> }) {
  return handle(async () => {
    const image = await libraryService.image((await ctx.params).fileId);
    const headers = { 'Content-Type': image.contentType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=86400', ETag: image.etag };
    if (req.headers.get('if-none-match') === image.etag) return new Response(null, { status: 304, headers });
    return new Response(new Uint8Array(image.bytes), { headers });
  });
}
