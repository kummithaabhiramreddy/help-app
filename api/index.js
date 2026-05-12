import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { eq, and, or, like } from 'drizzle-orm';
import 'dotenv/config';

// 1. Database Connection (Self-contained)
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// 2. Schema Definitions (Self-contained)
const donors = pgTable('donors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'blood' or 'organ'
  bloodGroup: text('blood_group'),
  organType: text('organ_type'),
  city: text('city').notNull(),
  contact: text('contact').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Express App logic
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await db.select().from(donors).limit(1);
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Blood Search
app.get('/api/search/blood', async (req, res) => {
  const { city, bloodGroup } = req.query;
  try {
    const conditions = [eq(donors.type, 'blood')];
    if (city) conditions.push(like(donors.city, `%${city}%`));
    if (bloodGroup && bloodGroup !== 'Any Blood Group') conditions.push(eq(donors.bloodGroup, bloodGroup));
    
    const results = await db.select().from(donors).where(and(...conditions));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register Donor
app.post('/api/register', async (req, res) => {
  try {
    const [newDonor] = await db.insert(donors).values(req.body).returning();
    res.json(newDonor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
