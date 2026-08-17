import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import s from './AttendanceDashboard.module.css';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AttendanceDashboard({ events }) {
  const [members, setMembers] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const memberMap = {};
        snapshot.forEach((doc) => {
          memberMap[doc.id] = doc.data().displayName || doc.data().email || 'Unknown';
        });
        setMembers(memberMap);
      },
      (err) => setError(err.message)
    );

    return () => unsubscribe();
  }, []);

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  const getAttendanceGroups = (event) => {
    const attendance = event.attendance || {};
    const groups = {
      yes: [],
      maybe: [],
      no: [],
    };

    Object.entries(attendance).forEach(([userId, status]) => {
      const memberName = members[userId] || userId;
      if (groups[status]) {
        groups[status].push(memberName);
      }
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort();
    });

    return groups;
  };

  return (
    <main className={s.page}>
      <header className={s.header}>
        <div>
          <h1>Event <span>Attendance</span></h1>
          <p>See who is coming, maybe, or can't make it to each event.</p>
        </div>
        <span className={s.count}>{events.length} events</span>
      </header>

      {error && <div className={s.error}>{error}</div>}

      <div className={s.eventsList}>
        {sortedEvents.length === 0 ? (
          <p className={s.empty}>No events scheduled yet.</p>
        ) : (
          sortedEvents.map((event) => {
            const d = new Date(event.date + 'T12:00:00');
            const groups = getAttendanceGroups(event);
            const totalResponses = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);

            return (
              <article className={s.eventCard} key={event.id}>
                <div className={s.eventHeader}>
                  <div className={s.eventDate}>
                    <span className={s.dayNum}>{d.getDate()}</span>
                    <span className={s.monthStr}>{MONTH_SHORT[d.getMonth()]}</span>
                  </div>
                  <div className={s.eventInfo}>
                    <h2>{event.title}</h2>
                    <div className={s.eventMeta}>
                      {event.time && <span>{event.time}</span>}
                      {event.location && <span>{event.location}</span>}
                    </div>
                  </div>
                  <span className={`${s.typePill} ${event.type === 'rehearsal' ? s.pillReh : ''}`}>
                    {event.type === 'rehearsal' ? 'Rehearsal' : 'Performance'}
                  </span>
                </div>

                <div className={s.attendanceGroups}>
                  <div className={s.group}>
                    <h3 className={s.groupTitle}>
                      <span className={s.statusBadge + ' ' + s.badgeYes}>✓</span>
                      Coming
                      <span className={s.count}>{groups.yes.length}</span>
                    </h3>
                    {groups.yes.length > 0 ? (
                      <ul className={s.memberList}>
                        {groups.yes.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className={s.empty}>No responses yet</p>
                    )}
                  </div>

                  <div className={s.group}>
                    <h3 className={s.groupTitle}>
                      <span className={s.statusBadge + ' ' + s.badgeMaybe}>?</span>
                      Maybe
                      <span className={s.count}>{groups.maybe.length}</span>
                    </h3>
                    {groups.maybe.length > 0 ? (
                      <ul className={s.memberList}>
                        {groups.maybe.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className={s.empty}>No responses</p>
                    )}
                  </div>

                  <div className={s.group}>
                    <h3 className={s.groupTitle}>
                      <span className={s.statusBadge + ' ' + s.badgeNo}>✕</span>
                      Not Coming
                      <span className={s.count}>{groups.no.length}</span>
                    </h3>
                    {groups.no.length > 0 ? (
                      <ul className={s.memberList}>
                        {groups.no.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className={s.empty}>No responses</p>
                    )}
                  </div>
                </div>

                <div className={s.summary}>
                  Total responses: {totalResponses}
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
