import { createClient } from "@/lib/supabase/server";
import type { ScrapedRow } from "@/lib/scrape/types";
import { diffResults, MAX_DIFF_ROWS } from "./diff-logic";

export { diffResults };
export type { ChangeSummary } from "./diff-logic";

// Ambil run sebelumnya yang udah selesai buat job yang sama.
// Urutan pakai queued_at karena id uuid random, bukan urutan waktu.
export async function getPreviousRunResults(
  jobId: string,
  beforeQueuedAt: string,
): Promise<ScrapedRow[]> {
  const supabase = await createClient();

  const { data: previousRun } = await supabase
    .from("job_runs")
    .select("id")
    .eq("job_id", jobId)
    .eq("status", "done")
    .lt("queued_at", beforeQueuedAt)
    .order("queued_at", { ascending: false })
    .limit(1)
    .single();

  if (!previousRun) return [];

  const { data, error } = await supabase
    .from("results")
    .select("data")
    .eq("run_id", previousRun.id)
    .order("id", { ascending: true })
    .limit(MAX_DIFF_ROWS);

  if (error) return [];
  return (data ?? []).map((row) => row.data as ScrapedRow);
}
