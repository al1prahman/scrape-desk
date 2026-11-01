import Link from "next/link";

const sections = [
  { id: "konsep", label: "1. Konsep dasar" },
  { id: "daftar", label: "2. Daftar dan login" },
  { id: "job-pertama", label: "3. Job pertama" },
  { id: "scraping", label: "4. Cara scraping" },
  { id: "ai-mode", label: "5. AI mode" },
  { id: "cron", label: "6. Cron job" },
  { id: "webhook", label: "7. Webhook" },
  { id: "transform", label: "8. Transformasi data" },
  { id: "perubahan", label: "9. Change detection" },
  { id: "api", label: "10. Cara pakai API" },
  { id: "export", label: "11. Export hasil" },
  { id: "troubleshooting", label: "12. Troubleshooting" },
];

export default function TutorialPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-subtle">scrape-desk</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Tutorial Lengkap</h1>
      <p className="mt-3 text-muted">
        Panduan step by step pakai ScrapeDesk dari nol sampai mahir. Setiap section bisa dibaca
        sendiri-sendiri, tapi kalau baru pertama kali ikuti urutan dari atas.
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
        <h2 className="text-lg font-medium">1. Konsep dasar</h2>
        <p className="mt-2 text-sm text-muted">
          ScrapeDesk punya tiga objek utama. Pahami ini dulu, sisanya gampang.
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-card border border-line bg-surface p-4">
            <span className="text-sm font-medium">Job</span>
            <p className="mt-1 text-sm text-muted">
              Resep scraping. Isinya: target URL, sumber data, aturan ekstraksi, dan opsi tambahan
              kayak schedule atau webhook. Satu job bisa di-run berkali-kali.
            </p>
          </div>
          <div className="rounded-card border border-line bg-surface p-4">
            <span className="text-sm font-medium">Run</span>
            <p className="mt-1 text-sm text-muted">
              Satu eksekusi job. Punya status: queued (nunggu di antrian), running (lagi diproses
              worker), done (berhasil), failed (gagal setelah retry).
            </p>
          </div>
          <div className="rounded-card border border-line bg-surface p-4">
            <span className="text-sm font-medium">Results</span>
            <p className="mt-1 text-sm text-muted">
              Baris data hasil satu run. Bisa dilihat di dashboard, diexport CSV/JSON, atau ditarik
              lewat API.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          Alur lengkap: lo bikin job, klik Run, job masuk antrian, worker ngambil dan nge-scrape,
          hasil masuk database, lo lihat atau tarik hasilnya.
        </p>
      </section>

      <section id="daftar" className="mt-12">
        <h2 className="text-lg font-medium">2. Daftar dan login</h2>
        <p className="mt-2 text-sm text-muted">
          Buka halaman register, isi email dan password. Setelah login lo masuk ke dashboard yang
          nampilin overview: jumlah job, jumlah run, total rows, dan kuota harian.
        </p>
        <p className="mt-2 text-sm text-muted">
          Tiap akun punya data sendiri yang terisolasi di database. Akun lo nggak bisa lihat job
          atau hasil akun orang lain.
        </p>
      </section>

      <section id="job-pertama" className="mt-12">
        <h2 className="text-lg font-medium">3. Job pertama</h2>
        <p className="mt-2 text-sm text-muted">
          Contoh paling simpel: scraping daftar buku dari books.toscrape.com.
        </p>
        <ol className="mt-3 space-y-2 text-sm text-muted">
          <li>1. Klik New Job di dashboard.</li>
          <li>2. Isi Nama job, misal Buku latihan.</li>
          <li>
            3. Isi Target URL:{" "}
            <span className="font-mono text-ink">https://books.toscrape.com/</span>
          </li>
          <li>4. Sumber data biarin Web Page.</li>
          <li>5. Mode ekstraksi pilih CSS Selector.</li>
          <li>6. Isi Container selector: article.product_pod</li>
          <li>
            7. Tambah dua field: title dengan selector{" "}
            <span className="font-mono text-ink">h3 a</span>, dan price dengan selector{" "}
            <span className="font-mono text-ink">p.price_color</span>.
          </li>
          <li>8. Simpan, buka halaman job, klik Run sekarang.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Status run update realtime. Selesai, klik hasil run buat lihat 20 baris data. Itu flow
          dasar semua job di sistem ini.
        </p>
      </section>

      <section id="scraping" className="mt-12">
        <h2 className="text-lg font-medium">4. Cara scraping</h2>
        <p className="mt-2 text-sm text-muted">
          Ada empat sumber data. Pilih di form New Job, form ngikutin otomatis.
        </p>

        <h3 className="mt-6 text-sm font-medium">Web Page, buat halaman HTML</h3>
        <p className="mt-1 text-sm text-muted">
          Browser asli render halaman termasuk JavaScript. Cocok buat blog, news, listing produk,
          komunitas. Tiga mode ekstraksi:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          <li>
            - CSS Selector: tiap field punya selector, baris disusun per index. Cocok buat halaman
            di mana tiap field muncul urut dan sama banyak.
          </li>
          <li>
            - Container: isi container selector, tiap elemen match jadi satu baris, field relatif di
            dalam container. Field nggak bisa bocor antar baris. Ini cara bener buat listing page.
          </li>
          <li>
            - AI Extract: tulis instruksi bahasa natural, LLM yang ekstrak. Cocok buat halaman
            berantakan.
          </li>
        </ul>
        <p className="mt-2 text-sm text-muted">
          Navigasi: paginasi dua mode (tombol next atau URL pattern dengan tanda {"{page}"}) dan
          infinite scroll. Bisa dikombinasi. Akses situs susah: cookies buat halaman butuh login,
          proxy dirotasi per halaman, dan stealth init script buat ngangkat ambang deteksi headless.
        </p>

        <h3 className="mt-6 text-sm font-medium">JSON API, buat data terstruktur</h3>
        <p className="mt-1 text-sm text-muted">
          Fetch JSON dari API manapun. Field dipetakan lewat dot path, support array index seperti
          authors[0].name. Paginasi tiga mode: page number, cursor, next link.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh jurnal dari OpenAlex:

