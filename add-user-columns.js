import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db/client.js';

async function addUserColumns() {
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
    
    // Check which columns need to be added
    const columnsToAdd = [];
    if (!existingColumns.includes('dob')) columnsToAdd.push('dob');
    if (!existingColumns.includes('city')) columnsToAdd.push('city');
    if (!existingColumns.includes('donation_type')) columnsToAdd.push('donation_type');
    
    if (columnsToAdd.length === 0) {
      console.log('✅ All columns already exist!');
      return;
    }
    
    console.log(`\n📝 Adding missing columns: ${columnsToAdd.join(', ')}`);
    
    // Add dob column if missing
    if (columnsToAdd.includes('dob')) {
      console.log('Adding dob column...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN dob varchar(50)`);
      console.log('✅ dob column added');
    }
    
    // Add city column if missing
    if (columnsToAdd.includes('city')) {
      console.log('Adding city column...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN city varchar(100)`);
      console.log('✅ city column added');
    }
    
    // Add donation_type column if missing
    if (columnsToAdd.includes('donation_type')) {
      console.log('Adding donation_type column...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN donation_type varchar(50)`);
      console.log('✅ donation_type column added');
    }
    
    console.log('\n✅ All columns have been successfully added to users table!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addUserColumns();
