# ScrapeDesk

Scraping-as-a-service platform. Define target URL dan field ekstraksi (CSS selector), trigger run, dan terima data terstruktur yang bisa dilihat di dashboard, diexport CSV/JSON, atau ditarik lewat public API dengan API key.

Bukan scraping tool personal: ada multi-user, job management, run history, API akses, dan isolasi data per user lewat Row Level Security.

## Tech Stack

- Next.js 15 (App Router) + Tailwind v4 + TypeScript strict
- Supabase: Postgres, Auth, Realtime
- pg-boss: job queue yang hidup di dalam Postgres, tanpa Redis
- Playwright + cheerio: worker scraping sebagai proses Node standalone
- Deploy: web di Vercel, worker di VPS atau mesin lokal

## Arsitektur

```
Browser / API client
      |
Next.js (web + route handlers)
  |        \
Supabase   pg-boss queue (di Postgres)
(Auth, RLS,      |
 Realtime)   Worker (Playwright + cheerio)
                   |
              results -> Postgres -> Realtime -> dashboard
```

Alur run: user trigger run, row job_runs dibuat dengan status queued, job di-enqueue ke pg-boss, worker mengambil job, update status running, scraping halaman dengan Playwright, ekstrak field dengan cheerio, batch insert ke results, update status done. Dashboard subscribe ke perubahan job_runs via Supabase Realtime.

Worker memakai service role key secara sengaja karena bertindak atas nama sistem, bukan user. Semua akses user lain dijaga RLS dengan policy auth.uid() = user_id.

## Setup Lokal

1. Bikin project di Supabase, jalankan supabase/schema.sql di SQL Editor
2. Aktifkan realtime untuk tabel job_runs:
   ```sql
   alter publication supabase_realtime add table public.job_runs;
   ```
3. Matikan email confirmation di Authentication > Providers > Email (buat development)
4. Copy .env.example ke .env.local, isi kredensial:
   - NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dari API Keys
   - SUPABASE_SECRET_KEY (server only)
   - DATABASE_URL dari Connection Pooling session mode (port 5432). Direct connection IPv6-only buat project baru, lokal wajib pakai pooler
5. npm install && npx playwright install chromium
6. Dua terminal: npm run dev dan npm run worker

## Public API

Semua endpoint butuh header Authorization: Bearer sk_live_xxx. Key dibuat dari halaman API Keys, plaintext cuma ditampilkan sekali, disimpan sebagai sha256 hash.

- GET /api/v1/jobs
- POST /api/v1/jobs
- GET /api/v1/jobs/:id
- POST /api/v1/jobs/:id/run
- GET /api/v1/jobs/:id/results (tambah ?format=csv)

Dokumentasi lengkap ada di halaman /docs.

## Catatan Engineering

### pg-boss v10: queue harus dibuat eksplisit

Bug pertama yang ketemu saat e2e test: run nyangkut di status queued selamanya tanpa error. Penyebabnya, pg-boss v10 menjalankan INSERT ... SELECT dengan INNER JOIN ke tabel pgboss.queue, dan queue tidak lagi auto-create saat send. Queue yang belum ada bikin insert menghasilkan zero rows dan send() return null tanpa error, job hilang senyap.

Solusinya: createQueue dipanggil eksplisit sebelum send, dan enqueue melempar error kalau send return null supaya kegagalan nggak pernah senyap lagi.

### Supabase connection pooling

Project Supabase baru hanya bisa diakses via IPv6 pada direct connection. Development lokal di jaringan IPv4 harus memakai Supavisor pooler session mode (port 5432, user postgres.<project-ref>).

### Strategi ekstraksi MVP

Tiap selector field dikumpulkan sebagai kolom, baris disusun per index. Cocok untuk halaman listing di mana setiap field muncul urut dan sama banyak. Limitasi ini didokumentasikan dan akan ditingkatkan di V2 dengan container-based extraction.

## Roadmap V2

- Scheduling cron per job
- Proxy rotation per job
- Pagination crawling dan link following
- Webhook notifikasi saat run selesai
- Quota dan billing
- Swap engine ke Python Scrapling untuk target susah
