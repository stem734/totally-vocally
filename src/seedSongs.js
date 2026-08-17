import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const SONGS = [
  { title: 'Place Your Hands', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'When You\'re Gone', choirs: ['Monday', 'Wednesday'] },
  { title: 'Will You Still Love Me Tomorrow?', choirs: ['Monday', 'Tuesday'] },
  { title: 'Time After Time', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'All My Love', choirs: ['Monday', 'Wednesday'] },
  { title: 'Teenage Kicks', choirs: ['Monday', 'Tuesday'] },
  { title: 'Livin on a prayer', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'Maybe It\'s Time', choirs: ['Monday', 'Wednesday'] },
  { title: 'Sit Down', choirs: ['Monday', 'Tuesday'] },
  { title: 'I Will Follow Him', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'Never Forget', choirs: ['Monday', 'Wednesday'] },
  { title: 'Tender', choirs: ['Monday', 'Tuesday'] },
  { title: 'Royals - You\'re The Voice', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'Kiss From a Rose', choirs: ['Monday', 'Wednesday'] },
  { title: 'Fields Of Gold', choirs: ['Monday', 'Tuesday'] },
  { title: 'Hold Back The River', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'The Chain', choirs: ['Monday', 'Wednesday'] },
  { title: 'Long Train Runnin\'', choirs: ['Monday', 'Tuesday'] },
  { title: 'It\'s Gonna Rain', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'All these things that i have done', choirs: ['Monday', 'Wednesday'] },
  { title: 'Still Haven\'t Found What I\'m Looking For', choirs: ['Monday', 'Tuesday'] },
  { title: 'Shooting Stars', choirs: ['Tuesday', 'Wednesday'] },
  { title: 'California Dreamin\'', choirs: ['Monday', 'Wednesday'] },
  { title: 'Shine On Me', choirs: ['Monday', 'Tuesday'] },
  { title: 'CHANDELIER', choirs: ['Tuesday', 'Wednesday'] },
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
        url: '',
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
