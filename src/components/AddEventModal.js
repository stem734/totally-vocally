import React, { useState, useEffect } from 'react';
import s from './AddEventModal.module.css';

const EMPTY = { title: '', type: 'rehearsal', date: '', time: '', location: '', desc: '' };

export default function AddEventModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      setForm({ ...EMPTY, date: today });
    }
  }, [open]);

  if (!open) return null;

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

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
    });
    onClose();
  };

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Add New Event</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
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
              <option value="rehearsal">🎵 Rehearsal</option>
              <option value="event">🎤 Performance / Event</option>
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
              placeholder="Any extra details for members..."
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
