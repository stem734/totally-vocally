import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const SONGS = [
  { title: 'Place Your Hands' },
  { title: 'When You\'re Gone' },
  { title: 'Will You Still Love Me Tomorrow?' },
  { title: 'Time After Time' },
  { title: 'All My Love' },
  { title: 'Teenage Kicks' },
  { title: 'Livin on a prayer' },
  { title: 'Maybe It\'s Time' },
  { title: 'Sit Down' },
  { title: 'I Will Follow Him' },
  { title: 'Never Forget' },
  { title: 'Tender' },
  { title: 'Royals - You\'re The Voice' },
  { title: 'Kiss From a Rose' },
  { title: 'Fields Of Gold' },
  { title: 'Hold Back The River' },
  { title: 'The Chain' },
  { title: 'Long Train Runnin\'' },
  { title: 'It\'s Gonna Rain' },
  { title: 'All these things that i have done' },
  { title: 'Still Haven\'t Found What I\'m Looking For' },
  { title: 'Shooting Stars' },
  { title: 'California Dreamin\'' },
  { title: 'Shine On Me' },
  { title: 'CHANDELIER' },
];

export async function seedSongs() {
  try {
    const songsRef = collection(db, 'songs');
    const existing = await getDocs(songsRef);

    if (existing.size > 0) {
      console.log('Songs already exist. Skipping seed.');
      return existing.size;
    }

    let count = 0;
    for (const song of SONGS) {
      await addDoc(songsRef, {
        ...song,
        createdAt: new Date().toISOString(),
      });
      count++;
    }

    console.log(`Seeded ${count} songs to Firestore`);
    return count;
  } catch (err) {
    console.error('Failed to seed songs:', err);
    throw err;
  }
}
