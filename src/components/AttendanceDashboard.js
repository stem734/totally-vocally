import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import AdminSidebar from './AdminSidebar';
import VoicePartBreakdown from './VoicePartBreakdown';
import { getDefaultFilters, filterEvents } from '../filterUtils';
import { eventTypeLabel } from '../eventFields';
import s from './AttendanceDashboard.module.css';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AttendanceDashboard({ events }) {
  const [members, setMembers] = useState({});
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(getDefaultFilters());
  const [copiedEventId, setCopiedEventId] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const memberMap = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const approved = data.role === 'admin' || data.status === 'approved';
          memberMap[doc.id] = {
            name: data.displayName || data.email || 'Unknown',
            approved,
          };
        });
        setMembers(memberMap);
      },
      (err) => setError(err.message)
    );

    return () => unsubscribe();
  }, []);

  const filteredEvents = filterEvents(events, filters);
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

  const getAttendanceGroups = (event) => {
    const attendance = event.attendance || {};
    const groups = {
      yes: [],
      maybe: [],
      no: [],
    };

    Object.entries(attendance).forEach(([userId, status]) => {
      const memberName = members[userId]?.name || userId;
      if (groups[status]) {
        groups[status].push(memberName);
      }
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort();
    });

    return groups;
  };

  const getNotResponded = (event) => {
    const attendance = event.attendance || {};
    return Object.entries(members)
      .filter(([userId, member]) => member.approved && !(userId in attendance))
      .map(([, member]) => member.name)
      .sort();
  };

  const copyNotResponded = (event, names) => {
    const text = `${event.title} (${event.date}) — yet to respond:\n${names.join('\n')}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedEventId(event.id);
        setTimeout(() => setCopiedEventId(''), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className={s.container}>
      <AdminSidebar filters={filters} onFiltersChange={setFilters} />
      <main className={s.page}>
        <header className={s.header}>
          <div>
            <h1>Event <span>Attendance</span></h1>
            <p>See who is coming, maybe, or can't make it to each event.</p>
          </div>
          <span className={s.count}>{sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}</span>
        </header>

        {error && <div className={s.error}>{error}</div>}

        <div className={s.eventsList}>
          {sortedEvents.length === 0 ? (
            <p className={s.empty}>No events matching your filters.</p>
          ) : (
            sortedEvents.map((event) => {
              const d = new Date(event.date + 'T12:00:00');
              const groups = getAttendanceGroups(event);
              const notResponded = getNotResponded(event);
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
                      {eventTypeLabel(event.type)}
                    </span>
                  </div>

                  {event.type !== 'rehearsal' && (
                    <VoicePartBreakdown counts={event.voicePartCounts || {}} checkMissing />
                  )}

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

                    <div className={s.group}>
                      <h3 className={s.groupTitle}>
                        <span className={s.statusBadge + ' ' + s.badgeUnresponded}>…</span>
                        Yet to Respond
                        <span className={s.count}>{notResponded.length}</span>
                        {notResponded.length > 0 && (
                          <button className={s.copyBtn} onClick={() => copyNotResponded(event, notResponded)}>
                            {copiedEventId === event.id ? 'Copied!' : 'Copy list'}
                          </button>
                        )}
                      </h3>
                      {notResponded.length > 0 ? (
                        <ul className={s.memberList}>
                          {notResponded.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={s.empty}>Everyone has responded</p>
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
    </div>
  );
}
