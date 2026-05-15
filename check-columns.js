import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function checkColumns() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'donors';
    `;
    console.log('🏛️ Columns in "donors" table:');
    result.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to check columns:', err);
    process.exit(1);
  }
}

checkColumns();
