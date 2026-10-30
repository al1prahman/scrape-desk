"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Run } from "@/lib/runs/types";

const statusStyles: Record<Run["status"], string> = {
  queued: "border-line text-muted",
  running: "border-amber-500/40 text-amber-400",
  done: "border-emerald-500/40 text-emerald-400",
  failed: "border-red-500/40 text-red-400",
  cancelled: "border-line text-subtle",
};

export function RunMonitor({ jobId, initialRuns }: { jobId: string; initialRuns: Run[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`runs:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_runs",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const updated = payload.new as Run;
          setRuns((prev) => {
            if (prev.some((run) => run.id === updated.id)) {
              return prev.map((run) => (run.id === updated.id ? updated : run));
            }
            return [updated, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, jobId]);

  if (runs.length === 0) {
    return <p className="text-sm text-muted">Belum ada run. Klik Run Now buat mulai.</p>;
  }

  return (
    <ul className="space-y-2">
      {runs.map((run) => (
        <li
          key={run.id}
          className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs ${statusStyles[run.status]}`}
            >
              {run.status}
            </span>
            <span className="text-xs text-subtle">
              {new Date(run.queued_at).toLocaleString("id-ID")}
            </span>
            {run.status === "done" ? (
              <Link
                href={`/dashboard/jobs/${jobId}/runs/${run.id}`}
                className="text-xs text-ink underline"
              >
                {run.row_count} rows
              </Link>
            ) : null}
          </div>
          <div className="text-xs text-muted">
            {run.status === "failed" ? run.error : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
