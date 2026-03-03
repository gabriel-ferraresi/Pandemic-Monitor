module.exports = {
    apps: [
        {
            name: 'global-health-monitor',
            script: 'npm',
            args: 'start',
            instances: 1, // Single-thread for SQLite and Data Integrity
            exec_mode: 'fork', // Resolves 502 PM2 Crash with 'tsx' and 'npm start'
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            },
            // Logs optimization
            merge_logs: true,
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            time: true
        }
    ]
};
