import React from 'react';
import s from './PendingApproval.module.css';

export default function PendingApproval({ profile, onLogout }) {
  return (
    <main className={s.screen}>
      <section className={s.card}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Totally Vocally" className={s.logo} />
        <span className={s.badge}>Request received</span>
        <h1>Awaiting approval</h1>
        <p>
          Thanks{profile?.displayName ? `, ${profile.displayName}` : ''}. An administrator needs to approve
          your membership before you can enter the portal.
        </p>
        {profile?.voicePart && <p className={s.voice}>Voice part: <strong>{profile.voicePart}</strong></p>}
        {profile?.rehearsalDay && <p className={s.voice}>Rehearsal group: <strong>{profile.rehearsalDay}</strong></p>}
        <button onClick={onLogout}>Sign Out</button>
      </section>
    </main>
  );
}
