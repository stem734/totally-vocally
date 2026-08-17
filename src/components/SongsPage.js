import React, { useState } from 'react';
import { useSongs } from '../useSongs';
import s from './SongsPage.module.css';

export default function SongsPage() {
  const { songs, loading, addSong, deleteSong } = useSongs();
  const [newSongTitle, setNewSongTitle] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!newSongTitle.trim()) return;

    setAdding(true);
    setError('');
    try {
      await addSong(newSongTitle.trim());
      setNewSongTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Remove this song?')) return;

    setError('');
    try {
      await deleteSong(songId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main className={s.page}>
        <p>Loading songs...</p>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <header className={s.header}>
        <div>
          <h1>Song <span>Library</span></h1>
          <p>Manage the song catalogue for allocating to events.</p>
        </div>
        <span className={s.count}>{songs.length} songs</span>
      </header>

      {error && <div className={s.error}>{error}</div>}

      <form className={s.addForm} onSubmit={handleAddSong}>
        <input
          type="text"
          placeholder="Add new song title..."
          value={newSongTitle}
          onChange={(e) => setNewSongTitle(e.target.value)}
          disabled={adding}
          className={s.input}
        />
        <button type="submit" disabled={adding || !newSongTitle.trim()} className={s.submitBtn}>
          {adding ? 'Adding...' : 'Add Song'}
        </button>
      </form>

      <div className={s.songsList}>
        {songs.length === 0 ? (
          <p className={s.empty}>No songs yet. Add one to get started.</p>
        ) : (
          songs.map((song) => (
            <article className={s.songCard} key={song.id}>
              <div className={s.songInfo}>
                <h3>{song.title}</h3>
              </div>
              <button
                className={s.deleteBtn}
                onClick={() => handleDeleteSong(song.id)}
                title="Delete song"
              >
                ×
              </button>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
