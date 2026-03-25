import React, { useState } from 'react';
import Login from './components/Login';
import Header from './components/Header';
import CalendarPage from './components/CalendarPage';
import EventsPage from './components/EventsPage';
import InfoPage from './components/InfoPage';
import FilesPage from './components/FilesPage';
import AddEventModal from './components/AddEventModal';
import { useEvents } from './useEvents';

export default function App() {
  const [loggedIn, setLoggedIn]     = useState(false);
  const [page, setPage]             = useState('calendar');
  const [modalOpen, setModalOpen]   = useState(false);

  const { events, addEvent, deleteEvent, setAttendance } = useEvents();

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const navigate = (p) => setPage(p);
  const openModal  = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <Header
        activePage={page}
        onNavigate={navigate}
        onLogout={() => { setLoggedIn(false); setPage('calendar'); }}
      />

      {page === 'calendar' && (
        <CalendarPage
          key="calendar"
          events={events}
          onAddEvent={openModal}
        />
      )}
      {page === 'events' && (
        <EventsPage
          key="events"
          events={events}
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
          // After adding, switch to events tab so they can see it
          setPage('events');
        }}
      />
    </>
  );
}
