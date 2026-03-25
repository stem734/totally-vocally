import React from 'react';
import s from './InfoPage.module.css';

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width: '2.5em', height: '2.5em'}}>
    <path d="M9 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-5l7-5V2c0-1.1-.9-2-2-2s-2 .9-2 2v4l-3-2v3z"/>
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width: '2.5em', height: '2.5em'}}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width: '2.5em', height: '2.5em'}}>
    <path d="M17 10.5V7c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width: '2.5em', height: '2.5em'}}>
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm13 5H6v-2h13v2zm0-4H6V8h13v2z"/>
  </svg>
);

const CARDS = [
  {
    icon: <MusicIcon />,
    title: 'Choir Director',
    text: 'Abi Moore\nabi@totallyvocally.com\n\nVisit: acapellawithabi.com',
  },
  {
    icon: <MapIcon />,
    title: 'Rehearsal Location',
    text: 'Hockley, Nottingham\n\nMonday Evenings: 6:45 – 8:45pm\nTuesday Evenings: 7:00 – 9:00pm\nWednesday Evenings: 6:00 – 8:00pm',
  },
  {
    icon: <MapIcon />,
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
    icon: '£',
    title: 'Membership & Fees',
    text: '[Subscription / term fee details here]\n\nPayments by [method] to [details].',
  },
  {
    icon: <PhoneIcon />,
    title: 'Social Media',
    text: 'Follow us and share the love!\n\nFacebook: /totallyvocally\nInstagram: @totallyvocally\nYouTube: Totally Vocally Channel',
  },
  {
    icon: <ChatIcon />,
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
          <h2>Welcome to Totally Vocally!</h2>
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
        <div className={s.heroNotes} aria-hidden="true"></div>
      </div>

      <div className={s.grid}>
        {CARDS.map((card, i) => (
          <div key={i} className={s.card}>
            <div className={s.cardIcon}>
              {typeof card.icon === 'string' ? card.icon : card.icon}
            </div>
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
