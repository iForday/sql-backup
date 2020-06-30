module.exports = {
  apps : [{
    name: 'sql-backup',
    script: 'app.js',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    ignore_watch: [
      "node_modules"
    ],
  }]
};
