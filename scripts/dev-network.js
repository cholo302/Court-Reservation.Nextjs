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
  return null;
}

const ip = getLocalIP();
const port = process.env.PORT || 3000;

console.log('\n🚀 Starting Next.js Dev Server\n');
console.log(`📱 Local:   http://localhost:${port}`);
if (ip) {
  console.log(`🌐 Network: http://${ip}:${port}`);
}
console.log('-'.repeat(50) + '\n');

// Use 0.0.0.0 to listen on all interfaces (works on Windows, Mac, Linux)
const child = spawn('npx', ['next', 'dev', '--hostname', '0.0.0.0', '--port', String(port)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

child.on('error', (err) => {
  console.error('Error starting dev server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
