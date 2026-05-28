// backfill-badge.js
// Recalculate badge_name for all existing donors based on current donated/received counts
import { db } from './db/client.js';
import { donors } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function backfill() {
  try {
    const donorsList = await db.select().from(donors);
    console.log(`Found ${donorsList.length} donors to backfill badge names.`);
    for (const donor of donorsList) {
      const donated = Number(donor.donated_count) || 0;
      const received = Number(donor.received_count) || 0;
      const score = (donated * 10) - (received * 2);
      const ratio = donated / (received + 1);
      const finalScore = Math.floor(score + (ratio * 5));
      let badgeName = 'BRONZE';
      if (finalScore <= 20) badgeName = 'BRONZE';
      else if (finalScore <= 50) badgeName = 'SILVER';
      else if (finalScore <= 100) badgeName = 'GOLD';
      else badgeName = 'DIAMOND';
      if (badgeName !== donor.badge_name) {
        await db.update(donors).set({ badge_name: badgeName }).where(eq(donors.donorId, donor.donorId));
        console.log(`Updated donor ${donor.donorId} badge to ${badgeName}`);
      }
    }
    console.log('Badge backfill completed.');
  } catch (err) {
    console.error('Error during badge backfill:', err);
  }
}

backfill();
