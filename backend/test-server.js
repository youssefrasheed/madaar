// Quick server test — run with: node test-server.js
const { spawn } = require('child_process');
const http = require('http');

console.log('Starting server...');
const server = spawn('node', ['src/index.js'], { cwd: __dirname });

let output = '';
server.stdout.on('data', d => { process.stdout.write(d); output += d; });
server.stderr.on('data', d => { process.stderr.write(d); });

// After 3 seconds, hit the health endpoint
setTimeout(() => {
  http.get('http://localhost:3001/api/health', res => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('\n✅ Health check passed:', body);
      server.kill();
      process.exit(0);
    });
  }).on('error', err => {
    console.error('\n❌ Health check failed:', err.message);
    server.kill();
    process.exit(1);
  });
}, 3000);
