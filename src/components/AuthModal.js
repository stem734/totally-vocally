import React, { useState } from 'react';
import s from './EventDetailModal.module.css';
import './AuthModal.css';

export default function AuthModal({ open, mode, onClose, onSubmit, loading, error, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (!email) return;
    if (mode !== 'forgotPassword' && !password) return;
    onSubmit(email, password);
  };

  if (!open) return null;

  const isForgotPassword = mode === 'forgotPassword';

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className={`${s.modal} authModal`}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>
            {isForgotPassword ? 'Reset Password' : 'Sign In'}
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
            )}

            {error && (
              <div className="authError">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={(!email || ((!isForgotPassword) && !password)) || loading}
              className="authSubmitBtn"
            >
              {loading ? 'Please wait...' : (isForgotPassword ? 'Send Reset Link' : 'Sign In')}
            </button>

            {!isForgotPassword && (
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
