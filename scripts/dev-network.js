const { spawn } = require('child_process');
const os = require('os');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
const port = process.env.PORT || 3000;

console.log('\n🚀 Starting Next.js Dev Server\n');
console.log(`📱 Local:   http://localhost:${port}`);
console.log(`🌐 Network: http://${ip}:${port}\n`);
console.log('-'.repeat(50) + '\n');

// Spawn next dev with the local IP
const child = spawn('next', ['dev', '--hostname', ip, '--port', port], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Error starting dev server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
