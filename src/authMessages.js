export function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Incorrect email or password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please wait a moment or reset your password.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Please check your internet connection and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in or reset the password for that account.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a password at least 6 characters long.';
    default:
      // Never surface raw SDK error text - it can leak internal details.
      return 'Something went wrong. Please try again.';
  }
}
