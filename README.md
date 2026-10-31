# ScrapeDesk

Scraping-as-a-service platform. Define a target URL and extraction fields, trigger a run, and receive structured data you can view in the dashboard, export as CSV/JSON, or pull through the public API with an API key.

This is not a personal scraping script: it has multi-user support, job management, run history, API access, and per-user data isolation via Row Level Security.

## Features

- **Two extraction modes**
  - CSS selector mode: define field-to-selector mappings, rows assembled by index
  - AI extraction mode: natural language instructions plus a field schema, powered by any OpenAI-compatible LLM endpoint (local or hosted)
- **Smart navigation**
  - Pagination in two modes: next-button click or URL pattern with `{page}` placeholder
  - Infinite scroll: scrolls until page height stabilizes or maxScrolls is reached
- **Access for hard targets**
  - Cookie injection for pages behind a login
  - Stealth init script that raises the minimum headless-detection bar
  - Per-job proxy list with round-robin rotation per page
- **Automation**
  - Cron scheduling per job, self-perpetuating chain that stops cleanly when the schedule is removed
  - Webhook notifications with a JSON payload when a run finishes
- **Platform**
  - Email/password auth with Supabase, per-user Row Level Security on every table
  - Job CRUD, run history, realtime status updates on the dashboard via Supabase Realtime
  - Public REST API with hashed API keys (sha256, plaintext shown once at creation)
  - CSV/JSON export
  - Built-in docs page at `/docs`

## Tech Stack

- Next.js 15 (App Router) + Tailwind v4 + TypeScript strict
- Supabase: Postgres, Auth, Realtime
- pg-boss: job queue living inside Postgres, no Redis
- Playwright + cheerio: scraping worker as a standalone Node process
- Deploy: web on Vercel, worker on a VPS or local machine

## Architecture

```
Browser / API client
      |
Next.js (web + route handlers)
  |        \
Supabase   pg-boss queue (inside Postgres)
(Auth, RLS,      |
 Realtime)   Worker (Playwright + cheerio)
                   |
              results -> Postgres -> Realtime -> dashboard
```

Run flow: user triggers a run, a `job_runs` row is created with status `queued`, the job is enqueued to pg-boss, the worker picks it up, sets status `running`, scrapes the page with Playwright, extracts fields with cheerio, batch-inserts into `results`, and sets status `done`. The dashboard subscribes to `job_runs` changes via Supabase Realtime.

The worker uses the service role key deliberately: it acts on behalf of the system, not a user. All other access is guarded by RLS with `auth.uid() = user_id` policies.

## Local Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor
2. Enable realtime for the runs table:
   ```sql
   alter publication supabase_realtime add table public.job_runs;
   ```
3. Disable email confirmation under Authentication > Providers > Email (development only)
4. Copy `.env.example` to `.env.local` and fill in credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from API Keys
   - `SUPABASE_SECRET_KEY` (server only)
   - `DATABASE_URL` from Connection Pooling session mode (port 5432). New projects are IPv6-only on direct connection, so local development must use the pooler
   - Optional LLM config for AI mode: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (any OpenAI-compatible endpoint)
5. `npm install && npx playwright install chromium`
6. Two terminals: `npm run dev` and `npm run worker`

## Public API

All endpoints require an `Authorization: Bearer <key>` header. Keys are created from the API Keys page; the plaintext is shown once and stored as a sha256 hash.

- `GET /api/v1/jobs`
- `POST /api/v1/jobs`
- `GET /api/v1/jobs/:id`
- `POST /api/v1/jobs/:id/run`
- `GET /api/v1/jobs/:id/results` (add `?format=csv`)

Full documentation lives on the `/docs` page.

## Job Config Reference

