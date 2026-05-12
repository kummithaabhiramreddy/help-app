import { pool } from './db/client.js';

async function main() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);
        console.log("✅ Users table ensured!");
    } catch (err) {
        console.error("❌ Error setting up table:", err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
