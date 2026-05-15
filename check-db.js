import 'dotenv/config';
import { db } from './db/client.js';
import { donors } from './db/schema.js';
import { count } from 'drizzle-orm';

async function check() {
  try {
    const result = await db.select({ total: count() }).from(donors);
    console.log('📊 Current total donors in Neon:', result[0].total);
    process.exit(0);
  } catch (err) {
    console.error('❌ Check failed:', err);
    process.exit(1);
  }
}

check();
