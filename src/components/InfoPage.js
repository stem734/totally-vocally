import React from 'react';
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
    text: 'Please do not check your phone during rehearsal. If you need to be on call for an emergency, let Abi know beforehand and keep your phone on vibrate.',
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

const INCLUDED = [
  'Two-hour rehearsals across 38 weeks of the year',
  'Professional learning tracks, lyrics and videos',
  'Bespoke pop, rock and gospel arrangements',
  'A free six-hour August workshop',
  'Weekly email or WhatsApp information and term plans',
  'Concert and performance opportunities',
];

export default function InfoPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <div className={s.heroGlow} />
        <p className={s.eyebrow}>Totally Vocally · Member handbook</p>
        <h1>Sing together.<br /><span>Grow together.</span></h1>
        <p className={s.heroCopy}>
          Everything you need to get the most from rehearsals, stay up to date and feel confident in your part.
        </p>
        <div className={s.heroActions}>
          <a href="mailto:abi@totallyvocally.com" className={s.primary}>Email Abi</a>
          <a href="tel:07786548337" className={s.secondary}>Call 07786 548337</a>
        </div>
        <div className={s.soundwave} aria-hidden="true">
          {[28, 52, 80, 44, 68, 94, 58, 76, 36, 64, 88, 48].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
      </section>

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
          <p>
            Rehearsal alone is not enough to learn the songs securely by heart. Your Dropbox materials include
            learning tracks, lyrics, exercises and videos prepared to help you practise independently.
          </p>
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
          <h2>£44 per month</h2>
          <p>Membership is paid by standing order on the 5th of each month. It covers rehearsals, learning materials, arrangements, licences, planning, venue hire and the tools used to produce your resources.</p>
          <p>Membership is not pay-as-you-go and remains due if you miss rehearsals. If you decide to leave, please give one month’s notice.</p>
        </article>
        <aside className={s.highlight}>
          <span className={s.quoteMark}>↻</span>
          <p>Taking time away?</p>
          <small>If you stop membership payments, your place cannot be held. Continuing your standing order keeps your place and learning-resource access as a virtual member. Speak to Abi before making changes.</small>
        </aside>
      </section>

      <section className={s.faqGrid}>
        <article><p className={s.sectionLabel}>Performances</p><h3>Are concerts compulsory?</h3><p>No. Performances and solos are always optional. You are warmly encouraged to join in, but never pressured.</p></article>
        <article><p className={s.sectionLabel}>Extra costs</p><h3>Will opportunities cost extra?</h3><p>If an outside opportunity involves a cost to singers, it will be explained in advance and participation will remain optional.</p></article>
        <article><p className={s.sectionLabel}>Communication</p><h3>Where are updates shared?</h3><p>Look out for the weekly member email or WhatsApp message with singing information, exercises and term plans.</p></article>
      </section>

      <footer className={s.footer}>
        <div><strong>Questions about choir or membership?</strong><span>Abi is the best person to help.</span></div>
        <div className={s.footerLinks}><a href="mailto:abi@totallyvocally.com">abi@totallyvocally.com</a><a href="tel:07786548337"><PhoneIcon /> 07786 548337</a></div>
      </footer>
    </main>
  );
}
