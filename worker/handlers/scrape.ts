import type { Job as BossJob } from "pg-boss";
import {
  getJobForSystem,
  insertResults,
  markRunDone,
  markRunFailed,
  markRunRunning,
} from "@/lib/runs/system-repository";
import { scrapeUrl } from "@/lib/scrape/engine";
import type { ScrapeJobData } from "@/lib/queue/enqueue";

async function processScrape(data: ScrapeJobData) {
  const { runId, jobId } = data;

  const jobRow = await getJobForSystem(jobId);
  if (!jobRow) {
    await markRunFailed(runId, "Job tidak ditemukan");
    return;
  }

  await markRunRunning(runId);

  try {
    const rows = await scrapeUrl(jobRow.target_url, jobRow.config);
    await insertResults(runId, rows);
    await markRunDone(runId, rows.length);
  } catch (error) {
    await markRunFailed(runId, error instanceof Error ? error.message : "Scrape gagal");
  }
}

// pg-boss mengirim job dalam batch array, bukan satu per satu.
export async function handleScrapeJob(jobs: BossJob<ScrapeJobData>[]) {
  for (const job of jobs) {
    await processScrape(job.data);
  }
}
