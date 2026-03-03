module.exports = {
    apps: [
        {
            name: 'global-health-monitor',
            script: 'npm',
            args: 'start',
            instances: 'max', // Scale to all cpu cores
            exec_mode: 'cluster',
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
