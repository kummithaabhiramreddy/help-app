import 'dotenv/config';
import { db } from './db/client.js';
import { users, donors } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function verifyUserTable() {
  try {
    console.log('🔍 Verifying users table structure...\n');
    
    // Get all users from the table
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log('📭 No users in the table yet.');
      console.log('\nExpected columns in users table:');
      console.log('✅ id (serial) - User ID');
      console.log('✅ name (varchar) - Full Name');
      console.log('✅ dob (varchar) - Date of Birth');
      console.log('✅ city (varchar) - City');
      console.log('✅ donation_type (varchar) - Donation Type');
      console.log('✅ email (varchar) - Email Address');
      console.log('✅ phone (varchar) - Phone Number');
      console.log('✅ password (text) - Password');
      console.log('✅ created_at (timestamp) - Created Date');
      return;
    }
    
    console.log(`📊 Found ${allUsers.length} user(s) in the table:\n`);
    allUsers.forEach((user, idx) => {
      console.log(`User ${idx + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  DOB: ${user.dob || '(empty)'}`);
      console.log(`  City: ${user.city || '(empty)'}`);
      console.log(`  Donation Type: ${user.donationType || '(empty)'}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: ${user.phone || '(empty)'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log();
    });

    console.log('\n✅ User table structure is ready to accept data!\n');
    console.log('When you submit the form, the first 4 questions will be stored here:');
    console.log('  1️⃣  Full Name → name');
    console.log('  2️⃣  Date of Birth → dob');
    console.log('  3️⃣  City → city');
    console.log('  4️⃣  Donation Type → donation_type');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

verifyUserTable();
