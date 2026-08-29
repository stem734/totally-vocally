import { getBlob, getMetadata, ref } from 'firebase/storage';
import { storage } from './firebase';

const DB_NAME = 'totally-vocally-file-cache';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const MAX_CACHE_BYTES = 512 * 1024 * 1024;
const MAX_ENTRY_BYTES = 100 * 1024 * 1024;

function canUseIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function openDatabase() {
  if (!canUseIndexedDb()) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(error);
      return;
    }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open the file cache'));
  });
}

export function fileCacheVersion(metadata = {}) {
  // Object generations change when the file bytes are replaced. The fallback
  // fields keep cache validation useful for metadata returned by listSharedFiles
  // and for older objects that do not expose a generation.
  if (metadata.generation) {
    return [metadata.generation, metadata.size, metadata.md5Hash, metadata.contentType]
      .filter((value) => value !== undefined && value !== null && value !== '')
      .join(':');
  }
  return [
    metadata.updated,
    metadata.size,
    metadata.md5Hash,
    metadata.contentType,
  ].filter((value) => value !== undefined && value !== null && value !== '').join(':');
}

function typedBlob(blob, contentType) {
  const type = contentType || blob.type || 'application/octet-stream';
  return blob.type === type ? blob : blob.slice(0, blob.size, type);
}

async function readCachedFile(path, version) {
  let database;
  try {
    database = await openDatabase();
    if (!database) return null;
    const record = await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(path);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Could not read the file cache'));
    });
    if (!record || record.version !== version || !record.blob) return null;

    // Touching is best effort; a cache hit must not fail just because its
    // recency marker could not be updated.
    try {
      const touchTransaction = database.transaction(STORE_NAME, 'readwrite');
      touchTransaction.objectStore(STORE_NAME).put({ ...record, lastAccessed: Date.now() });
    } catch (error) {
      console.warn('Could not update file cache recency:', error);
    }
    return typedBlob(record.blob, record.contentType);
  } catch (error) {
    // IndexedDB is unavailable in some private browsing modes and can also be
    // evicted by the browser. A cache failure must never block a network fetch.
    console.warn('Could not read the file cache:', error);
    return null;
  } finally {
    database?.close();
  }
}

export async function cacheFileIndex(files) {
  if (!canUseIndexedDb()) return;
  let database;
  try {
    database = await openDatabase();
    if (!database) return;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ path: '__index__', files, lastAccessed: Date.now() });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not write the file index'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not write the file index'));
    });
  } catch (error) {
    console.warn('Could not cache the file index:', error);
  } finally {
    database?.close();
  }
}

export async function getCachedFileIndex() {
  let database;
  try {
    database = await openDatabase();
    if (!database) return null;
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get('__index__');
      request.onsuccess = () => resolve(request.result?.files || null);
      request.onerror = () => reject(request.error || new Error('Could not read the file index'));
    });
  } catch (error) {
    console.warn('Could not read the cached file index:', error);
    return null;
  } finally {
    database?.close();
  }
}

async function writeCachedFile(path, version, blob, contentType) {
  if (!canUseIndexedDb() || !blob || blob.size > MAX_ENTRY_BYTES) return;
  const database = await openDatabase();
  if (!database) return;
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put({
        path,
        version,
        blob: typedBlob(blob, contentType),
        contentType: contentType || blob.type || 'application/octet-stream',
        size: blob.size,
        lastAccessed: Date.now(),
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not write the file cache'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not write the file cache'));
    });

    // Keep a bounded cache. Browser quotas are device-dependent and browsers
    // may evict best-effort storage, so cache writes are never required for
    // successful playback.
    const records = await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Could not inspect the file cache'));
    });
    let total = records.reduce((sum, record) => sum + (record.size || 0), 0);
    if (total > MAX_CACHE_BYTES) {
      const removals = records
        .sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0))
        .filter((record) => {
          if (total <= MAX_CACHE_BYTES) return false;
          total -= record.size || 0;
          return true;
        })
        .map((record) => record.path);
      if (removals.length > 0) {
        await new Promise((resolve, reject) => {
          const transaction = database.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          removals.forEach((pathToRemove) => store.delete(pathToRemove));
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error || new Error('Could not prune the file cache'));
          transaction.onabort = () => reject(transaction.error || new Error('Could not prune the file cache'));
        });
      }
    }
  } finally {
    database.close();
  }
}

export async function clearFileCache() {
  const database = await openDatabase();
  if (!database) return;
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not clear the file cache'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not clear the file cache'));
    });
  } catch (error) {
    console.warn('Could not clear the file cache:', error);
  } finally {
    database.close();
  }
}

function canUseOfflineCache(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return error?.code === 'storage/retry-limit-exceeded';
}

/**
 * Return an authenticated, correctly typed Blob from the local cache when the
 * server version is unchanged. Metadata is checked before every online use;
 * getBlob is only called on a cache miss or version change. If the browser is
 * offline, the last authenticated cache entry is used instead.
 */
export async function getCachedFileBlob(file) {
  const storageRef = ref(storage, file.fullPath);
  let metadata;
  try {
    metadata = await getMetadata(storageRef);
  } catch (error) {
    if (!canUseOfflineCache(error)) throw error;
    const cachedOffline = await readCachedFile(file.fullPath, fileCacheVersion(file));
    if (cachedOffline) return cachedOffline;
    throw error;
  }

  const version = fileCacheVersion({ ...file, ...metadata });
  const cached = await readCachedFile(file.fullPath, version);
  if (cached) return cached;

  const blob = await getBlob(storageRef);
  const contentType = metadata.contentType || file.contentType || blob.type;
  const typed = typedBlob(blob, contentType);
  try {
    await writeCachedFile(file.fullPath, version, typed, contentType);
  } catch (error) {
    // Caching is an optimisation; quota and private-mode failures must not
    // prevent a user from playing or viewing a file fetched successfully.
    console.warn('Could not cache file:', error);
  }
  return typed;
}
