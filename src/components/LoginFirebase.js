import React from 'react';
import s from './Login.module.css';

export default function LoginFirebase({ onLoginClick, onSignUpClick }) {
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
            Sign In with Magic Link
          </button>
          <button className={s.btnSecondary} onClick={onSignUpClick}>
            New Member? Sign Up
          </button>
        </div>

        <p className={s.hint}>We'll send you a sign-in link via email — no password needed.</p>
      </div>
    </div>
  );
}
