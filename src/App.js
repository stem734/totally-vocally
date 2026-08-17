import React, { useState, useEffect } from 'react';
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
import SongsPage from './components/SongsPage';
import { useAuth } from './useAuth';
import { useEventsFirestore } from './useEventsFirestore';
import { importTermDates2026 } from './termDates';
import { seedSongs } from './seedSongs';

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
    default:
      return error?.message || 'Unable to sign in. Please try again.';
  }
}

export default function App() {
  const { user, profile, isAdmin, isApproved, loading, signIn, signUp, resetPassword, logout } = useAuth();
  const { events, addEvent, deleteEvent, setAttendance } = useEventsFirestore(isApproved ? user?.uid : null);

  const [page, setPage] = useState('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'forgotPassword'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [importingDates, setImportingDates] = useState(false);

  useEffect(() => {
    if (isAdmin) seedSongs().catch(err => console.error('Failed to seed songs:', err));
  }, [isAdmin]);

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
        success = await resetPassword(email);
        if (success) {
          alert(`Password reset link sent to ${email}. Check your email to reset your password.`);
          setAuthModalOpen(false);
          setAuthMode('signin');
        }
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
          onLoginClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}
          onSignUpClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
        />
        <AuthModal
          open={authModalOpen}
          mode={authMode}
          onClose={() => { setAuthModalOpen(false); setAuthError(''); setAuthMode('signin'); }}
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
  const navigate = (p) => setPage(p);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <Header
        activePage={page}
        onNavigate={navigate}
        onLogout={logout}
        isAdmin={isAdmin}
      />

      {page === 'calendar' && (
        <CalendarPage
          key="calendar"
          events={events}
          isAdmin={isAdmin}
          onAddEvent={openModal}
          onDeleteEvent={deleteEvent}
          onSetAttendance={setAttendance}
          rehearsalDay={profile?.rehearsalDay}
          onImportTermDates={async () => {
            setImportingDates(true);
            try {
              const count = await importTermDates2026(user.uid);
              alert(`${count} term-date rehearsals imported. Existing matching dates were updated, not duplicated.`);
            } finally {
              setImportingDates(false);
            }
          }}
          importingDates={importingDates}
        />
      )}
      {page === 'events' && (
        <EventsPage
          key="events"
          events={events}
          isAdmin={isAdmin}
          onAddEvent={openModal}
          onDeleteEvent={deleteEvent}
          onSetAttendance={setAttendance}
          rehearsalDay={profile?.rehearsalDay}
        />
      )}
      {page === 'info' && <InfoPage key="info" isAdmin={isAdmin} />}
      {page === 'files' && <FilesPage key="files" />}
      {page === 'attendance' && isAdmin && <AttendanceDashboard key="attendance" events={events} />}
      {page === 'songs' && isAdmin && <SongsPage key="songs" />}
      {page === 'members' && isAdmin && <MembersPage key="members" />}

      <AddEventModal
        open={modalOpen}
        onClose={closeModal}
        onSave={(ev) => {
          addEvent(ev);
          setPage('events');
        }}
      />
    </>
  );
}
