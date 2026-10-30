import Link from "next/link";
import { logout } from "./actions";

const navLinkClass = "text-sm text-muted transition-colors hover:text-ink";

export function DashboardNav({ email }: { email: string }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          ScrapeDesk
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className={navLinkClass}>
            Overview
          </Link>
          <Link href="/dashboard/jobs" className={navLinkClass}>
            Jobs
          </Link>
          <Link href="/dashboard/keys" className={navLinkClass}>
            API Keys
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-subtle sm:block">{email}</span>
          <form action={logout}>
            <button type="submit" className="text-sm text-muted transition-colors hover:text-ink">
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
