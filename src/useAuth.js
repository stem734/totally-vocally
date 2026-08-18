import { useState, useEffect, useCallback, useRef } from 'react';
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
import { doc, increment, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Automatically sign a user out after this much inactivity, so an
// unattended session can't be left open indefinitely.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // True after an automatic sign-out, so the login screen can explain why.
  const [sessionExpired, setSessionExpired] = useState(false);
  const lastActivityRef = useRef(Date.now());

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
            setIsViewer(profileData.role === 'viewer');
          } else {
            setProfile(null);
            setIsAdmin(false);
            setIsViewer(false);
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
        setIsViewer(false);
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

  // Sign the user out after a period of inactivity so they're prompted to
  // log back in. Only runs while someone is actually logged in.
  useEffect(() => {
    if (!user) return undefined;

    lastActivityRef.current = Date.now();
    const markActivity = () => { lastActivityRef.current = Date.now(); };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'visibilitychange'];
    activityEvents.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        setSessionExpired(true);
        signOut(auth).catch((err) => console.error('Failed to sign out on inactivity:', err));
      }
    }, 30 * 1000); // check every 30s

    return () => {
      clearInterval(interval);
      activityEvents.forEach((evt) => window.removeEventListener(evt, markActivity));
    };
  }, [user]);

  const signIn = useCallback(async (email, password) => {
    setError('');
    setSessionExpired(false);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      try {
        await updateDoc(doc(db, 'users', cred.user.uid), {
          loginCount: increment(1),
          lastLoginAt: new Date().toISOString(),
        });
      } catch (err) {
        // Don't fail sign-in over a login-stats write issue.
        console.error('Failed to record login stats:', err);
      }
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
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
        voicePart: '',
        role: 'member',
        status: 'pending',
        createdAt: new Date().toISOString(),
        loginCount: 0,
        lastLoginAt: null,
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
      setIsViewer(false);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    user,
    profile,
    isAdmin,
    isViewer,
    isApproved: isAdmin || profile?.status === 'approved',
    loading,
    error,
    sessionExpired,
    signIn,
    signUp,
    resetPassword,
    logout,
  };
}
