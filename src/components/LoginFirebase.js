import React from 'react';
import s from './Login.module.css';

export default function LoginFirebase({ onLoginClick }) {
  return (
    <div className={s.screen}>
      <div className={s.bg} />
      <div className={s.waves} aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div className={s.card}>
        <div className={s.logoWrap}>
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Totally Vocally" className={s.logoImg} />
        </div>
        <p className={s.tagline}>Members Portal</p>

        <div className={s.buttonGroup}>
          <button className={s.btnPrimary} onClick={onLoginClick}>
            Sign In
          </button>
        </div>

        <p className={s.hint}>Sign in with your email and password to access the members portal.</p>
      </div>
    </div>
  );
}
