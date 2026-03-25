import React from 'react';
import s from './Header.module.css';

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const EventIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="17" r="1"/>
    <path d="M8.56 5.75A4 4 0 0 1 12 4c2.373 0 4.25 1.68 5.32 4"/>
    <path d="M5 9c1.5-1 3-2 5-2 5 0 7 4 8 6m-1 3v2a2 2 0 1 1-4 0v-2m0 0H9a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2"/>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const FilesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2.414-.6l-5.972-7.467a2 2 0 0 0-3.228 0L2.414 18.4A2 2 0 0 1 0 17V5a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2z"/>
    <circle cx="8.5" cy="7" r="1.5"/>
  </svg>
);

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'events',   label: 'Events',   icon: EventIcon },
  { id: 'info',     label: 'Info',     icon: InfoIcon },
  { id: 'files',    label: 'Files',    icon: FilesIcon },
];

export default function Header({ activePage, onNavigate, onLogout }) {
  return (
    <header className={s.header}>
      <div className={s.brand} onClick={() => onNavigate('calendar')}>
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Totally Vocally" className={s.brandLogo} />
      </div>

      <nav className={s.nav}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${s.navBtn} ${activePage === tab.id ? s.active : ''}`}
              onClick={() => onNavigate(tab.id)}
            >
              <span className={s.navIcon}><Icon /></span>
              <span className={s.navLabel}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <button className={s.logoutBtn} onClick={onLogout}>
        Sign Out
      </button>
    </header>
  );
}
