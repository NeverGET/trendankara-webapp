module.exports = {
  apps: [
    {
      name: 'radio-cms',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/radio-cms',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      error_file: '/var/log/radio-cms/pm2-error.log',
      out_file: '/var/log/radio-cms/pm2-out.log',
      log_file: '/var/log/radio-cms/pm2-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Auto-restart on file changes (disabled in production)
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '.git',
        'public/uploads'
      ],

      // Health check
      min_uptime: '10s',
      max_restarts: 10,

      // Environment variables from file
      env_file: '.env.production'
    }
  ],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'user',
      host: 'trendankara.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/radio-cms.git',
      path: '/var/www/radio-cms',
      'pre-deploy-local': 'npm run build',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/radio-cms'
    },
    staging: {
      user: 'user',
      host: 'staging.trendankara.com',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/radio-cms.git',
      path: '/var/www/radio-cms-staging',
      'pre-deploy-local': 'npm run build',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'mkdir -p /var/www/radio-cms-staging'
    }
  }
};