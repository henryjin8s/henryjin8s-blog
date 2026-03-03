module.exports = {
  apps: [{
    name: 'pi-dashboard',
    script: './server.js',
    cwd: '/home/henry/website/admin',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 8081,
      ADMIN_USER: 'henry',
      ADMIN_PASS: 'Dfhj1109!'
    },
    error_file: '/home/henry/logs/pi-dashboard-error.log',
    out_file: '/home/henry/logs/pi-dashboard-out.log',
    log_file: '/home/henry/logs/pi-dashboard-combined.log',
    time: true
  }]
};
