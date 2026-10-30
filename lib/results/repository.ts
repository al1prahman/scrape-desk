import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/jobs/types";
import type { Run } from "@/lib/runs/types";
import type { ScrapedRow } from "@/lib/scrape/types";

export type ResultsPage = {
  rows: ScrapedRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type RunWithJob = {
  run: Run;
  job: Job;
};

export async function getRunWithJob(runId: string): Promise<RunWithJob | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_runs")
    .select("*, job:jobs(*)")
    .eq("id", runId)
    .single();

  if (error || !data) return null;

  const { job, ...run } = data;
  return { run: run as Run, job: job as Job };
}

export async function getResults(runId: string, page = 1, pageSize = 50): Promise<ResultsPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("results")
    .select("data", { count: "exact" })
    .eq("run_id", runId)
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []).map((row) => row.data as ScrapedRow),
    page,
    pageSize,
    total: count ?? 0,
  };
}
