import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import s from './EditEventModal.module.css';
import { EVENT_TYPES, DURATION_OPTIONS, CHOIR_SECTIONS, formatDuration, defaultArrivalTime } from '../eventFields';

export default function EditEventModal({ open, event, onClose, onSave, isSaving, songs = [] }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('rehearsal');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [arriveBy, setArriveBy] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [sections, setSections] = useState([]);
  const [songIds, setSongIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setType(event.type || 'rehearsal');
      setDate(event.date || '');
      setTime(event.time || '');
      setArriveBy(event.arriveBy || defaultArrivalTime(event.time));
      setDuration(event.duration || '');
      setLocation(event.location || '');
      setDesc(event.desc || '');
      setSections(Array.isArray(event.sections) ? event.sections : (Array.isArray(event.choirs) ? event.choirs : (event.section ? [event.section] : [])));
      setSongIds(Array.isArray(event.songIds) ? event.songIds : []);
      setError('');
    }
  }, [event, open]);

  const handleTimeChange = (value) => {
    setTime(value);
    if (!arriveBy) setArriveBy(defaultArrivalTime(value));
  };

  const toggleListValue = (setter) => (value) => {
    setter((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !date) {
      setError('Title and date are required');
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        type,
        date,
        time,
        arriveBy,
        duration: duration ? Number(duration) : '',
        location: location.trim(),
        desc: desc.trim(),
        sections,
        songIds,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!open || !event) return null;

  return createPortal(
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Edit Event</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.body}>
            {error && <div className={s.error}>{error}</div>}

            <div className={s.formGroup}>
              <label htmlFor="title">Event Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className={s.formRow}>
              <div className={s.formGroup}>
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSaving}
                  required
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className={s.formGroup}>
                <label htmlFor="date">Date *</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className={s.formRow}>
              <div className={s.formGroup}>
                <label htmlFor="time">Time</label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className={s.formGroup}>
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSaving}
                  placeholder="e.g., Community Hall"
                />
              </div>
            </div>

            <div className={s.formRow}>
              <div className={s.formGroup}>
                <label htmlFor="arriveBy">Arrive By (defaults to 30 mins before the start time)</label>
                <input
                  id="arriveBy"
                  type="time"
                  value={arriveBy}
                  onChange={(e) => setArriveBy(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className={s.formGroup}>
                <label htmlFor="duration">Duration</label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="">—</option>
                  {DURATION_OPTIONS.map(mins => (
                    <option key={mins} value={mins}>{formatDuration(mins)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={s.formGroup}>
              <label htmlFor="desc">Description</label>
              <textarea
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                disabled={isSaving}
                rows={4}
                placeholder="Optional event description — paste a https:// link to make it clickable"
              />
            </div>

            <fieldset className={s.checkboxField}>
              <legend>Choir sections <span className={s.opt}>(optional — leave empty for everyone)</span></legend>
              <div className={s.checkboxGroup}>
                {CHOIR_SECTIONS.map((section) => (
                  <label key={section} className={s.checkboxOption}>
                    <input
                      type="checkbox"
                      checked={sections.includes(section)}
                      onChange={() => toggleListValue(setSections)(section)}
                      disabled={isSaving}
                    />
                    <span>{section}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={s.checkboxField}>
              <legend>Songs <span className={s.opt}>(optional)</span></legend>
              {songs.filter((song) => !song.archivedAt).length > 0 ? (
                <div className={`${s.checkboxGroup} ${s.songGroup}`}>
                  {songs.filter((song) => !song.archivedAt || songIds.includes(song.id)).map((song) => (
                    <label key={song.id} className={s.checkboxOption}>
                      <input
                        type="checkbox"
                        checked={songIds.includes(song.id)}
                        onChange={() => toggleListValue(setSongIds)(song.id)}
                        disabled={isSaving}
                      />
                      <span>{song.title}</span>
                    </label>
                  ))}
                </div>
              ) : <p className={s.emptyOptions}>No songs have been added yet.</p>}
            </fieldset>
          </div>

          <div className={s.footer}>
            <button
              type="button"
              className={s.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={s.submitBtn}
              disabled={isSaving || !title.trim() || !date}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
