import { createClient } from "@/lib/supabase/server";
import type { ScrapedRow } from "@/lib/scrape/types";

// Cap biar diff nggak berat buat job dengan ribuan rows.
const MAX_DIFF_ROWS = 1000;

export type ChangeSummary = {
  added: number;
  removed: number;
  unchanged: number;
  samples: {
    added: ScrapedRow[];
    removed: ScrapedRow[];
  };
};

// Identitas baris dari hash isi row, jadi perubahan posisi nggak dihitung.
// Baris yang berubah muncul sebagai satu removed plus satu added, itu
// semantics set-diff yang jujur tanpa butuh stable key dari user.
function rowKey(row: ScrapedRow): string {
  return JSON.stringify(row, Object.keys(row).sort());
}

export function diffResults(previous: ScrapedRow[], current: ScrapedRow[]): ChangeSummary {
  const previousKeys = new Set(
    previous.slice(0, MAX_DIFF_ROWS).map((row) => rowKey(row)),
  );
  const currentKeys = new Set(current.slice(0, MAX_DIFF_ROWS).map((row) => rowKey(row)));

  const added: ScrapedRow[] = [];
  const removed: ScrapedRow[] = [];
  let unchanged = 0;

  for (const row of current.slice(0, MAX_DIFF_ROWS)) {
    if (previousKeys.has(rowKey(row))) {
      unchanged++;
    } else {
      added.push(row);
    }
  }

  for (const row of previous.slice(0, MAX_DIFF_ROWS)) {
    if (!currentKeys.has(rowKey(row))) {
      removed.push(row);
    }
  }

  return {
    added: added.length,
    removed: removed.length,
    unchanged,
    samples: {
      added: added.slice(0, 3),
      removed: removed.slice(0, 3),
    },
  };
}

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
