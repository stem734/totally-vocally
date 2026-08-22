import React, { useState, useEffect } from 'react';
import s from './AddEventModal.module.css';
import { EVENT_TYPES, DURATION_OPTIONS, formatDuration, defaultArrivalTime } from '../eventFields';

const EMPTY = { title: '', type: 'rehearsal', date: '', time: '', arriveBy: '', duration: '', location: '', desc: '' };

export default function AddEventModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      setForm({ ...EMPTY, date: today });
    }
  }, [open]);

  if (!open) return null;

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((current) => {
      const next = { ...current, [field]: value };
      const selectedTime = field === 'time' ? value : current.time;

      if (field === 'time' && !current.arriveBy) {
        next.arriveBy = defaultArrivalTime(selectedTime);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.date) {
      alert('Please enter a title and date.');
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      desc: form.desc.trim(),
      duration: form.duration ? Number(form.duration) : '',
    });
    onClose();
  };

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Add New Event</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={s.body}>
          <div className={s.field}>
            <label>Event Title</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Weekly Rehearsal"
            />
          </div>

          <div className={s.field}>
            <label>Type</label>
            <select value={form.type} onChange={set('type')}>
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label>Date</label>
              <input type="date" value={form.date} onChange={set('date')} />
            </div>
            <div className={s.field}>
              <label>Time</label>
              <input type="time" value={form.time} onChange={set('time')} />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label>Arrive By <span className={s.opt}>(defaults to 30 minutes before the start time)</span></label>
              <input type="time" value={form.arriveBy} onChange={set('arriveBy')} />
            </div>
            <div className={s.field}>
              <label>Duration <span className={s.opt}>(optional)</span></label>
              <select value={form.duration} onChange={set('duration')}>
                <option value="">—</option>
                {DURATION_OPTIONS.map(mins => (
                  <option key={mins} value={mins}>{formatDuration(mins)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={s.field}>
            <label>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. Hockley, Nottingham"
            />
          </div>

          <div className={s.field}>
            <label>Description <span className={s.opt}>(optional)</span></label>
            <textarea
              value={form.desc}
              onChange={set('desc')}
              placeholder="Any extra details or a https:// link for members..."
              rows={3}
            />
          </div>
        </div>

        <div className={s.footer}>
          <button className={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={s.saveBtn} onClick={handleSave}>Add Event</button>
        </div>
      </div>
    </div>
  );
}
