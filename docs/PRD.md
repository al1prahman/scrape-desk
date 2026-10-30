# ScrapeDesk - Product Requirements Document

Versi: 1.0
Status: Draft, menunggu persetujuan
Tanggal: 29 Oktober 2026

---

## 1. Ringkasan Produk

ScrapeDesk adalah platform scraping-as-a-service. User mendaftarkan target URL beserta konfigurasi ekstraksi field (CSS selector), memicu eksekusi, dan menerima data terstruktur yang bisa dilihat di dashboard, diexport CSV/JSON, atau ditarik lewat API publik dengan API key.

Posisi produk: bukan scraping tool personal, tapi platform. Bedanya ada multi-user, job management, history, API akses, dan isolasi data per user.

## 2. Tujuan

- Portofolio fullstack yang menunjukkan kedalaman engineering, bukan tutorial clone
- Produk yang benar-benar bisa dipakai end-to-end: dari landing page sampai API publik
- Arsitektur yang bersih dan bisa diceritakan sebagai case study saat interview

## 3. Target User dan Use Case

Primary: developer atau data analyst yang butuh data terstruktur dari web secara berkala.
Use case inti:
- Monitoring harga kompetitor
- Mengumpulkan listing dari direktori atau marketplace
- Ekstraksi data dari halaman publik untuk riset

## 4. Ruang Lingkup

### MVP (dibangun sekarang)
1. Auth email/password via Supabase
2. Job CRUD: nama, target URL, konfigurasi field ekstraksi
3. Manual run: trigger eksekusi, lihat status realtime
4. Worker scraping: Playwright + cheerio, hasil tersimpan per run
5. Results viewer: tabel, JSON view, export CSV dan JSON
6. Run history dan retry
7. API key: create, revoke, akses API publik
8. Dashboard: statistik usage, job list, status
9. Landing page publik dan halaman docs dengan contoh curl

### V2 (tidak dibangun sekarang, didokumentasikan saja)
- Scheduling cron per job
- Proxy rotation per job
- Pagination crawling dan link following
- Webhook notifikasi saat run selesai
- Quota dan billing
- Tim multi-user
- Swap engine ke Python Scrapling untuk target susah
- Penyimpanan raw HTML dan screenshot sebagai artifact

## 5. Fitur Detail

### 5.1 Auth
- Register dengan email dan password
- Login, logout, session persistence via cookie
- Proteksi route dashboard via middleware
- Setiap user hanya bisa akses data sendiri (RLS di level database)

### 5.2 Job Management
- Buat job: nama, target URL, daftar field (nama field + CSS selector)
- Validasi URL dan minimal satu field
- Edit dan hapus job
- Konfigurasi disimpan sebagai jsonb, contoh:
  { "fields": [{ "name": "title", "selector": "h2.title" }], "limit": 100 }

### 5.3 Run Engine
- Trigger manual dari dashboard atau API
- Status lifecycle: queued, running, done, failed, cancelled
- Update status realtime ke dashboard via Supabase Realtime
- Setiap run punya record sendiri, hasil terisolasi per run
- Error message tersimpan dan tampil di UI

### 5.4 Results
- Tabel hasil ekstraksi per run
- Toggle tampilan tabel dan JSON mentah
- Export CSV dan JSON
- Pagination untuk run besar

### 5.5 API Key dan Public API
- Generate API key, plaintext ditampilkan sekali saat create
- Key disimpan sebagai hash, prefix disimpan untuk identifikasi
- Revoke key
- Public API dengan auth Bearer token:
  - POST /api/v1/jobs (create job)
  - GET /api/v1/jobs (list)
  - POST /api/v1/jobs/:id/run (trigger run)
  - GET /api/v1/jobs/:id/results (ambil hasil, format json atau csv)

### 5.6 Dashboard
- Overview: total job, total run, total rows, run terbaru
- Job list dengan status terakhir
- Halaman detail job: config, run history, hasil run terpilih

### 5.7 Landing dan Docs
- Landing page: value prop, cara kerja, contoh output, CTA daftar
- Docs: quickstart curl, daftar endpoint, format response, format error

## 6. Alur Penggunaan Sistem

