import React from 'react';
import s from './Header.module.css';

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'events',   label: 'Events',   icon: '🎤' },
  { id: 'info',     label: 'Info',     icon: 'ℹ️' },
  { id: 'files',    label: 'Files',    icon: '📁' },
];

export default function Header({ activePage, onNavigate, onLogout }) {
  return (
    <header className={s.header}>
      <div className={s.brand} onClick={() => onNavigate('calendar')}>
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Totally Vocally" className={s.brandLogo} />
      </div>

      <nav className={s.nav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${s.navBtn} ${activePage === tab.id ? s.active : ''}`}
            onClick={() => onNavigate(tab.id)}
          >
            <span className={s.navIcon}>{tab.icon}</span>
            <span className={s.navLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      <button className={s.logoutBtn} onClick={onLogout}>
        Sign Out
      </button>
    </header>
  );
}
