# ScrapeDesk

Scraping-as-a-service platform with a multi-source data pipeline. Define a target and extraction rules, trigger a run, and receive structured data you can view in the dashboard, export as CSV/JSON, or pull through the public API with an API key.

This is not a personal scraping script: it has multi-user support, job management, run history, API access, and per-user data isolation via Row Level Security.

## Features

- **Four source types in one pipeline**
  - Web page: render HTML with Playwright, extract with CSS selectors or an LLM
  - JSON API: fetch JSON, map fields with dot paths, paginate by page number, cursor, or next link
  - RSS/Atom feed: parse any feed into title, link, date, summary rows
  - Sitemap crawl: discover URLs from sitemap.xml (including sitemap indexes), then scrape each page
- **Extraction modes**
  - CSS selector mode: field-to-selector mappings, rows assembled by index
  - Container mode: define a container selector plus relative field selectors, one row per container element, no field bleed between rows
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
  - Webhook notifications with a JSON payload when a run finishes, HMAC-SHA256 signed when WEBHOOK_SECRET is set
  - Change detection: every run result page shows a set-based diff against the previous completed run (added, removed, unchanged, with samples)
- **Reliability**
  - Automatic retry with exponential backoff (2 retries, 30s then 60s) on scrape failures
  - Per-domain politeness delay (DOMAIN_DELAY_MS, default 1s) so the system does not hammer a single host
