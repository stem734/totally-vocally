import { useState, useEffect, useCallback } from 'react';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

  const sendMagicLink = useCallback(async (email, displayName, isNewMember) => {
    setError('');
    try {
      // Validate join code for new members
      if (isNewMember) {
        const code = window.prompt('Enter the choir join code:');
        if (code !== JOIN_CODE) {
          setError('Invalid join code. Please contact Abi Moore for access.');
          return false;
        }
      }

      const actionCodeSettings = {
        url: `${window.location.origin}?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      // Save email for later verification
      window.localStorage.setItem('emailForSignIn', email);
      if (displayName) {
        window.localStorage.setItem('displayNameForSignIn', displayName);
      }
      window.localStorage.setItem('isNewMemberForSignIn', isNewMember.toString());

      return true;
    } catch (err) {
      setError(err.message);
      return false;
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
    sendMagicLink,
    logout,
  };
}
