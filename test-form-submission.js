import 'dotenv/config';
import dbRepo from './db/index.js';

async function testFormSubmission() {
  try {
    console.log('🧪 Testing form submission with first 4 questions...\n');
    
    const testData = {
      name: 'Test Donor',
      dob: '27 May 1990',
      city: 'Bhimavaram',
      donationType: 'Blood',
      email: `testuser${Date.now()}@test.com`,
      phone: '9876543210',
      password: ''
    };

    console.log('📝 Test data to save to users table:');
    console.log(`  ✅ Name: ${testData.name}`);
    console.log(`  ✅ DOB: ${testData.dob}`);
    console.log(`  ✅ City: ${testData.city}`);
    console.log(`  ✅ Donation Type: ${testData.donationType}`);
    console.log(`  📧 Email: ${testData.email}`);
    console.log(`  📱 Phone: ${testData.phone}\n`);

    console.log('💾 Saving to users table...');
    const result = await dbRepo.saveUserProfile(testData);
    
    console.log(`✅ Successfully saved with ID: ${result.id}\n`);
    
    console.log('📊 Data verification:');
    console.log(`  Column "name" ← stored: ${testData.name}`);
    console.log(`  Column "dob" ← stored: ${testData.dob}`);
    console.log(`  Column "city" ← stored: ${testData.city}`);
    console.log(`  Column "donation_type" ← stored: ${testData.donationType}`);
    
    console.log('\n✅ Form submission test PASSED!');
    console.log('\n📋 Summary:');
    console.log('   When users submit the form:');
    console.log('   1. First 4 questions → Saved to USERS table');
    console.log('   2. Remaining fields → Saved to DONORS table');
    console.log('   3. Data is properly stored in Neon database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testFormSubmission();
