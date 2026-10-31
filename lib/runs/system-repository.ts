import { createAdminClient } from "@/lib/supabase/admin";
import type { Job } from "@/lib/jobs/types";
import type { ScrapedRow } from "@/lib/scrape/types";
import type { Run } from "./types";

export async function getJobForSystem(jobId: string): Promise<Job | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();

  if (error) return null;
  return data as Job;
}

export async function createRunForJob(jobId: string): Promise<Run> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_runs")
    .insert({ job_id: jobId, trigger: "schedule" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Run;
}

export async function markRunRunning(runId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("job_runs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) throw new Error(error.message);
}

export async function markRunDone(runId: string, rowCount: number): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("job_runs")
    .update({
      status: "done",
      row_count: rowCount,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) throw new Error(error.message);
}

export async function markRunFailed(runId: string, message: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("job_runs")
    .update({
      status: "failed",
      error: message,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) throw new Error(error.message);
}

export async function insertResults(runId: string, rows: ScrapedRow[]): Promise<void> {
  if (rows.length === 0) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("results")
    .insert(rows.map((data) => ({ run_id: runId, data })));

  if (error) throw new Error(error.message);
}
