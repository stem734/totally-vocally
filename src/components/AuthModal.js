import React, { useState } from 'react';
import s from './EventDetailModal.module.css';
import './AuthModal.css';

export default function AuthModal({ open, mode, onClose, onSubmit, loading, error }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [voicePart, setVoicePart] = useState('');

  const handleSubmit = () => {
    if (!email) return;
    onSubmit(email, displayName, voicePart);
  };

  if (!open) return null;

  const isSignUp = mode === 'signup';

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className={`${s.modal} authModal`}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{isSignUp ? 'Join the Choir' : 'Sign In'}</h2>
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

            {isSignUp && (
              <>
                <div className="authField">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    disabled={loading}
                  />
                </div>

                <div className="authField">
                  <label>Voice Part (optional)</label>
                  <select
                    value={voicePart}
                    onChange={(e) => setVoicePart(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Not specified</option>
                    <option value="soprano">Soprano</option>
                    <option value="alto">Alto</option>
                    <option value="tenor">Tenor</option>
                    <option value="bass">Bass</option>
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className="authError">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!email || loading}
              className="authSubmitBtn"
            >
              {loading ? 'Sending link...' : (isSignUp ? 'Send Join Link' : 'Send Sign-In Link')}
            </button>

            <p className="authHint">
              {isSignUp
                ? 'We\'ll send you a link to create your account'
                : 'We\'ll send you a sign-in link — no password needed'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
