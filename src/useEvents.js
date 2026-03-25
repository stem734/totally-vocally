import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tv_events_v3';

function pad(n) { return String(n).padStart(2, '0'); }
function dateStr(year, month, day) { return `${year}-${pad(month + 1)}-${pad(day)}`; }

function seedEvents() {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return [
    {
      id: 1,
      title: 'Weekly Rehearsal',
      type: 'rehearsal',
      date: dateStr(y, m, 10),
      time: '19:30',
      location: "Hockley, Nottingham",
      desc: 'Warm-ups from 7:15. Bring your music for the upcoming show!',
      attendance: {},
    },
    {
      id: 2,
      title: 'Summer Showcase',
      type: 'event',
      date: dateStr(y, m, 22),
      time: '19:00',
      location: 'Nottingham Playhouse',
      desc: 'Our big summer performance. Smart-casual dress. Call time 6pm for sound check.',
      attendance: {},
    },
    {
      id: 3,
      title: 'Weekly Rehearsal',
      type: 'rehearsal',
      date: dateStr(y, m, 17),
      time: '19:30',
      location: "Hockley, Nottingham",
      desc: 'Final run-through before the Summer Showcase.',
      attendance: {},
    },
  ];
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return seedEvents();
}

function persist(events) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch (_) {}
}

export function useEvents() {
  const [events, setEvents] = useState(load);

  const addEvent = useCallback((ev) => {
    setEvents((prev) => {
      const maxId = prev.length ? Math.max(...prev.map((e) => e.id)) : 0;
      const next = [...prev, { ...ev, id: maxId + 1, attendance: {} }];
      persist(next);
      return next;
    });
  }, []);

  const deleteEvent = useCallback((id) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const setAttendance = useCallback((id, val) => {
    setEvents((prev) => {
      const next = prev.map((e) => {
        if (e.id !== id) return e;
        const att = { ...e.attendance };
        if (att['me'] === val) delete att['me'];
        else att['me'] = val;
        return { ...e, attendance: att };
      });
      persist(next);
      return next;
    });
  }, []);

  return { events, addEvent, deleteEvent, setAttendance };
}
