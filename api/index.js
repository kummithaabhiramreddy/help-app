import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dbRepo from '../db/index.js';
import { sendRegistrationEmail } from '../emailservice.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/* ── Password Security Helpers ── */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return password === storedHash;
  const [salt, key] = storedHash.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return key === hash;
}

// ── HEALTH CHECK ──
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const stats = await dbRepo.getStats();
    res.json({ status: 'ok', ...stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── AUTH: REGISTER ──
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const existing = await dbRepo.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = hashPassword(password);
    const result = await dbRepo.createUser({ name, email, phone, password: hashed });
    res.status(201).json({ success: true, userId: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── AUTH: LOGIN ──
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await dbRepo.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── DONORS: REGISTER ──
app.post(['/api/register', '/api/donors'], async (req, res) => {
  try {
    const body = req.body;
    const emailKey = (body.email || '').toLowerCase().trim();
    const phoneKey = (body.phone || body.contact || '').replace(/\D/g, '');

    // Duplicate check
    const donorsList = await dbRepo.getAllDonors();
    const dup = donorsList.find(d => 
      (d.email && d.email.toLowerCase().trim() === emailKey) || 
      (d.phone && d.phone.replace(/\D/g, '').slice(-10) === phoneKey.slice(-10))
    );

    if (dup) {
      const currentDonation = body.type === 'Blood' ? `Blood` : `Organ`;
      const newDetail = dup.donated_detail ? `${dup.donated_detail}, ${currentDonation}` : currentDonation;
      await dbRepo.updateDonor(dup.donorId, {
        donated_count: (dup.donated_count || 0) + 1,
        donated_detail: newDetail,
        timestamp: Date.now()
      });
      return res.json({ success: true, donorId: dup.donorId, updated: true });
    }

    const record = {
      donorId: `BHM-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: body.name,
      bloodgroup: body.bloodgroup,
      type: body.type,
      organs: Array.isArray(body.organs) ? body.organs : [],
      city: body.city,
      phone: phoneKey,
      email: emailKey,
      registeredOn: new Date().toLocaleDateString('en-IN'),
      timestamp: Date.now(),
      donated_count: 1,
      donated_detail: body.type
    };

    const result = await dbRepo.saveDonor(record);
    try {
      if (record.email) sendRegistrationEmail(record);
    } catch (e) {}

    res.status(201).json({ success: true, donorId: record.donorId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── SEARCH: BLOOD ──
app.get('/api/search/blood', async (req, res) => {
  try {
    const results = await dbRepo.searchBloodDonors(req.query);
    res.json({ donors: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── SEARCH: ORGANS ──
app.get('/api/search/organs', async (req, res) => {
  try {
    const results = await dbRepo.searchOrganDonors(req.query);
    res.json({ donors: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
