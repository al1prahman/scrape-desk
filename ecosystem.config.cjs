// PM2 config buat worker di VPS. Worker HARUS jalan terpisah dari web,
// Vercel cuma buat Next.js app.
//
// Setup di VPS:
//   npm install -g pm2
//   npm install
//   npx playwright install --with-deps chromium
//   cp .env.local .env.worker   (isi kredensial produksi)
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "scrapedesk-worker",
      script: "worker/index.ts",
      interpreter: "node_modules/.bin/tsx",
      interpreter_args: "--env-file=.env.worker",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
