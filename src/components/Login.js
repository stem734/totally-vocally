import React, { useState } from 'react';
import s from './Login.module.css';

const PASSWORD = '5inging';

export default function Login({ onLogin }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pw === PASSWORD) {
      onLogin();
    } else {
      setError('Incorrect password — please try again.');
      setPw('');
      setShake(true);
      setTimeout(() => { setShake(false); setError(''); }, 2600);
    }
  };

  return (
    <div className={s.screen}>
      <div className={s.bg} />
      <div className={s.waves} aria-hidden="true">
        <span>♪</span><span>♫</span><span>♩</span><span>♬</span><span>♪</span>
      </div>
      <div className={`${s.card} ${shake ? s.shake : ''}`}>
        <div className={s.logoWrap}>
          <div className={s.logoCircle}>
            <span className={s.logoNote}>♫</span>
          </div>
        </div>
        <h1 className={s.title}>Totally<br /><span>Vocally</span></h1>
        <p className={s.tagline}>Members Portal</p>
        <div className={s.inputWrap}>
          <input
            className={s.input}
            type="password"
            placeholder="Enter your password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && attempt()}
            autoComplete="current-password"
          />
        </div>
        <button className={s.btn} onClick={attempt}>Enter the Choir Room</button>
        <p className={s.error}>{error}\u00a0</p>
      </div>
    </div>
  );
}
