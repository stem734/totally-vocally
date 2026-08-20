import React, { useEffect, useRef, useState } from 'react';
import { useSongs } from '../useSongs';
import EditEventModal from './EditEventModal';
import AllocateSongsModal from './AllocateSongsModal';
import VoicePartBreakdown from './VoicePartBreakdown';
import s from './EventsPage.module.css';
import { ClockIcon, CheckIcon, MusicIcon } from '../icons';
import { eventTypeLabel, formatDuration } from '../eventFields';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function attSummary(ev) {
  const vals = Object.values(ev.attendance || {});
  const yes   = vals.filter(v => v === 'yes').length;
  const maybe = vals.filter(v => v === 'maybe').length;
  const no    = vals.filter(v => v === 'no').length;
  const parts = [];
  if (yes)   parts.push(`${yes} coming`);
  if (maybe) parts.push(`${maybe} maybe`);
  if (no)    parts.push(`${no} not coming`);
  return parts.length ? parts.join(' · ') : 'No responses yet';
}

export default function EventsPage({ events, isAdmin, onAddEvent, onDeleteEvent, onUpdateEvent, onSetAttendance, onAllocateSongs, rehearsalDay, onMarkEventsSeen }) {
  const { songs } = useSongs();
  const [editingEventId, setEditingEventId] = useState(null);
  const [allocatingEventId, setAllocatingEventId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.focus();
    onMarkEventsSeen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = [...events].filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = [...events].filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const sorted = [...upcoming, ...past];

  const editingEvent = events.find(e => e.id === editingEventId) || null;
  const allocatingEvent = events.find(e => e.id === allocatingEventId) || null;

  return (
    <main className={s.page} id="main-content" ref={mainRef} tabIndex={-1}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Upcoming <span>Events</span></h1>
          <p className={s.sub}>Let us know if you're coming!</p>
        </div>
        {isAdmin && <button className={s.addBtn} onClick={onAddEvent}>＋ Add Event</button>}
      </div>

      {sorted.length === 0 ? (
        <div className={s.empty}>
          <span><MusicIcon /></span>
          <p>No events yet — add one above!</p>
        </div>
      ) : (
        <div className={s.list}>
          {sorted.map(ev => {
            const d = new Date(ev.date + 'T12:00:00');
            const myAtt = ev.myAttendance || null;
            const isReh = ev.type === 'rehearsal';
            const isDesignated = isReh && rehearsalDay && (ev.groupDay === rehearsalDay || ev.title?.startsWith(rehearsalDay));

            return (
              <div key={ev.id} className={`${s.card} ${isReh ? s.cardReh : ''} ${isDesignated ? s.designated : ''}`}>
                <div className={`${s.dateBadge} ${isReh ? s.dateBadgeReh : ''}`}>
                  <span className={s.dayNum}>{d.getDate()}</span>
                  <span className={s.monthStr}>{MONTH_SHORT[d.getMonth()]}</span>
                </div>

                <div className={s.body}>
                  <div className={s.topRow}>
                    <span className={`${s.typePill} ${isReh ? s.pillReh : ''}`}>
                      {eventTypeLabel(ev.type)}
                    </span>
                    {isAdmin && <button
                      className={s.delBtn}
                      onClick={() => setDeletingEvent(ev)}
                      title="Delete"
                    >×</button>}
                  </div>

                  <h2 className={s.evTitle}>{ev.title}</h2>

                  <p className={s.meta}>
                    {ev.time && <span><ClockIcon /> {ev.time}</span>}
                    {ev.arriveBy && <span><ClockIcon /> Arrive by {ev.arriveBy}</span>}
                    {ev.duration && <span><ClockIcon /> {formatDuration(ev.duration)}</span>}
                    {ev.location && (
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(ev.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}
                      >
                        {ev.location}
                      </a>
                    )}
                  </p>

                  {ev.desc && <p className={s.desc}>{ev.desc}</p>}

                  {ev.songIds && ev.songIds.length > 0 && (
                    <div className={s.songsSection}>
                      <p className={s.attLabel}>Songs Allocated</p>
                      <div className={s.songsList}>
                        {ev.songIds.map((songId) => {
                          const song = songs.find(sg => sg.id === songId);
                          return (
                            <span key={songId} className={s.songTag}>
                              {song?.title || 'Unknown Song'}
                              {song?.url && (
                                <a href={song.url} target="_blank" rel="noopener noreferrer" className={s.songLink}>
                                  🔗
                                </a>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {ev.type !== 'rehearsal' && (
                    <VoicePartBreakdown counts={ev.voicePartCounts || {}} checkMissing={isAdmin} />
                  )}

                  <div className={s.attSection}>
                    {!isAdmin && (
                      <>
                        <p className={s.attLabel}>Are you coming?</p>
                        <div className={s.attRow}>
                          <button
                            className={`${s.attBtn} ${myAtt === 'yes' ? s.attYes : ''}`}
                            onClick={() => onSetAttendance(ev.id, 'yes')}
                          ><CheckIcon /> Coming</button>
                          <button
                            className={`${s.attBtn} ${myAtt === 'maybe' ? s.attMaybe : ''}`}
                            onClick={() => onSetAttendance(ev.id, 'maybe')}
                          >? Maybe</button>
                          <button
                            className={`${s.attBtn} ${myAtt === 'no' ? s.attNo : ''}`}
                            onClick={() => onSetAttendance(ev.id, 'no')}
                          >× Can't make it</button>
                        </div>
                      </>
                    )}
                    <p className={s.attCount}>{attSummary(ev)}</p>
                  </div>

                  {isAdmin && (
                    <div className={s.adminRow}>
                      <button className={s.editBtn} onClick={() => setEditingEventId(ev.id)}>Edit Event</button>
                      <button className={s.allocateBtn} onClick={() => setAllocatingEventId(ev.id)}>Allocate Songs</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && onUpdateEvent && (
        <EditEventModal
          open={editingEvent !== null}
          event={editingEvent}
          onClose={() => setEditingEventId(null)}
          onSave={async (updates) => {
            setIsSaving(true);
            try {
              await onUpdateEvent(editingEvent.id, updates);
              setEditingEventId(null);
            } finally {
              setIsSaving(false);
            }
          }}
          isSaving={isSaving}
        />
      )}

      {isAdmin && onAllocateSongs && (
        <AllocateSongsModal
          open={allocatingEvent !== null}
          event={allocatingEvent}
          onClose={() => setAllocatingEventId(null)}
          onSave={async (songIds) => {
            await onAllocateSongs(allocatingEvent.id, songIds);
            setAllocatingEventId(null);
          }}
          isSaving={false}
        />
      )}

      {deletingEvent && (
        <div className={s.confirmOverlay} onClick={() => setDeletingEvent(null)}>
          <div className={s.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Remove event?</h3>
            <p>Are you sure you want to remove "{deletingEvent.title}"?</p>
            <div className={s.confirmActions}>
              <button className={s.editBtn} onClick={() => setDeletingEvent(null)}>Cancel</button>
              <button
                className={s.confirmDeleteBtn}
                onClick={() => {
                  onDeleteEvent(deletingEvent.id);
                  setDeletingEvent(null);
                }}
              >Remove</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
