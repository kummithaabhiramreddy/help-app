import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './db/schema.js';
import { eq, isNull, or } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function backfillUserIds() {
  console.log('🔄 Fetching existing users without a custom userid...');
  
  try {
    // Get all users ordered by id
    const existingUsers = await db.select().from(users).orderBy(users.id);
    
    let count = 0;
    
    for (const user of existingUsers) {
      if (!user.userid) {
        // Generate userid based on sequential primary key 'id'
        const customUserId = `HELP-${String(user.id).padStart(4, '0')}`;
        
        await db.update(users)
          .set({ userid: customUserId })
          .where(eq(users.id, user.id));
          
        console.log(`✅ Allocated ${customUserId} to user ${user.name} (id: ${user.id})`);
        count++;
      }
    }
    
    console.log(`\n🎉 Backfill complete! Updated ${count} users.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

backfillUserIds();