1. User buka landing page, klik daftar
2. Register dan login, masuk dashboard kosong
3. Klik New Job, isi nama, URL, dan field selector
4. Simpan job, klik Run Now
5. Status berjalan queued lalu running, badge update realtime
6. Run selesai, user buka job, lihat tabel hasil
7. Export CSV/JSON, atau copy API key dari halaman Settings
8. Pakai API key untuk submit job dan tarik hasil dari luar platform

## 7. Arsitektur Sistem

### Komponen
- Web app: Next.js 15 App Router, Tailwind v4, server components plus client components untuk interaktivitas
- Database: Supabase Postgres, RLS untuk isolasi data
- Auth: Supabase Auth, session via SSR cookie
- Queue: pg-boss, queue yang hidup di dalam Postgres
- Worker: proses Node standalone (tsx), Playwright Chromium untuk fetch, cheerio untuk parsing
- Realtime: Supabase Realtime channel untuk status run
- Deploy: web di Vercel, worker di VPS atau mesin lokal (didokumentasikan)

### Alur data run
1. API route insert job_runs status queued
2. pg-boss enqueue job scrape dengan payload runId dan konfigurasi
3. Worker ambil job, update status running
4. Playwright buka halaman, tunggu selector, ambil HTML
5. cheerio ekstrak field sesuai config
6. Batch insert ke results
7. Update run: status done, row_count, finished_at
8. Supabase Realtime push update ke dashboard yang subscribe

### Alur data public API
1. Request masuk dengan header Authorization Bearer sk_live_xxx
2. Middleware hash key, lookup di api_keys, cek revoked
3. Update last_used_at, inject user_id ke context
4. Handler proses request dalam konteks user tersebut

## 8. Skema Database

```sql
-- jobs: definisi scraping
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  target_url text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- job_runs: satu eksekusi job
create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  trigger text not null default 'manual'
    check (trigger in ('manual', 'api', 'schedule')),
  error text,
  row_count integer not null default 0,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

-- results: baris data hasil satu run
create table public.results (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.job_runs on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- api_keys: kredensial akses programmatik
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- index
create index jobs_user_id_idx on public.jobs (user_id);
create index job_runs_job_id_idx on public.job_runs (job_id, queued_at desc);
create index job_runs_status_idx on public.job_runs (status);
create index results_run_id_idx on public.results (run_id);
create index api_keys_user_id_idx on public.api_keys (user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- RLS
alter table public.jobs enable row level security;
alter table public.job_runs enable row level security;
alter table public.results enable row level security;
alter table public.api_keys enable row level security;

create policy "own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own runs" on public.job_runs
  for all using (
    exists (select 1 from public.jobs j where j.id = job_runs.job_id and j.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.jobs j where j.id = job_runs.job_id and j.user_id = auth.uid())
  );

create policy "own results" on public.results
  for all using (
    exists (
      select 1 from public.job_runs r
      join public.jobs j on j.id = r.job_id
      where r.id = results.run_id and j.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.job_runs r
      join public.jobs j on j.id = r.job_id
      where r.id = results.run_id and j.user_id = auth.uid()
    )
  );

create policy "own keys" on public.api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Catatan: worker memakai service role key sehingga bypass RLS secara sengaja, karena worker adalah komponen tepercaya yang bertindak atas nama sistem.

## 9. Struktur Sistem

```
scrape-desk/
  app/
    page.tsx                      landing page
    docs/page.tsx                 dokumentasi API
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      dashboard/
        page.tsx                  overview
        jobs/
          page.tsx                job list
          new/page.tsx            create job
          [id]/page.tsx           job detail, run history, results
        keys/page.tsx             API key management
      layout.tsx                  shell dengan nav dan auth guard
    api/
      jobs/route.ts               GET list, POST create
      jobs/[id]/route.ts          GET, PATCH, DELETE
      jobs/[id]/run/route.ts      POST trigger run
      runs/[runId]/results/route.ts  GET results, export csv
      keys/route.ts               GET, POST
      keys/[id]/route.ts          DELETE revoke
      v1/
        jobs/route.ts             public API
        jobs/[id]/route.ts        public API
        jobs/[id]/run/route.ts    public API
        jobs/[id]/results/route.ts public API
  components/
    ui/                           primitif: button, card, table, badge, input
    sections/                     section landing dan dashboard
  lib/
    env.ts                        validasi environment variable dengan zod
    supabase/
      client.ts                   browser client
      server.ts                   server client
      middleware.ts               session refresh
    api/
      auth.ts                     auth session user
      api-key.ts                  validasi Bearer key
      response.ts                 helper response dan error format
      validate.ts                 helper parsing zod
    queue/
      boss.ts                     instance pg-boss singleton
    scrape/
      types.ts                    tipe domain: Job, Run, Result, ExtractConfig
      engine.ts                   orkestrasi scrape (dipakai worker)
      extract.ts                  parsing cheerio
  worker/
    index.ts                      bootstrap dan registrasi handler
    handlers/
      scrape.ts                   handler job scrape
  supabase/
    schema.sql
  types/
    database.types.ts             generated types dari Supabase
