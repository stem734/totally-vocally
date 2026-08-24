import React, { useState } from 'react';
import AllocateSongsModal from './AllocateSongsModal';
import EditEventModal from './EditEventModal';
import VoicePartBreakdown from './VoicePartBreakdown';
import LinkedText from './LinkedText';
import s from './EventDetailModal.module.css';
import { ClockIcon, CheckIcon } from '../icons';
import { eventTypeLabel, formatDuration } from '../eventFields';
import { useModalA11y } from '../useModalA11y';
import { safeExternalUrl } from '../safeUrl';

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

export default function EventDetailModal({ open, event, isAdmin, onClose, onSetAttendance, onDelete, onUpdate, onAllocateSongs, onOpenSongFolder, songs = [] }) {
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const modalRef = useModalA11y(open && !!event, onClose);

  if (!open || !event) return null;

  const d = new Date(event.date + 'T12:00:00');
  const myAtt = event.myAttendance || null;
  const isReh = event.type === 'rehearsal';

  return (
    <div className={s.overlay}>
      <div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eventDetailModalTitle"
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle} id="eventDetailModalTitle">{event.title}</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={s.body}>
          <div className={s.dateBadge}>
            <span className={s.dayNum}>{d.getDate()}</span>
            <span className={s.monthStr}>{MONTH_SHORT[d.getMonth()]}</span>
          </div>

          <div className={s.content}>
            <span className={`${s.typePill} ${isReh ? s.pillReh : ''}`}>
              {eventTypeLabel(event.type)}
            </span>

            {event.time && (
              <p className={s.meta}>
                <span><ClockIcon /> {event.time}</span>
              </p>
            )}

            {event.arriveBy && (
              <p className={s.meta}>
                <span><ClockIcon /> Arrive by {event.arriveBy}</span>
              </p>
            )}

            {event.duration && (
              <p className={s.meta}>
                <span><ClockIcon /> {formatDuration(event.duration)}</span>
              </p>
            )}

            {event.location && (
              <p className={s.meta}>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}
                >
                  {event.location}
                </a>
              </p>
            )}

            {event.desc && <LinkedText text={event.desc} className={s.desc} />}

            {event.songIds && event.songIds.length > 0 && (
              <div className={s.songsSection}>
                <p className={s.songsLabel}>Songs Allocated</p>
                <div className={s.songsList}>
                  {event.songIds.map((songId) => {
                    const song = songs.find(s => s.id === songId);
                    return (
                      <div key={songId} className={s.songTag}>
                        {song ? (
                          <button type="button" className={s.songFolderButton} onClick={() => onOpenSongFolder?.(song.id)}>
                            {song.title}
                          </button>
                        ) : 'Unknown Song'}
                        {safeExternalUrl(song?.url) && (
                          <a href={safeExternalUrl(song.url)} target="_blank" rel="noopener noreferrer" className={s.songLink}>
                            🔗
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {event.type !== 'rehearsal' && (
              <VoicePartBreakdown counts={event.voicePartCounts || {}} checkMissing={isAdmin} />
            )}

            {!isReh && <div className={s.attSection}>
              {!isAdmin && (
                <>
                  <p className={s.attLabel} id="att-label-detail">Are you coming?</p>
                  {/* aria-pressed exposes the chosen response to screen readers -
                      the selected state is otherwise only conveyed by colour. */}
                  <div className={s.attRow} role="group" aria-labelledby="att-label-detail">
                    <button
                      className={`${s.attBtn} ${myAtt === 'yes' ? s.attYes : ''}`}
                      aria-pressed={myAtt === 'yes'}
                      onClick={() => onSetAttendance(event.id, 'yes')}
                    ><span aria-hidden="true"><CheckIcon /></span> Coming</button>
                    <button
                      className={`${s.attBtn} ${myAtt === 'maybe' ? s.attMaybe : ''}`}
                      aria-pressed={myAtt === 'maybe'}
                      onClick={() => onSetAttendance(event.id, 'maybe')}
                    ><span aria-hidden="true">?</span> Maybe</button>
                    <button
                      className={`${s.attBtn} ${myAtt === 'no' ? s.attNo : ''}`}
                      aria-pressed={myAtt === 'no'}
                      onClick={() => onSetAttendance(event.id, 'no')}
                    ><span aria-hidden="true">×</span> Can't make it</button>
                  </div>
                </>
              )}
              <p className={s.attCount}>{attSummary(event)}</p>
            </div>}
          </div>
        </div>

        {isAdmin && (
          <div className={s.footer}>
            <button
              className={s.editBtn}
              onClick={() => setEditModalOpen(true)}
            >Edit Event</button>
            <button
              className={s.allocateBtn}
              onClick={() => setAllocateModalOpen(true)}
            >Allocate Songs</button>
            <button
              className={s.delBtn}
              onClick={() => setConfirmingDelete(true)}
            >Delete Event</button>
          </div>
        )}

        {editModalOpen && isAdmin && onUpdate && (
          <EditEventModal
            open={editModalOpen}
            event={event}
            onClose={() => setEditModalOpen(false)}
            onSave={async (updates) => {
              setIsUpdating(true);
              try {
                await onUpdate(event.id, updates);
                setEditModalOpen(false);
              } finally {
                setIsUpdating(false);
              }
            }}
            isSaving={isUpdating}
          />
        )}

        {allocateModalOpen && isAdmin && onAllocateSongs && (
          <AllocateSongsModal
            open={allocateModalOpen}
            event={event}
            onClose={() => setAllocateModalOpen(false)}
            onSave={async (songIds) => {
              await onAllocateSongs(event.id, songIds);
              setAllocateModalOpen(false);
            }}
            isSaving={false}
            songs={songs}
          />
        )}

        {confirmingDelete && (
          <div className={s.confirmOverlay} onClick={() => setConfirmingDelete(false)}>
            <div className={s.confirmModal} onClick={(e) => e.stopPropagation()}>
              <h3>Remove event?</h3>
              <p>Are you sure you want to remove "{event.title}"?</p>
              <div className={s.confirmActions}>
                <button className={s.editBtn} onClick={() => setConfirmingDelete(false)}>Cancel</button>
                <button
                  className={s.delBtn}
                  onClick={() => {
                    onDelete(event.id);
                    onClose();
                  }}
                >Remove</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
