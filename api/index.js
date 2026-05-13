import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, or, like } from 'drizzle-orm';
import 'dotenv/config';
import { donors, emergencyRequests } from '../db/schema.js';
import { desc } from 'drizzle-orm';

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
    // Match donors who are 'Blood' or 'Both' type
    const conditions = [
      or(eq(donors.type, 'Blood'), eq(donors.type, 'Both'))
    ];
    if (city) conditions.push(like(donors.city, `%${city}%`));
    
    if (bloodGroup && bloodGroup !== 'Any Blood Group') {
      conditions.push(eq(donors.bloodgroup, bloodGroup));
    }
    
    const results = await db.select().from(donors).where(and(...conditions)).orderBy(desc(donors.timestamp));
    res.json(results);
  } catch (error) {
    console.error("Blood Search Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Organ Search
app.get('/api/search/organs', async (req, res) => {
  const { city, organs } = req.query;
  try {
    // Match donors who are 'Organ' or 'Both' type
    const conditions = [
      or(eq(donors.type, 'Organ'), eq(donors.type, 'Both'))
    ];
    if (city) conditions.push(like(donors.city, `%${city}%`));
    
    if (organs) {
      const requestedOrgans = organs.split(',').map(o => o.trim()).filter(o => o);
      if (requestedOrgans.length > 0) {
        const organConditions = requestedOrgans.map(o => like(donors.organs, `%${o}%`));
        conditions.push(or(...organConditions));
      }
    }

    const results = await db.select().from(donors).where(and(...conditions)).orderBy(desc(donors.timestamp));
    
    // Parse organs JSON for the response
    const parsedResults = results.map(row => ({
      ...row,
      organs: (() => { try { return JSON.parse(row.organs || '[]'); } catch (e) { return []; } })()
    }));

    res.json({ donors: parsedResults });
  } catch (error) {
    console.error("Organ Search Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Register Donor
app.post('/api/register', async (req, res) => {
  try {
    const body = req.body;
    console.log("📥 Incoming Registration:", body.donorId);

    // Map frontend fields to DB schema fields
    let organsData = body.organ_type || '[]';
    if (typeof organsData === 'string' && !organsData.startsWith('[')) {
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
      organs: organsData,
      city: body.city,
      phone: body.contact,
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

// Emergency Request
app.post('/api/donors/request', async (req, res) => {
  try {
    const body = req.body;
    await db.insert(emergencyRequests).values({
      donorId: body.donorId,
      requesterName: body.requesterName,
      requestType: body.requestType,
      bloodGroup: body.bloodGroup || null,
      organType: body.organType || null,
      details: body.details || '',
      timestamp: Date.now()
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Request Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// List All Donors (for Database View)
app.get('/api/donors', async (req, res) => {
  try {
    const results = await db.select().from(donors).orderBy(desc(donors.timestamp));
    res.json({ donors: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;


