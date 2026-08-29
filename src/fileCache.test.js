import { describe, expect, it, vi } from 'vitest';

vi.mock('./firebase', () => ({ storage: {} }));
vi.mock('firebase/storage', () => ({
  getBlob: vi.fn(),
  getMetadata: vi.fn(),
  ref: vi.fn(),
}));

import { fileCacheVersion } from './fileCache';

describe('fileCacheVersion', () => {
  it('uses the object generation as the stable content version', () => {
    expect(fileCacheVersion({
      generation: '42',
      metageneration: '3',
      updated: '2026-08-28T20:00:00Z',
      size: 123,
      md5Hash: 'abc',
      contentType: 'audio/mpeg',
    })).toBe('42:123:abc:audio/mpeg');
  });

  it('falls back to metadata when a generation is unavailable', () => {
    expect(fileCacheVersion({
      updated: '2026-08-28T20:00:00Z',
      size: 123,
      md5Hash: 'abc',
      contentType: 'application/pdf',
    })).toBe('2026-08-28T20:00:00Z:123:abc:application/pdf');
  });
});
