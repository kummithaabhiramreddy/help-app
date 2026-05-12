// Global fetch used

async function test() {
  const donor = {
    donorId: 'TEST-' + Date.now(),
    name: 'Test Donor ' + new Date().toISOString(),
    dob: '1990-01-01',
    bloodgroup: 'O+',
    type: 'Both',
    organs: ['Heart', 'Kidneys'],
    city: 'TestCity',
    phone: '99' + Math.floor(Math.random()*100000000),
    email: 'kummithajahnavi7@gmail.com',
    registeredOn: new Date().toLocaleDateString(),
    timestamp: Date.now()
  };

  console.log('🚀 Testing registration...');
  const regRes = await fetch('http://localhost:3000/api/donors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(donor)
  });
  
  if (regRes.ok) {
    console.log('✅ Registration successful!');
    const data = await regRes.json();
    console.log('Response:', data);
    
    console.log('\n🔍 Verifying in Explorer API...');
    const exploreRes = await fetch('http://localhost:3000/api/donors');
    const exploreData = await exploreRes.json();
    
    const found = exploreData.donors.find(d => d.donorId === donor.donorId);
    if (found) {
      console.log('✅ Verified! Donor found in Explorer API.');
    } else {
      console.error('❌ FAILED: Donor NOT found in Explorer API.');
      console.log('Available donors:', exploreData.donors.length);
    }
    
    console.log('\n🔍 Verifying in Blood Search (O+ in TestCity)...');
    const p = new URLSearchParams();
    p.set('city', 'TestCity');
    p.set('bloodGroups', 'O+');
    const searchRes = await fetch('http://localhost:3000/api/search/blood?' + p.toString());
    const searchData = await searchRes.json();
    if (searchData.donors.find(d => d.donorId === donor.donorId)) {
      console.log('✅ Verified! Donor found in Blood Search.');
    } else {
      console.error('❌ FAILED: Donor NOT found in Blood Search.');
      console.log('Search params:', p.toString());
      console.log('Results found:', searchData.donors.length);
      console.log('Found IDs:', searchData.donors.map(d => d.donorId).join(', '));
    }
  } else {
    console.error('❌ Registration failed with status:', regRes.status);
    const err = await regRes.text();
    console.log('Error details:', err);
  }
}

test();
