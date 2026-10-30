import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

const steps = [
  {
    title: "Define target",
    description:
      "Masukin URL halaman dan field yang mau diekstrak pakai CSS selector. Simpan sebagai job.",
  },
  {
    title: "Run",
    description:
      "Klik Run Now atau panggil API. Job masuk queue, worker scraping pakai Playwright, status update realtime.",
  },
  {
    title: "Ambil hasil",
    description:
      "Lihat tabel rapi di dashboard, export CSV atau JSON, atau tarik lewat public API pakai API key.",
  },
];

const features = [
  {
    title: "Realtime status",
    description: "Queued, running, done, atau failed. Update langsung via Supabase Realtime.",
  },
  {
    title: "Export CSV dan JSON",
    description: "Satu klik dari dashboard atau endpoint, langsung bisa dibuka di Excel.",
  },
  {
    title: "Public API",
    description: "Submit job dan tarik hasil dari aplikasi lo sendiri pakai API key.",
  },
  {
    title: "Queue based",
    description: "pg-boss di Postgres, nggak perlu Redis. Worker jalan terpisah dari web.",
  },
  {
    title: "Isolasi per user",
    description: "Row Level Security di level database, tiap user cuma lihat data sendiri.",
  },
  {
    title: "Run history",
    description: "Setiap eksekusi tersimpan sendiri-sendiri, hasil nggak saling nimpa.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6">
      <section className="flex min-h-screen flex-col justify-center py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-subtle">scrape-desk</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Data dari web,
          <br />
          jadi terstruktur.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Define target URL dan field ekstraksi sekali, jalankan kapan saja, ambil hasilnya lewat
          dashboard atau API. Nggak perlu maintain script scraping sendiri.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/register" className={buttonClass("primary")}>
            Mulai gratis
          </Link>
          <Link href="/docs" className={buttonClass("secondary")}>
            Lihat API docs
          </Link>
        </div>
      </section>

      <section className="border-t border-line py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Cara kerja</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-card border border-line bg-surface p-6">
              <span className="font-mono text-xs text-subtle">0{index + 1}</span>
              <h3 className="mt-3 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Satu baris curl, dapat data</h2>
        <pre className="mt-6 overflow-x-auto rounded-card border border-line bg-surface p-5 font-mono text-xs text-ink">
          {`curl -X POST https://domain-lo.com/api/v1/jobs \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Harga kompetitor", "targetUrl": "https://contoh.com/listing",
        "fields": [{ "name": "title", "selector": "h2.title" }] }'`}
        </pre>
      </section>

      <section className="border-t border-line py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Fitur</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.title}>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted">{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Siap mulai?</h2>
        <p className="mt-3 text-muted">Bikin akun, jalanin run pertama dalam 2 menit.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/register" className={buttonClass("primary")}>
            Mulai gratis
          </Link>
          <Link href="/login" className={buttonClass("secondary")}>
            Masuk
          </Link>
        </div>
      </section>
    </main>
  );
}
