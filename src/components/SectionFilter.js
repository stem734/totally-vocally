import React from 'react';
import { CHOIR_SECTIONS } from '../eventFields';
import s from './SectionFilter.module.css';

export default function SectionFilter({ isAdmin, value = 'all', onChange }) {
  if (!isAdmin) return null;

  return (
    <div className={s.wrapper}>
      <label htmlFor="event-section-filter">Show section</label>
      <select
        id="event-section-filter"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="all">All sections</option>
        {CHOIR_SECTIONS.map((section) => (
          <option key={section} value={section}>{section}</option>
        ))}
      </select>
    </div>
  );
}
