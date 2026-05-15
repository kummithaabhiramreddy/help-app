import 'dotenv/config';
import dbRepo from './db/index.js';

async function test() {
  const record = {
    donorId: 'TEST-' + Date.now().toString(36),
    name: 'Manual Test',
    dob: '1990-01-01',
    bloodgroup: 'A+',
    type: 'Blood',
    organs: [],
    city: 'Bhimavaram',
    phone: '9999999999',
    email: 'manual@test.com',
    biometric: null,
    registeredOn: '15 May 2026',
    timestamp: Date.now(),
    donated_count: 1,
    donated_detail: 'Blood (A+)',
    received_count: 0,
    received_detail: 'None yet'
  };

  try {
    console.log('⏳ Attempting to save donor...');
    const result = await dbRepo.saveDonor(record);
    console.log('✅ Success! Donor saved with DB ID:', result.id);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to save donor:', err);
    process.exit(1);
  }
}

test();
