import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, addDoc, deleteField, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export function useSongs(enabled = true) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setSongs([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'songs'),
      (snapshot) => {
        const songsData = [];
        snapshot.forEach((doc) => {
          songsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        songsData.sort((a, b) => a.title.localeCompare(b.title));
        setSongs(songsData);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to fetch songs:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [enabled]);

  const addSong = useCallback(async (title, url = '', choirs = [], linkedFiles = [], metadata = {}) => {
    try {
      await addDoc(collection(db, 'songs'), {
        title,
        url: url || '',
        choirs: choirs || [],
        linkedFiles: linkedFiles.map((file) => ({
          fullPath: file.fullPath,
          name: file.name,
          contentType: file.contentType,
        })),
        resourceVersion: metadata.resourceVersion || '',
        resourceDate: metadata.resourceDate || '',
        rightsNotes: metadata.rightsNotes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to add song:', err);
      throw err;
    }
  }, []);

  const archiveSong = useCallback(async (songId) => {
    try {
      await updateDoc(doc(db, 'songs', songId), {
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to archive song:', err);
      throw err;
    }
  }, []);

  const restoreSong = useCallback(async (songId) => {
    try {
      await updateDoc(doc(db, 'songs', songId), {
        archivedAt: deleteField(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to restore song:', err);
      throw err;
    }
  }, []);

  const updateSong = useCallback(async (songId, updates) => {
    try {
      await updateDoc(doc(db, 'songs', songId), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to update song:', err);
      throw err;
    }
  }, []);

  return { songs, loading, addSong, archiveSong, restoreSong, updateSong };
}
