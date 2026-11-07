import { createHash } from 'node:crypto';
import { posix } from 'node:path';
import type { RenderedDoc, SyncReport } from '@/types';
import { db, type LibraryRepository } from '@/server/db';
import { requireValue } from '@/server/exam/validation';
import { renderLibraryMarkdown } from '@/lib/citation';
import { createGoogleDriveClient, isAllowedImage, type DriveClient, type DriveFile } from './drive';

export type LibraryRenderer = (markdown: string, sharedSources?: string) => Omit<RenderedDoc, 'doc'>;
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const defaultRenderer: LibraryRenderer = (md, sharedSources) => renderLibraryMarkdown(md, sharedSources);

export function rewriteImages(md: string, folderPath: string, files: DriveFile[]): string {
  return md.replace(/!\[([^\]]*)\]\((?:<)?(\.\/hinh\/[^)>]+)(?:>)?\)/g, (full, alt: string, relative: string) => {
    const path = posix.normalize(posix.join(folderPath, relative));
    const matches = files.filter(f => isAllowedImage(f.mimeType) && posix.join(f.folderPath, f.name) === path);
    requireValue(matches.length === 1, `Không tìm thấy ảnh duy nhất: ${relative}`);
    return `![${alt}](/api/library/image/${encodeURIComponent(matches[0].id)})`;
  });
}

export function createLibraryService(repository: LibraryRepository = db.libraryRepository, getClient: () => DriveClient = () => createGoogleDriveClient(), render: LibraryRenderer = defaultRenderer) {
  let syncing = false;
  let renderer = render;
  let client: DriveClient | undefined;
  let imageFiles = new Map<string, DriveFile>();
  const imageCache = new Map<string, { revision: string; bytes: Uint8Array; contentType: string }>();
  async function sync(): Promise<SyncReport> {
    requireValue(!syncing, 'Đang đồng bộ thư viện.', 409); syncing = true;
    const report: SyncReport = { startedAt: new Date().toISOString(), finishedAt: '', added: [], updated: [], removed: [], unchanged: 0, errors: [] };
    try {
      client ??= getClient();
      // Enumeration must complete before any removal can be inferred.
      const files = await client.listFiles();
      const images = files.filter(f => isAllowedImage(f.mimeType));
      const sharedFile = files.find(f => f.name === '_nguon.md' && f.folderPath === '');
      const sharedSources = sharedFile ? await client.readText(sharedFile.id) : '';
      const docs = files.filter(f => /\.md$/i.test(f.name) && f.name !== '_nguon.md');
      const seen = new Set(docs.map(f => f.id));
      const existing = [...repository.list(), ...repository.list(true)];
      for (const file of docs) {
        try {
          const previousDoc = existing.find(d => d.driveFileId === file.id);
          const previous = previousDoc ? repository.get(previousDoc.id) : undefined;
          const imageRevision = images.filter(f => f.folderPath === posix.join(file.folderPath, 'hinh')).map(f => `${f.id}:${f.name}:${f.modifiedTime}:${f.md5Checksum ?? ''}`).sort().join('|');
          // Hash includes shared definitions and image mapping, so their changes invalidate documents.
          const revision = hash(`${file.modifiedTime}:${file.md5Checksum ?? ''}:${file.folderPath}:${file.name}:${sharedSources}:${imageRevision}`);
          if (previous && !previous.doc.deletedAt && previous.doc.contentHash === revision) { report.unchanged++; continue; }
          const markdown = rewriteImages(await client.readText(file.id), file.folderPath, files);
          const title = markdown.match(/^title:\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '') ?? file.name.replace(/\.md$/i, '');
          const tags = (markdown.match(/^tags:\s*\[(.*)\]/m)?.[1] ?? '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
          renderer(markdown, sharedSources); // A failed render leaves the previous cache untouched.
          const doc = { id: previousDoc?.id ?? file.id, driveFileId: file.id, title, folderPath: file.folderPath, tags, driveModifiedTime: file.modifiedTime, syncedAt: new Date().toISOString(), contentHash: revision, deletedAt: null };
          repository.save({ doc, markdown, sharedSources });
          (previous ? report.updated : report.added).push(doc.id);
        } catch (error) { report.errors.push({ driveFileId: file.id, name: file.name, message: error instanceof Error ? error.message : 'Không đồng bộ được tài liệu.' }); }
      }
      for (const doc of repository.list()) {
        // Local samples are independent of Drive and never removed by sync.
        if (doc.id === 'sample-library' || seen.has(doc.driveFileId)) continue;
        const entry = repository.get(doc.id)!; entry.doc.deletedAt = new Date().toISOString(); repository.save(entry); report.removed.push(doc.id);
      }
      imageFiles = new Map(images.map(f => [f.id, f]));
      for (const id of imageCache.keys()) if (!imageFiles.has(id)) imageCache.delete(id);
      return report;
    } finally { syncing = false; report.finishedAt = new Date().toISOString(); }
  }
  async function image(id: string) {
    // Never proxy an arbitrary Drive ID supplied by the browser.
    const file = imageFiles.get(id); requireValue(file, 'Ảnh chưa được đồng bộ hoặc ngoài thư viện.', 404);
    const revision = file.md5Checksum ?? file.modifiedTime;
    let value = imageCache.get(id);
    if (!value || value.revision !== revision) {
      client ??= getClient(); const loaded = await client.readImage(id);
      requireValue(isAllowedImage(loaded.contentType), 'Định dạng ảnh không được hỗ trợ.', 415);
      value = { ...loaded, revision }; imageCache.set(id, value);
    }
    return { ...value, etag: `"${hash(`${id}:${revision}`)}"` };
  }
  function getDoc(id: string): RenderedDoc {
    const entry = repository.get(id); requireValue(entry && !entry.doc.deletedAt, 'Không tìm thấy tài liệu.', 404);
    return { doc: entry.doc, ...renderer(entry.markdown, entry.sharedSources) };
  }
  return { sync, image, getDoc, setRenderer: (value: LibraryRenderer) => { renderer = value; } };
}
const globalLibrary = globalThis as typeof globalThis & { y4Library?: ReturnType<typeof createLibraryService> };
export const libraryService = globalLibrary.y4Library ??= createLibraryService();
