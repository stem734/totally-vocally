import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import s from './MembersPage.module.css';

const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const VOICE_PARTS = ['Soprano 1', 'Soprano 2', 'Alto', 'Tenor 1', 'Tenor 2', 'Bass'];
const REHEARSAL_DAYS = ['Monday', 'Tuesday', 'Wednesday'];

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  useEffect(() => onSnapshot(collection(db, 'users'), (snapshot) => {
    setMembers(snapshot.docs.map((member) => ({ id: member.id, ...member.data() })));
  }, (err) => setError(err.message)), []);

  const setStatus = async (memberId, status) => {
    setUpdating(memberId);
    setError('');
    try {
      await updateDoc(doc(db, 'users', memberId), { status, reviewedAt: new Date().toISOString() });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const setVoicePart = async (memberId, voicePart) => {
    setUpdating(memberId);
    setError('');
    try {
      await updateDoc(doc(db, 'users', memberId), { voicePart });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const setRehearsalDay = async (memberId, rehearsalDay) => {
    setUpdating(memberId);
    setError('');
    try {
      await updateDoc(doc(db, 'users', memberId), { rehearsalDay });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const ordered = [...members].sort((a, b) => {
    if ((a.status || 'approved') === 'pending' && (b.status || 'approved') !== 'pending') return -1;
    if ((b.status || 'approved') === 'pending' && (a.status || 'approved') !== 'pending') return 1;
    return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
  });

  return (
    <main className={s.page}>
      <header className={s.header}>
        <div><h1>Choir <span>Members</span></h1><p>Review access requests and membership status.</p></div>
        <span className={s.count}>{members.length} members</span>
      </header>
      {error && <div className={s.error}>{error}</div>}
      <div className={s.tableHeader}>
        <span>Member</span>
        <span>Logins</span>
        <span>Voice Part</span>
        <span>Rehearsal Day</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      <div className={s.list}>
        {ordered.map((member) => {
          const status = member.role === 'admin' ? 'approved' : (member.status || 'approved');
          return (
            <article className={s.card} key={member.id}>
              <div className={s.identity}>
                <strong>{member.displayName || 'Unnamed member'}</strong>
                <span>{member.email}</span>
                <small>{member.role === 'admin' ? 'Administrator' : 'Choir member'}</small>
              </div>
              <div className={s.logins}>
                <strong>{member.loginCount || 0}</strong>
                <small>{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}</small>
              </div>
              <select
                className={s.voiceSelect}
                value={member.voicePart || ''}
                disabled={updating === member.id}
                onChange={(event) => setVoicePart(member.id, event.target.value)}
                aria-label={`Voice part for ${member.displayName || member.email}`}
              >
                <option value="">Assign voice part</option>
                {VOICE_PARTS.map((part) => <option key={part} value={part}>{part}</option>)}
              </select>
              <select
                className={s.voiceSelect}
                value={member.rehearsalDay || ''}
                disabled={updating === member.id}
                onChange={(event) => setRehearsalDay(member.id, event.target.value)}
                aria-label={`Rehearsal day for ${member.displayName || member.email}`}
              >
                <option value="">Assign rehearsal day</option>
                {REHEARSAL_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
              <span className={`${s.status} ${s[status]}`}>{STATUS_LABELS[status]}</span>
              {member.role !== 'admin' && (
                <div className={s.actions}>
                  {status !== 'approved' && <button className={s.approve} disabled={updating === member.id || !member.voicePart || !member.rehearsalDay} title={!member.voicePart || !member.rehearsalDay ? 'Assign a voice part and rehearsal day before approval' : ''} onClick={() => setStatus(member.id, 'approved')}>Approve</button>}
                  {status !== 'rejected' && <button className={s.reject} disabled={updating === member.id} onClick={() => setStatus(member.id, 'rejected')}>Reject</button>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
