import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CalendarPage from './components/CalendarPage';
import EventsPage from './components/EventsPage';
import InfoPage from './components/InfoPage';
import FilesPage from './components/FilesPage';
import AddEventModal from './components/AddEventModal';
import LoginFirebase from './components/LoginFirebase';
import AuthModal from './components/AuthModal';
import PendingApproval from './components/PendingApproval';
import MembersPage from './components/MembersPage';
import AttendanceDashboard from './components/AttendanceDashboard';
import { useAuth } from './useAuth';
import { useEventsFirestore } from './useEventsFirestore';
import { useSongs } from './useSongs';

const LAST_SEEN_EVENTS_KEY_PREFIX = 'tv_last_seen_events_';

function getAuthErrorMessage(error) {
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
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a longer password.';
    default:
      // Never surface raw SDK error text - it can leak internal details.
      return 'Something went wrong. Please try again.';
  }
}

export default function App() {
  const { user, profile, isAdmin, isApproved, loading, sessionExpired, signIn, signUp, resetPassword, logout } = useAuth();
  const canViewAdminPages = isAdmin;
  const { events, addEvent, deleteEvent, updateEvent, setAttendance, allocateSongs, createRehearsalBlock } = useEventsFirestore(isApproved ? user?.uid : null, profile?.voicePart);
  const songLibrary = useSongs(isApproved);

  const [page, setPage] = useState('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'forgotPassword'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [lastSeenEventsAt, setLastSeenEventsAt] = useState('');
  const [openSongFolderId, setOpenSongFolderId] = useState('');

  useEffect(() => {
    if (!user) { setLastSeenEventsAt(''); return; }
    setLastSeenEventsAt(localStorage.getItem(LAST_SEEN_EVENTS_KEY_PREFIX + user.uid) || '');
  }, [user]);

  const markEventsSeen = useCallback(() => {
    if (!user) return;
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_EVENTS_KEY_PREFIX + user.uid, now);
    setLastSeenEventsAt(now);
  }, [user]);

  const hasNewEvents = events.some((ev) => ev.createdAt && ev.createdAt > lastSeenEventsAt);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthError('');
    setAuthMode('signin');
  }, []);

  const handleAuth = async (email, password, displayName) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      let success = false;
      if (authMode === 'signin') {
        success = await signIn(email, password);
        if (success) {
          setAuthModalOpen(false);
        }
      } else if (authMode === 'signup') {
        success = await signUp(email, password, displayName);
        if (success) setAuthModalOpen(false);
      } else if (authMode === 'forgotPassword') {
        try {
          await resetPassword(email);
        } catch (err) {
          // Treat "no such account" the same as success so the reset form
          // can't be used to probe which emails are registered.
          if (err?.code !== 'auth/user-not-found') throw err;
        }
        alert(`If an account exists for ${email}, a password reset link has been sent. Check your email to reset your password.`);
        setAuthModalOpen(false);
        setAuthMode('signin');
      }
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', color: '#f5f0f5' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <LoginFirebase
          sessionExpired={sessionExpired}
          onLoginClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}
          onSignUpClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
        />
        <AuthModal
          open={authModalOpen}
          mode={authMode}
          onClose={closeAuthModal}
          onSubmit={handleAuth}
          loading={authLoading}
          error={authError}
          onForgotPassword={() => setAuthMode('forgotPassword')}
        />
      </>
    );
  }

  if (!isApproved) {
    return <PendingApproval profile={profile} onLogout={logout} />;
  }

  // Logged in
  const navigate = (p) => {
    if (p === 'files') setOpenSongFolderId('');
    setPage(p);
    if (p === 'calendar' || p === 'events') markEventsSeen();
  };
  const openSongFolder = (songId) => {
    setOpenSongFolderId(songId);
    setPage('files');
  };
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <Header
        activePage={page}
        onNavigate={navigate}
        onLogout={logout}
        showAdminNav={canViewAdminPages}
        hasNewEvents={hasNewEvents}
      />

      {page === 'calendar' && (
        <CalendarPage
          key="calendar"
          events={events}
          isAdmin={isAdmin}
          onAddEvent={openModal}
          onDeleteEvent={deleteEvent}
          onUpdateEvent={updateEvent}
          onSetAttendance={setAttendance}
          onAllocateSongs={allocateSongs}
          onCreateRehearsalBlock={createRehearsalBlock}
          rehearsalDay={profile?.rehearsalDay}
          songs={songLibrary.songs}
          onOpenSongFolder={openSongFolder}
        />
      )}
      {page === 'events' && (
        <EventsPage
          key="events"
          events={events}
          isAdmin={isAdmin}
          onAddEvent={openModal}
          onDeleteEvent={deleteEvent}
          onUpdateEvent={updateEvent}
          onSetAttendance={setAttendance}
          onAllocateSongs={allocateSongs}
          rehearsalDay={profile?.rehearsalDay}
          songs={songLibrary.songs}
          onOpenSongFolder={openSongFolder}
        />
      )}
      {page === 'info' && <InfoPage key="info" isAdmin={isAdmin} />}
      {page === 'files' && (
        <FilesPage
          key={`files-${openSongFolderId || 'all'}`}
          isAdmin={isAdmin}
          songLibrary={songLibrary}
          initialSongId={openSongFolderId}
        />
      )}
      {page === 'attendance' && canViewAdminPages && (
        <AttendanceDashboard key="attendance" events={events} />
      )}
      {page === 'members' && canViewAdminPages && (
        <MembersPage key="members" isAdmin={isAdmin} />
      )}

      <AddEventModal
        open={modalOpen}
        onClose={closeModal}
        onSave={(ev) => {
          addEvent(ev);
          navigate('events');
        }}
      />
    </>
  );
}
