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
const MAX_LINKED_FILES = 20;

function songLinkedFiles(song) {
  if (Array.isArray(song.linkedFiles)) return song.linkedFiles;
  if (song.linkedFilePath) {
    return [{
      fullPath: song.linkedFilePath,
      name: song.linkedFileName || 'Linked file',
      contentType: song.linkedFileContentType || 'application/octet-stream',
    }];
  }
  return [];
}

export default function SongsPage({
  isAdmin = true,
  songLibrary,
  embedded = false,
  uploadedFiles = null,
  uploadedFilesLoading = false,
}) {
  const { songs, loading, addSong, archiveSong, restoreSong, updateSong } = songLibrary;
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [newLinkedFilePaths, setNewLinkedFilePaths] = useState([]);
  const [newSongChoirs, setNewSongChoirs] = useState([]);
  const [newResourceVersion, setNewResourceVersion] = useState('');
  const [newResourceDate, setNewResourceDate] = useState('');
  const [newRightsNotes, setNewRightsNotes] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editLinkedFilePaths, setEditLinkedFilePaths] = useState([]);
  const [editChoirs, setEditChoirs] = useState([]);
  const [editResourceVersion, setEditResourceVersion] = useState('');
  const [editResourceDate, setEditResourceDate] = useState('');
  const [editRightsNotes, setEditRightsNotes] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const [archivingSong, setArchivingSong] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [openingFile, setOpeningFile] = useState('');
  const [resourceSong, setResourceSong] = useState(null);

  const loadAvailableFiles = useCallback(async () => {
    if (!isAdmin || Array.isArray(uploadedFiles)) return;
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
  }, [isAdmin, uploadedFiles]);

  useEffect(() => {
    if (Array.isArray(uploadedFiles)) {
      setAvailableFiles(uploadedFiles);
      setFilesLoading(uploadedFilesLoading);
      return;
    }
    loadAvailableFiles();
  }, [loadAvailableFiles, uploadedFiles, uploadedFilesLoading]);

  const filesForPaths = (paths, currentSong = null) => paths.map((fullPath) => (
    availableFiles.find((file) => file.fullPath === fullPath)
      || songLinkedFiles(currentSong || {}).find((file) => file.fullPath === fullPath)
  )).filter(Boolean);

  const toggleLinkedFile = (fullPath, isNew) => {
    const paths = isNew ? newLinkedFilePaths : editLinkedFilePaths;
    const setPaths = isNew ? setNewLinkedFilePaths : setEditLinkedFilePaths;
    if (paths.includes(fullPath)) {
      setPaths(paths.filter((path) => path !== fullPath));
    } else if (paths.length < MAX_LINKED_FILES) {
      setPaths([...paths, fullPath]);
    } else {
      setError(`A song can have up to ${MAX_LINKED_FILES} linked files.`);
    }
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
        filesForPaths(newLinkedFilePaths),
        { resourceVersion: newResourceVersion.trim(), resourceDate: newResourceDate, rightsNotes: newRightsNotes.trim() }
      );
      setNewSongTitle('');
      setNewSongUrl('');
      setNewLinkedFilePaths([]);
      setNewSongChoirs([]);
      setNewResourceVersion('');
      setNewResourceDate('');
      setNewRightsNotes('');
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
    setEditLinkedFilePaths(songLinkedFiles(song).map((file) => file.fullPath));
    setEditChoirs(song.choirs || []);
    setEditResourceVersion(song.resourceVersion || '');
    setEditResourceDate(song.resourceDate || '');
    setEditRightsNotes(song.rightsNotes || '');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setUpdating(editingId);
    setError('');
    try {
      const currentSong = songs.find((song) => song.id === editingId);
      await updateSong(editingId, {
        title: editTitle.trim(),
        url: requireSafeExternalUrl(editUrl),
        choirs: editChoirs,
        linkedFiles: filesForPaths(editLinkedFilePaths, currentSong).map((file) => ({
          fullPath: file.fullPath,
          name: file.name,
          contentType: file.contentType,
        })),
        linkedFilePath: '',
        linkedFileName: '',
        linkedFileContentType: '',
        resourceVersion: editResourceVersion.trim(),
        resourceDate: editResourceDate,
        rightsNotes: editRightsNotes.trim(),
      });
      setEditingId(null);
      setEditTitle('');
      setEditUrl('');
      setEditLinkedFilePaths([]);
      setEditChoirs([]);
      setEditResourceVersion('');
      setEditResourceDate('');
      setEditRightsNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const handleLinkedFile = async (songId, file) => {
    if (!file?.fullPath) return;
    setError('');
    setOpeningFile(`${songId}:${file.fullPath}`);
    try {
      const blob = await getBlob(ref(storage, file.fullPath));
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.name || 'choir-resource';
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

  const handleConfirmArchive = async () => {
    if (!archivingSong) return;

    setArchiving(true);
    setError('');
    try {
      await archiveSong(archivingSong.id);
      setArchivingSong(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setArchiving(false);
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
    const LoadingRoot = embedded ? 'section' : 'main';
    return (
      <LoadingRoot className={`${s.page} ${embedded ? s.embedded : ''}`}>
        <p>Loading songs...</p>
      </LoadingRoot>
    );
  }

  const Root = embedded ? 'section' : 'main';
  const Heading = embedded ? 'h2' : 'h1';
  const activeSongs = songs.filter((song) => !song.archivedAt);
  const archivedSongs = songs.filter((song) => song.archivedAt);

  return (
    <Root className={`${s.page} ${embedded ? s.embedded : ''}`} aria-labelledby={embedded ? 'song-folder-management-title' : undefined}>
      <header className={s.header}>
        <div>
          <Heading id={embedded ? 'song-folder-management-title' : undefined}>
            {embedded ? <>Manage <span>song folders</span></> : <>Song <span>Library</span></>}
          </Heading>
          <p>{embedded ? 'Create song folders and choose which uploaded resources members see inside them.' : 'Manage the song catalogue for allocating to events.'}</p>
        </div>
        <div className={s.headerActions}>
          {isAdmin && activeSongs.length === 0 && (
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
          <span className={s.count}>{activeSongs.length} songs</span>
        </div>
      </header>

      {(error || seedError) && <div className={s.error}>{error || seedError}</div>}

      {activeSongs.length === 0 ? (
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
            {activeSongs.map((song) => {
              const linkedFiles = songLinkedFiles(song);
              const resourceCount = linkedFiles.length + (safeExternalUrl(song.url) ? 1 : 0);
              return (
                <article className={s.card} key={song.id}>
                  <div className={s.titleCell}><strong>{song.title}</strong>{(song.resourceVersion || song.resourceDate) && <small>{song.resourceVersion || 'Unversioned'}{song.resourceDate ? ` · ${song.resourceDate}` : ''}</small>}</div>
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
                    {resourceCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setResourceSong(song)}
                        className={s.resourcesButton}
                        title="Open song resources"
                      >
                        {linkedFiles.length > 0 ? `${linkedFiles.length} file${linkedFiles.length === 1 ? '' : 's'}` : 'Web link'}
                      </button>
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
                        onClick={() => setArchivingSong(song)}
                        title="Archive song"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {isAdmin && archivedSongs.length > 0 && <section className={s.archivedSection}>
        <button className={s.archivedToggle} type="button" onClick={() => setShowArchived((open) => !open)} aria-expanded={showArchived}>
          <span><strong>Archived songs</strong><small>Hidden from members and event allocation.</small></span>
          <span>{archivedSongs.length} {showArchived ? '⌃' : '⌄'}</span>
        </button>
        {showArchived && <div className={s.archivedList}>{archivedSongs.map((song) => <article className={s.archivedSong} key={song.id}><div><strong>{song.title}</strong><small>{song.resourceVersion || 'No version'}{song.resourceDate ? ` · ${song.resourceDate}` : ''}</small></div><button className={s.restoreBtn} onClick={() => restoreSong(song.id)}>Restore</button></article>)}</div>}
      </section>}

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
            <div className={s.metadataFields}>
              <label className={s.field}><span>Resource version</span><input type="text" value={editResourceVersion} onChange={(e) => setEditResourceVersion(e.target.value)} disabled={updating === editingId} className={s.input} placeholder="e.g. v2.1" /></label>
              <label className={s.field}><span>Resource date</span><input type="date" value={editResourceDate} onChange={(e) => setEditResourceDate(e.target.value)} disabled={updating === editingId} className={s.input} /></label>
            </div>
            <label className={s.field}><span>Arrangement licensing / ownership</span><textarea value={editRightsNotes} onChange={(e) => setEditRightsNotes(e.target.value)} disabled={updating === editingId} className={s.textarea} maxLength="1000" placeholder="Optional licensing or ownership notes" /></label>

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
              <legend>Practice resources</legend>
              <p>Select all files that belong to this song, such as lyrics, voice parts and learning tracks.</p>
              <div className={s.fileChecklist} aria-label="Uploaded files">
                {filesLoading ? <span className={s.checklistState}>Loading uploaded files…</span> : availableFiles.length === 0 ? <span className={s.checklistState}>No files have been uploaded yet.</span> : availableFiles.map((file) => (
                  <label key={file.fullPath} className={s.fileChoice}>
                    <input type="checkbox" checked={editLinkedFilePaths.includes(file.fullPath)} onChange={() => toggleLinkedFile(file.fullPath, false)} disabled={updating === editingId} />
                    <span>{file.name}</span>
                  </label>
                ))}
                {songLinkedFiles(songs.find((song) => song.id === editingId) || {}).filter((file) => !availableFiles.some((available) => available.fullPath === file.fullPath)).map((file) => (
                  <label key={file.fullPath} className={s.fileChoice}>
                    <input type="checkbox" checked={editLinkedFilePaths.includes(file.fullPath)} onChange={() => toggleLinkedFile(file.fullPath, false)} disabled={updating === editingId} />
                    <span>{file.name} (currently unavailable)</span>
                  </label>
                ))}
              </div>
              <label className={s.field}>
                <span>External HTTPS link (optional)</span>
                <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} disabled={updating === editingId} className={s.input} placeholder="https://…" />
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
              onChange={(e) => setNewSongUrl(e.target.value)}
              disabled={updating === 'add'}
              className={s.input}
            />
            <div className={s.metadataFields}>
              <label className={s.field}><span>Resource version</span><input type="text" value={newResourceVersion} onChange={(e) => setNewResourceVersion(e.target.value)} disabled={updating === 'add'} className={s.input} placeholder="e.g. v2.1" /></label>
              <label className={s.field}><span>Resource date</span><input type="date" value={newResourceDate} onChange={(e) => setNewResourceDate(e.target.value)} disabled={updating === 'add'} className={s.input} /></label>
            </div>
            <label className={s.field}><span>Arrangement licensing / ownership</span><textarea value={newRightsNotes} onChange={(e) => setNewRightsNotes(e.target.value)} disabled={updating === 'add'} className={s.textarea} maxLength="1000" placeholder="Optional licensing or ownership notes" /></label>
            <div className={s.fileChecklist} aria-label="Uploaded files">
              {filesLoading ? <span className={s.checklistState}>Loading uploaded files…</span> : availableFiles.length === 0 ? <span className={s.checklistState}>No files have been uploaded yet.</span> : availableFiles.map((file) => (
                <label key={file.fullPath} className={s.fileChoice}>
                  <input type="checkbox" checked={newLinkedFilePaths.includes(file.fullPath)} onChange={() => toggleLinkedFile(file.fullPath, true)} disabled={updating === 'add'} />
                  <span>{file.name}</span>
                </label>
              ))}
            </div>
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

      {resourceSong && createPortal(
        <div className={s.confirmOverlay} onClick={() => setResourceSong(null)}>
          <section className={s.resourcesModal} role="dialog" aria-modal="true" aria-labelledby="song-resources-title" onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <div>
                <span className={s.eyebrow}>Practice resources</span>
                <h3 id="song-resources-title">{resourceSong.title}</h3>
                {(resourceSong.resourceVersion || resourceSong.resourceDate || resourceSong.rightsNotes) && <div className={s.resourceMetadata}>
                  {(resourceSong.resourceVersion || resourceSong.resourceDate) && <small>{resourceSong.resourceVersion || 'Unversioned'}{resourceSong.resourceDate ? ` · ${resourceSong.resourceDate}` : ''}</small>}
                  {resourceSong.rightsNotes && <small>{resourceSong.rightsNotes}</small>}
                </div>}
              </div>
              <button type="button" className={s.closeBtn} onClick={() => setResourceSong(null)} aria-label="Close resources">×</button>
            </div>
            <div className={s.resourceList}>
              {songLinkedFiles(resourceSong).map((file) => {
                const fileKey = `${resourceSong.id}:${file.fullPath}`;
                return (
                  <div className={s.resourceItem} key={file.fullPath}>
                    <span aria-hidden="true">{file.contentType?.startsWith('audio/') ? '🎧' : file.contentType === 'application/pdf' ? '📄' : '📎'}</span>
                    <div><strong>{file.name}</strong><small>Uploaded file</small></div>
                    <button onClick={() => handleLinkedFile(resourceSong.id, file)} disabled={openingFile === fileKey}>
                      {openingFile === fileKey ? 'Opening…' : 'Download'}
                    </button>
                  </div>
                );
              })}
              {safeExternalUrl(resourceSong.url) && (
                <div className={s.resourceItem}>
                  <ExternalLinkIcon />
                  <div><strong>External resource</strong><small>{safeExternalUrl(resourceSong.url)}</small></div>
                  <a href={safeExternalUrl(resourceSong.url)} target="_blank" rel="noopener noreferrer">Open</a>
                </div>
              )}
            </div>
            <div className={s.modalActions}>
              <button type="button" className={s.cancelBtn} onClick={() => setResourceSong(null)}>Close</button>
            </div>
          </section>
        </div>,
        document.body
      )}

      {archivingSong && createPortal(
        <div className={s.confirmOverlay} onClick={() => !archiving && setArchivingSong(null)}>
          <div className={s.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Archive song?</h3>
            <p>Archive "{archivingSong.title}"? Its files and record are retained and can be restored later.</p>
            <div className={s.confirmActions}>
              <button
                className={s.cancelBtn}
                onClick={() => setArchivingSong(null)}
                disabled={archiving}
              >
                Cancel
              </button>
              <button
                className={s.confirmDeleteBtn}
                onClick={handleConfirmArchive}
                disabled={archiving}
              >
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Root>
  );
}
