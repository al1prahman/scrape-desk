-- ScrapeDesk schema
-- Jalankan sekali di Supabase SQL Editor

-- jobs: definisi scraping
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  target_url text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- job_runs: satu eksekusi job, hasil terisolasi per run
create table if not exists public.job_runs (
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
create table if not exists public.results (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.job_runs on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- api_keys: kredensial akses programmatik
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on public.jobs (user_id);
create index if not exists job_runs_job_id_idx on public.job_runs (job_id, queued_at desc);
create index if not exists job_runs_status_idx on public.job_runs (status);
create index if not exists results_run_id_idx on public.results (run_id);
create index if not exists api_keys_user_id_idx on public.api_keys (user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.job_runs enable row level security;
alter table public.results enable row level security;
alter table public.api_keys enable row level security;

drop policy if exists "own jobs" on public.jobs;
create policy "own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own runs" on public.job_runs;
create policy "own runs" on public.job_runs
  for all using (
    exists (select 1 from public.jobs j where j.id = job_runs.job_id and j.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.jobs j where j.id = job_runs.job_id and j.user_id = auth.uid())
  );

drop policy if exists "own results" on public.results;
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

drop policy if exists "own keys" on public.api_keys;
create policy "own keys" on public.api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
