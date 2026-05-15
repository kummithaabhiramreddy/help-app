import 'dotenv/config';
import { db } from './db/client.js';
import { donors } from './db/schema.js';
import { desc } from 'drizzle-orm';

async function list() {
  try {
    const result = await db.select().from(donors).orderBy(desc(donors.timestamp)).limit(20);
    console.log('📋 Latest 20 donors in Neon:');
    result.forEach(d => {
      console.log(`- [${d.donorId}] ${d.name} (${d.bloodgroup}) in ${d.city} on ${d.registeredOn}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to list donors:', err);
    process.exit(1);
  }
}

list();
