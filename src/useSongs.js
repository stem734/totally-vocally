import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export function useSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const addSong = useCallback(async (title, url = '', choirs = []) => {
    try {
      await addDoc(collection(db, 'songs'), {
        title,
        url: url || '',
        choirs: choirs || [],
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to add song:', err);
      throw err;
    }
  }, []);

  const deleteSong = useCallback(async (songId) => {
    try {
      await deleteDoc(doc(db, 'songs', songId));
    } catch (err) {
      console.error('Failed to delete song:', err);
      throw err;
    }
  }, []);

  const updateSong = useCallback(async (songId, updates) => {
    try {
      await updateDoc(doc(db, 'songs', songId), updates);
    } catch (err) {
      console.error('Failed to update song:', err);
      throw err;
    }
  }, []);

  return { songs, loading, addSong, deleteSong, updateSong };
}
