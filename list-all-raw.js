import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function listAll() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const result = await sql`SELECT donorid, name, timestamp FROM donors ORDER BY timestamp DESC`;
    console.log(`📋 Total in DB: ${result.length}`);
    result.forEach(d => console.log(`- [${d.donorid}] ${d.name} (${d.timestamp})`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
}

listAll();
