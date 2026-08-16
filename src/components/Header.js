import React from 'react';
import s from './Header.module.css';
import { CalendarIcon, EventIcon, InfoIcon, FilesIcon } from '../icons';

export default function Header({ activePage, onNavigate, onLogout }) {
  const TABS = [
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'events',   label: 'Events',   icon: EventIcon },
    { id: 'info',     label: 'Info',     icon: InfoIcon },
    { id: 'files',    label: 'Files',    icon: FilesIcon },
  ];
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
