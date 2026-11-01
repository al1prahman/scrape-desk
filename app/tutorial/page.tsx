import Link from "next/link";

const sections = [
  { id: "konsep", label: "Konsep dasar" },
  { id: "job-pertama", label: "Job pertama" },
  { id: "sumber", label: "Sumber data" },
  { id: "ekstraksi", label: "Mode ekstraksi" },
  { id: "navigasi", label: "Navigasi" },
  { id: "akses", label: "Akses situs sulit" },
  { id: "otomasi", label: "Otomasi" },
  { id: "perubahan", label: "Change detection" },
  { id: "kuota", label: "Kuota" },
  { id: "api", label: "API dan export" },
  { id: "resep", label: "Resep lengkap" },
];

export default function TutorialPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-subtle">scrape-desk</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Tutorial</h1>
      <p className="mt-3 text-muted">
        Panduan lengkap pakai ScrapeDesk, dari bikin job pertama sampai otomasi penuh. Semua fitur
        ada di sini.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:text-ink"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <section id="konsep" className="mt-12">
        <h2 className="text-lg font-medium">Konsep dasar</h2>
        <p className="mt-2 text-sm text-muted">
          Tiga kata kunci: job, run, results. Job adalah resep scraping: target URL, sumber data,
          aturan ekstraksi. Run adalah satu eksekusi job. Results adalah baris data hasil satu run.
          Satu job bisa di-run berkali-kali, tiap run punya hasil terpisah dan bisa dibandingkan.
        </p>
      </section>

      <section id="job-pertama" className="mt-12">
        <h2 className="text-lg font-medium">Job pertama</h2>
        <p className="mt-2 text-sm text-muted">
          Buka dashboard, klik New Job. Isi nama dan target URL, pilih sumber data dan mode
          ekstraksi, tentukan field, simpan. Di halaman job, klik Run sekarang. Status run update
          realtime, hasil muncul di halaman hasil run.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh job paling sederhana:

Nama:        Books to Scrape
Target URL:  https://books.toscrape.com/
Sumber:      Web Page
Mode:        CSS Selector
Fields:      title -> article.product_pod h3 a
             price -> article.product_pod p.price_color`}
        </pre>
      </section>

      <section id="sumber" className="mt-12">
        <h2 className="text-lg font-medium">Sumber data</h2>
        <p className="mt-2 text-sm text-muted">
          Empa sumber data dalam satu pipeline. Pilih di form New Job, form ngikutin otomatis.
        </p>

        <h3 className="mt-6 text-sm font-medium">Web Page</h3>
        <p className="mt-1 text-sm text-muted">
          Render halaman HTML pakai browser asli, cocok buat blog, news, listing produk, komunitas.
          Mendukung JavaScript rendering, paginasi, infinite scroll, cookies, dan proxy.
        </p>

        <h3 className="mt-6 text-sm font-medium">JSON API</h3>
        <p className="mt-1 text-sm text-muted">
          Fetch JSON dari API manapun. Field dipetakan lewat dot path, support array index seperti
          authors[0].name. Paginasi tiga mode: page number, cursor, dan next link. Cocok buat jurnal
          ilmiah, Reddit, dan layanan dengan API resmi.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh: jurnal dari OpenAlex

Target URL:  https://api.openalex.org/works?search=quantum&per-page=25
Sumber:      JSON API
Items path:  results
Fields:      title -> title
             year  -> publication_year
             cited -> cited_by_count
Paginasi:    Page number, param "page", 10 halaman`}
        </pre>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh: komentar Reddit

Target URL:  https://www.reddit.com/r/programmerhumor/comments/<id>.json
Sumber:      JSON API
Items path:  1.data.children
Fields:      body   -> data.body
             author -> data.author
             score  -> data.score`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">RSS/Atom Feed</h3>
        <p className="mt-1 text-sm text-muted">
          Parse feed jadi kolom title, link, date, summary. Nggak perlu config ekstraksi, paling
          reliable buat berita karena hampir semua situs berita punya feed.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh: berita BBC

Target URL:  https://feeds.bbci.co.uk/news/rss.xml
Sumber:      RSS/Atom Feed
Limit:       50`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">Sitemap Crawl</h3>
        <p className="mt-1 text-sm text-muted">
          Ambil semua URL dari sitemap.xml, termasuk sitemap index, terus scraping tiap halaman
          pakai aturan ekstraksi web. Filter URL dan batas jumlah URL. Cocok buat ngambil seluruh
          isi blog atau situs berita.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh: seluruh artikel blog

