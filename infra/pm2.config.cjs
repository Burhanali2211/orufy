module.exports = {
  apps: [
    {
      name: 'saas-api',
      script: 'apps/api/src/index.ts',
      cwd: '/var/www/saas',
      interpreter: '/root/.bun/bin/bun',
      interpreter_args: 'run',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      env_file: '/var/www/saas/.env',
      env: {
        NODE_ENV: 'production',
      },
      out_file: '/var/log/saas/api-out.log',
      error_file: '/var/log/saas/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
