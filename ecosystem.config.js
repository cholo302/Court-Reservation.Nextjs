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
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // PM2 will load the .env file in the project root automatically.
      // Make sure /root/Court-Reservation.Nextjs/.env exists on the server
      // with all required variables (see .env.example).
      error_file: '/root/.pm2/logs/nextjs-app-error.log',
      out_file: '/root/.pm2/logs/nextjs-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
