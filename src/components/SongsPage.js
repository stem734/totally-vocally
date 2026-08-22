import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getBlob, getMetadata, listAll, ref } from 'firebase/storage';
import { seedSongs } from '../seedSongs';
import { storage } from '../firebase';
import { ExternalLinkIcon } from '../icons';
import { requireSafeExternalUrl, safeExternalUrl } from '../safeUrl';
import s from './SongsPage.module.css';

const CHOIR_DAYS = ['Monday', 'Tuesday', 'Wednesday'];
const FILES_PATH = 'shared';

export default function SongsPage({ isAdmin = true, songLibrary }) {
  const { songs, loading, addSong, deleteSong, updateSong } = songLibrary;
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [newLinkedFilePath, setNewLinkedFilePath] = useState('');
  const [newSongChoirs, setNewSongChoirs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editLinkedFilePath, setEditLinkedFilePath] = useState('');
  const [editChoirs, setEditChoirs] = useState([]);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const [deletingSong, setDeletingSong] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [openingFile, setOpeningFile] = useState('');

  const loadAvailableFiles = useCallback(async () => {
    if (!isAdmin) return;
    setFilesLoading(true);
    try {
      const result = await listAll(ref(storage, FILES_PATH));
      const files = await Promise.all(result.items.map(async (fileRef) => {
        const metadata = await getMetadata(fileRef);
        return {
          fullPath: fileRef.fullPath,
          name: metadata.customMetadata?.originalName || fileRef.name,
          contentType: metadata.contentType || 'application/octet-stream',
        };
      }));
      files.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableFiles(files);
    } catch (err) {
      console.error('Failed to load files for songs:', err);
      setError('Uploaded files could not be loaded. You can still use an external link.');
    } finally {
      setFilesLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { loadAvailableFiles(); }, [loadAvailableFiles]);

  const selectedFile = (fullPath) => availableFiles.find((file) => file.fullPath === fullPath) || null;

  const linkedFileForEdit = () => {
    const selected = selectedFile(editLinkedFilePath);
    if (selected) return selected;
    const currentSong = songs.find((song) => song.id === editingId);
    if (currentSong?.linkedFilePath === editLinkedFilePath) {
      return {
        fullPath: currentSong.linkedFilePath,
        name: currentSong.linkedFileName || 'Linked file',
        contentType: currentSong.linkedFileContentType || 'application/octet-stream',
      };
    }
    return null;
  };

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
      await addSong(
        newSongTitle.trim(),
        requireSafeExternalUrl(newSongUrl),
        newSongChoirs,
        selectedFile(newLinkedFilePath)
      );
      setNewSongTitle('');
      setNewSongUrl('');
      setNewLinkedFilePath('');
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
    setEditLinkedFilePath(song.linkedFilePath || '');
    setEditChoirs(song.choirs || []);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setUpdating(editingId);
    setError('');
    try {
      const linkedFile = linkedFileForEdit();
      await updateSong(editingId, {
        title: editTitle.trim(),
        url: requireSafeExternalUrl(editUrl),
        choirs: editChoirs,
        linkedFilePath: linkedFile?.fullPath || '',
        linkedFileName: linkedFile?.name || '',
        linkedFileContentType: linkedFile?.contentType || '',
      });
      setEditingId(null);
      setEditTitle('');
      setEditUrl('');
      setEditLinkedFilePath('');
      setEditChoirs([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const handleLinkedFile = async (song) => {
    if (!song.linkedFilePath) return;
    setError('');
    setOpeningFile(song.id);
    try {
      const blob = await getBlob(ref(storage, song.linkedFilePath));
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = song.linkedFileName || song.title;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (err) {
      console.error('Failed to open linked file:', err);
      setError('The linked file could not be downloaded. It may have been removed.');
    } finally {
      setOpeningFile('');
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
                    {song.linkedFilePath ? (
                      <button
                        type="button"
                        onClick={() => handleLinkedFile(song)}
                        disabled={openingFile === song.id}
                        className={s.songLink}
                        title={`Download ${song.linkedFileName || 'linked file'}`}
                        aria-label={`Download ${song.linkedFileName || 'linked file'}`}
                      >
                        {openingFile === song.id ? '…' : '📎'}
                      </button>
                    ) : safeExternalUrl(song.url) ? (
                      <a href={safeExternalUrl(song.url)} target="_blank" rel="noopener noreferrer" className={s.songLink} title="Open link" aria-label="Open link">
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
            ))}
          </div>
        </>
      )}

      {editingId && createPortal(
        <div className={s.confirmOverlay} onClick={() => updating !== editingId && setEditingId(null)}>
          <form className={s.songModal} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className={s.modalHeader}>
              <div>
                <span className={s.eyebrow}>Song Library</span>
                <h3>Edit song</h3>
              </div>
              <button type="button" className={s.closeBtn} onClick={() => setEditingId(null)} aria-label="Close editor" disabled={updating === editingId}>×</button>
            </div>

            <label className={s.field}>
              <span>Song title</span>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={updating === editingId} className={s.input} autoFocus />
            </label>

            <fieldset className={s.fieldset}>
              <legend>Choirs</legend>
              <div className={s.choirSelector}>
                {CHOIR_DAYS.map((choir) => (
                  <label key={choir} className={s.choirCheckbox}>
                    <input type="checkbox" checked={editChoirs.includes(choir)} onChange={() => toggleChoir(choir, false)} disabled={updating === editingId} />
                    <span>{choir}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={s.resourceBox}>
              <legend>Practice resource</legend>
              <p>Choose a file from the Files section, or provide an external web link.</p>
              <label className={s.field}>
                <span>Uploaded file</span>
                <select value={editLinkedFilePath} onChange={(e) => { setEditLinkedFilePath(e.target.value); if (e.target.value) setEditUrl(''); }} disabled={updating === editingId || filesLoading} className={s.input}>
                  <option value="">No uploaded file</option>
                  {editLinkedFilePath && !selectedFile(editLinkedFilePath) && <option value={editLinkedFilePath}>Previously linked file</option>}
                  {availableFiles.map((file) => <option key={file.fullPath} value={file.fullPath}>{file.name}</option>)}
                </select>
              </label>
              <div className={s.orDivider}><span>or</span></div>
              <label className={s.field}>
                <span>External HTTPS link</span>
                <input type="url" value={editUrl} onChange={(e) => { setEditUrl(e.target.value); if (e.target.value) setEditLinkedFilePath(''); }} disabled={updating === editingId} className={s.input} placeholder="https://…" />
              </label>
            </fieldset>

            <div className={s.modalActions}>
              <button type="button" className={s.cancelBtn} onClick={() => setEditingId(null)} disabled={updating === editingId}>Cancel</button>
              <button type="submit" className={s.submitBtn} disabled={updating === editingId || !editTitle.trim()}>{updating === editingId ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </div>,
        document.body
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
              onChange={(e) => {
                setNewSongUrl(e.target.value);
                if (e.target.value) setNewLinkedFilePath('');
              }}
              disabled={updating === 'add'}
              className={s.input}
            />
            <select
              value={newLinkedFilePath}
              onChange={(e) => {
                setNewLinkedFilePath(e.target.value);
                if (e.target.value) setNewSongUrl('');
              }}
              disabled={updating === 'add' || filesLoading}
              className={s.input}
              aria-label="Linked uploaded file"
            >
              <option value="">{filesLoading ? 'Loading uploaded files…' : 'Choose an uploaded file (optional)'}</option>
              {availableFiles.map((file) => <option key={file.fullPath} value={file.fullPath}>{file.name}</option>)}
            </select>
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
