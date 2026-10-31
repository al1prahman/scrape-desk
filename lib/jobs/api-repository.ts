import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateJobInput } from "@/lib/validation/jobs";
import type { Job } from "./types";
import type { Run } from "@/lib/runs/types";
import type { ScrapedRow } from "@/lib/scrape/types";

// Operasi untuk public API: tanpa session user, scoping eksplisit per user_id
// lewat admin client. RLS sengaja di-bypass, jadi filter user_id wajib ada
// di setiap query, itu satu-satunya yang menjaga isolasi data.

export async function listJobsForUser(userId: string): Promise<Job[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Job[];
}

export async function getJobForUser(userId: string, jobId: string): Promise<Job | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as Job;
}

export async function createJobForUser(userId: string, input: CreateJobInput): Promise<Job> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: userId,
      name: input.name,
      target_url: input.targetUrl,
      config: input.config,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}

export async function createRunForJob(jobId: string): Promise<Run> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_runs")
    .insert({ job_id: jobId, trigger: "api" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Run;
}

export async function getLatestDoneRun(jobId: string): Promise<Run | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_id", jobId)
    .eq("status", "done")
    .order("queued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Run;
}

export async function getResultsForRun(runId: string): Promise<ScrapedRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("results")
    .select("data")
    .eq("run_id", runId)
    .order("id", { ascending: true })
    .limit(10000);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.data as ScrapedRow);
}
