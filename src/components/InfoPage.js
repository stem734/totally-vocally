import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import s from './InfoPage.module.css';
import { MusicIcon, PhoneIcon, CheckIcon, FilesIcon } from '../icons';

const REHEARSAL_PRACTICE = [
  {
    number: '01',
    title: 'Be there to sing',
    text: 'Our two hours together are time to leave daily stresses behind, focus on singing and go home energised. Give the rehearsal your full attention.',
  },
  {
    number: '02',
    title: 'Devices on silent',
    text: 'Please do not check your phone during rehearsal. If you need to be on call for an emergency, let the choir director know beforehand and keep your phone on vibrate.',
  },
  {
    number: '03',
    title: 'Listen while others learn',
    text: 'When another section is working, listen to how their notes relate to yours. Keep conversation below the notes being taught so everyone can hear and learn.',
  },
  {
    number: '04',
    title: 'Come prepared',
    text: 'Use the learning tracks and lyric charts between rehearsals. This is especially important before performances, when secure parts let us focus on technique, dynamics and style.',
  },
];

const DEFAULT_INFO = {
  homePractice: 'Rehearsal alone is not enough to learn the songs securely by heart. Your Dropbox materials include learning tracks, lyrics, exercises and videos prepared to help you practise independently.',
  membershipFee: '£44 per month',
  membershipDetails: 'Membership is paid by standing order on the 5th of each month. It covers rehearsals, learning materials, arrangements, licences, planning, venue hire and the tools used to produce your resources.',
  cancellation: 'Membership is not pay-as-you-go and remains due if you miss rehearsals. If you decide to leave, please give one month’s notice.',
  timeAway: 'If you stop membership payments, your place cannot be held. Continuing your standing order keeps your place and learning-resource access as a virtual member. Speak to the choir director before making changes.',
  communication: 'Look out for the weekly member email or WhatsApp message with singing information, exercises and term plans.',
  email: 'info@totallyvocally.com',
  phone: '07000 000000',
};

const INCLUDED = [
  'Two-hour rehearsals across 38 weeks of the year',
  'Professional learning tracks, lyrics and videos',
  'Bespoke pop, rock and gospel arrangements',
  'A free six-hour August workshop',
  'Weekly email or WhatsApp information and term plans',
  'Concert and performance opportunities',
];

export default function InfoPage({ isAdmin }) {
  const [info, setInfo] = useState(DEFAULT_INFO);
  const [draft, setDraft] = useState(DEFAULT_INFO);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(doc(db, 'content', 'memberInfo'), (snapshot) => {
    const next = { ...DEFAULT_INFO, ...(snapshot.exists() ? snapshot.data() : {}) };
    setInfo(next);
    if (!editing) setDraft(next);
  }), [editing]);

  const saveInfo = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'content', 'memberInfo'), draft, { merge: true });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={s.page}>
      {isAdmin && <div className={s.adminBar}><span>Member information</span><button onClick={() => { setDraft(info); setEditing(!editing); }}>{editing ? 'Cancel' : 'Edit page'}</button></div>}
      {editing && (
        <section className={s.editor}>
          <h2>Edit member information</h2>
          {Object.entries(draft).map(([key, value]) => (
            <label key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span>{value.length > 60 ? <textarea rows="3" value={value} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /> : <input value={value} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />}</label>
          ))}
          <button className={s.saveButton} onClick={saveInfo} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </section>
      )}
      <section className={s.legacy}>
        <div><p className={s.sectionLabel}>At rehearsal</p><h2>Getting the best from our time together</h2></div>
        <div className={s.practiceGrid}>
          {REHEARSAL_PRACTICE.map((item) => (
            <article key={item.number} className={s.practiceCard}>
              <span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={s.detailsGrid}>
        <article className={s.detailsCard}>
          <div className={s.icon}><FilesIcon /></div>
          <p className={s.sectionLabel}>Between rehearsals</p>
          <h2>Learn your part at home</h2>
          <p>{info.homePractice}</p>
          <p>
            The better the parts are learned, the more rehearsal time we can spend on blend, movement,
            technique, dynamics and performance.
          </p>
        </article>

        <article className={`${s.detailsCard} ${s.director}`}>
          <div className={s.icon}><MusicIcon /></div>
          <p className={s.sectionLabel}>Your membership includes</p>
          <h2>More than rehearsal night</h2>
          <ul className={s.checkList}>
            {INCLUDED.map((item) => <li key={item}><CheckIcon /><span>{item}</span></li>)}
          </ul>
        </article>
      </section>

      <section className={s.storyGrid}>
        <article className={s.story}>
          <p className={s.sectionLabel}>Membership</p>
          <h2>{info.membershipFee}</h2>
          <p>{info.membershipDetails}</p>
          <p>{info.cancellation}</p>
        </article>
        <aside className={s.highlight}>
          <p className={s.sectionLabel}>Time away</p>
          <h2>Taking time away?</h2>
          <p className={s.highlightBody}>{info.timeAway}</p>
        </aside>
      </section>

      <section className={s.faqGrid}>
        <article><p className={s.sectionLabel}>Performances</p><h3>Are concerts compulsory?</h3><p>No. Performances and solos are always optional. You are warmly encouraged to join in, but never pressured.</p></article>
        <article><p className={s.sectionLabel}>Extra costs</p><h3>Will opportunities cost extra?</h3><p>If an outside opportunity involves a cost to singers, it will be explained in advance and participation will remain optional.</p></article>
        <article><p className={s.sectionLabel}>Communication</p><h3>Where are updates shared?</h3><p>{info.communication}</p></article>
      </section>

      <footer className={s.footer}>
        <div><strong>Questions about choir or membership?</strong><span>The choir director is the best person to help.</span></div>
        <div className={s.footerLinks}><a href={`mailto:${info.email}`}>{info.email}</a><a href={`tel:${info.phone.replace(/\s/g, '')}`}><PhoneIcon /> {info.phone}</a></div>
      </footer>
    </main>
  );
}
