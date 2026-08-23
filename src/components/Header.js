import React from 'react';
import s from './Header.module.css';
import { CalendarIcon, EventIcon, InfoIcon, FilesIcon } from '../icons';

export default function Header({ activePage, onNavigate, onLogout, showAdminNav, hasNewEvents }) {
  const TABS = [
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'events',   label: 'Events',   icon: EventIcon },
    { id: 'files',    label: 'Files',    icon: FilesIcon },
    { id: 'info',     label: 'Info',     icon: InfoIcon },
  ];
  if (showAdminNav) {
    TABS.push({ id: 'attendance', label: 'Attendance', icon: EventIcon });
    TABS.push({ id: 'members', label: 'Members', icon: InfoIcon });
  }
  return (
    <>
      <a href="#main-content" className={s.skipLink}>Skip to content</a>
      <header className={s.header}>
        <button type="button" className={s.brand} onClick={() => onNavigate('calendar')}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Totally Vocally" className={s.brandLogo} />
        </button>

        <nav className={s.nav} aria-label="Main navigation">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const showBadge = hasNewEvents && (tab.id === 'calendar' || tab.id === 'events');
            return (
              <button
                key={tab.id}
                className={`${s.navBtn} ${activePage === tab.id ? s.active : ''}`}
                onClick={() => onNavigate(tab.id)}
                aria-current={activePage === tab.id ? 'page' : undefined}
              >
                <span className={s.navIcon}>
                  <Icon />
                  {showBadge && <span className={s.navBadge} aria-hidden="true" />}
                </span>
                <span className={s.navLabel}>
                  {tab.label}
                  {showBadge && <span className={s.srOnly}> (new)</span>}
                </span>
              </button>
            );
          })}
        </nav>

        <button className={s.logoutBtn} onClick={onLogout}>
          Sign Out
        </button>
      </header>
    </>
  );
}
