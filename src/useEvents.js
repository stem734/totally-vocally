import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tv_events_v4';

const VENUE = 'Clumber Hall, High Cross Street, Nottingham, NG1 3AZ';

function seedEvents() {
  // ── 2026 Term Dates extracted from choir info ──
  // Mondays 6:45pm – 8:45pm
  const mondays = [
    // Block 1
    '2026-01-05','2026-01-12','2026-01-19','2026-01-26','2026-02-02',
    // Block 2
    '2026-02-16','2026-02-23','2026-03-02','2026-03-09','2026-03-16',
    // Block 3
    '2026-03-30','2026-04-06','2026-04-13','2026-04-20','2026-04-27',
    // Block 4
    '2026-05-11','2026-05-18','2026-05-25','2026-06-01','2026-06-08',
    // Block 5
    '2026-06-29','2026-07-06','2026-07-13','2026-07-20','2026-07-27',
    // Block 6
    '2026-09-07','2026-09-14','2026-09-21','2026-09-28','2026-10-05',
    // Block 7
    '2026-10-19','2026-10-26','2026-11-02','2026-11-09','2026-11-16',
    // Block 8
    '2026-11-30','2026-12-07','2026-12-14',
  ];

  // Tuesdays 7:00pm – 9:00pm
  const tuesdays = [
    // Block 1
    '2026-01-06','2026-01-13','2026-01-20','2026-01-27','2026-02-03',
    // Block 2
    '2026-02-17','2026-02-24','2026-03-03','2026-03-10','2026-03-17',
    // Block 3
    '2026-03-31','2026-04-07','2026-04-14','2026-04-21','2026-04-28',
    // Block 4
    '2026-05-12','2026-05-19','2026-05-26','2026-06-02','2026-06-09',
    // Block 5
    '2026-06-30','2026-07-07','2026-07-14','2026-07-21','2026-07-28',
    // Block 6
    '2026-09-08','2026-09-15','2026-09-22','2026-09-29','2026-10-06',
    // Block 7
    '2026-10-20','2026-10-27','2026-11-03','2026-11-10','2026-11-17',
    // Block 8
    '2026-12-01','2026-12-08','2026-12-15',
  ];

  const events = [];
  let id = 1;

  mondays.forEach((date) => {
    events.push({
      id: id++,
      title: 'Monday Rehearsal',
      type: 'rehearsal',
      date,
      time: '18:45',
      location: VENUE,
      desc: '6:45pm – 8:45pm. Monday group rehearsal.',
      attendance: {},
    });
  });

  tuesdays.forEach((date) => {
    events.push({
      id: id++,
      title: 'Tuesday Rehearsal',
      type: 'rehearsal',
      date,
      time: '19:00',
      location: VENUE,
      desc: '7:00pm – 9:00pm. Tuesday group rehearsal.',
      attendance: {},
    });
  });

  // ── Performances ──
  events.push({
    id: id++,
    title: 'Performance — Smithy Row',
    type: 'event',
    date: '2026-03-29',
    time: '10:00',
    location: 'Smithy Row, Nottingham',
    desc: 'Live performance on Smithy Row. Details TBC.',
    attendance: {},
  });

  return events;
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
