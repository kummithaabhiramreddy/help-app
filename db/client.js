import 'dotenv/config';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';

// Create Drizzle instance based on environment
let dbInstance;

if (process.env.DATABASE_URL) {
  // Use Neon HTTP for Vercel/Production
  const client = neon(process.env.DATABASE_URL);
  dbInstance = drizzleNeon(client, { schema });
  console.log('✅ Initialized Neon Serverless Connection');
} else {
  // Use standard Pool for Local Development
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME || 'donor_registry',
  });
  dbInstance = drizzlePg(pool, { schema });
  console.log('✅ Initialized Local Pool Connection');
}

export const db = dbInstance;
