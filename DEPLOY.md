# Deployment

ScrapeDesk punya dua proses yang harus di-deploy terpisah:

- Web (Next.js): Vercel, zero-config, push ke GitHub langsung deploy
- Worker (Playwright): VPS atau mesin lokal, TIDAK bisa di Vercel karena butuh Chromium dan proses long-running

## Web di Vercel

1. Import repo GitHub lo ke Vercel
2. Set environment variables di Project Settings (semua nilai dari .env.local):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - SUPABASE_SECRET_KEY
   - DATABASE_URL
   - NEXT_PUBLIC_APP_URL (domain Vercel lo, misal https://scrapedesk.vercel.app)
   - LLM_BASE_URL, LLM_API_KEY, LLM_MODEL (kalau pakai AI mode; arahkan ke endpoint yang bisa diakses publik)
   - DAILY_RUN_QUOTA (opsional, default 50)
3. Deploy. Vercel auto-detect Next.js, nggak perlu config tambahan

Catatan: worker nggak ikut ke-deploy ke Vercel. Pastikan worker jalan di VPS sebelum trigger run dari produksi.

## Worker di VPS

Butuh Ubuntu 22.04+, Node 20+, dan Chromium.

```bash
# Clone repo
git clone https://github.com/<username>/scrape-desk.git
cd scrape-desk

# Install dependencies
npm install

# Install Chromium buat Playwright, dengan system deps
npx playwright install --with-deps chromium

# Env buat worker, isi kredensial produksi
cp .env.local .env.worker

# Jalanin pakai PM2 biar auto-restart
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Worker butuh akses ke DATABASE_URL yang sama (pooler session mode). Kalau VPS lo IPv6-ready, direct connection juga bisa dan lebih cepat.

Monitoring:

```bash
pm2 status
pm2 logs scrapedesk-worker
pm2 restart scrapedesk-worker
```

## Catatan produksi

- Web di Vercel dan worker di VPS share satu database Supabase, komunikasi lewat pg-boss queue. Nggak ada koneksi langsung web ke worker
- Kalau worker mati, run nyangkut di status queued. Monitor pm2 atau pasang alerting
- Pooler Supabase free tier max 15 koneksi session mode: web pakai beberapa, worker pakai 2, enqueue pakai 1. Kalau nambah instance worker, naikin pool atau pindah ke transaction pooler
- LLM endpoint buat AI mode harus bisa diakses dari worker (VPS), bukan dari browser
