import React from 'react';
import s from './InfoPage.module.css';

const CARDS = [
  {
    icon: '🎤',
    title: 'Choir Director',
    text: 'Abi Moore\nabi@totallyvocally.com\n\nVisit: acapellawithabi.com',
  },
  {
    icon: '📍',
    title: 'Rehearsal Location',
    text: 'Hockley, Nottingham\n\nMonday Evenings: 6:45 – 8:45pm\nTuesday Evenings: 7:00 – 9:00pm\nWednesday Evenings: 6:00 – 8:00pm',
  },
  {
    icon: '📋',
    title: 'Choir Guidelines',
    list: [
      'Please arrive on time and warmed up',
      'Bring your music for rehearsals',
      'Mark attendance in advance via the Events tab',
      'Notify Abi of any planned absences',
      'Phones on silent during rehearsals',
    ],
  },
  {
    icon: '💰',
    title: 'Membership & Fees',
    text: '[Subscription / term fee details here]\n\nPayments by [method] to [details].',
  },
  {
    icon: '📱',
    title: 'Social Media',
    text: 'Follow us and share the love!\n\nFacebook: /totallyvocally\nInstagram: @totallyvocally\nYouTube: Totally Vocally Channel',
  },
  {
    icon: '📢',
    title: 'Group Chat',
    text: 'Join our members WhatsApp group for quick updates and announcements.\n\nGroup link: [Insert WhatsApp link here]',
  },
];

export default function InfoPage() {
  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Choir <span>Information</span></h1>
      </div>

      <div className={s.hero}>
        <div className={s.heroText}>
          <h2>Welcome to Totally Vocally! 🎵</h2>
          <p>
            An awesome, independent acappella choir of Nottingham-based singers who tear up every
            stage with joyful harmonies &amp; percussive rhythms. Led by <strong>Abi Moore</strong>,
            we bring pop, rock, funk &amp; gospel anthems with groove, warmth &amp; soul.
          </p>
          <p>
            This portal is your central hub — rehearsal schedules, events, shared files, and
            everything you need to stay connected with your fellow singers.
          </p>
        </div>
        <div className={s.heroNotes} aria-hidden="true">♪ ♫ ♩ ♬</div>
      </div>

      <div className={s.grid}>
        {CARDS.map((card, i) => (
          <div key={i} className={s.card}>
            <div className={s.cardIcon}>{card.icon}</div>
            <h3 className={s.cardTitle}>{card.title}</h3>
            {card.list ? (
              <ul className={s.list}>
                {card.list.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            ) : (
              <p className={s.cardText}>{card.text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