- **Platform**
  - Email/password auth with Supabase, per-user Row Level Security on every table
  - Job CRUD, run history, realtime status updates on the dashboard via Supabase Realtime
  - Public REST API with hashed API keys (sha256, plaintext shown once at creation), OpenAPI spec in docs/openapi.yaml
  - CSV/JSON export
  - Daily run quota per user (default 50, override with DAILY_RUN_QUOTA), enforced on dashboard and API, usage shown on the overview page
  - Post-extraction data transforms: regex extract, number coercion, replace, prefix/suffix, case, and template columns
  - Built-in docs page at `/docs` and a full tutorial at `/tutorial`

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
    "sourceType": "api",
    "mode": "css",
    "fields": [
      { "name": "title", "selector": "title" },
      { "name": "cited", "selector": "cited_by_count" }
    ],
    "api": {
      "itemsPath": "results",
      "headers": { "Authorization": "Bearer xxx" },
      "pagination": {
        "type": "page",
        "pageParam": "page",
        "maxPages": 5,
        "sizeParam": "per-page",
        "pageSize": 25
      }
    }
  }
}
```

`sourceType` selects the source: `web` (default), `api`, `feed`, or `sitemap`. In API mode, field selectors are dot paths into the JSON response (supports array indexes like `authors[0].name`). In feed mode, no extraction config is needed; rows are title, link, date, summary. In sitemap mode, `sitemap.urlFilter` and `sitemap.maxUrls` control which discovered URLs get scraped, and the normal extraction config applies to each page.

For AI mode, replace `fields` with `instruction` (natural language) and `schema` (field name + description pairs). All navigation, access, and automation options work in both modes.

In CSS mode, `containerSelector` is optional. When set, each matching element becomes one row and field selectors are resolved relative to it. When empty, fields are collected as columns and rows are assembled by index.

## Engineering Notes

### Multi-source architecture

`scrapeJob` dispatches on `sourceType`: web renders HTML through Playwright (the default, fully backward compatible), api fetches JSON with dot-path field mapping and three pagination strategies, feed parses RSS/Atom into fixed columns, and sitemap discovers URLs then runs the web extraction per page. One pipeline, four input shapes, one output shape.

### Retry with backoff

Enqueued jobs carry `retryLimit: 2, retryDelay: 30, retryBackoff: true`. The worker handler marks a run failed, then rethrows if attempts remain, so pg-boss reschedules with exponential backoff (30s, then 60s). The final attempt is the one that stays failed. The handler reads `retryCount`/`retryLimit` from pg-boss job metadata, which requires `work` with `includeMetadata: true`.

### Webhook signing

When `WEBHOOK_SECRET` is set, the payload body is signed with HMAC-SHA256 and sent in the `X-ScrapeDesk-Signature` header as `sha256=<hex>`. Receivers verify by recomputing the HMAC over the raw body. Without the secret, webhooks still fire unsigned.

### Domain politeness

`respectDomainDelay` keeps an in-memory map of the last hit time per hostname and sleeps before a request if the same domain was hit less than `DOMAIN_DELAY_MS` ago. The delay is read lazily from `process.env` rather than the validated env module so the module stays importable in unit tests.

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

### Extraction strategy

Two CSS strategies:

- Container mode (`containerSelector` set): each matching element is one row, fields are resolved relative to the container. No field can bleed between rows. This is the correct default for listing pages.
- Column mode (`containerSelector` empty): each field selector is collected as a column and rows are assembled by index. Fits pages where every field appears in order and in equal counts.

### Change detection

Diffs are set-based on a hash of each row's content, compared against the previous completed run of the same job. A changed row appears as one removed plus one added, which is honest set-diff semantics without requiring a stable key from the user. Comparisons are capped at 1000 rows per run.

Run ordering uses `queued_at`, not the UUID id: `gen_random_uuid()` is random, so id order says nothing about time order. This was a real bug caught by e2e testing.

### Stealth scope

The stealth init script raises the minimum headless-detection bar (webdriver flag, chrome runtime, plugins, permissions). It is not a complete anti-bot solution; Cloudflare-class challenges can still block. It is a floor, not a ceiling.

## Security Notes

- All tables have Row Level Security enabled with per-user policies; the API authenticates via hashed API keys; the dashboard is protected by session middleware
- All external input is validated with zod schemas at the system boundary, with explicit length and count caps
- Secrets come from environment variables only; `.env.local` is gitignored and no credentials are committed
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-DNS-Prefetch-Control) are set on every response
- Known considerations, documented rather than hidden: the scraping engine and webhook notifier fetch user-supplied URLs, which is inherent to the product and a self-directed SSRF surface for authenticated users; two npm audit advisories (postcss via next, zod) remain open because fixes are breaking upgrades and both are low-reachability for this deployment (build-time CSS processing of first-party stylesheets; oversized-input validation now capped by schema limits)

## Testing

78 unit tests across 10 files, run with `npm test`:

```
npm test        # run once
npm run test:watch  # watch mode
```

Coverage: config normalization (including legacy rows without a mode field), column resolution, container and column extraction, data transforms, set-based diffing, API dot-path mapping and pagination, RSS/Atom parsing, sitemap index recursion, zod validation boundaries, and domain rate limiting.

End-to-end verified against live targets:

- Web CSS mode: 20 rows from books.toscrape.com
- Web container mode: 20 rows with per-container field scoping, verified no field bleed (all prices match the £ format, titles match real books)
- Web AI mode: 3 rows (title/price/stock) through an OpenAI-compatible endpoint
- Web pagination: 60 rows across 3 pages, first row from page 1, last row from page 3
- Web infinite scroll: 100 quotes from quotes.toscrape.com/scroll
- Web cookie injection: verified via httpbin echo of injected cookies
- API source: 5 journal papers from OpenAlex with title, year, citation count
- API pagination: 6 rows across 2 pages via page-number pagination
- Feed source: 10 news items from BBC RSS with title, link, date
- Sitemap source: 3 RFC pages discovered through a sitemap index with child recursion
- Webhook: payload received with correct event, jobId, status, and rowCount
- Schedule: cron fires, creates the run row, scrapes 20 rows, reschedules the next run, and stops cleanly when the schedule is removed
- Proxy rotation: verified plumbing via forced `ERR_PROXY_CONNECTION_FAILED` on a dead proxy
- Change detection: identical re-runs produce 0 added, 0 removed, 20 unchanged; an edited row is detected as 1 added plus 1 removed
- Quota: daily count via jobs join verified correct
- Transforms: number coercion strips currency symbols (51.77 from £51.77) and template columns combine transformed values, verified end to end

## Deployment

See [DEPLOY.md](DEPLOY.md). Short version: web on Vercel (zero-config), worker on a VPS with PM2 (`ecosystem.config.cjs` included). The two processes share one Supabase database and communicate through the pg-boss queue.

Docker Compose is also available for local full-stack runs:

```
docker compose up --build
```

This builds the web image (Next.js standalone output) and the worker image (Playwright base with Chromium preinstalled). Both read credentials from `.env.local`.

## API Specification

The public API is documented as an OpenAPI 3.0 spec in `docs/openapi.yaml`. Import it into Postman, Insomnia, or Swagger UI for an interactive reference.

## Roadmap V4

- True change detection with a user-defined stable key (row identity instead of content hash)
- Stripe billing on top of the existing quota metering
- Quota tiers per plan
- Screenshot capture per run as visual evidence

## License

MIT
