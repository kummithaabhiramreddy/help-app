import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { db } from '../db/client.js';
import { donors, emergencyCare } from '../db/schema.js';
import { eq, and, or, like } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import 'dotenv/config';

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
    let query = db.select().from(donors);
    const conditions = [eq(donors.type, 'blood')];
    
    if (city) conditions.push(like(donors.city, `%${city}%`));
    if (bloodGroup && bloodGroup !== 'Any Blood Group') conditions.push(eq(donors.bloodGroup, bloodGroup));
    
    const results = await query.where(and(...conditions));
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
