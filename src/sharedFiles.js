import { getMetadata, listAll, ref } from 'firebase/storage';
import { storage } from './firebase';

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
    };
  }));
  return files.sort((a, b) => a.name.localeCompare(b.name));
}
