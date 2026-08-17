import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { useSongs } from '../useSongs';
import { getDefaultFilters } from '../filterUtils';
import s from './SongsPage.module.css';

export default function SongsPage() {
  const [filters, setFilters] = useState(getDefaultFilters());
  const { songs, loading, addSong, deleteSong, updateSong } = useSongs();
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!newSongTitle.trim()) return;

    setUpdating('add');
    setError('');
    try {
      await addSong(newSongTitle.trim(), newSongUrl.trim());
      setNewSongTitle('');
      setNewSongUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const startEdit = (song) => {
    setEditingId(song.id);
    setEditTitle(song.title);
    setEditUrl(song.url || '');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setUpdating(editingId);
    setError('');
    try {
      await updateSong(editingId, {
        title: editTitle.trim(),
        url: editUrl.trim(),
      });
      setEditingId(null);
      setEditTitle('');
      setEditUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
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
    <div className={s.container}>
      <AdminSidebar filters={filters} onFiltersChange={setFilters} showMonthFilter={false} />
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
          placeholder="Song title..."
          value={newSongTitle}
          onChange={(e) => setNewSongTitle(e.target.value)}
          disabled={updating === 'add'}
          className={s.input}
        />
        <input
          type="url"
          placeholder="Link URL (optional)"
          value={newSongUrl}
          onChange={(e) => setNewSongUrl(e.target.value)}
          disabled={updating === 'add'}
          className={s.input}
        />
        <button type="submit" disabled={updating === 'add' || !newSongTitle.trim()} className={s.submitBtn}>
          {updating === 'add' ? 'Adding...' : 'Add Song'}
        </button>
      </form>

      <div className={s.songsList}>
        {songs.length === 0 ? (
          <p className={s.empty}>No songs yet. Add one to get started.</p>
        ) : (
          songs.map((song) => (
            <article className={s.songCard} key={song.id}>
              {editingId === song.id ? (
                <div className={s.editForm}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={updating === song.id}
                    className={s.editInput}
                    placeholder="Song title"
                  />
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    disabled={updating === song.id}
                    className={s.editInput}
                    placeholder="Link URL (optional)"
                  />
                  <div className={s.editActions}>
                    <button
                      className={s.saveBtn}
                      onClick={handleSaveEdit}
                      disabled={updating === song.id || !editTitle.trim()}
                    >
                      {updating === song.id ? '...' : 'Save'}
                    </button>
                    <button
                      className={s.cancelBtn}
                      onClick={() => setEditingId(null)}
                      disabled={updating === song.id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={s.songInfo}>
                    <h3>{song.title}</h3>
                    {song.url && (
                      <a href={song.url} target="_blank" rel="noopener noreferrer" className={s.songLink}>
                        Link →
                      </a>
                    )}
                  </div>
                  <div className={s.actions}>
                    <button
                      className={s.editBtn}
                      onClick={() => startEdit(song)}
                      title="Edit song"
                    >
                      ✎
                    </button>
                    <button
                      className={s.deleteBtn}
                      onClick={() => handleDeleteSong(song.id)}
                      title="Delete song"
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </div>
      </main>
    </div>
  );
}
