import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, or, ilike, like, desc, sql, count } from 'drizzle-orm';

import 'dotenv/config';
import { donors, emergencyRequests, users, otps } from '../db/schema.js';


// 1. Database Connection (Cached for performance)
let cachedDb = null;
const getDb = () => {
  if (cachedDb) return cachedDb;
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing! Please set it in Vercel Environment Variables.");
  }
  
  console.log("🔌 Initializing new Database connection...");
  const neonClient = neon(process.env.DATABASE_URL);
  cachedDb = drizzle(neonClient);
  return cachedDb;
};

// 2. Express App logic
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Health Check
app.get('/api/health', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in Vercel Environment Variables!");
    }
    const db = getDb();
    const result = await db.select().from(donors).limit(1);

    res.json({ 
      status: 'ok', 
      database: 'connected',
      version: 'v4.0.4',
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

app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    msg: "If you see this, Express is working correctly on Vercel!"
  });
});


// Blood Search
app.get('/api/search/blood', async (req, res) => {
  const { city, bloodGroup, bloodGroups } = req.query;
  try {
    const conditions = [
      or(eq(donors.type, 'Blood'), eq(donors.type, 'Both'))
    ];
    if (city) conditions.push(ilike(donors.city, `%${city}%`));
    
    // Support single or multiple blood groups
    if (bloodGroups) {
      const groups = bloodGroups.split(',').map(g => g.trim()).filter(g => g);
      if (groups.length > 0) {
        const groupConditions = groups.map(g => eq(donors.bloodgroup, g));
        conditions.push(or(...groupConditions));
      }
    } else if (bloodGroup && bloodGroup !== 'Any Blood Group') {
      conditions.push(eq(donors.bloodgroup, bloodGroup));
    }
    
    const db = getDb();
    const results = await db.select().from(donors).where(and(...conditions)).orderBy(desc(donors.timestamp));
    
    // Parse organs JSON for the response
    const parsedResults = results.map(row => ({
      ...row,
      organs: (() => { try { return JSON.parse(row.organs || '[]'); } catch (e) { return []; } })()
    }));

    res.json({ donors: parsedResults });
  } catch (error) {
    console.error("Blood Search Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Organ Search
app.get('/api/search/organs', async (req, res) => {
  const { city, organs } = req.query;
  try {
    const conditions = [
      or(eq(donors.type, 'Organ'), eq(donors.type, 'Both'))
    ];
    if (city) conditions.push(ilike(donors.city, `%${city}%`));
    
    if (organs) {
      const requestedOrgans = organs.split(',').map(o => o.trim()).filter(o => o);
      if (requestedOrgans.length > 0) {
        const organConditions = requestedOrgans.map(o => ilike(donors.organs, `%${o}%`));
        conditions.push(or(...organConditions));
      }
    }


    const db = getDb();
    const results = await db.select().from(donors).where(and(...conditions)).orderBy(desc(donors.timestamp));

    
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

    const db = getDb();
    console.log("🛢️ Database connection verified. Attempting insert...");
    
    let inserted;
    try {
      inserted = await db.insert(donors).values(data).returning();
    } catch (dbError) {
      console.error("❌ Database Insert Error:", dbError);
      return res.status(500).json({ 
        error: "Database Insert Failed", 
        details: dbError.message,
        code: dbError.code 
      });
    }

    console.log("✅ Database insert returned:", inserted.length, "rows");
    const newDonor = inserted[0];
    
    res.json({ 
      success: true, 
      donorId: newDonor ? newDonor.donorId : data.donorId 
    });

  } catch (error) {
    console.error("🏁 Registration Flow Crash:", error);
    res.status(500).json({ 
      error: "Registration Crashed", 
      message: error.message 
    });
  }
});


// Emergency Request
app.post('/api/donors/request', async (req, res) => {
  try {
    const body = req.body;
    const db = getDb();
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
    const db = getDb();
    const results = await db.select().from(donors).orderBy(desc(donors.timestamp));

    const parsed = results.map(row => ({
      ...row,
      organs: (() => { try { return JSON.parse(row.organs || '[]'); } catch (e) { return []; } })()
    }));
    res.json({ donors: parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log Donation (for Database Explorer)
app.post('/api/donors/donate', async (req, res) => {
  try {
    const { donorId, type } = req.body;
    const db = getDb();
    const donor = await db.select().from(donors).where(eq(donors.donorId, donorId)).limit(1);

    
    if (donor[0]) {
      let currentDetail = donor[0].donated_detail || '';
      const newItem = type === 'Blood' ? 'Blood Donation' : 'Organ Donation';
      const updatedDetail = currentDetail ? `${currentDetail}, ${newItem}` : newItem;

      await db.update(donors)
        .set({
          donated_count: (donor[0].donated_count || 0) + 1,
          donated_detail: updatedDetail
        })
        .where(eq(donors.donorId, donorId));
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Donor not found' });
    }
  } catch (error) {
    console.error("Donate Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Donor (for Database Explorer)
app.post('/api/donors/delete', async (req, res) => {
  try {
    const { donorId } = req.body;
    const db = getDb();
    await db.delete(donors).where(eq(donors.donorId, donorId));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Dashboard Analytics ---

app.get('/api/stats', async (req, res) => {
  try {
    const db = getDb();
    const totalResult = await db.select({ count: count() }).from(donors);

    const typeResults = await db.select({ 
      type: donors.type, 
      count: count() 
    }).from(donors).groupBy(donors.type);

    res.json({
      total_donors: Number(totalResult[0]?.count ?? 0),
      by_type: typeResults
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/blood-groups', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.select({

      bloodgroup: donors.bloodgroup,
      total: count(),
    }).from(donors).groupBy(donors.bloodgroup);

    res.json({
      blood_group_availability: result.map(r => ({
        blood_group: r.bloodgroup,
        donor_count: Number(r.total)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/donation-types', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.select({

      type: donors.type,
      total: count(),
    }).from(donors).groupBy(donors.type);

    res.json({
      donation_type_breakdown: result.map(r => ({
        donation_type: r.type,
        donor_count: Number(r.total)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/donors/recent', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const db = getDb();
    const results = await db.select().from(donors).orderBy(desc(donors.timestamp)).limit(limit);

    res.json({ donors: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/cities', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.select({

      city: donors.city,
      total: count(),
    }).from(donors).groupBy(donors.city).orderBy(sql`2 DESC`).limit(20);


    res.json({
      city_wise_distribution: result.map(r => ({
        city: r.city,
        donor_count: Number(r.total)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Password Reset (OTP) ---

// 1. Dispatch OTP
app.post('/api/auth-flow/dispatch-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const db = getDb();
    
    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (!user[0]) {
      // For security, don't reveal if user exists, but here we can be helpful
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Generate 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in database
    await db.insert(otps).values({
      email: email.toLowerCase().trim(),
      code: otp,
      expiresAt
    });

    console.log(`📧 OTP generated for ${email}: ${otp} (expires in 10m)`);

    // In a real app, send email here. For now, simulate success.
    res.json({ 
      success: true, 
      message: 'OTP dispatched successfully',
      simulated: true, // Tell frontend to show the code for testing
      otp: otp 
    });
  } catch (error) {
    console.error("OTP Dispatch Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Confirm OTP
app.post('/api/auth-flow/confirm-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const db = getDb();
    const result = await db.select()
      .from(otps)
      .where(and(
        eq(otps.email, email.toLowerCase().trim()),
        eq(otps.code, otp)
      ))
      .orderBy(desc(otps.createdAt))
      .limit(1);

    if (!result[0]) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    if (Date.now() > result[0].expiresAt) {
      return res.status(400).json({ error: 'Code has expired' });
    }

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error("OTP Confirm Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Reset Password
app.post('/api/auth-flow/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

    const db = getDb();
    
    // Verify OTP again to be safe
    const result = await db.select()
      .from(otps)
      .where(and(
        eq(otps.email, email.toLowerCase().trim()),
        eq(otps.code, otp)
      ))
      .orderBy(desc(otps.createdAt))
      .limit(1);

    if (!result[0] || Date.now() > result[0].expiresAt) {
      return res.status(400).json({ error: 'Session expired. Please request a new code.' });
    }

    // Update user password
    // Note: In real app, hash the password! 
    // Here we use the same verifyPassword fallback as in server.js
    await db.update(users)
      .set({ password: newPassword }) // Should be hashed in production
      .where(eq(users.email, email.toLowerCase().trim()));

    // Delete the OTP
    await db.delete(otps).where(eq(otps.email, email.toLowerCase().trim()));

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error("Password Reset Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for undefined /api routes

app.use((req, res) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.url 
  });
});

export default app;

