import React from 'react';
import s from './FilesPage.module.css';

// ── Replace with your real Dropbox folder share link ──
const DROPBOX_URL = 'https://www.dropbox.com/your-folder-link-here';

export default function FilesPage() {
  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Shared <span>Files</span></h1>
      </div>

      <div className={s.hero}>
        <div className={s.bigNote} aria-hidden="true">♬</div>
        <div className={s.content}>
          <div className={s.icon}>📁</div>
          <h2 className={s.heroTitle}>Sheet Music &amp; Resources</h2>
          <p className={s.heroDesc}>
            All choir files — sheet music, recordings, newsletters, and documents — live in our
            shared Dropbox folder. Click below to open it.
          </p>
          <a className={s.dropboxBtn} href={DROPBOX_URL} target="_blank" rel="noopener noreferrer">
            <DropboxLogo />
            Open Dropbox Folder
          </a>
          <p className={s.hint}>Contact Abi if you need access to the folder.</p>
        </div>
      </div>
    </div>
  );
}

function DropboxLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="white">
      <path d="M64 32L0 80l64 48 64-48L64 32zm128 0l-64 48 64 48 64-48-64-48zM0 176l64 48 64-48-64-48L0 176zm192-48l-64 48 64 48 64-48-64-48zm-64 54l-64 48 64 32 64-32-64-48z"/>
    </svg>
  );
}
