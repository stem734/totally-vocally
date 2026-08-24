import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { setMemberAccess } from '../firebaseFunctions';
import s from './MembersPage.module.css';

const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', inactive: 'Inactive' };
const VOICE_PARTS = ['Soprano 1', 'Soprano 2', 'Alto', 'Tenor 1', 'Tenor 2', 'Bass'];
const REHEARSAL_DAYS = ['Monday', 'Tuesday', 'Wednesday'];

export default function MembersPage({ isAdmin = true }) {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const [accessMember, setAccessMember] = useState(null);
  const [changingAccess, setChangingAccess] = useState(false);
  const [dayFilter, setDayFilter] = useState('');
  const [voicePartFilter, setVoicePartFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

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

  const handleDeactivate = async () => {
    if (!accessMember) return;
    setChangingAccess(true);
    setError('');
    try {
      await setMemberAccess({ targetUid: accessMember.id, action: 'deactivate' });
      setAccessMember(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingAccess(false);
    }
  };

  const reactivateMember = async (member) => {
    setUpdating(member.id);
    setError('');
    try {
      await setMemberAccess({ targetUid: member.id, action: 'reactivate' });
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

  const pendingMembers = ordered.filter((member) => {
    const status = member.role === 'admin' ? 'approved' : (member.status || 'approved');
    return status === 'pending';
  });
  const matchesFilters = (member) => (!search || `${member.displayName || ''} ${member.email || ''}`.toLowerCase().includes(search.toLowerCase()))
    && (!dayFilter || member.rehearsalDay === dayFilter)
    && (!voicePartFilter || member.voicePart === voicePartFilter);
  const otherMembers = ordered.filter((member) => !pendingMembers.includes(member) && member.status !== 'inactive' && matchesFilters(member));
  const inactiveMembers = ordered.filter((member) => member.role !== 'admin' && member.status === 'inactive' && matchesFilters(member));

  const renderMember = (member) => {
    const status = member.role === 'admin' ? 'approved' : (member.status || 'approved');
    const displayName = member.displayName || 'Unnamed member';
    const email = member.email;
    const locked = !isAdmin || updating === member.id;
    return (
      <article className={`${s.card} ${status === 'pending' ? s.pendingCard : ''}`} key={member.id}>
        <div className={s.identity}>
          <strong title={displayName}>{displayName}</strong>
          <span title={email}>{email}</span>
          <small>{member.role === 'admin' ? 'Administrator' : 'Choir member'}</small>
        </div>
        <div className={s.logins}>
          <strong>{member.loginCount || 0}</strong>
          <small>{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}</small>
        </div>
        <select
          className={s.voiceSelect}
          value={member.voicePart || ''}
          disabled={locked}
          onChange={(event) => setVoicePart(member.id, event.target.value)}
          aria-label={`Voice part for ${displayName}`}
        >
          <option value="">Assign voice part</option>
          {VOICE_PARTS.map((part) => <option key={part} value={part}>{part}</option>)}
        </select>
        <select
          className={s.voiceSelect}
          value={member.rehearsalDay || ''}
          disabled={locked}
          onChange={(event) => setRehearsalDay(member.id, event.target.value)}
          aria-label={`Rehearsal day for ${displayName}`}
        >
          <option value="">Assign rehearsal day</option>
          {REHEARSAL_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
        </select>
        <span className={`${s.status} ${s[status]}`}>{STATUS_LABELS[status]}</span>
        {isAdmin && member.role !== 'admin' && (
          <div className={s.actions}>
            {status !== 'approved' && <button className={s.approve} disabled={updating === member.id || !member.voicePart || !member.rehearsalDay} title={!member.voicePart || !member.rehearsalDay ? 'Assign a voice part and rehearsal day before approval' : ''} onClick={() => setStatus(member.id, 'approved')}>Approve</button>}
            {status !== 'rejected' && <button className={s.reject} disabled={updating === member.id} onClick={() => setStatus(member.id, 'rejected')}>Reject</button>}
            {status === 'inactive' ? (
              <button className={s.approve} disabled={updating === member.id} onClick={() => reactivateMember(member)}>Reactivate</button>
            ) : (
              <button className={s.delete} disabled={updating === member.id} onClick={() => setAccessMember({ id: member.id, displayName })}>Deactivate</button>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <main className={s.page}>
      <header className={s.header}>
        <div><h1>Choir <span>Members</span></h1><p>Review access requests and membership status.</p></div>
        <span className={s.count}>{members.length} members</span>
      </header>
      {error && <div className={s.error}>{error}</div>}
      {pendingMembers.length > 0 && (
        <section className={s.memberSection} aria-labelledby="pending-approvals-heading">
          <div className={s.sectionHeading}>
            <h2 id="pending-approvals-heading">Pending approvals</h2>
            <span>{pendingMembers.length} awaiting review</span>
          </div>
          <div className={`${s.list} ${s.pendingList}`}>{pendingMembers.map(renderMember)}</div>
        </section>
      )}

      <section className={s.memberSection} aria-labelledby="members-heading">
        <div className={s.sectionHeading}>
          <h2 id="members-heading">Members</h2>
          <span>{otherMembers.length} account{otherMembers.length === 1 ? '' : 's'}</span>
        </div>
        {isAdmin && <div className={s.filters} aria-label="Filter members">
          <label>Search members<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" /></label>
          <label>Rehearsal day<select value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}><option value="">All days</option>{REHEARSAL_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
          <label>Voice part<select value={voicePartFilter} onChange={(event) => setVoicePartFilter(event.target.value)}><option value="">All voice parts</option>{VOICE_PARTS.map((part) => <option key={part} value={part}>{part}</option>)}</select></label>
          <button type="button" className={s.resetFilters} onClick={() => { setSearch(''); setDayFilter(''); setVoicePartFilter(''); }}>Reset filters</button>
        </div>}
        <div className={s.tableHeader}>
          <span>Member</span>
          <span>Logins</span>
          <span>Voice Part</span>
          <span>Rehearsal Day</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className={s.list}>
          {otherMembers.length > 0 ? otherMembers.map(renderMember) : <p className={s.empty}>No approved, rejected, or administrator accounts yet.</p>}
        </div>
      </section>

      {inactiveMembers.length > 0 && <section className={`${s.memberSection} ${s.inactiveSection}`} aria-labelledby="inactive-members-heading">
        <button type="button" className={s.inactiveToggle} onClick={() => setShowInactive((open) => !open)} aria-expanded={showInactive}>
          <span><strong id="inactive-members-heading">Deactivated members</strong><small>Sign-in disabled; retained for audit and reactivation.</small></span>
          <span>{inactiveMembers.length} {showInactive ? '⌃' : '⌄'}</span>
        </button>
        {showInactive && <div className={s.inactiveList}>{inactiveMembers.map(renderMember)}</div>}
      </section>}

      {accessMember && createPortal(
        <div className={s.confirmOverlay} onClick={() => !changingAccess && setAccessMember(null)}>
          <div className={s.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Deactivate member?</h3>
            <p>
              This disables "{accessMember.displayName}"'s sign-in and revokes access immediately.
              Their profile and audit history are retained so an administrator can reactivate them later.
            </p>
            <div className={s.confirmActions}>
              <button className={s.cancelBtn} onClick={() => setAccessMember(null)} disabled={changingAccess}>Cancel</button>
              <button className={s.confirmDeleteBtn} onClick={handleDeactivate} disabled={changingAccess}>
                {changingAccess ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
