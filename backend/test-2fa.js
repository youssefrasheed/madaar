// Quick 2FA verification automated test
const http = require('http');
const db = require('./src/db/database');

async function test2FA() {
  console.log('Testing 2FA Authentication Flow...');

  // 1. Test Login Request
  const postData = JSON.stringify({ email: 'demo@socialhub.com', password: 'password123' });
  const loginRes = await makeRequest('/api/auth/login', postData);
  console.log('1. Login response:', loginRes.body);

  if (!loginRes.body.requireOtp || !loginRes.body.tempToken) {
    throw new Error('Failed: Expected requireOtp and tempToken');
  }

  // 2. Fetch code from database
  const otpRecord = db.prepare(`SELECT * FROM verification_codes WHERE user_id = 1 ORDER BY id DESC LIMIT 1`).get();
  console.log('2. Retrieved OTP from database:', otpRecord.code);

  // 3. Test Invalid OTP
  const badVerify = await makeRequest('/api/auth/verify-otp', JSON.stringify({
    tempToken: loginRes.body.tempToken,
    otp: '000000'
  }));
  console.log('3. Bad OTP test (should fail):', badVerify.status, badVerify.body.message);

  // 4. Test Valid OTP
  const goodVerify = await makeRequest('/api/auth/verify-otp', JSON.stringify({
    tempToken: loginRes.body.tempToken,
    otp: otpRecord.code
  }));
  console.log('4. Good OTP test (should succeed):', goodVerify.status, goodVerify.body.message);

  if (goodVerify.body.token && goodVerify.body.user) {
    console.log('✅ 2FA End-to-End Test PASSED! Issued User:', goodVerify.body.user.email);
  } else {
    throw new Error('2FA verification failed');
  }
}

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Start temporary server for test
const app = require('./src/index');
setTimeout(async () => {
  try {
    await test2FA();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}, 1500);
