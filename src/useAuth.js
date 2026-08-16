import { useState, useEffect, useCallback } from 'react';
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const JOIN_CODE = 'sing2026'; // Choir join code for self-registration

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === 'admin');
          }
        } catch (err) {
          console.error('Failed to fetch user role:', err);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Handle email link login after redirect from email
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            setError('Failed to sign in with email link: ' + err.message);
          });
      }
    }

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email, password, displayName, voicePart) => {
    setError('');
    try {
      // Validate join code
      const code = window.prompt('Enter the choir join code:');
      if (code !== JOIN_CODE) {
        setError('Invalid join code. Please contact the choir director for access.');
        return false;
      }

      // Create user account
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      if (displayName) {
        await updateProfile(userCred.user, { displayName });
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCred.user.uid), {
        email,
        displayName: displayName || '',
        voicePart: voicePart || '',
        role: 'member',
        createdAt: new Date().toISOString(),
      });

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setError('');
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}?mode=resetPassword`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError('');
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    user,
    isAdmin,
    loading,
    error,
    signIn,
    signUp,
    resetPassword,
    logout,
  };
}
