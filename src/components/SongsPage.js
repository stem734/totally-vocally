import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { useSongs } from '../useSongs';
import { getDefaultFilters } from '../filterUtils';
import { seedSongs } from '../seedSongs';
import s from './SongsPage.module.css';

export default function SongsPage() {
  const [filters, setFilters] = useState(getDefaultFilters());
  const { songs, loading, addSong, deleteSong, updateSong } = useSongs();
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [newSongChoirs, setNewSongChoirs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editChoirs, setEditChoirs] = useState([]);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const CHOIR_DAYS = ['Monday', 'Tuesday', 'Wednesday'];

  const toggleChoir = (choir, isNew = true) => {
    if (isNew) {
      setNewSongChoirs(
        newSongChoirs.includes(choir)
          ? newSongChoirs.filter(c => c !== choir)
          : [...newSongChoirs, choir]
      );
    } else {
      setEditChoirs(
        editChoirs.includes(choir)
          ? editChoirs.filter(c => c !== choir)
          : [...editChoirs, choir]
      );
    }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!newSongTitle.trim()) return;

    setUpdating('add');
    setError('');
    try {
      await addSong(newSongTitle.trim(), newSongUrl.trim(), newSongChoirs);
      setNewSongTitle('');
      setNewSongUrl('');
      setNewSongChoirs([]);
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
    setEditChoirs(song.choirs || []);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setUpdating(editingId);
    setError('');
    try {
      await updateSong(editingId, {
        title: editTitle.trim(),
        url: editUrl.trim(),
        choirs: editChoirs,
      });
      setEditingId(null);
      setEditTitle('');
      setEditUrl('');
      setEditChoirs([]);
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

  const handleSeedSongs = async () => {
    setSeedError('');
    setSeeding(true);
    try {
      const count = await seedSongs();
      alert(`✓ Successfully imported ${count} songs!`);
    } catch (err) {
      setSeedError(err.message);
    } finally {
      setSeeding(false);
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
          <div className={s.headerActions}>
            {songs.length === 0 && (
              <button
                className={s.seedBtn}
                onClick={handleSeedSongs}
                disabled={seeding}
              >
                {seeding ? 'Importing...' : 'Import Song List'}
              </button>
            )}
            <span className={s.count}>{songs.length} songs</span>
          </div>
        </header>

      {(error || seedError) && <div className={s.error}>{error || seedError}</div>}

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
        <div className={s.choirSelector}>
          <label className={s.choirLabel}>Choirs:</label>
          {CHOIR_DAYS.map((choir) => (
            <label key={choir} className={s.choirCheckbox}>
              <input
                type="checkbox"
                checked={newSongChoirs.includes(choir)}
                onChange={() => toggleChoir(choir, true)}
                disabled={updating === 'add'}
              />
              <span>{choir}</span>
            </label>
          ))}
        </div>
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
                  <div className={s.choirSelector}>
                    {CHOIR_DAYS.map((choir) => (
                      <label key={choir} className={s.choirCheckbox}>
                        <input
                          type="checkbox"
                          checked={editChoirs.includes(choir)}
                          onChange={() => toggleChoir(choir, false)}
                          disabled={updating === song.id}
                        />
                        <span>{choir}</span>
                      </label>
                    ))}
                  </div>
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
                    {song.choirs && song.choirs.length > 0 && (
                      <div className={s.choirTags}>
                        {song.choirs.map((choir) => (
                          <span key={choir} className={s.choirTag}>{choir}</span>
                        ))}
                      </div>
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
