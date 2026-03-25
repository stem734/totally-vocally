import React from 'react';
import s from './EventDetailModal.module.css';

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

export default function EventDetailModal({ open, event, isAdmin, onClose, onSetAttendance, onDelete }) {
  if (!open || !event) return null;

  const d = new Date(event.date + 'T12:00:00');
  const myAtt = event.attendance['me'] || null;
  const isReh = event.type === 'rehearsal';

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{event.title}</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={s.body}>
          <div className={s.dateBadge}>
            <span className={s.dayNum}>{d.getDate()}</span>
            <span className={s.monthStr}>{MONTH_SHORT[d.getMonth()]}</span>
          </div>

          <div className={s.content}>
            <span className={`${s.typePill} ${isReh ? s.pillReh : ''}`}>
              {isReh ? 'Rehearsal' : 'Performance'}
            </span>

            {event.time && (
              <p className={s.meta}>
                <span><ClockIcon /> {event.time}</span>
              </p>
            )}

            {event.location && (
              <p className={s.meta}>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}
                >
                  {event.location}
                </a>
              </p>
            )}

            {event.desc && (
              <p className={s.desc}>{event.desc}</p>
            )}

            <div className={s.attSection}>
              <p className={s.attLabel}>Are you coming?</p>
              <div className={s.attRow}>
                <button
                  className={`${s.attBtn} ${myAtt === 'yes' ? s.attYes : ''}`}
                  onClick={() => onSetAttendance(event.id, 'yes')}
                ><CheckIcon /> Coming</button>
                <button
                  className={`${s.attBtn} ${myAtt === 'maybe' ? s.attMaybe : ''}`}
                  onClick={() => onSetAttendance(event.id, 'maybe')}
                >? Maybe</button>
                <button
                  className={`${s.attBtn} ${myAtt === 'no' ? s.attNo : ''}`}
                  onClick={() => onSetAttendance(event.id, 'no')}
                >× Can't make it</button>
              </div>
              <p className={s.attCount}>{attSummary(event)}</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className={s.footer}>
            <button
              className={s.delBtn}
              onClick={() => {
                if (window.confirm('Remove this event?')) {
                  onDelete(event.id);
                  onClose();
                }
              }}
            >Delete Event</button>
          </div>
        )}
      </div>
    </div>
  );
}