Target URL:  https://api.openalex.org/works?search=quantum&per-page=25
Sumber:      JSON API
Items path:  results
Fields:      title -> title
             year  -> publication_year
             cited -> cited_by_count
Paginasi:    Page number, param "page", 10 halaman`}
        </pre>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh komentar Reddit:

Target URL:  https://www.reddit.com/r/programmerhumor/comments/<id>.json
Sumber:      JSON API
Items path:  1.data.children
Fields:      body   -> data.body
             author -> data.author
             score  -> data.score`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">RSS/Atom Feed, buat berita</h3>
        <p className="mt-1 text-sm text-muted">
          Parse feed jadi kolom title, link, date, summary. Nggak perlu config ekstraksi, paling
          reliable buat berita karena hampir semua situs berita punya feed.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Target URL:  https://feeds.bbci.co.uk/news/rss.xml
Sumber:      RSS/Atom Feed
Limit:       50`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">Sitemap Crawl, buat seluruh isi situs</h3>
        <p className="mt-1 text-sm text-muted">
          Ambil semua URL dari sitemap.xml termasuk sitemap index, terus scraping tiap halaman
          pakai aturan web. Filter URL dan batas jumlah URL.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Target URL:  https://domain-blog.com/sitemap.xml
Sumber:      Sitemap Crawl
Filter URL:  /blog/
Maks URL:    100
Fields:      title -> h1.post-title
             date  -> time`}
        </pre>
      </section>

      <section id="ai-mode" className="mt-12">
        <h2 className="text-lg font-medium">5. AI mode, cara pakai</h2>
        <p className="mt-2 text-sm text-muted">
          AI mode cocok buat halaman yang selector-nya nggak stabil atau strukturnya berantakan.
          Alih-alih nulis selector, lo tulis instruksi bahasa natural dan schema field yang mau
          diambil.
        </p>
        <p className="mt-2 text-sm text-muted">Cara pakai:</p>
        <ol className="mt-2 space-y-2 text-sm text-muted">
          <li>1. Di form New Job, pilih mode ekstraksi AI Extract.</li>
          <li>
            2. Tulis Instruksi ekstraksi, misal &quot;Ambil nama produk, harga, dan rating untuk
            setiap item di halaman ini&quot;.
          </li>
          <li>
            3. Tambah Schema output: tiap field punya nama dan deskripsi. Misal nama price dengan
            deskripsi &quot;harga dalam rupiah, angka saja&quot;.
          </li>
          <li>4. Simpan dan run seperti biasa.</li>
        </ol>
        <p className="mt-2 text-sm text-muted">
          Yang terjadi di belakang layar: halaman di-render, HTML dibersihin jadi markdown (buang
          navigasi, footer, iklan), markdown dikirim ke LLM bersama instruksi dan schema, LLM balik
          JSON, JSON diparse jadi rows.
        </p>
        <p className="mt-2 text-sm text-muted">
          Butuh endpoint LLM OpenAI-compatible. Set env LLM_BASE_URL, LLM_API_KEY, dan LLM_MODEL.
          Bisa colok ke provider mana pun, termasuk model lokal. Kalau selector stabil, CSS mode
          lebih cepat dan lebih murah. AI mode itu buat kasus yang CSS nggak sanggup.
        </p>
      </section>

      <section id="cron" className="mt-12">
        <h2 className="text-lg font-medium">6. Cron job, cara pakai</h2>
        <p className="mt-2 text-sm text-muted">
          Cron bikin job jalan otomatis sesuai jadwal. Di form job, ada field Schedule cron di
          section Otomasi.
        </p>
        <p className="mt-2 text-sm text-muted">Format cron 5 field, dipisah spasi:</p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`menit  jam  hari-dalam-bulan  bulan  hari-dalam-minggu

0 9 * * *      tiap hari jam 9 pagi
*/30 * * * *   tiap 30 menit
0 8 * * 1      tiap Senin jam 8 pagi
0 0 1 * *      tanggal 1 tiap bulan jam 12 malam`}
        </pre>
        <p className="mt-2 text-sm text-muted">
          Isi cron, simpan job, sistem otomatis jalanin sesuai jadwal. Tiap run terjadwal bikin run
          row baru dengan trigger schedule. Kalau cron dihapus dari config job, rantai jadwal
          berhenti sendiri, nggak ada run nyangkut.
        </p>
        <p className="mt-2 text-sm text-muted">
          Ingat kuota: run terjadwal tetap dihitung ke kuota harian 50 run. Kalau kuota habis, run
          balik error 429.
        </p>
      </section>

      <section id="webhook" className="mt-12">
        <h2 className="text-lg font-medium">7. Webhook, cara pakai</h2>
        <p className="mt-2 text-sm text-muted">
          Webhook bikin sistem ngabarin URL lo setiap run selesai. Isi field Webhook URL di section
          Otomasi, misal https://domain-lo.com/webhook.
        </p>
        <p className="mt-2 text-sm text-muted">Setiap run selesai, sistem POST JSON ke URL itu:</p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`{
  "event": "run.completed",
  "jobId": "uuid-job",
  "runId": "uuid-run",
  "status": "done",
  "rowCount": 20,
  "error": null,
  "finishedAt": "2026-10-31T10:00:00.000Z"
}`}
        </pre>
        <p className="mt-2 text-sm text-muted">
          Verifikasi tanda tangan: kalau environment WEBHOOK_SECRET diset, payload ditandatangani
          HMAC-SHA256 dan dikirim di header X-ScrapeDesk-Signature dengan format sha256=hex. Buat
          verifikasi di receiver, hitung HMAC-SHA256 dari raw body pakai secret yang sama, bandingin
          hasilnya.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`// Contoh verifikasi di Node.js
import { createHmac } from "node:crypto";

const expected = createHmac("sha256", process.env.WEBHOOK_SECRET)
  .update(rawBody)
  .digest("hex");
const received = req.headers["x-scrapedesk-signature"]
  ?.replace("sha256=", "");
if (expected !== received) return res.status(401).end();`}
        </pre>
      </section>

      <section id="transform" className="mt-12">
        <h2 className="text-lg font-medium">8. Transformasi data, cara pakai</h2>
        <p className="mt-2 text-sm text-muted">
          Transform dijalanin berurutan setelah ekstraksi, sebelum hasil disimpan. Ada di form job
          mode CSS, section Transformasi data. Delapan jenis:
        </p>
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p>
            - Regex extract: narik bagian teks pakai pola regex, misal angka dari &quot;£51.77&quot;.
          </p>
          <p>- Ambil angka: buang simbol mata uang dan separator, hasil angka bersih.</p>
          <p>
            - Ganti teks: cari dan ganti, misal &quot;In stock&quot; jadi &quot;Tersedia&quot;.
          </p>
          <p>- Tambah depan atau belakang: nambah teks di awal atau akhir nilai.</p>
          <p>- Huruf kecil atau besar: normalisasi case.</p>
          <p>
            - Template kolom baru: bikin kolom baru dari kolom lain pakai tanda{" "}
            {"{{nama_field}}"}.
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">
          Tiap transform punya field sumber dan kolom tujuan. Kolom tujuan kosong berarti nimpa field
          asal, diisi berarti bikin kolom baru dan asal tetap ada. Transform berurutan, jadi
          transform kedua bisa pakai hasil transform pertama.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`Contoh: harga £51.77 mau jadi kolom angka dan label siap pakai

Transform 1: Ambil angka, field price, target priceNumber
Transform 2: Template "{{title}} - {{priceNumber}}", target kartu

Hasil: title       = "A Light in the ..."
       price       = "£51.77"
       priceNumber = "51.77"
       kartu       = "A Light in the ... - 51.77"`}
        </pre>
      </section>

      <section id="perubahan" className="mt-12">
        <h2 className="text-lg font-medium">9. Change detection</h2>
        <p className="mt-2 text-sm text-muted">
          Halaman hasil run nampilin diff terhadap run sebelumnya yang selesai: berapa baris baru,
          hilang, dan sama, plus contoh barisnya. Baris yang berubah muncul sebagai satu hilang plus
          satu baru, itu semantics set-diff yang jujur.
        </p>
        <p className="mt-2 text-sm text-muted">
          Berguna buat monitoring: harga kompetitor turun, stok habis, artikel baru publish, komentar
          baru di thread. Kombinasikan dengan schedule cron dan webhook buat alerting otomatis.
        </p>
      </section>

      <section id="api" className="mt-12">
        <h2 className="text-lg font-medium">10. Cara pakai API</h2>
        <p className="mt-2 text-sm text-muted">
          API dipakai buat tarik hasil dari aplikasi lain atau script. Buka halaman API Keys, klik
          create key, plaintext cuma ditampil sekali. Simpan baik-baik.
        </p>
        <p className="mt-2 text-sm text-muted">
          Semua request butuh header Authorization: Bearer dengan key itu.
        </p>

        <h3 className="mt-6 text-sm font-medium">List job</h3>
        <pre className="mt-2 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`curl https://domain-lo.com/api/v1/jobs \\
  -H "Authorization: Bearer sk_live_xxx"`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">Bikin job</h3>
        <pre className="mt-2 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`curl -X POST https://domain-lo.com/api/v1/jobs \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Harga kompetitor",
    "targetUrl": "https://toko.com/produk",
    "config": {
      "mode": "css",
      "containerSelector": ".product",
      "fields": [
        { "name": "nama", "selector": "h2" },
        { "name": "harga", "selector": ".price" }
      ],
      "transforms": [
        { "type": "number", "field": "harga", "target": "hargaAngka" }
      ]
    }
  }'`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">Trigger run</h3>
        <pre className="mt-2 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`curl -X POST https://domain-lo.com/api/v1/jobs/<job-id>/run \\
  -H "Authorization: Bearer sk_live_xxx"`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">Ambil hasil, JSON atau CSV</h3>
        <pre className="mt-2 overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs text-ink">
          {`# JSON
