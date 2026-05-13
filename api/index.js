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
    const result = await db.select().from(donors).limit(1);
    res.json({ 
      status: 'ok', 
      database: 'connected',
      count: result.length,
      env: process.env.VERCEL ? 'production' : 'development'
    });
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
    const conditions = [eq(donors.type, 'Blood')]; // Case sensitive match for 'Blood'
    if (city) conditions.push(like(donors.city, `%${city}%`));
    
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
    const body = req.body;
    console.log("📥 Incoming Registration:", body.donorId);

    // Map frontend fields to DB schema fields
    // Ensure organs is stored as a JSON stringified array for compatibility with db/index.js
    let organsData = body.organ_type || '[]';
    if (typeof organsData === 'string' && !organsData.startsWith('[')) {
      // If it's a comma-separated string, convert to array first
      organsData = JSON.stringify(organsData.split(',').map(s => s.trim()).filter(s => s));
    } else if (Array.isArray(organsData)) {
      organsData = JSON.stringify(organsData);
    }

    const data = {
      donorId: body.donorId,
      name: body.name,
      dob: body.dob,
      bloodgroup: body.bloodgroup,
      type: body.type,
      organs: organsData, // Now a JSON stringified array
      city: body.city,
      phone: body.contact,     // Map 'contact' from frontend to 'phone' in DB
      email: body.email,
      biometric: body.biometric,
      registeredOn: body.registeredOn,
      timestamp: body.timestamp || Date.now()
    };

    const [newDonor] = await db.insert(donors).values(data).returning();
    res.json({ success: true, donorId: newDonor.donorId });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
});



export default app;

