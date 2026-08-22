import React from 'react';
import s from './Login.module.css';

export default function LoginFirebase({ onLoginClick, onSignUpClick, sessionExpired }) {
  return (
    <div className={s.screen}>
      <div className={s.bg} />
      <div className={s.waves} aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div className={s.card}>
        <div className={s.logoWrap}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Totally Vocally" className={s.logoImg} />
        </div>
        <p className={s.tagline}>Members Portal</p>

        {sessionExpired && (
          <p className={s.notice} role="status">
            You were signed out after a period of inactivity. Please sign in again.
          </p>
        )}

        <div className={s.buttonGroup}>
          <button className={s.btnPrimary} onClick={onLoginClick}>
            Sign In
          </button>
          <button className={s.btnSecondary} onClick={onSignUpClick}>
            Request Access
          </button>
        </div>

        <p className={s.hint}>Only members of Totally Vocally Choir can use this application</p>
      </div>
    </div>
  );
}
