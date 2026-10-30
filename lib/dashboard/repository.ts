import { createClient } from "@/lib/supabase/server";
import type { Run } from "@/lib/runs/types";

export type DashboardStats = {
  jobCount: number;
  runCount: number;
  rowCount: number;
  recentRuns: (Run & { job_name: string })[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [jobs, runs, results, recent] = await Promise.all([
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("job_runs").select("*", { count: "exact", head: true }),
    supabase.from("results").select("*", { count: "exact", head: true }),
    supabase
      .from("job_runs")
      .select("*, job:jobs(name)")
      .order("queued_at", { ascending: false })
      .limit(5),
  ]);

  return {
    jobCount: jobs.count ?? 0,
    runCount: runs.count ?? 0,
    rowCount: results.count ?? 0,
    recentRuns: (recent.data ?? []).map((row) => {
      const { job, ...run } = row;
      return {
        ...(run as Run),
        job_name: (job as { name: string } | null)?.name ?? "-",
      };
    }),
  };
}
