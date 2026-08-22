import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteObject,
  getBlob,
  getMetadata,
  listAll,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { storage } from '../firebase';
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

function safeStorageName(name) {
  return name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-160) || 'file';
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function FilesPage({ isAdmin = false }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeFile, setActiveFile] = useState('');
  const [playingFile, setPlayingFile] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const mainRef = useRef(null);
  const inputRef = useRef(null);
  const audioRequestRef = useRef(0);
  const audioUrlRef = useRef('');

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
  useEffect(() => () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const replaceAudioUrl = (nextUrl = '') => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
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

  const closePlayer = () => {
    audioRequestRef.current += 1;
    setPlayingFile('');
    replaceAudioUrl();
    setAudioLoading(false);
  };

  const handlePlay = async (file) => {
    if (playingFile === file.fullPath) {
      closePlayer();
      return;
    }

    setError('');
    setAudioLoading(true);
    setPlayingFile(file.fullPath);
    replaceAudioUrl();
    const requestId = audioRequestRef.current + 1;
    audioRequestRef.current = requestId;
    try {
      // Fetch through the authenticated SDK so playback remains protected by
      // Storage Rules instead of exposing a shareable download-token URL.
      const blob = await getBlob(ref(storage, file.fullPath));
      const nextUrl = URL.createObjectURL(blob);
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
      ) : files.length === 0 ? (
        <section className={s.empty}>
          <span aria-hidden="true">📂</span>
          <h2>No shared files yet</h2>
          <p>{isAdmin ? 'Upload the first choir resource to get started.' : 'Files uploaded by the choir team will appear here.'}</p>
        </section>
      ) : (
        <section className={s.fileList} aria-label="Shared choir files">
          {files.map((file) => {
            const busy = activeFile === file.fullPath;
            const isAudio = file.contentType.startsWith('audio/');
            const isPlaying = playingFile === file.fullPath;
            return (
              <article className={s.fileCard} key={file.fullPath}>
                <div className={s.fileIcon} aria-hidden="true">{isAudio ? '🎧' : file.contentType === 'application/pdf' ? '📄' : '📁'}</div>
                <div className={s.fileDetails}>
                  <h2>{file.name}</h2>
                  <p>{formatBytes(file.size)}{file.updated ? ` · Updated ${new Date(file.updated).toLocaleDateString()}` : ''}</p>
                </div>
                <div className={s.actions}>
                  {isAudio && (
                    <button onClick={() => handlePlay(file)} disabled={audioLoading && isPlaying}>
                      {audioLoading && isPlaying ? 'Loading…' : isPlaying ? 'Close player' : 'Play'}
                    </button>
                  )}
                  <button onClick={() => handleDownload(file)} disabled={busy}>{busy ? 'Working…' : 'Download'}</button>
                  {isAdmin && <button className={s.deleteButton} onClick={() => handleDelete(file)} disabled={busy}>Delete</button>}
                </div>
                {isAudio && isPlaying && audioUrl && (
                  <div className={s.audioPlayer}>
                    <audio controls autoPlay src={audioUrl} aria-label={`Playing ${file.name}`}>
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      <p className={s.hint}>Downloads are available only while signed in as an approved choir member.</p>
    </main>
  );
}
