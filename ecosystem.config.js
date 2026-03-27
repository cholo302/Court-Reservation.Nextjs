module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      script: 'server.js',
      args: 'start -p 3000',
      cwd: '/root/Court-Reservation.Nextjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 5000,
      wait_ready: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/root/.pm2/logs/nextjs-app-error.log',
      out_file: '/root/.pm2/logs/nextjs-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
