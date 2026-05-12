import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Create connection pool
const connectionString = process.env.DATABASE_URL;

const pool = new Pool(connectionString ? {
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
} : {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: 'donor_registry',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Connection event handlers
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL Database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export for migrations
export { pool };
