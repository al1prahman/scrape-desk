import { createClient } from "@/lib/supabase/server";
import type { Run, RunTrigger } from "./types";

export async function createRun(jobId: string, trigger: RunTrigger): Promise<Run> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_runs")
    .insert({ job_id: jobId, trigger })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Run;
}

export async function listRuns(jobId: string): Promise<Run[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_id", jobId)
    .order("queued_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data as Run[];
}
