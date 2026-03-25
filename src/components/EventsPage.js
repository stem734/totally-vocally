import React from 'react';
import s from './EventsPage.module.css';

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width: '1.2em', height: '1.2em', display: 'inline', marginRight: '0.4em', verticalAlign: 'middle'}}>
    <path d="M11.99 5C9.35 5 7 7.35 7 9.99s2.35 5 5 5 5-2.35 5-5-2.35-5-5-5zm.5 8h-1v-6h1v6z"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width: '1.1em', height: '1.1em', marginRight: '0.3em', verticalAlign: 'middle'}}>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width: '1.5em', height: '1.5em'}}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11z"/>
  </svg>
);

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function attSummary(ev) {
  const vals = Object.values(ev.attendance);
  const yes   = vals.filter(v => v === 'yes').length;
  const maybe = vals.filter(v => v === 'maybe').length;
  const no    = vals.filter(v => v === 'no').length;
  const parts = [];
  if (yes)   parts.push(`${yes} coming`);
  if (maybe) parts.push(`${maybe} maybe`);
  if (no)    parts.push(`${no} not coming`);
  return parts.length ? parts.join(' · ') : 'No responses yet';
}

export default function EventsPage({ events, isAdmin, onAddEvent, onDeleteEvent, onSetAttendance }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Upcoming <span>Events</span></h1>
          <p className={s.sub}>Let us know if you're coming!</p>
        </div>
        {isAdmin && <button className={s.addBtn} onClick={onAddEvent}>＋ Add Event</button>}
      </div>

      {sorted.length === 0 ? (
        <div className={s.empty}>
          <span><MusicIcon /></span>
          <p>No events yet — add one above!</p>
        </div>
      ) : (
        <div className={s.list}>
          {sorted.map(ev => {
            const d = new Date(ev.date + 'T12:00:00');
            const myAtt = ev.attendance['me'] || null;
            const isReh = ev.type === 'rehearsal';

            return (
              <div key={ev.id} className={`${s.card} ${isReh ? s.cardReh : ''}`}>
                <div className={`${s.dateBadge} ${isReh ? s.dateBadgeReh : ''}`}>
                  <span className={s.dayNum}>{d.getDate()}</span>
                  <span className={s.monthStr}>{MONTH_SHORT[d.getMonth()]}</span>
                </div>

                <div className={s.body}>
                  <div className={s.topRow}>
                    <span className={`${s.typePill} ${isReh ? s.pillReh : ''}`}>
                      {isReh ? 'Rehearsal' : 'Performance'}
                    </span>
                    {isAdmin && <button
                      className={s.delBtn}
                      onClick={() => window.confirm('Remove this event?') && onDeleteEvent(ev.id)}
                      title="Delete"
                    >×</button>}
                  </div>

                  <h2 className={s.evTitle}>{ev.title}</h2>

                  <p className={s.meta}>
                    {ev.time && <span><ClockIcon /> {ev.time}</span>}
                    {ev.location && (
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(ev.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}
                      >
                        {ev.location}
                      </a>
                    )}
                  </p>

                  {ev.desc && <p className={s.desc}>{ev.desc}</p>}

                  <div className={s.attSection}>
                    <p className={s.attLabel}>Are you coming?</p>
                    <div className={s.attRow}>
                      <button
                        className={`${s.attBtn} ${myAtt === 'yes' ? s.attYes : ''}`}
                        onClick={() => onSetAttendance(ev.id, 'yes')}
                      ><CheckIcon /> Coming</button>
                      <button
                        className={`${s.attBtn} ${myAtt === 'maybe' ? s.attMaybe : ''}`}
                        onClick={() => onSetAttendance(ev.id, 'maybe')}
                      >? Maybe</button>
                      <button
                        className={`${s.attBtn} ${myAtt === 'no' ? s.attNo : ''}`}
                        onClick={() => onSetAttendance(ev.id, 'no')}
                      >× Can't make it</button>
                    </div>
                    <p className={s.attCount}>{attSummary(ev)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
