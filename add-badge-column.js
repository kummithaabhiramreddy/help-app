import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("Adding badge_name column to donors table...");
    await sql`ALTER TABLE donors ADD COLUMN IF NOT EXISTS badge_name VARCHAR(50) DEFAULT 'BRONZE'`;
    console.log("✅ Column added successfully.");
  } catch (error) {
    console.error("❌ Error adding column:", error);
  }
}

main();
