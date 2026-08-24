import { getAuthErrorMessage } from './authMessages';

describe('authentication messages', () => {
  test('offers a useful duplicate-account message', () => {
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toContain('Sign in or reset');
  });

  test('explains the weak password minimum', () => {
    expect(getAuthErrorMessage({ code: 'auth/weak-password' })).toContain('6 characters');
  });

  test('keeps unknown Firebase errors generic', () => {
    expect(getAuthErrorMessage({ code: 'auth/internal-error', message: 'secret detail' })).toBe('Something went wrong. Please try again.');
  });

  test('handles invalid email', () => {
    expect(getAuthErrorMessage({ code: 'auth/invalid-email' })).toBe('Please enter a valid email address.');
  });

  test('handles invalid credentials', () => {
    expect(getAuthErrorMessage({ code: 'auth/invalid-credential' })).toContain('Incorrect email or password');
  });

  test('handles rate limiting', () => {
    expect(getAuthErrorMessage({ code: 'auth/too-many-requests' })).toContain('Too many');
  });

  test('handles network failure', () => {
    expect(getAuthErrorMessage({ code: 'auth/network-request-failed' })).toContain('internet connection');
  });
});
