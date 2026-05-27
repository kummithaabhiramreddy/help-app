import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function listAll() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const result = await sql`SELECT donorid, name, email, phone FROM donors`;
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listAll();
