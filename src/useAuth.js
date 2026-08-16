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
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile();
      if (firebaseUser) {
        setUser(firebaseUser);
        // Keep approval and role changes in sync while the user is logged in.
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setProfile(profileData);
            setIsAdmin(profileData.role === 'admin');
          } else {
            setProfile(null);
            setIsAdmin(false);
          }
          setLoading(false);
        }, (err) => {
          console.error('Failed to fetch user role:', err);
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
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

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
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
      // Create user account
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      if (displayName) {
        await updateProfile(userCred.user, { displayName });
      }

      // Create user document in Firestore
      const newProfile = {
        email,
        displayName: displayName || '',
        voicePart: voicePart || '',
        role: 'member',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
      setProfile(newProfile);

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
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
      setProfile(null);
      setIsAdmin(false);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    user,
    profile,
    isAdmin,
    isApproved: isAdmin || profile?.status === 'approved',
    loading,
    error,
    signIn,
    signUp,
    resetPassword,
    logout,
  };
}
