import React, { useEffect, useRef, useState } from 'react';
import s from './CalendarPage.module.css';
import EventDetailModal from './EventDetailModal';
import RehearsalBlockModal from './RehearsalBlockModal';
import { downloadICalendar } from '../calendarSubscription';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function CalendarPage({ events, isAdmin, onAddEvent, onDeleteEvent, onUpdateEvent, onSetAttendance, onAllocateSongs, rehearsalDay, onCreateRehearsalBlock }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedEventId, setSelectedEventId] = useState(null);
  const selectedEvent = events.find(e => e.id === selectedEventId) || null;
  const [rehearsalBlockModalOpen, setRehearsalBlockModalOpen] = useState(false);
  const [blockCreating, setBlockCreating] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => { mainRef.current?.focus(); }, []);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDow   = new Date(year, month, 1).getDay();
  const offset     = (firstDow + 6) % 7;
  const daysInMo   = new Date(year, month + 1, 0).getDate();
  const prevMoDays = new Date(year, month, 0).getDate();

  const cellDate = (cell) => {
    const rawMonth = month + cell.mo;
    const rm = ((rawMonth % 12) + 12) % 12;
    const ry = year + Math.floor(rawMonth / 12);
    return `${ry}-${String(rm + 1).padStart(2,'0')}-${String(cell.d).padStart(2,'0')}`;
  };

  const cells = [];
  for (let i = offset - 1; i >= 0; i--)
    cells.push({ d: prevMoDays - i, mo: -1, other: true });
  for (let d = 1; d <= daysInMo; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    cells.push({ d, mo: 0, other: false, isToday });
  }
  const rem = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= rem; d++) cells.push({ d, mo: 1, other: true });

  return (
    <main className={s.page} id="main-content" ref={mainRef} tabIndex={-1}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Rehearsal <span>Calendar</span></h1>
        </div>
        <div className={s.headerBtns}>
          <button className={s.exportBtn} onClick={() => downloadICalendar(events)}>Subscribe (iCal)</button>
          {isAdmin && <button className={s.addBtn} onClick={onAddEvent}>Add Event</button>}
          {isAdmin && <button className={s.addBtn} onClick={() => setRehearsalBlockModalOpen(true)}>Create Rehearsal Block</button>}
        </div>
      </div>

      <div className={s.nav}>
        <button className={s.arrow} onClick={prev} aria-label="Previous month">‹</button>
        <span className={s.monthLabel}>{MONTHS[month]} {year}</span>
        <button className={s.arrow} onClick={next} aria-label="Next month">›</button>
      </div>

      <div className={s.grid}>
        {DAYS.map(d => <div key={d} className={s.dayHdr}>{d}</div>)}
        {cells.map((cell, i) => {
          const key = cellDate(cell);
          const evs = events.filter(e => e.date === key);
          return (
            <div key={i} className={`${s.cell} ${cell.other ? s.other : ''} ${cell.isToday ? s.today : ''}`}>
              <span className={s.num}>{cell.d}</span>
              {evs.map(ev => {
                const isDesignated = ev.type === 'rehearsal' && rehearsalDay && (ev.groupDay === rehearsalDay || ev.title?.startsWith(rehearsalDay));
                return (
                  <button
                    type="button"
                    key={ev.id}
                    className={`${s.chip} ${ev.type === 'rehearsal' ? s.chipReh : ''} ${isDesignated ? s.designated : ''}`}
                    onClick={() => setSelectedEventId(ev.id)}
                    title={`${ev.time ? ev.time+' — ' : ''}${ev.title}`}
                  >
                    {ev.title}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className={s.legend}>
        <span className={`${s.dot} ${s.dotEvent}`} /> Performance / Workshop
        <span className={`${s.dot} ${s.dotReh}`} /> Rehearsal
      </div>

      <EventDetailModal
        open={selectedEvent !== null}
        event={selectedEvent}
        isAdmin={isAdmin}
        onClose={() => setSelectedEventId(null)}
        onSetAttendance={onSetAttendance}
        onDelete={onDeleteEvent}
        onUpdate={onUpdateEvent}
        onAllocateSongs={onAllocateSongs}
      />

      <RehearsalBlockModal
        open={rehearsalBlockModalOpen}
        onClose={() => setRehearsalBlockModalOpen(false)}
        onSave={async (blockData) => {
          if (onCreateRehearsalBlock) {
            setBlockCreating(true);
            try {
              const count = await onCreateRehearsalBlock(blockData);
              alert(`Created ${count} rehearsals`);
              setRehearsalBlockModalOpen(false);
            } finally {
              setBlockCreating(false);
            }
          }
        }}
        isSaving={blockCreating}
      />
    </main>
  );
}
