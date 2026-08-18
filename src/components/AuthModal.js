import React, { useState } from 'react';
import s from './EventDetailModal.module.css';
import './AuthModal.css';

const TERMS_URL = 'https://mailchi.mp/535857a27c03/terms-and-conditions';

export default function AuthModal({ open, mode, onClose, onSubmit, loading, error, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    if (mode !== 'forgotPassword' && !password) return;
    if (mode === 'signup' && (!displayName || !agreed)) return;
    onSubmit(email, password, displayName);
  };

  if (!open) return null;

  const isForgotPassword = mode === 'forgotPassword';
  const isSignUp = mode === 'signup';

  return (
    <div className={s.overlay}>
      <div className={`${s.modal} authModal`}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>
            {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Request Access' : 'Sign In')}
          </h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close" disabled={loading}>×</button>
        </div>

        <div className={s.body}>
          <div className="authContent">
            <div className="authField">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            {!isForgotPassword && (
              <>
              {isSignUp && (
                <div className="authField">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>
              )}
              <div className="authField">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              </>
            )}

            {isSignUp && (
              <>
                <p className="authNotice">
                  Joining the app means sharing your name, email, voice part and rehearsal
                  attendance with the choir admin team so they can run rehearsals, events and
                  communications. This is covered by the choir's{' '}
                  <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">Terms &amp; Privacy Policy</a>.
                </p>
                <label className="authCheckboxField">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    disabled={loading}
                  />
                  <span>
                    I have read and agree to the{' '}
                    <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">Terms &amp; Conditions and Privacy Policy</a>
                  </span>
                </label>
              </>
            )}

            {error && (
              <div className="authError">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={(!email || ((!isForgotPassword) && !password) || (isSignUp && (!displayName || !agreed))) || loading}
              className="authSubmitBtn"
            >
              {loading ? 'Please wait...' : (isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Submit Request' : 'Sign In'))}
            </button>

            {!isForgotPassword && !isSignUp && (
              <p className="authHint">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7ac4e6',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    font: 'inherit',
                  }}
                >
                  Forgot password?
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
