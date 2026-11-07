import { createSign } from 'node:crypto';
import { object, requireValue, ServiceError } from '@/server/exam/validation';

export interface DriveFile { id: string; name: string; mimeType: string; modifiedTime: string; md5Checksum?: string; folderPath: string }
export interface DriveClient { listFiles(): Promise<DriveFile[]>; readText(id: string): Promise<string>; readImage(id: string): Promise<{ bytes: Uint8Array; contentType: string }> }
const folderMime = 'application/vnd.google-apps.folder';
const allowedImages = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'];
export const isAllowedImage = (mime: string) => allowedImages.includes(mime.toLowerCase());

/** No secret is created or persisted. Reads only the explicitly configured service account. */
export function createGoogleDriveClient(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): DriveClient {
  requireValue(env.GOOGLE_SERVICE_ACCOUNT_JSON && env.DRIVE_ROOT_FOLDER_ID, 'Chưa cấu hình Google Drive.', 503);
  const account: unknown = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  requireValue(object(account) && typeof account.client_email === 'string' && typeof account.private_key === 'string', 'Cấu hình Google Drive không hợp lệ.', 503);
  const email = account.client_email; const privateKey = account.private_key;
  const root = env.DRIVE_ROOT_FOLDER_ID;
  requireValue(/^[\w-]+$/.test(root), 'DRIVE_ROOT_FOLDER_ID không hợp lệ.', 503);
  let token: { value: string; until: number } | undefined;
  let pendingToken: Promise<string> | undefined;
  async function accessToken(): Promise<string> {
    if (token && Date.now() < token.until) return token.value;
    if (pendingToken) return pendingToken;
    pendingToken = (async () => {
      const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
      const iat = Math.floor(Date.now() / 1000);
      const body = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: email, scope: 'https://www.googleapis.com/auth/drive.readonly', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 })}`;
      const signature = createSign('RSA-SHA256').update(body).sign(privateKey, 'base64url');
      const response = await fetcher('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${body}.${signature}` }), signal: AbortSignal.timeout(30000), cache: 'no-store' });
      requireValue(response.ok, 'Không lấy được quyền đọc Google Drive.', 502);
      const value: unknown = await response.json(); requireValue(object(value) && typeof value.access_token === 'string' && typeof value.expires_in === 'number', 'Phản hồi xác thực Drive không hợp lệ.', 502);
      token = { value: value.access_token, until: Date.now() + Math.max(0, value.expires_in - 60) * 1000 }; return token.value;
    })();
    try { return await pendingToken; } finally { pendingToken = undefined; }
  }
  async function request(path: string) {
    const response = await fetcher(`https://www.googleapis.com/drive/v3/files${path}`, { headers: { Authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(30000), cache: 'no-store' });
    if (!response.ok) throw new ServiceError('Không đọc được dữ liệu Google Drive.', 502);
    return response;
  }
  return {
    async listFiles() {
      const result: DriveFile[] = []; const visited = new Set<string>();
      async function walk(id: string, path: string): Promise<void> {
        requireValue(!visited.has(id), 'Cấu trúc thư mục Drive bị lặp.', 502); visited.add(id);
        let pageToken: string | undefined;
        do {
          const query = new URLSearchParams({ q: `'${id.replace(/'/g, "\\'")}' in parents and trashed = false`, pageSize: '1000', fields: 'nextPageToken,incompleteSearch,files(id,name,mimeType,modifiedTime,md5Checksum)', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' });
          if (pageToken) query.set('pageToken', pageToken);
          const body: unknown = await (await request(`?${query}`)).json();
          requireValue(object(body) && Array.isArray(body.files) && !body.incompleteSearch, 'Danh sách Drive chưa đầy đủ; dừng để bảo vệ cache.', 502);
          for (const item of body.files) {
            requireValue(object(item) && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.mimeType === 'string', 'Metadata Drive không hợp lệ.', 502);
            if (item.mimeType === folderMime) await walk(item.id, path ? `${path}/${item.name}` : item.name);
            else if (/\.md$/i.test(item.name) || isAllowedImage(item.mimeType)) result.push({ id: item.id, name: item.name, mimeType: item.mimeType, modifiedTime: typeof item.modifiedTime === 'string' ? item.modifiedTime : '', md5Checksum: typeof item.md5Checksum === 'string' ? item.md5Checksum : undefined, folderPath: path });
          }
          pageToken = typeof body.nextPageToken === 'string' ? body.nextPageToken : undefined;
        } while (pageToken);
      }
      await walk(root, ''); return result;
    },
    async readText(id) { return (await request(`/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`)).text(); },
    async readImage(id) {
      const response = await request(`/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`);
      const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase() ?? '';
      requireValue(isAllowedImage(contentType), 'Định dạng ảnh không được hỗ trợ.', 415);
      return { bytes: new Uint8Array(await response.arrayBuffer()), contentType };
    },
  };
}