curl "https://domain-lo.com/api/v1/jobs/<job-id>/results" \\
  -H "Authorization: Bearer sk_live_xxx"

# CSV, langsung bisa dibuka di Excel
curl "https://domain-lo.com/api/v1/jobs/<job-id>/results?format=csv" \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -o hasil.csv`}
        </pre>

        <h3 className="mt-6 text-sm font-medium">Error code</h3>
        <div className="mt-2 space-y-1 text-sm text-muted">
          <p>- 400 VALIDATION_ERROR: input nggak valid, cek pesan error.</p>
          <p>- 401 UNAUTHORIZED: API key salah atau nggak dikirim.</p>
          <p>- 404 NOT_FOUND: job nggak ada atau bukan milik lo.</p>
          <p>- 429 QUOTA_EXCEEDED: kuota harian habis, reset tengah malam UTC.</p>
          <p>- 500 INTERNAL_ERROR: error server.</p>
        </div>
        <p className="mt-2 text-sm text-muted">
          Spesifikasi lengkap format OpenAPI ada di file docs/openapi.yaml di repo, bisa di-import ke
          Postman atau Swagger UI.
        </p>
      </section>

      <section id="export" className="mt-12">
        <h2 className="text-lg font-medium">11. Export hasil</h2>
        <p className="mt-2 text-sm text-muted">
          Dua cara. Dari dashboard: buka halaman hasil run, ada tombol download CSV. Dari API: tambah
          query ?format=csv seperti di section 10. CSV-nya kompatibel Excel, nilai yang mengandung
          koma atau baris baru di-quote otomatis.
        </p>
      </section>

      <section id="troubleshooting" className="mt-12">
        <h2 className="text-lg font-medium">12. Troubleshooting</h2>
        <div className="mt-3 space-y-3 text-sm text-muted">
          <div>
            <span className="font-medium text-ink">Run nyangkut di status queued.</span>
            <p>
              Worker nggak jalan atau mati. Cek proses worker, start lagi dengan npm run worker.
              Worker dan web harus jalan barengan.
            </p>
          </div>
          <div>
            <span className="font-medium text-ink">Run done tapi 0 rows.</span>
            <p>
              Selector nggak match halaman, atau halaman target berubah struktur. Coba buka URL
              target di browser, inspect elemen, update selector. Kalau situs kasih halaman captcha,
              hasilnya juga kosong karena konten asli nggak ke-render.
            </p>
          </div>
          <div>
            <span className="font-medium text-ink">Run failed dengan error proxy.</span>
            <p>Proxy di config mati atau nggak bisa connect. Cek daftar proxy, ganti yang aktif.</p>
          </div>
          <div>
            <span className="font-medium text-ink">Error 429 pas trigger run.</span>
            <p>
              Kuota harian habis. Lihat sisa kuota di halaman overview, tunggu reset tengah malam
              UTC, atau naikin limit lewat env DAILY_RUN_QUOTA.
            </p>
          </div>
          <div>
            <span className="font-medium text-ink">AI mode balik hasil aneh.</span>
            <p>
              Instruksi kurang spesifik atau schema ambigu. Perjelas deskripsi tiap field, misal
              &quot;harga dalam rupiah, angka saja tanpa Rp&quot;.
            </p>
          </div>
          <div>
            <span className="font-medium text-ink">Halaman lama error.</span>
            <p>
              Kalau ada job yang dibuat sebelum fitur tertentu ada, config-nya bisa kurang field.
              Sistem normalize config otomatis, tapi kalau tetap error, edit dan simpan ulang job-nya
              biar config di-refresh.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Langkah berikutnya</h2>
        <p className="mt-2 text-sm text-muted">
          Buka{" "}
          <Link href="/dashboard/jobs/new" className="underline">
            New Job
          </Link>{" "}
          dan coba bikin job pertama lo. Kalau butuh detail teknis endpoint, halaman{" "}
          <Link href="/docs" className="underline">
            API Docs
          </Link>{" "}
          lengkapnya.
        </p>
      </section>
    </main>
  );
}
