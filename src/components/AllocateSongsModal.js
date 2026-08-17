import React, { useState, useMemo } from 'react';
import { useSongs } from '../useSongs';
import s from './AllocateSongsModal.module.css';

export default function AllocateSongsModal({ open, event, onClose, onSave, isSaving }) {
  const { songs } = useSongs();
  const [selectedSongIds, setSelectedSongIds] = useState(event?.songIds || []);

  const allocatedSongs = useMemo(() => {
    return songs.filter(song => selectedSongIds.includes(song.id));
  }, [songs, selectedSongIds]);

  const availableSongs = useMemo(() => {
    return songs.filter(song => !selectedSongIds.includes(song.id));
  }, [songs, selectedSongIds]);

  const handleAddSong = (songId) => {
    setSelectedSongIds([...selectedSongIds, songId]);
  };

  const handleRemoveSong = (songId) => {
    setSelectedSongIds(selectedSongIds.filter(id => id !== songId));
  };

  const handleSave = () => {
    onSave(selectedSongIds);
  };

  if (!open || !event) return null;

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Allocate Songs to {event.title}</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={s.body}>
          <div className={s.column}>
            <h3>Available Songs</h3>
            <div className={s.songsList}>
              {availableSongs.length === 0 ? (
                <p className={s.empty}>All songs allocated</p>
              ) : (
                availableSongs.map((song) => (
                  <div key={song.id} className={s.songItem}>
                    <span>{song.title}</span>
                    <button
                      className={s.addSongBtn}
                      onClick={() => handleAddSong(song.id)}
                      title="Add to event"
                    >
                      +
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={s.column}>
            <h3>Allocated Songs</h3>
            <div className={s.songsList}>
              {allocatedSongs.length === 0 ? (
                <p className={s.empty}>No songs allocated yet</p>
              ) : (
                allocatedSongs.map((song) => (
                  <div key={song.id} className={s.songItem + ' ' + s.allocated}>
                    <span>{song.title}</span>
                    <button
                      className={s.removeSongBtn}
                      onClick={() => handleRemoveSong(song.id)}
                      title="Remove from event"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={s.footer}>
          <button className={s.cancelBtn} onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className={s.saveBtn} onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Allocation'}
          </button>
        </div>
      </div>
    </div>
  );
}
