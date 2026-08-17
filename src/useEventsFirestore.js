import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  collection,
  collectionGroup,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export function useEventsFirestore(userId, voicePart) {
  const [events, setEvents] = useState([]);
  const [attendanceByEvent, setAttendanceByEvent] = useState({});
  const [voicePartsByEvent, setVoicePartsByEvent] = useState({});
  const [loading, setLoading] = useState(true);

  // Listen to events in real-time
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setEvents(eventsData);
      setLoading(false);
    });

    const unsubscribeAttendance = onSnapshot(
      collectionGroup(db, 'attendance'),
      (snapshot) => {
        const nextAttendance = {};
        const nextVoiceParts = {};
        snapshot.forEach((attendanceDoc) => {
          const eventId = attendanceDoc.ref.parent.parent?.id;
          if (!eventId) return;
          const data = attendanceDoc.data();
          if (!nextAttendance[eventId]) nextAttendance[eventId] = {};
          nextAttendance[eventId][attendanceDoc.id] = data.status;
          if (!nextVoiceParts[eventId]) nextVoiceParts[eventId] = {};
          nextVoiceParts[eventId][attendanceDoc.id] = data.voicePart || 'Unassigned';
        });
        setAttendanceByEvent(nextAttendance);
        setVoicePartsByEvent(nextVoiceParts);
      },
      (err) => console.error('Failed to fetch attendance:', err)
    );

    return () => {
      unsubscribe();
      unsubscribeAttendance();
    };
  }, [userId]);

  const eventsWithAttendance = useMemo(() => events.map((event) => {
    const attendance = attendanceByEvent[event.id] || {};
    const voiceParts = voicePartsByEvent[event.id] || {};
    const voicePartCounts = {};
    Object.entries(attendance).forEach(([uid, status]) => {
      if (status !== 'yes') return;
      const part = voiceParts[uid] || 'Unassigned';
      voicePartCounts[part] = (voicePartCounts[part] || 0) + 1;
    });
    return {
      ...event,
      attendance,
      myAttendance: attendance[userId] || null,
      voicePartCounts,
    };
  }), [events, attendanceByEvent, voicePartsByEvent, userId]);

  const addEvent = useCallback(async (eventData) => {
    try {
      await addDoc(collection(db, 'events'), {
        ...eventData,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to add event:', err);
      throw err;
    }
  }, [userId]);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  }, []);

  const updateEvent = useCallback(async (eventId, updates) => {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to update event:', err);
      throw err;
    }
  }, []);

  const setAttendance = useCallback(async (eventId, status) => {
    if (!userId) return;
    try {
      const attendanceRef = doc(db, 'events', eventId, 'attendance', userId);
      if (status) {
        await setDoc(attendanceRef, {
          status,
          voicePart: voicePart || 'Unassigned',
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Delete if status is cleared
        await deleteDoc(attendanceRef);
      }
    } catch (err) {
      console.error('Failed to set attendance:', err);
      throw err;
    }
  }, [userId, voicePart]);

  const allocateSongs = useCallback(async (eventId, songIds) => {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        songIds: songIds || [],
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to allocate songs:', err);
      throw err;
    }
  }, []);

  const createRehearsalBlock = useCallback(async (blockData) => {
    try {
      const startDate = new Date(blockData.startDate);
      const endDate = new Date(blockData.endDate);
      const excluded = new Set(blockData.excludedDates || []);
      const daysOfWeek = blockData.daysOfWeek || [1, 3, 5];

      let createdCount = 0;
      const current = new Date(startDate);

      while (current <= endDate) {
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

        if (
          daysOfWeek.includes(current.getDay()) &&
          !excluded.has(dateStr)
        ) {
          await addDoc(collection(db, 'events'), {
            title: `Rehearsal - ${current.toLocaleDateString('en-US', { weekday: 'long' })}`,
            type: 'rehearsal',
            date: dateStr,
            time: blockData.time || '',
            location: blockData.location || '',
            desc: '',
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          createdCount++;
        }

        current.setDate(current.getDate() + 1);
      }

      return createdCount;
    } catch (err) {
      console.error('Failed to create rehearsal block:', err);
      throw err;
    }
  }, [userId]);

  return { events: eventsWithAttendance, loading, addEvent, deleteEvent, updateEvent, setAttendance, allocateSongs, createRehearsalBlock };
}

// Helper to migrate from localStorage to Firestore (one-time operation)
export async function migrateEventsToFirestore() {
  try {
    const STORAGE_KEY = 'tv_events_v4';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;

    const events = JSON.parse(raw);
    let count = 0;

    for (const event of events) {
      await addDoc(collection(db, 'events'), {
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time || null,
        location: event.location,
        description: event.desc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      count++;
    }

    console.log(`Migrated ${count} events to Firestore`);
    return count;
  } catch (err) {
    console.error('Migration failed:', err);
    return 0;
  }
}
