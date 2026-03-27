const path = require('path')
const fs = require('fs')

// Load .env file manually so PM2 passes vars to the app
function loadEnv(envPath) {
  const env = {}
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.substring(0, eqIndex).trim()
      let value = trimmed.substring(eqIndex + 1).trim()
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  } catch (e) {
    console.error('⚠️  Could not read .env file at', envPath)
  }
  return env
}

const envVars = loadEnv(path.join(__dirname, '.env'))

module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/root/Court-Reservation.Nextjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // Prevent crash-loop: stop restarting after 10 failures within 60s
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 5000,
      wait_ready: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ...envVars,
      },
      error_file: '/root/.pm2/logs/nextjs-app-error.log',
      out_file: '/root/.pm2/logs/nextjs-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
