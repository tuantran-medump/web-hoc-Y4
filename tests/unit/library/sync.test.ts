import { describe, expect, it, vi } from 'vitest';
import { createMemoryDatabase } from '@/server/db';
import { createLibraryService } from '@/server/library';
import type { DriveClient, DriveFile } from '@/server/library/drive';
const file = (id: string, name = `${id}.md`, mimeType = 'text/markdown'): DriveFile => ({ id, name, mimeType, modifiedTime: '2026-11-07T00:00:00Z', folderPath: '' });
describe('library sync', () => {
  it('adds, skips unchanged, updates, soft deletes and revives documents', async () => {
    const db = createMemoryDatabase(false); let files = [file('a')]; let text = '# One';
    const client: DriveClient = { listFiles: async () => files, readText: vi.fn(async () => text), readImage: async () => ({ bytes: new Uint8Array([1]), contentType: 'image/png' }) };
    const service = createLibraryService(db.libraryRepository, () => client);
    expect((await service.sync()).added).toEqual(['a']); expect((await service.sync()).unchanged).toBe(1); expect(client.readText).toHaveBeenCalledTimes(1);
    text = '# Two'; files[0].modifiedTime = '2026-11-08T00:00:00Z'; expect((await service.sync()).updated).toEqual(['a']);
    files = []; expect((await service.sync()).removed).toEqual(['a']); expect(db.libraryRepository.list()).toHaveLength(0);
    files = [file('a')]; expect((await service.sync()).updated).toEqual(['a']); expect(db.libraryRepository.list()).toHaveLength(1);
  });
  it('reports one failed file, keeps its cache and continues with other documents', async () => {
    const db = createMemoryDatabase(false); let failing = false;
    const client: DriveClient = { listFiles: async () => [file('a'), file('b')].map(f => ({ ...f, modifiedTime: failing ? 'new' : f.modifiedTime })), readText: async id => { if (failing && id === 'a') throw new Error('network'); return '# Good'; }, readImage: vi.fn() };
    const service = createLibraryService(db.libraryRepository, () => client); await service.sync(); failing = true;
    const result = await service.sync(); expect(result.errors[0].driveFileId).toBe('a'); expect(result.updated).toEqual(['b']); expect(db.libraryRepository.list()).toHaveLength(2);
  });
  it('returns 409 during a concurrent sync, then releases the lock after errors', async () => {
    let resolve!: (files: DriveFile[]) => void;
    const wait = new Promise<DriveFile[]>(r => { resolve = r; });
    const client: DriveClient = { listFiles: vi.fn(() => wait), readText: vi.fn(), readImage: vi.fn() };
    const service = createLibraryService(createMemoryDatabase(false).libraryRepository, () => client);
    const first = service.sync(); await expect(service.sync()).rejects.toMatchObject({ status: 409 }); resolve([]); await first;
    await expect(service.sync()).resolves.toMatchObject({ unchanged: 0 });
    const broken = createLibraryService(createMemoryDatabase(false).libraryRepository, () => { throw new Error('config'); });
    await expect(broken.sync()).rejects.toThrow('config'); await expect(broken.sync()).rejects.toThrow('config');
  });
  it('does not delete cached documents on an incomplete listing', async () => {
    const db = createMemoryDatabase(false); let fail = false;
    const client: DriveClient = { listFiles: async () => { if (fail) throw new Error('listing failed'); return [file('a')]; }, readText: async () => '# A', readImage: vi.fn() };
    const service = createLibraryService(db.libraryRepository, () => client); await service.sync(); fail = true;
    await expect(service.sync()).rejects.toThrow(); expect(db.libraryRepository.list()).toHaveLength(1);
  });
  it('rewrites images and only proxies known, safe images with revision caching', async () => {
    const db = createMemoryDatabase(false); const image = { ...file('img', 'x.png', 'image/png'), folderPath: 'hinh' };
    const client: DriveClient = { listFiles: async () => [file('a'), image], readText: async () => '![x](./hinh/x.png)', readImage: vi.fn(async () => ({ bytes: new Uint8Array([1, 2]), contentType: 'image/png' })) };
    const service = createLibraryService(db.libraryRepository, () => client); await service.sync();
    expect(db.libraryRepository.get('a')?.markdown).toContain('/api/library/image/img');
    await expect(service.image('unknown')).rejects.toMatchObject({ status: 404 });
    expect((await service.image('img')).bytes).toEqual(new Uint8Array([1, 2])); await service.image('img'); expect(client.readImage).toHaveBeenCalledTimes(1);
  });
  it('invalidates unchanged documents when shared source definitions change', async () => {
    let shared = 'one'; const client: DriveClient = { listFiles: async () => [file('a'), file('sources', '_nguon.md')], readText: async id => id === 'sources' ? shared : '# A', readImage: vi.fn() };
    const service = createLibraryService(createMemoryDatabase(false).libraryRepository, () => client); await service.sync(); shared = 'two';
    expect((await service.sync()).updated).toEqual(['a']);
  });
});
