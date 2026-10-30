import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-subtle">scrape-desk</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Data dari web, jadi terstruktur.
      </h1>
      <p className="mt-4 text-lg text-muted">
        Define target URL dan field ekstraksi sekali, jalankan kapan saja, ambil hasilnya lewat
        dashboard atau API.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/register" className={buttonClass("primary")}>
          Mulai gratis
        </Link>
        <Link href="/login" className={buttonClass("secondary")}>
          Masuk
        </Link>
      </div>
    </main>
  );
}
