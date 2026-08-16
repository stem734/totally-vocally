import React from 'react';
import s from './InfoPage.module.css';
import { MusicIcon, MapPinIcon, MessageSquareIcon } from '../icons';

const REHEARSALS = [
  { day: 'Monday', time: '6:45–8:45pm' },
  { day: 'Tuesday', time: '7:00–9:00pm' },
  { day: 'Wednesday', time: '6:00–8:00pm' },
];

const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/totallyvocally' },
  { label: 'Instagram', href: 'https://www.instagram.com/totallyvocally' },
  { label: 'YouTube', href: 'https://youtube.com/playlist?list=PL-M07X6ZGOhEoEJVqJovqUBPB_c-nqEfy' },
];

export default function InfoPage() {
  return (
    <main className={s.page}>
      <section className={s.hero}>
        <div className={s.heroGlow} />
        <p className={s.eyebrow}>Nottingham · Voices only</p>
        <h1>Big sound.<br /><span>No instruments.</span></h1>
        <p className={s.heroCopy}>Totally Vocally is an independent Nottingham acappella choir bringing pop, rock, funk and gospel to life through joyful harmony, body percussion and a whole lot of soul.</p>
        <div className={s.heroActions}>
          <a href="mailto:abi@totallyvocally.com" className={s.primary}>Contact Abi</a>
          <a href="https://www.totallyvocally.com/" target="_blank" rel="noopener noreferrer" className={s.secondary}>Visit public website ↗</a>
        </div>
        <div className={s.soundwave} aria-hidden="true">
          {[28, 52, 80, 44, 68, 94, 58, 76, 36, 64, 88, 48].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
      </section>

      <section className={s.storyGrid}>
        <article className={s.story}>
          <p className={s.sectionLabel}>Who we are</p>
          <h2>Harmony you can feel</h2>
          <p>Every sound comes from the singers’ voices and bodies—huge harmonies, rhythmic grooves and performances built on warmth, energy and genuine connection.</p>
          <p>No folders, backing tracks or standing still. We learn by ear and perform with belief in the songs, natural movement and joyful faces.</p>
        </article>
        <aside className={s.highlight}>
          <span className={s.quoteMark}>“</span>
          <p>Hope, joy &amp; funky goodness—in totally acappella harmony.</p>
          <small>How do we do it? Totally Vocally.</small>
        </aside>
      </section>

      <section className={s.legacy}>
        <div><p className={s.sectionLabel}>Where our voices have taken us</p><h2>Nottingham to New York</h2></div>
        <div className={s.milestones}>
          <article><strong>Lincoln Center</strong><span>Shared the New York stage with stars from Pentatonix and the Pitch Perfect films.</span></article>
          <article><strong>Nottingham Playhouse</strong><span>Performed with Gareth Malone for a sold-out hometown audience.</span></article>
          <article><strong>Everywhere else</strong><span>From tunnels, tramlines and pubs to theatres, festivals and paddleboard championships.</span></article>
        </div>
      </section>

      <section className={s.detailsGrid}>
        <article className={s.detailsCard}>
          <div className={s.icon}><MapPinIcon /></div>
          <p className={s.sectionLabel}>Weekly rehearsals</p>
          <h2>Hockley, Nottingham</h2>
          <div className={s.schedule}>{REHEARSALS.map((session) => <div key={session.day}><strong>{session.day}</strong><span>{session.time}</span></div>)}</div>
          <small>Check the Calendar for current dates, changes and performances.</small>
        </article>
        <article className={`${s.detailsCard} ${s.director}`}>
          <div className={s.icon}><MusicIcon /></div>
          <p className={s.sectionLabel}>Musical director</p>
          <h2>Abi Moore</h2>
          <p>Choir director, workshop leader and one of the UK’s most prolific acappella arrangers, specialising in harmony pop and rock for singers who learn by ear.</p>
          <div className={s.linkRow}>
            <a href="mailto:abi@totallyvocally.com">abi@totallyvocally.com</a>
            <a href="https://www.acapellawithabi.com/" target="_blank" rel="noopener noreferrer">Acappella with Abi ↗</a>
          </div>
        </article>
      </section>

      <section className={s.connect}>
        <div className={s.connectIntro}><div className={s.icon}><MessageSquareIcon /></div><div><p className={s.sectionLabel}>Stay connected</p><h2>Follow the adventures</h2></div></div>
        <div className={s.socials}>{SOCIALS.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">{social.label}<span>↗</span></a>)}</div>
      </section>

      <footer className={s.footer}>
        <div><strong>Want to book the choir?</strong><span>From intimate backing vocals to the full epic choir.</span></div>
        <a href="mailto:abi@totallyvocally.com?subject=Booking%20Totally%20Vocally">Start a conversation →</a>
      </footer>
    </main>
  );
}
