import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, or, like } from 'drizzle-orm';
import 'dotenv/config';
import { donors } from '../db/schema.js';

// 1. Database Connection (Optimized for Vercel)
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// 2. Express App logic
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in Vercel Environment Variables!");
    }
    await db.select().from(donors).limit(1);
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      hint: "Check Vercel Environment Variables" 
    });
  }
});

// Blood Search
app.get('/api/search/blood', async (req, res) => {
  const { city, bloodGroup } = req.query;
  try {
    const conditions = [eq(donors.type, 'blood')];
    if (city) conditions.push(like(donors.city, `%${city}%`));
    
    // Note: Schema uses 'bloodgroup' (lowercase g)
    if (bloodGroup && bloodGroup !== 'Any Blood Group') {
      conditions.push(eq(donors.bloodgroup, bloodGroup));
    }
    
    const results = await db.select().from(donors).where(and(...conditions));
    res.json(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Register Donor
app.post('/api/register', async (req, res) => {
  try {
    // Ensure the incoming data matches the schema (contact -> phone, bloodGroup -> bloodgroup)
    const data = { ...req.body };
    if (data.contact) {
      data.phone = data.contact;
      delete data.contact;
    }
    if (data.bloodGroup) {
      data.bloodgroup = data.bloodGroup;
      delete data.bloodGroup;
    }

    const [newDonor] = await db.insert(donors).values(data).returning();
    res.json(newDonor);
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;

