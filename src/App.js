import React, { useState } from 'react';
import Header from './components/Header';
import CalendarPage from './components/CalendarPage';
import EventsPage from './components/EventsPage';
import InfoPage from './components/InfoPage';
import FilesPage from './components/FilesPage';
import AddEventModal from './components/AddEventModal';
import LoginFirebase from './components/LoginFirebase';
import AuthModal from './components/AuthModal';
import { useAuth } from './useAuth';
import { useEventsFirestore } from './useEventsFirestore';

export default function App() {
  const { user, isAdmin, loading, signIn, signUp, resetPassword, logout } = useAuth();
  const { events, addEvent, deleteEvent, setAttendance } = useEventsFirestore(user?.uid);

  const [page, setPage] = useState('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin', 'signup', or 'forgotPassword'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAuth = async (email, password, displayName, voicePart) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      let success = false;
      if (authMode === 'signin') {
        success = await signIn(email, password);
        if (success) {
          alert('Signed in successfully!');
          setAuthModalOpen(false);
        }
      } else if (authMode === 'signup') {
        success = await signUp(email, password, displayName, voicePart);
        if (success) {
          alert('Account created successfully! Welcome to Totally Vocally!');
          setAuthModalOpen(false);
        }
      } else if (authMode === 'forgotPassword') {
        success = await resetPassword(email);
        if (success) {
          alert(`Password reset link sent to ${email}. Check your email to reset your password.`);
          setAuthModalOpen(false);
          setAuthMode('signin');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'An error occurred');
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
      />

      {page === 'calendar' && (
        <CalendarPage
          key="calendar"
          events={events}
          isAdmin={isAdmin}
          onAddEvent={openModal}
          onDeleteEvent={deleteEvent}
          onSetAttendance={setAttendance}
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
        />
      )}
      {page === 'info' && <InfoPage key="info" />}
      {page === 'files' && <FilesPage key="files" />}

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
