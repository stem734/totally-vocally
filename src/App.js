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
  const { user, isAdmin, loading, sendMagicLink, logout } = useAuth();
  const { events, addEvent, deleteEvent, setAttendance } = useEventsFirestore(user?.uid);

  const [page, setPage] = useState('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSendMagicLink = async (email, displayName, voicePart) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const isNewMember = authMode === 'signup';
      const success = await sendMagicLink(email, displayName, isNewMember);
      if (success) {
        alert(`Magic link sent to ${email}. Check your email to sign in.`);
        setAuthModalOpen(false);
      } else {
        setAuthError('Failed to send magic link. Please try again.');
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
          onClose={() => { setAuthModalOpen(false); setAuthError(''); }}
          onSubmit={handleSendMagicLink}
          loading={authLoading}
          error={authError}
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
