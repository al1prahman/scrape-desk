import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard/repository";
import { getQuotaStatus } from "@/lib/quota/check";
import { createClient } from "@/lib/supabase/server";
import { buttonClass } from "@/components/ui/button";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-wider text-subtle">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const stats = await getDashboardStats();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const quota = user ? await getQuotaStatus(user.id) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <Link href="/dashboard/jobs/new" className={buttonClass("primary")}>
          New Job
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Jobs" value={stats.jobCount} />
        <StatCard label="Runs" value={stats.runCount} />
        <StatCard label="Rows scraped" value={stats.rowCount} />
      </div>
      {quota && (
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-subtle">Kuota run hari ini</p>
          <p className="mt-2 text-2xl font-semibold">
            {quota.used.toLocaleString("id-ID")}
            <span className="text-base text-muted"> / {quota.limit.toLocaleString("id-ID")}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-subtle">
            {quota.remaining > 0
              ? `Sisa ${quota.remaining} run hari ini, reset tengah malam UTC.`
              : "Kuota hari ini habis, reset tengah malam UTC."}
          </p>
        </div>
      )}
      <section>
        <h2 className="text-lg font-medium">Run terbaru</h2>
        {stats.recentRuns.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Belum ada run.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.recentRuns.map((run) => (
              <li
                key={run.id}
                className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-sm"
              >
                <Link href={`/dashboard/jobs/${run.job_id}`} className="hover:underline">
                  {run.job_name}
                </Link>
                <span className="text-muted">{run.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
