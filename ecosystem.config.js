// Load .env file to pass env vars to PM2-managed process
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envVars = {
    NODE_ENV: 'production',
    PORT: 3000,
  }
  const envPath = path.join(__dirname, '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.substring(0, eqIndex).trim()
      let value = trimmed.substring(eqIndex + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      envVars[key] = value
    }
  }
  return envVars
}

module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      script: 'server.js',
      args: 'start -p 3000',
      cwd: '/root/Court-Reservation.Nextjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 5000,
      wait_ready: false,
      env: loadEnvFile(),
      error_file: '/root/.pm2/logs/nextjs-app-error.log',
      out_file: '/root/.pm2/logs/nextjs-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