```json
{
  "config": {
    "mode": "css",
    "fields": [{ "name": "title", "selector": "h2.title" }],
    "navigation": {
      "pagination": {
        "mode": "url-pattern",
        "urlPattern": "https://example.com/listing?page={page}",
        "maxPages": 5
      },
      "infiniteScroll": { "maxScrolls": 10 }
    },
    "cookies": [{ "name": "session", "value": "xxx" }],
    "proxies": ["http://user:pass@1.2.3.4:8080"],
    "schedule": { "cron": "0 9 * * *" },
    "webhookUrl": "https://your-domain.com/webhook"
  }
}
```

For AI mode, replace `fields` with `instruction` (natural language) and `schema` (field name + description pairs). All navigation, access, and automation options work in both modes.

## Engineering Notes

### pg-boss v10: queues must be created explicitly

The first bug found during e2e testing: runs stuck in `queued` forever with no error. pg-boss v10 runs `INSERT ... SELECT` with an INNER JOIN against the `pgboss.queue` table, and queues no longer auto-create on send. A missing queue makes the insert affect zero rows and `send()` return null without error, so the job vanishes silently.

Fix: `createQueue` is called explicitly before send, and enqueue throws if send returns null, so failures never go silent again.

### Supabase connection pooling

New Supabase projects are IPv6-only on direct connection. Local development on IPv4 networks must use the Supavisor pooler in session mode (port 5432, user `postgres.<project-ref>`).

The free-tier pooler caps at 15 session-mode connections, so pg-boss pools are bounded: max 2 for the worker, max 1 for enqueue.

### Zombie workers

`npm run worker` spawns a tree of npm, tsx, and node processes. Ctrl+C is safe because SIGINT kills the whole group. But force-killing only the npm process leaves orphaned children alive as zombies that keep consuming the job queue while running stale code. If scraping results look wrong, check how many node processes are running.

### Scheduling design

Schedules are self-perpetuating: every scheduled run schedules the next one via `sendAfter`, computed with cron-parser. When the schedule is removed from the job config, the next scheduled arrival finds no schedule and stops without processing or rescheduling. This design was chosen because pg-boss native schedules are one-per-queue and do not fit many jobs with individual schedules.

### Extraction strategy (MVP)

Each field selector is collected as a column and rows are assembled by index. This fits listing pages where every field appears in order and in equal counts. The limitation is documented and will be upgraded in V2 with container-based extraction.

### Stealth scope

The stealth init script raises the minimum headless-detection bar (webdriver flag, chrome runtime, plugins, permissions). It is not a complete anti-bot solution; Cloudflare-class challenges can still block. It is a floor, not a ceiling.

## Security Notes

- All tables have Row Level Security enabled with per-user policies; the API authenticates via hashed API keys; the dashboard is protected by session middleware
- All external input is validated with zod schemas at the system boundary, with explicit length and count caps
- Secrets come from environment variables only; `.env.local` is gitignored and no credentials are committed
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-DNS-Prefetch-Control) are set on every response
- Known considerations, documented rather than hidden: the scraping engine and webhook notifier fetch user-supplied URLs, which is inherent to the product and a self-directed SSRF surface for authenticated users; two npm audit advisories (postcss via next, zod) remain open because fixes are breaking upgrades and both are low-reachability for this deployment (build-time CSS processing of first-party stylesheets; oversized-input validation now capped by schema limits)

## Testing

End-to-end verified against live targets:

- CSS mode: 20 rows from books.toscrape.com
- AI mode: 3 rows (title/price/stock) through an OpenAI-compatible endpoint
- Pagination: 60 rows across 3 pages, first row from page 1, last row from page 3
- Infinite scroll: 100 quotes from quotes.toscrape.com/scroll
- Cookie injection: verified via httpbin echo of injected cookies
- Webhook: payload received with correct event, jobId, status, and rowCount
- Schedule: cron fires, creates the run row, scrapes 20 rows, reschedules the next run, and stops cleanly when the schedule is removed
- Proxy rotation: verified plumbing via forced `ERR_PROXY_CONNECTION_FAILED` on a dead proxy

## Roadmap V2

- Container-based extraction (parent selector plus field selectors)
- Change detection between runs
- Quota and billing
- Swap the engine to Python Scrapling for the hardest targets

## License

MIT
