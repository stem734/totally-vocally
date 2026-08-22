import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  deleteObject,
  getBlob,
  getMetadata,
  listAll,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { storage } from '../firebase';
import { safeExternalUrl } from '../safeUrl';
import SongsPage from './SongsPage';
import s from './FilesPage.module.css';

const FILES_PATH = 'shared';
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

function isAllowedType(type) {
  return ALLOWED_TYPES.has(type)
    || type.startsWith('audio/')
    || type.startsWith('image/')
    || type.startsWith('video/');
}

function isPreviewableType(type) {
  return type === 'application/pdf'
    || type.startsWith('text/')
    || type.startsWith('image/')
    || type.startsWith('video/');
}

function safeStorageName(name) {
  return name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-160) || 'file';
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function linkedPathsForSong(song) {
  if (Array.isArray(song.linkedFiles)) {
    return song.linkedFiles.map((file) => file.fullPath).filter(Boolean);
  }
  return song.linkedFilePath ? [song.linkedFilePath] : [];
}

export default function FilesPage({ isAdmin = false, songLibrary, initialSongId = '' }) {
  const songs = songLibrary?.songs || [];
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeFile, setActiveFile] = useState('');
  const [playingFile, setPlayingFile] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const mainRef = useRef(null);
  const inputRef = useRef(null);
  const audioRequestRef = useRef(0);
  const audioUrlRef = useRef('');
  const previewUrlRef = useRef('');
  const previewRequestRef = useRef(0);

  const fileGroups = useMemo(() => {
    const filesByPath = new Map(files.map((file) => [file.fullPath, file]));
    const assignedPaths = new Set();
    const songGroups = songs.map((song) => {
      const groupedFiles = linkedPathsForSong(song).map((path) => {
        const file = filesByPath.get(path);
        if (file) assignedPaths.add(path);
        return file;
      }).filter(Boolean);
      return {
        id: `song-${song.id}`,
        songId: song.id,
        name: song.title,
        files: groupedFiles,
        externalUrl: safeExternalUrl(song.url),
      };
    }).filter((group) => group.files.length > 0 || group.externalUrl || group.songId === initialSongId);

    const generalFiles = files.filter((file) => !assignedPaths.has(file.fullPath));
    if (generalFiles.length > 0) {
      songGroups.push({
        id: 'general-resources',
        songId: '',
        name: 'General Resources',
        files: generalFiles,
        externalUrl: '',
      });
    }
    return songGroups;
  }, [files, initialSongId, songs]);

  const loadFiles = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const result = await listAll(ref(storage, FILES_PATH));
      const nextFiles = await Promise.all(result.items.map(async (fileRef) => {
        const metadata = await getMetadata(fileRef);
        return {
          fullPath: fileRef.fullPath,
          name: metadata.customMetadata?.originalName || fileRef.name,
          size: metadata.size,
          contentType: metadata.contentType || 'application/octet-stream',
          updated: metadata.updated,
        };
      }));
      nextFiles.sort((a, b) => a.name.localeCompare(b.name));
      setFiles(nextFiles);
    } catch (err) {
      console.error('Failed to list files:', err);
      setError('Files could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { mainRef.current?.focus(); }, []);
  useEffect(() => { loadFiles(); }, [loadFiles]);
  useEffect(() => {
    if (!initialSongId || loading) return;
    const folders = Array.from(mainRef.current?.querySelectorAll('[data-song-id]') || []);
    const target = folders.find((folder) => folder.dataset.songId === initialSongId);
    if (!target) return;
    target.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.querySelector('summary')?.focus({ preventScroll: true });
  }, [fileGroups, initialSongId, loading]);
  useEffect(() => () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const replaceAudioUrl = (nextUrl = '') => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
  };

  const replacePreviewUrl = (nextUrl = '') => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  };

  const uploadOne = (file) => new Promise((resolve, reject) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeStorageName(file.name)}`;
    const uploadTask = uploadBytesResumable(ref(storage, `${FILES_PATH}/${uniqueName}`), file, {
      contentType: file.type,
      customMetadata: { originalName: file.name },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      reject,
      resolve
    );
  });

  const handleUpload = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (selected.length === 0) return;

    const invalid = selected.find((file) => !isAllowedType(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      setError(`“${invalid.name}” is not an allowed file type or is larger than 100 MB.`);
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);
    try {
      for (const file of selected) {
        setActiveFile(file.name);
        await uploadOne(file);
      }
      await loadFiles();
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('The upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setActiveFile('');
    }
  };

  const handleDownload = async (file) => {
    setError('');
    setActiveFile(file.fullPath);
    try {
      // Authenticated SDK download keeps Storage Rules in the access path;
      // unlike a persistent token URL, it cannot be shared to bypass login.
      const blob = await getBlob(ref(storage, file.fullPath));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error('Failed to download file:', err);
      setError('The file could not be downloaded. Please try again.');
    } finally {
      setActiveFile('');
    }
  };

  const closePreview = () => {
    previewRequestRef.current += 1;
    setPreviewFile(null);
    setPreviewText('');
    replacePreviewUrl();
    setPreviewLoading(false);
  };

  const handlePreview = async (file) => {
    setError('');
    setPreviewFile(file);
    setPreviewText('');
    replacePreviewUrl();
    setPreviewLoading(true);
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    try {
      const blob = await getBlob(ref(storage, file.fullPath));
      const typedBlob = blob.slice(0, blob.size, file.contentType);
      if (previewRequestRef.current !== requestId) return;
      if (file.contentType.startsWith('text/')) {
        const text = await typedBlob.text();
        if (previewRequestRef.current !== requestId) return;
        setPreviewText(text);
      } else {
        replacePreviewUrl(URL.createObjectURL(typedBlob));
      }
    } catch (err) {
      if (previewRequestRef.current !== requestId) return;
      console.error('Failed to preview file:', err);
      closePreview();
      setError('The file could not be previewed. Please try downloading it instead.');
    } finally {
      if (previewRequestRef.current === requestId) setPreviewLoading(false);
    }
  };

  const closePlayer = () => {
    audioRequestRef.current += 1;
    setPlayingFile('');
    replaceAudioUrl();
    setAudioLoading(false);
  };

  const handlePlay = async (file, locationKey = file.fullPath) => {
    if (playingFile === locationKey) {
      closePlayer();
      return;
    }

    setError('');
    setAudioLoading(true);
    setPlayingFile(locationKey);
    replaceAudioUrl();
    const requestId = audioRequestRef.current + 1;
    audioRequestRef.current = requestId;
    try {
      // Fetch through the authenticated SDK so playback remains protected by
      // Storage Rules instead of exposing a shareable download-token URL.
      const blob = await getBlob(ref(storage, file.fullPath));
      // Firebase responses may arrive as application/octet-stream. Chromium
      // refuses an untyped blob under nosniff/CSP, even when the bytes are a
      // valid MP3, so preserve the trusted MIME type stored in metadata.
      const playableBlob = blob.slice(0, blob.size, file.contentType);
      const nextUrl = URL.createObjectURL(playableBlob);
      if (audioRequestRef.current !== requestId) {
        URL.revokeObjectURL(nextUrl);
        return;
      }
      replaceAudioUrl(nextUrl);
    } catch (err) {
      if (audioRequestRef.current !== requestId) return;
      console.error('Failed to load audio file:', err);
      setPlayingFile('');
      setError('The recording could not be played. Please try again.');
    } finally {
      if (audioRequestRef.current === requestId) setAudioLoading(false);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete “${file.name}” for every member? This cannot be undone.`)) return;

    setError('');
    setActiveFile(file.fullPath);
    try {
      await deleteObject(ref(storage, file.fullPath));
      setFiles((current) => current.filter((item) => item.fullPath !== file.fullPath));
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('The file could not be deleted. Please try again.');
    } finally {
      setActiveFile('');
    }
  };

  return (
    <main className={s.page} id="main-content" ref={mainRef} tabIndex={-1}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Shared <span>Files</span></h1>
          <p>Sheet music, recordings, newsletters and choir resources.</p>
        </div>
        {isAdmin && (
          <>
            <input
              ref={inputRef}
              className={s.hiddenInput}
              type="file"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,audio/*,image/*,video/*"
            />
            <button className={s.uploadButton} onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload files'}
            </button>
          </>
        )}
      </div>

      {uploading && (
        <section className={s.uploadStatus} aria-live="polite">
          <div><span>Uploading {activeFile}</span><strong>{uploadProgress}%</strong></div>
          <progress value={uploadProgress} max="100">{uploadProgress}%</progress>
        </section>
      )}

      {error && <div className={s.error} role="alert">{error}</div>}

      {loading ? (
        <p className={s.state}>Loading files…</p>
      ) : fileGroups.length === 0 ? (
        <section className={s.empty}>
          <span aria-hidden="true">📂</span>
          <h2>No shared files yet</h2>
          <p>{isAdmin ? 'Upload the first choir resource to get started.' : 'Files uploaded by the choir team will appear here.'}</p>
        </section>
      ) : (
        <section className={s.folderTree} aria-label="Choir resource folders">
          {fileGroups.map((group) => {
            const itemCount = group.files.length + (group.externalUrl ? 1 : 0);
            return (
              <details
                className={s.folder}
                key={group.id}
                data-song-id={group.songId || undefined}
                defaultOpen={group.songId === initialSongId}
              >
                <summary>
                  <span className={s.folderIcon} aria-hidden="true">📁</span>
                  <strong>{group.name}</strong>
                  <small>{itemCount} resource{itemCount === 1 ? '' : 's'}</small>
                </summary>
                <div className={s.folderContents}>
                  {itemCount === 0 && (
                    <p className={s.emptyFolder}>No resources have been added to this song yet.</p>
                  )}
                  {group.files.map((file) => {
                    const busy = activeFile === file.fullPath;
                    const isAudio = file.contentType.startsWith('audio/');
                    const locationKey = `${group.id}:${file.fullPath}`;
                    const isPlaying = playingFile === locationKey;
                    const isPreviewable = isPreviewableType(file.contentType);
                    return (
                      <article className={s.fileCard} key={`${group.id}-${file.fullPath}`}>
                        <div className={s.fileIcon} aria-hidden="true">{isAudio ? '🎧' : file.contentType === 'application/pdf' ? '📄' : '📁'}</div>
                        <div className={s.fileDetails}>
                          <h2>{file.name}</h2>
                          <p>{formatBytes(file.size)}{file.updated ? ` · Updated ${new Date(file.updated).toLocaleDateString()}` : ''}</p>
                        </div>
                        <div className={s.actions}>
                          {isPreviewable && (
                            <button onClick={() => handlePreview(file)} disabled={previewLoading}>
                              {previewLoading && previewFile?.fullPath === file.fullPath ? 'Opening…' : 'View'}
                            </button>
                          )}
                          {isAudio && (
                            <button onClick={() => handlePlay(file, locationKey)} disabled={audioLoading && isPlaying}>
                              {audioLoading && isPlaying ? 'Loading…' : isPlaying ? 'Close player' : 'Play'}
                            </button>
                          )}
                          <button onClick={() => handleDownload(file)} disabled={busy}>{busy ? 'Working…' : 'Download'}</button>
                          {isAdmin && <button className={s.deleteButton} onClick={() => handleDelete(file)} disabled={busy}>Delete</button>}
                        </div>
                        {isAudio && isPlaying && audioUrl && (
                          <div className={s.audioPlayer}>
                            <audio controls autoPlay preload="metadata" aria-label={`Playing ${file.name}`} onError={() => setError('This recording could not be played by your browser. Check that it is a valid audio file.')}>
                              <source src={audioUrl} type={file.contentType} />
                              Your browser does not support audio playback.
                            </audio>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {group.externalUrl && (
                    <a className={s.externalResource} href={group.externalUrl} target="_blank" rel="noopener noreferrer">
                      <span aria-hidden="true">🔗</span>
                      <div><strong>External practice resource</strong><small>{group.externalUrl}</small></div>
                      <span>Open ↗</span>
                    </a>
                  )}
                </div>
              </details>
            );
          })}
        </section>
      )}

      {isAdmin && songLibrary && (
        <section className={s.songManagement} aria-label="Song folder management">
          <SongsPage
            isAdmin
            embedded
            songLibrary={songLibrary}
            uploadedFiles={files}
            uploadedFilesLoading={loading}
          />
        </section>
      )}

      {previewFile && createPortal(
        <div className={s.previewOverlay} role="presentation" onClick={closePreview}>
          <section className={s.previewModal} role="dialog" aria-modal="true" aria-labelledby="file-preview-title" onClick={(event) => event.stopPropagation()}>
            <header className={s.previewHeader}>
              <div>
                <span>File preview</span>
                <h2 id="file-preview-title">{previewFile.name}</h2>
              </div>
              <button onClick={closePreview} aria-label="Close file preview">×</button>
            </header>
            <div className={s.previewBody}>
              {previewLoading ? (
                <p className={s.previewState}>Opening file…</p>
              ) : previewFile.contentType === 'application/pdf' && previewUrl ? (
                <iframe src={previewUrl} title={previewFile.name} />
              ) : previewFile.contentType.startsWith('image/') && previewUrl ? (
                <img src={previewUrl} alt={previewFile.name} />
              ) : previewFile.contentType.startsWith('video/') && previewUrl ? (
                <video controls preload="metadata">
                  <source src={previewUrl} type={previewFile.contentType} />
                </video>
              ) : previewFile.contentType.startsWith('text/') ? (
                <pre>{previewText}</pre>
              ) : null}
            </div>
            <footer className={s.previewFooter}>
              <button onClick={() => handleDownload(previewFile)} disabled={activeFile === previewFile.fullPath}>
                {activeFile === previewFile.fullPath ? 'Working…' : 'Download'}
              </button>
              <button className={s.previewCloseButton} onClick={closePreview}>Close</button>
            </footer>
          </section>
        </div>,
        document.body
      )}

      <p className={s.hint}>Downloads are available only while signed in as an approved choir member.</p>
    </main>
  );
}
