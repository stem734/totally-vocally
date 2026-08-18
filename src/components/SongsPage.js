import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSongs } from '../useSongs';
import { seedSongs } from '../seedSongs';
import { ExternalLinkIcon } from '../icons';
import s from './SongsPage.module.css';

const CHOIR_DAYS = ['Monday', 'Tuesday', 'Wednesday'];

export default function SongsPage({ isAdmin = true }) {
  const { songs, loading, addSong, deleteSong, updateSong } = useSongs();
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [newSongChoirs, setNewSongChoirs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editChoirs, setEditChoirs] = useState([]);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const [deletingSong, setDeletingSong] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      setAddModalOpen(false);
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

  const handleConfirmDelete = async () => {
    if (!deletingSong) return;

    setDeleting(true);
    setError('');
    try {
      await deleteSong(deletingSong.id);
      setDeletingSong(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
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
    <main className={s.page}>
      <header className={s.header}>
        <div>
          <h1>Song <span>Library</span></h1>
          <p>Manage the song catalogue for allocating to events.</p>
        </div>
        <div className={s.headerActions}>
          {isAdmin && songs.length === 0 && (
            <button
              className={s.seedBtn}
              onClick={handleSeedSongs}
              disabled={seeding}
            >
              {seeding ? 'Importing...' : 'Import Song List'}
            </button>
          )}
          {isAdmin && (
            <button className={s.submitBtn} onClick={() => setAddModalOpen(true)}>
              + Add Song
            </button>
          )}
          <span className={s.count}>{songs.length} songs</span>
        </div>
      </header>

      {(error || seedError) && <div className={s.error}>{error || seedError}</div>}

      {songs.length === 0 ? (
        <p className={s.empty}>No songs yet. Add one to get started.</p>
      ) : (
        <>
          <div className={s.tableHeader}>
            <span>Title</span>
            <span>Choirs</span>
            <span>Link</span>
            {isAdmin && <span>Actions</span>}
          </div>
          <div className={s.list}>
            {songs.map((song) => (
              isAdmin && editingId === song.id ? (
                <article className={`${s.card} ${s.editCard}`} key={song.id}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={updating === song.id}
                    className={`${s.editInput} ${s.titleCell}`}
                    placeholder="Song title"
                  />
                  <div className={`${s.choirSelector} ${s.choirsCell}`}>
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
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    disabled={updating === song.id}
                    className={`${s.editInput} ${s.linkCell}`}
                    placeholder="Link URL (optional)"
                  />
                  <div className={`${s.actionsCell} ${s.editActions}`}>
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
                </article>
              ) : (
                <article className={s.card} key={song.id}>
                  <span className={s.titleCell}>{song.title}</span>
                  <div className={s.choirsCell}>
                    {song.choirs && song.choirs.length > 0 && (
                      <div className={s.choirTags}>
                        {song.choirs.map((choir) => (
                          <span key={choir} className={s.choirTag}>{choir}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={s.linkCell}>
                    {song.url ? (
                      <a href={song.url} target="_blank" rel="noopener noreferrer" className={s.songLink} title="Open link" aria-label="Open link">
                        <ExternalLinkIcon />
                      </a>
                    ) : (
                      <span className={s.noLink}>—</span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className={s.actionsCell}>
                      <button
                        className={s.editBtn}
                        onClick={() => startEdit(song)}
                        title="Edit song"
                      >
                        ✎
                      </button>
                      <button
                        className={s.deleteBtn}
                        onClick={() => setDeletingSong(song)}
                        title="Delete song"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </article>
              )
            ))}
          </div>
        </>
      )}

      {addModalOpen && createPortal(
        <div className={s.confirmOverlay} onClick={() => updating !== 'add' && setAddModalOpen(false)}>
          <form className={s.addModal} onClick={(e) => e.stopPropagation()} onSubmit={handleAddSong}>
            <h3>Add a song</h3>
            <input
              type="text"
              placeholder="Song title..."
              value={newSongTitle}
              onChange={(e) => setNewSongTitle(e.target.value)}
              disabled={updating === 'add'}
              className={s.input}
              autoFocus
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
            <div className={s.confirmActions}>
              <button
                type="button"
                className={s.cancelBtn}
                onClick={() => setAddModalOpen(false)}
                disabled={updating === 'add'}
              >
                Cancel
              </button>
              <button type="submit" disabled={updating === 'add' || !newSongTitle.trim()} className={s.submitBtn}>
                {updating === 'add' ? 'Adding...' : 'Add Song'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {deletingSong && createPortal(
        <div className={s.confirmOverlay} onClick={() => !deleting && setDeletingSong(null)}>
          <div className={s.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Remove song?</h3>
            <p>Are you sure you want to remove "{deletingSong.title}" from the library?</p>
            <div className={s.confirmActions}>
              <button
                className={s.cancelBtn}
                onClick={() => setDeletingSong(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className={s.confirmDeleteBtn}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