Target URL:  https://domain-blog.com/sitemap.xml
Sumber:      Sitemap Crawl
Filter URL:  /blog/
Maks URL:    100
Fields:      title -> h1.post-title
             date  -> time`}
        </pre>
      </section>

      <section id="ekstraksi" className="mt-12">
        <h2 className="text-lg font-medium">Mode ekstraksi</h2>

        <h3 className="mt-6 text-sm font-medium">CSS Selector</h3>
        <p className="mt-1 text-sm text-muted">
          Tiap field punya selector sendiri, baris disusun per index. Cocok buat halaman di mana
          tiap field muncul urut dan sama banyak.
        </p>

        <h3 className="mt-6 text-sm font-medium">Container</h3>
        <p className="mt-1 text-sm text-muted">
          Isi container selector, tiap elemen yang match jadi satu baris, field diekstrak relatif di
          dalam container. Field nggak bisa bocor antar baris. Ini cara bener buat listing page.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Container:   article.product_pod
Fields:      title -> h3 a
             price -> p.price_color`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">AI Extract</h3>
        <p className="mt-1 text-sm text-muted">
          Tulis instruksi bahasa natural plus schema field, LLM baca konten halaman dan ekstrak
          sesuai instruksi. Cocok buat halaman berantakan yang selector-nya nggak stabil. Butuh
          endpoint OpenAI-compatible, bisa colok ke provider mana pun.
        </p>
      </section>

      <section id="navigasi" className="mt-12">
        <h2 className="text-lg font-medium">Navigasi</h2>
        <p className="mt-2 text-sm text-muted">
          Buat sumber web, dua cara jalan keluar halaman listing:
        </p>
        <p className="mt-2 text-sm text-muted">
          Paginasi tombol next: kasih selector tombol next, engine klik sampai habis atau maksimal
          halaman tercapai. Paginasi URL pattern: kasih pattern dengan tanda {"{page}"}, engine ganti
          nomor halaman otomatis.
        </p>
        <p className="mt-2 text-sm text-muted">
          Infinite scroll: centang opsi ini, engine scroll ke bawah sampai tinggi halaman stabil atau
          maksimal scroll tercapai. Bisa dikombinasi dengan paginasi.
        </p>
      </section>

      <section id="akses" className="mt-12">
        <h2 className="text-lg font-medium">Akses situs susah</h2>
        <p className="mt-2 text-sm text-muted">
          Cookies: buat halaman butuh login, login dulu di browser, copy cookies, paste ke textarea
          Cookies di form job dengan format name=value per baris. Cookies dikirim ke halaman target.
        </p>
        <p className="mt-2 text-sm text-muted">
          Proxies: satu per baris format http://user:pass@ip:port, dirotasi round-robin per halaman.
          Berguna buat situs yang rate limit per IP.
        </p>
        <p className="mt-2 text-sm text-muted">
          Stealth: init script ngangkat ambang deteksi headless minimum. Jujur ya, ini bukan
          anti-bot sempurna. Cloudflare challenge kelas berat dan Google reCAPTCHA masih bisa nolak.
          Buat target segitu, pakai sumber API atau feed sebagai gantinya.
        </p>
      </section>

      <section id="otomasi" className="mt-12">
        <h2 className="text-lg font-medium">Otomasi</h2>
        <p className="mt-2 text-sm text-muted">
          Schedule cron: isi cron 5 field di form job, job jalan otomatis sesuai jadwal. Rantai
          schedule berhenti sendiri kalau schedule dihapus dari config. Contoh: 0 9 * * * artinya
          tiap hari jam 9 pagi.
        </p>
        <p className="mt-2 text-sm text-muted">
          Webhook: isi URL webhook, sistem POST JSON ke URL itu setiap run selesai, berisi event,
          jobId, runId, status, rowCount, dan error kalau ada.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`{
  "event": "run.completed",
  "jobId": "uuid",
  "runId": "uuid",
  "status": "done",
  "rowCount": 20,
  "error": null,
  "finishedAt": "2026-10-31T10:00:00.000Z"
}`}
        </pre>
      </section>

      <section id="perubahan" className="mt-12">
        <h2 className="text-lg font-medium">Change detection</h2>
        <p className="mt-2 text-sm text-muted">
          Halaman hasil run menampilkan diff terhadap run sebelumnya yang selesai: berapa baris
          baru, hilang, dan sama, plus contoh barisnya. Baris yang berubah muncul sebagai satu
          hilang plus satu baru, itu semantics set-diff yang jujur. Berguna buat monitoring harga,
          stok, atau konten.
        </p>
      </section>

      <section id="kuota" className="mt-12">
        <h2 className="text-lg font-medium">Kuota</h2>
        <p className="mt-2 text-sm text-muted">
          Tiap akun dibatasi 50 run per hari, reset tengah malam UTC. Pemakaian tampil di halaman
          overview dashboard. Kalau habis, trigger run balik error 429 QUOTA_EXCEEDED.
        </p>
      </section>

      <section id="api" className="mt-12">
        <h2 className="text-lg font-medium">API dan export</h2>
        <p className="mt-2 text-sm text-muted">
          Bikin API key di halaman API Keys, plaintext cuma ditampil sekali, disimpan sebagai hash.
          Pakai key itu buat tarik hasil dari aplikasi lain:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`# List job
curl https://domain-lo.com/api/v1/jobs \\
  -H "Authorization: Bearer <api-key>"

# Trigger run
curl -X POST https://domain-lo.com/api/v1/jobs/<id>/run \\
  -H "Authorization: Bearer <api-key>"

# Ambil hasil, JSON atau CSV
curl "https://domain-lo.com/api/v1/jobs/<id>/results" \\
  -H "Authorization: Bearer <api-key>"
curl "https://domain-lo.com/api/v1/jobs/<id>/results?format=csv" \\
  -H "Authorization: Bearer <api-key>"`}
        </pre>
        <p className="mt-2 text-sm text-muted">
          Dokumentasi endpoint lengkap ada di halaman{" "}
          <Link href="/docs" className="underline">
            API Docs
          </Link>
          .
        </p>
      </section>

      <section id="resep" className="mt-12">
        <h2 className="text-lg font-medium">Resep lengkap</h2>

        <h3 className="mt-6 text-sm font-medium">Monitor harga kompetitor</h3>
        <p className="mt-1 text-sm text-muted">
          Job web dengan container mode di halaman produk, paginasi URL pattern kalau listing
          multipage, schedule cron tiap pagi, webhook ke Telegram atau Slack. Buka halaman hasil
          run buat lihat perubahan harga lewat change detection.
        </p>

        <h3 className="mt-6 text-sm font-medium">Riset jurnal</h3>
        <p className="mt-1 text-sm text-muted">
          Job API ke OpenAlex atau Semantic Scholar dengan items path dan paginasi page number.
          Export CSV buat dibawa ke spreadsheet. Nggak ada risiko captcha karena API resmi.
        </p>

        <h3 className="mt-6 text-sm font-medium">Agregator berita</h3>
        <p className="mt-1 text-sm text-muted">
          Satu job feed per situs berita, atau sitemap crawl kalau butuh isi artikel lengkap bukan
          cuma headline. Schedule tiap jam, webhook ke database atau notifikasi.
        </p>

        <h3 className="mt-6 text-sm font-medium">Monitoring komunitas</h3>
        <p className="mt-1 text-sm text-muted">
          Job API ke Reddit JSON endpoint dengan items path ke children komentar. Change detection
          ngasih tau kapan ada komentar baru di thread yang dipantau.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Langkah berikutnya</h2>
        <p className="mt-2 text-sm text-muted">
          Buka{" "}
          <Link href="/dashboard/jobs/new" className="underline">
            New Job
          </Link>{" "}
          dan coba salah satu resep di atas. Kalau butuh detail teknis endpoint, halaman{" "}
          <Link href="/docs" className="underline">
            API Docs
          </Link>{" "}
          lengkapnya.
        </p>
      </section>
    </main>
  );
}
