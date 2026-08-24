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
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { useEventsFirestore } from './useEventsFirestore';
import { useSongs } from './useSongs';
import { db } from './firebase';
import { getAuthErrorMessage } from './authMessages';
import { eventMatchesSection } from './filterUtils';
import { latestFileUpdatedAt } from './fileUpdates';
import { listSharedFiles } from './sharedFiles';

const LAST_SEEN_EVENTS_KEY_PREFIX = 'tv_last_seen_events_';
const LAST_SEEN_FILES_KEY_PREFIX = 'tv_last_seen_files_';
const FILE_UPDATE_POLL_MS = 2 * 60 * 1000;

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
  const [authErrorCode, setAuthErrorCode] = useState('');
  const [lastSeenEventsAt, setLastSeenEventsAt] = useState('');
  const [lastSeenFilesAt, setLastSeenFilesAt] = useState('');
  const [latestFileAt, setLatestFileAt] = useState('');
  const [filesNewSince, setFilesNewSince] = useState('');
  const [openSongFolderId, setOpenSongFolderId] = useState('');
  const [eventSectionFilter, setEventSectionFilter] = useState('all');
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  // Navigation state survives while the sign-in screen is shown. Always give
  // the next account a safe, available landing page after authentication.
  useEffect(() => {
    if (user?.uid) setPage('calendar');
  }, [user?.uid]);

  useEffect(() => {
    if (!user) { setLastSeenEventsAt(''); setLastSeenFilesAt(''); setFilesNewSince(''); return; }
    setLastSeenEventsAt(localStorage.getItem(LAST_SEEN_EVENTS_KEY_PREFIX + user.uid) || '');
    setLastSeenFilesAt(localStorage.getItem(LAST_SEEN_FILES_KEY_PREFIX + user.uid) || '');
  }, [user]);

  useEffect(() => {
    if (!isApproved) return undefined;
    let active = true;
    const refresh = async () => {
      try { const files = await listSharedFiles(); if (active) setLatestFileAt(latestFileUpdatedAt(files)); } catch (err) { console.error('Failed to check for new files:', err); }
    };
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    const interval = window.setInterval(refresh, FILE_UPDATE_POLL_MS);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refreshWhenVisible); };
  }, [isApproved]);

  const markEventsSeen = useCallback(() => {
    if (!user) return;
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_EVENTS_KEY_PREFIX + user.uid, now);
    setLastSeenEventsAt(now);
  }, [user]);

  const markFilesSeen = useCallback(() => {
    if (!user) return;
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_FILES_KEY_PREFIX + user.uid, now);
    setLastSeenFilesAt(now);
  }, [user]);

  useEffect(() => {
    if (!isAdmin) {
      setPendingApprovalCount(0);
      return undefined;
    }

    return onSnapshot(collection(db, 'users'), (snapshot) => {
      setPendingApprovalCount(snapshot.docs.filter((member) => {
        const data = member.data();
        return data.role !== 'admin' && data.status === 'pending';
      }).length);
    }, (err) => {
      console.error('Failed to fetch pending approval count:', err);
      setPendingApprovalCount(0);
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) setEventSectionFilter('all');
  }, [isAdmin]);

  const visibleEvents = events.filter((event) => eventMatchesSection(
    event,
    isAdmin ? eventSectionFilter : profile?.rehearsalDay
  ));
  const hasNewEvents = visibleEvents.some((ev) => ev.createdAt && ev.createdAt > lastSeenEventsAt);
  const hasNewFiles = Boolean(latestFileAt && latestFileAt > lastSeenFilesAt);

  const handleFilesLoaded = useCallback((files) => { setLatestFileAt(latestFileUpdatedAt(files)); markFilesSeen(); }, [markFilesSeen]);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthError('');
    setAuthErrorCode('');
    setAuthMode('signin');
  }, []);

  const handleAuth = async (email, password, displayName) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthErrorCode('');
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
      setAuthErrorCode(err?.code || '');
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
          errorCode={authErrorCode}
          onForgotPassword={() => { setAuthError(''); setAuthErrorCode(''); setAuthMode('forgotPassword'); }}
          onSignIn={() => { setAuthError(''); setAuthErrorCode(''); setAuthMode('signin'); }}
          onResetPassword={() => { setAuthError(''); setAuthErrorCode(''); setAuthMode('forgotPassword'); }}
        />
      </>
    );
  }

  if (!isApproved) {
    return <PendingApproval profile={profile} onLogout={logout} />;
  }

  // Logged in
  const navigate = (p) => {
    if (p === 'files') { setOpenSongFolderId(''); setFilesNewSince(lastSeenFilesAt); }
    setPage(p);
    if (p === 'calendar' || p === 'events') markEventsSeen();
    if (p === 'files') markFilesSeen();
  };
  const openSongFolder = (songId) => {
    setOpenSongFolderId(songId);
    setFilesNewSince(lastSeenFilesAt);
    setPage('files');
    markFilesSeen();
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
        hasNewFiles={hasNewFiles}
        pendingApprovalCount={pendingApprovalCount}
      />

      {page === 'calendar' && (
        <CalendarPage
          key="calendar"
          events={visibleEvents}
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
          sectionFilter={eventSectionFilter}
          onSectionFilterChange={setEventSectionFilter}
        />
      )}
      {page === 'events' && (
        <EventsPage
          key="events"
          events={visibleEvents}
          isAdmin={isAdmin}
          onAddEvent={openModal}
          onDeleteEvent={deleteEvent}
          onUpdateEvent={updateEvent}
          onSetAttendance={setAttendance}
          onAllocateSongs={allocateSongs}
          rehearsalDay={profile?.rehearsalDay}
          songs={songLibrary.songs}
          onOpenSongFolder={openSongFolder}
          sectionFilter={eventSectionFilter}
          onSectionFilterChange={setEventSectionFilter}
        />
      )}
      {page === 'info' && <InfoPage key="info" isAdmin={isAdmin} />}
      {page === 'files' && (
        <FilesPage
          key={`files-${openSongFolderId || 'all'}`}
          isAdmin={isAdmin}
          songLibrary={songLibrary}
          initialSongId={openSongFolderId}
          onFilesLoaded={handleFilesLoaded}
          newSince={filesNewSince}
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
        songs={songLibrary.songs}
      />
    </>
  );
}
