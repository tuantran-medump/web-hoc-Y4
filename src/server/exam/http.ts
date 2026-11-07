import type { ApiResponse } from '@/types';
import { ServiceError } from './validation';
export function success<T>(data: T, status = 200): Response { return Response.json({ success: true, data } satisfies ApiResponse<T>, { status, headers: { 'Cache-Control': 'no-store' } }); }
export async function handle(action: () => unknown | Promise<unknown>): Promise<Response> {
  try { const data = await action(); return data instanceof Response ? data : success(data); }
  catch (error) {
    const status = error instanceof ServiceError ? error.status : error instanceof SyntaxError ? 400 : 500;
    return Response.json({ success: false, error: status === 500 ? 'Lỗi máy chủ.' : error instanceof Error ? error.message : 'Yêu cầu không hợp lệ.' } satisfies ApiResponse<never>, { status });
  }
}
