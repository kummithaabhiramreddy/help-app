import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db/client.js';

async function addUserIdColumn() {
  try {
    console.log('🔍 Checking existing columns in users table...');
    
    // Get existing columns
    const result = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    const existingColumns = result.rows.map(r => r.column_name);
    console.log('Existing columns:', existingColumns);
    
    if (existingColumns.includes('userid')) {
      console.log('✅ userid column already exists!');
      process.exit(0);
    }
    
    console.log('\n📝 Adding missing userid column...');
    await db.execute(sql`ALTER TABLE users ADD COLUMN userid varchar(100)`);
    console.log('✅ userid column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    process.exit(1);
  }
}

addUserIdColumn();
