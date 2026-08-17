import React from 'react';
import s from './AdminSidebar.module.css';

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

const YEARS = (() => {
  const current = new Date().getFullYear();
  return [current, current + 1];
})();

export default function AdminSidebar({ filters, onFiltersChange, showMonthFilter = true, showTypeFilter = true }) {
  const handleEventTypeChange = (type) => {
    const newTypes = filters.eventTypes.includes(type)
      ? filters.eventTypes.filter(t => t !== type)
      : [...filters.eventTypes, type];
    onFiltersChange({ ...filters, eventTypes: newTypes });
  };

  const handleMonthChange = (month) => {
    const newMonths = filters.months.includes(month)
      ? filters.months.filter(m => m !== month)
      : [...filters.months, month];
    onFiltersChange({ ...filters, months: newMonths });
  };

  const handleYearChange = (year) => {
    const newYears = filters.years.includes(year)
      ? filters.years.filter(y => y !== year)
      : [...filters.years, year];
    onFiltersChange({ ...filters, years: newYears });
  };

  const handleResetFilters = () => {
    onFiltersChange({
      eventTypes: ['rehearsal', 'performance'],
      months: MONTHS.map(m => m.value),
      years: YEARS,
    });
  };

  const activeFilterCount =
    (filters.eventTypes.length < 2 ? 1 : 0) +
    (filters.months.length < MONTHS.length ? 1 : 0) +
    (filters.years.length < YEARS.length ? 1 : 0);

  return (
    <aside className={s.sidebar}>
      <div className={s.header}>
        <h2>Filters</h2>
        {activeFilterCount > 0 && (
          <button className={s.resetBtn} onClick={handleResetFilters} title="Reset all filters">
            Reset
          </button>
        )}
      </div>

      {showTypeFilter && (
        <div className={s.filterGroup}>
          <h3>Event Type</h3>
          <label className={s.checkbox}>
            <input
              type="checkbox"
              checked={filters.eventTypes.includes('rehearsal')}
              onChange={() => handleEventTypeChange('rehearsal')}
            />
            <span>Rehearsals</span>
          </label>
          <label className={s.checkbox}>
            <input
              type="checkbox"
              checked={filters.eventTypes.includes('performance')}
              onChange={() => handleEventTypeChange('performance')}
            />
            <span>Performances</span>
          </label>
        </div>
      )}

      {showMonthFilter && (
        <>
          <div className={s.filterGroup}>
            <h3>Year</h3>
            <div className={s.yearGrid}>
              {YEARS.map((year) => (
                <label key={year} className={s.yearCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.years.includes(year)}
                    onChange={() => handleYearChange(year)}
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={s.filterGroup}>
            <h3>Month</h3>
            <div className={s.monthGrid}>
              {MONTHS.map((month) => (
                <label key={month.value} className={s.monthCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.months.includes(month.value)}
                    onChange={() => handleMonthChange(month.value)}
                  />
                  <span>{month.label.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {activeFilterCount > 0 && (
        <div className={s.activeCount}>
          {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
        </div>
      )}
    </aside>
  );
}
