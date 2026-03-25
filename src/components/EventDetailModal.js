import React from 'react';
import s from './EventDetailModal.module.css';

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
                <span>⏰ {event.time}</span>
              </p>
            )}

            {event.location && (
              <p className={s.meta}>
                <span>📍 {event.location}</span>
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
                >✔ Coming</button>
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
