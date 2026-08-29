import { getMetadata, listAll, ref } from 'firebase/storage';
import { storage } from './firebase';
import { cacheFileIndex } from './fileCache';

export const FILES_PATH = 'shared';

export async function listSharedFiles() {
  const result = await listAll(ref(storage, FILES_PATH));
  const files = await Promise.all(result.items.map(async (fileRef) => {
    const metadata = await getMetadata(fileRef);
    return {
      fullPath: fileRef.fullPath,
      name: metadata.customMetadata?.originalName || fileRef.name,
      size: metadata.size,
      contentType: metadata.contentType || 'application/octet-stream',
      updated: metadata.updated,
      generation: metadata.generation,
      metageneration: metadata.metageneration,
      md5Hash: metadata.md5Hash,
    };
  }));
  const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
  await cacheFileIndex(sortedFiles);
  return sortedFiles;
}
