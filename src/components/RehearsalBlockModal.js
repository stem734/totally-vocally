import React, { useState } from 'react';
import s from './RehearsalBlockModal.module.css';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function RehearsalBlockModal({ open, onClose, onSave, isSaving }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState([1, 3, 5]); // Default: Mon, Wed, Fri
  const [excludedDates, setExcludedDates] = useState('');
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleDayToggle = (day) => {
    setSelectedDays(
      selectedDays.includes(day)
        ? selectedDays.filter(d => d !== day)
        : [...selectedDays, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate || selectedDays.length === 0) {
      setError('Please fill in start date, end date, and select at least one day');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('Start date must be before end date');
      return;
    }

    const excluded = excludedDates
      .split(',')
      .map(d => d.trim())
      .filter(d => d);

    try {
      await onSave({
        startDate,
        endDate,
        daysOfWeek: selectedDays,
        excludedDates: excluded,
        time,
        location,
      });
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDays([1, 3, 5]);
    setExcludedDates('');
    setTime('19:00');
    setLocation('');
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Create Rehearsal Block</h2>
          <button className={s.closeBtn} onClick={resetForm} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.body}>
            {error && <div className={s.error}>{error}</div>}

            <div className={s.formGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className={s.formGroup}>
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className={s.formGroup}>
              <label>Days of Week</label>
              <div className={s.daysGrid}>
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.value} className={s.dayCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      disabled={isSaving}
                    />
                    <span>{day.label.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={s.formGroup}>
              <label htmlFor="time">Time (optional)</label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className={s.formGroup}>
              <label htmlFor="location">Location (optional)</label>
              <input
                id="location"
                type="text"
                placeholder="e.g., Community Hall"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className={s.formGroup}>
              <label htmlFor="excludedDates">Excluded Dates (optional)</label>
              <textarea
                id="excludedDates"
                placeholder="Enter dates to exclude (breaks, holidays)&#10;Format: YYYY-MM-DD&#10;One date per line&#10;e.g., 2026-12-25&#10;2027-01-01"
                value={excludedDates}
                onChange={(e) => setExcludedDates(e.target.value)}
                disabled={isSaving}
                rows={4}
              />
            </div>

            {startDate && endDate && selectedDays.length > 0 && (
              <div className={s.preview}>
                <p className={s.previewLabel}>Preview</p>
                <p>Will create rehearsals on:</p>
                <ul>
                  {selectedDays
                    .sort()
                    .map((day) => DAYS_OF_WEEK.find(d => d.value === day)?.label)
                    .join(', ')}
                </ul>
                <p>from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <div className={s.footer}>
            <button
              type="button"
              className={s.cancelBtn}
              onClick={resetForm}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={s.submitBtn}
              disabled={isSaving || !startDate || !endDate || selectedDays.length === 0}
            >
              {isSaving ? 'Creating...' : 'Create Rehearsals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
