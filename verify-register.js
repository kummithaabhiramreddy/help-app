import http from 'http';

const data = JSON.stringify({
  name: "Antigravity Verified Test",
  dob: "1990-01-01",
  bloodgroup: "O+",
  type: "Blood",
  city: "Bhimavaram",
  phone: "8888888888",
  email: "verify@test.com",
  timestamp: Date.now(),
  donorId: "VERIFIED-" + Date.now()
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
