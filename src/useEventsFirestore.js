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

export function useEventsFirestore(userId) {
  const [events, setEvents] = useState([]);
  const [attendanceByEvent, setAttendanceByEvent] = useState({});
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
        snapshot.forEach((attendanceDoc) => {
          const eventId = attendanceDoc.ref.parent.parent?.id;
          if (!eventId) return;
          if (!nextAttendance[eventId]) nextAttendance[eventId] = {};
          nextAttendance[eventId][attendanceDoc.id] = attendanceDoc.data().status;
        });
        setAttendanceByEvent(nextAttendance);
      },
      (err) => console.error('Failed to fetch attendance:', err)
    );

    return () => {
      unsubscribe();
      unsubscribeAttendance();
    };
  }, [userId]);

  const eventsWithAttendance = useMemo(() => events.map((event) => ({
    ...event,
    attendance: attendanceByEvent[event.id] || {},
    myAttendance: attendanceByEvent[event.id]?.[userId] || null,
  })), [events, attendanceByEvent, userId]);

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
  }, [userId]);

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

  return { events: eventsWithAttendance, loading, addEvent, deleteEvent, updateEvent, setAttendance, allocateSongs };
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
