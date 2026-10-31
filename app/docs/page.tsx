import Link from "next/link";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/jobs",
    description: "List semua job milik akun lo",
  },
  {
    method: "POST",
    path: "/api/v1/jobs",
    description: "Bikin job baru. Body: name, targetUrl, fields[{name, selector}]",
  },
  {
    method: "GET",
    path: "/api/v1/jobs/:id",
    description: "Detail satu job",
  },
  {
    method: "POST",
    path: "/api/v1/jobs/:id/run",
    description: "Trigger run, hasilnya masuk queue dan diproses worker",
  },
  {
    method: "GET",
    path: "/api/v1/jobs/:id/results",
    description: "Ambil hasil run terakhir. Tambah ?format=csv buat download CSV",
  },
];

const errorCodes = [
  ["400", "VALIDATION_ERROR", "Input nggak valid"],
  ["401", "UNAUTHORIZED", "API key salah atau nggak dikirim"],
  ["404", "NOT_FOUND", "Resource nggak ada atau bukan milik lo"],
  ["500", "INTERNAL_ERROR", "Error server"],
];

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-subtle">scrape-desk</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">API Docs</h1>
      <p className="mt-3 text-muted">
        Public API dipakai buat submit job dan tarik hasil dari aplikasi lo sendiri. Semua
        request butuh header Authorization dengan API key dari dashboard.
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Autentikasi</h2>
        <p className="mt-2 text-sm text-muted">
          Bikin key di halaman API Keys, plaintext cuma ditampilin sekali. Kirim sebagai Bearer
          token:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Authorization: Bearer sk_live_xxx`}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Quickstart</h2>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`# bikin job
curl -X POST https://domain-lo.com/api/v1/jobs \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Harga kompetitor",
    "targetUrl": "https://contoh.com/listing",
    "fields": [
      { "name": "title", "selector": "h2.title" },
      { "name": "price", "selector": ".price" }
    ]
  }'

# trigger run
curl -X POST https://domain-lo.com/api/v1/jobs/JOB_ID/run \\
  -H "Authorization: Bearer sk_live_xxx"

# ambil hasil
curl https://domain-lo.com/api/v1/jobs/JOB_ID/results \\
  -H "Authorization: Bearer sk_live_xxx"`}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Endpoints</h2>
        <ul className="mt-4 space-y-2">
          {endpoints.map((endpoint) => (
            <li
              key={`${endpoint.method} ${endpoint.path}`}
              className="rounded-card border border-line bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">
                  {endpoint.method}
                </span>
                <code className="font-mono text-sm text-ink">{endpoint.path}</code>
              </div>
              <p className="mt-2 text-sm text-muted">{endpoint.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Mode ekstraksi</h2>
        <p className="mt-2 text-sm text-muted">
          Job punya dua mode. Mode css pakai CSS selector, tepat dan cepat. Mode ai kirim konten
          halaman ke LLM dan ekstrak sesuai instruksi bahasa manusia, cocok buat halaman yang
          strukturnya berantapan. Config mode ai dikirim di field config saat create job:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`{
  "name": "Harga kompetitor",
  "targetUrl": "https://contoh.com/listing",
  "config": {
    "mode": "ai",
    "instruction": "Ambil nama produk dan harga untuk setiap item",
    "schema": [
      { "name": "product", "description": "nama produk" },
      { "name": "price", "description": "harga dalam rupiah" }
    ]
  }
}`}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Navigasi dan akses</h2>
        <p className="mt-2 text-sm text-muted">
          Config job mendukung paginasi, infinite scroll, dan cookie injection:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`{
  "config": {
    "mode": "css",
    "fields": [{ "name": "title", "selector": "h2.title" }],
    "navigation": {
      "pagination": {
        "mode": "url-pattern",
        "urlPattern": "https://contoh.com/listing?page={page}",
        "maxPages": 5
      },
      "infiniteScroll": { "maxScrolls": 10 }
    },
    "cookies": [
      { "name": "session", "value": "xxx" }
    ]
  }
}`}
        </pre>
        <p className="mt-3 text-sm text-muted">
          Paginasi mode next-selector pakai selector tombol next, misal li.next a. Cookie dikirim
          ke halaman target, berguna buat halaman yang butuh login.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Sumber data</h2>
        <p className="mt-2 text-sm text-muted">
          Config job punya sourceType: web (default), api, feed, dan sitemap. Mode api fetch JSON
          dan memetakan field lewat dot path, mendukung paginasi page number, cursor, dan next
          link. Mode feed parse RSS atau Atom jadi kolom title, link, date, summary. Mode sitemap
          ambil URL dari sitemap.xml termasuk sitemap index, lalu scraping tiap halaman.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Container mode</h2>
        <p className="mt-2 text-sm text-muted">
          Di mode css, containerSelector opsional. Kalau diisi, tiap elemen yang match jadi satu
          baris dan field selector diekstrak relatif di dalam container, jadi field nggak bisa bocor
          antar baris:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`{
  "config": {
    "mode": "css",
    "containerSelector": "article.product_pod",
    "fields": [
      { "name": "title", "selector": "h3 a" },
      { "name": "price", "selector": "p.price_color" }
    ]
  }
}`}
        </pre>
        <p className="mt-3 text-sm text-muted">
          Kalau containerSelector kosong, field dikumpulkan sebagai kolom dan baris disusun per
          index, cocok buat halaman di mana tiap field muncul urut dan sama banyak.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Kuota harian</h2>
        <p className="mt-2 text-sm text-muted">
          Tiap user dibatasi 50 run per hari secara default, bisa dioverride lewat env
          DAILY_RUN_QUOTA. Kuota dihitung dari jumlah job_runs yang di-queue hari ini dan direset
          tengah malam UTC. Kalau habis, trigger run balik error 429 dengan code QUOTA_EXCEEDED.
          Pemakaian kuota tampil di halaman overview dashboard.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Format response</h2>
        <p className="mt-2 text-sm text-muted">
          Sukses dibungkus dalam data, error dalam error dengan code yang bisa diproses
          programatik:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`{ "data": { "jobs": [ ... ] } }

{ "error": { "code": "UNAUTHORIZED", "message": "API key tidak valid" } }`}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Error codes</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {errorCodes.map(([status, code, description]) => (
            <li key={code} className="flex gap-3">
              <span className="font-mono text-xs text-subtle">{status}</span>
              <code className="font-mono text-xs text-ink">{code}</code>
              <span className="text-muted">{description}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <Link href="/register" className={buttonClassHref}>
          Mulai gratis
        </Link>
      </div>
    </main>
  );
}

const buttonClassHref =
  "inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-accent";