```

Prinsip penempatan: lib tidak mengimport dari app atau components. app dan worker adalah adapter tipis di atas lib. Semua logika domain dan integrasi hidup di lib.

## 10. Desain API

### Format sukses
{ "data": ... }

### Format error
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }

Kode error: VALIDATION_ERROR 400, UNAUTHORIZED 401, FORBIDDEN 403, NOT_FOUND 404, RATE_LIMITED 429, INTERNAL 500.

### Autentikasi
- Dashboard dan API internal: session cookie Supabase
- Public API v1: header Authorization Bearer dengan API key

### Endpoint internal (session)
- GET /api/jobs
- POST /api/jobs
- GET /api/jobs/:id
- PATCH /api/jobs/:id
- DELETE /api/jobs/:id
- POST /api/jobs/:id/run
- GET /api/runs/:runId/results?format=json|csv
- GET /api/keys
- POST /api/keys
- DELETE /api/keys/:id

### Endpoint publik (API key)
- POST /api/v1/jobs
- GET /api/v1/jobs
- POST /api/v1/jobs/:id/run
- GET /api/v1/jobs/:id/results?format=json|csv

## 11. Prinsip Clean Code

- TypeScript strict, tanpa any, tanpa non-null assertion sembarangan
- Validasi semua input di boundary dengan zod, tipe ter Infer dari schema
- Satu tanggung jawab per modul, file pendek, fungsi pendek
- lib bebas framework, app dan worker tipis
- Error handling eksplisit: class AppError dengan code dan status, tidak ada catch yang membisukan error
- Environment variable divalidasi sekali saat boot, gagal cepat kalau kurang
- Naming konsisten: file kebab-case, export named, konstanta UPPER_SNAKE
- Komentar hanya untuk alasan kenapa, bukan apa
- Tidak ada dead code, tidak ada commented-out code
- Response API seragam lewat helper tunggal

## 12. Skill Mapping

Skill yang akan dipakai saat implementasi:
- nextjs-tailwind-site-building: scaffold, design system token, struktur komponen
- api-and-interface-design: desain endpoint dan kontrak API
- frontend-ui-engineering dan design-taste-frontend: kualitas UI dashboard
- claude-design: landing page
- scraping-anti-bot dan scrapling-scraping: referensi engine worker
- proxy-rotation-pipeline: dasar untuk fitur proxy di V2
- antislop-code dan rigorous-execution: disiplin clean code dan verifikasi

## 13. Milestone

- M1 Fondasi: scaffold Next, env config, Supabase client, schema, halaman auth
- M2 Job CRUD: API internal, validasi zod, halaman job list dan create
- M3 Run engine: pg-boss, worker Playwright dan cheerio, lifecycle run, realtime status
- M4 Results: viewer, pagination, export CSV dan JSON
- M5 API key dan public API: generate, hash, middleware Bearer, endpoint v1
- M6 Landing dan docs: halaman publik, quickstart curl, README case study

## 14. Keputusan yang Perlu Persetujuan

1. Scope MVP seperti bagian 4, sisanya masuk V2. Setuju?
2. Auth email/password saja, tanpa OAuth untuk MVP. Setuju?
3. Ekstraksi pakai input CSS selector manual, tanpa visual picker untuk MVP. Setuju?
4. Worker memakai Node plus Playwright, pipeline Python Scrapling menyusul di V2. Setuju?
5. Fresh start di folder WORK/scrape-desk, scaffold awal di ALIP/scrapedesk diabaikan. Setuju?
6. Deploy: web di Vercel, worker di VPS atau mesin lokal. Setuju?
