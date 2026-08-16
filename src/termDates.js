import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const VENUE = 'Clumber Hall, High Cross Street, Nottingham, NG1 3AZ';

const GROUPS = [
  {
    day: 'Monday', time: '18:45',
    dates: ['01-05','01-12','01-19','01-26','02-02','02-16','02-23','03-02','03-09','03-16','03-30','04-06','04-13','04-20','04-27','05-11','05-18','05-25','06-01','06-08','06-29','07-06','07-13','07-20','07-27','09-07','09-14','09-21','09-28','10-05','10-19','10-26','11-02','11-09','11-16','11-30','12-07','12-14'],
  },
  {
    day: 'Tuesday', time: '19:00',
    dates: ['01-06','01-13','01-20','01-27','02-03','02-17','02-24','03-03','03-10','03-17','03-31','04-07','04-14','04-21','04-28','05-12','05-19','05-26','06-02','06-09','06-30','07-07','07-14','07-21','07-28','09-08','09-15','09-22','09-29','10-06','10-20','10-27','11-03','11-10','11-17','12-01','12-08','12-15'],
  },
  {
    day: 'Wednesday', time: '18:00',
    dates: ['01-07','01-14','01-21','01-28','02-04','02-18','02-25','03-04','03-11','03-18','04-01','04-08','04-15','04-22','04-29','05-13','05-20','05-27','06-03','06-10','07-01','07-08','07-15','07-22','07-29','09-09','09-16','09-23','09-30','10-07','10-21','10-28','11-04','11-11','11-18','12-02','12-09','12-16'],
  },
];

export const TERM_DATE_COUNT = GROUPS.reduce((total, group) => total + group.dates.length, 0);

export async function importTermDates2026(userId) {
  const events = GROUPS.flatMap((group) => group.dates.map((date) => ({ group, date: `2026-${date}` })));
  const batches = [];
  for (let start = 0; start < events.length; start += 450) {
    const batch = writeBatch(db);
    events.slice(start, start + 450).forEach(({ group, date }) => {
      const eventId = `rehearsal-${date}-${group.day.toLowerCase()}`;
      batch.set(doc(db, 'events', eventId), {
        title: `${group.day} Rehearsal`, type: 'rehearsal', date, time: group.time,
        location: VENUE, desc: `${group.day} choir weekly rehearsal`, groupDay: group.day, createdBy: userId,
        source: 'term-dates-2026', updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    batches.push(batch.commit());
  }
  await Promise.all(batches);
  return events.length;
}
