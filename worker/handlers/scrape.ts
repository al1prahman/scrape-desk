import type { Job as BossJob } from "pg-boss";
import { scrapeJob } from "@/lib/scrape/engine";
import {
  createRunForJob,
  getJobForSystem,
  insertResults,
  markRunDone,
  markRunFailed,
  markRunRunning,
} from "@/lib/runs/system-repository";
import { notifyWebhook } from "@/lib/webhooks/notify";
import { scheduleNextRun } from "@/lib/queue/schedule";
import type { ScrapeJobData } from "@/lib/queue/enqueue";

async function processScrape(data: ScrapeJobData) {
  const { jobId } = data;

  const jobRow = await getJobForSystem(jobId);
  if (!jobRow) {
    if (data.runId) {
      await markRunFailed(data.runId, "Job tidak ditemukan");
    }
    return;
  }

  // Run dari scheduler nggak bawa runId, jadi dibuat di sini.
  const runId = data.runId ?? (await createRunForJob(jobId)).id;

  await markRunRunning(runId);

  let status: "done" | "failed" = "failed";
  let rowCount = 0;
  let errorMessage: string | null = null;

  try {
    const rows = await scrapeJob(jobRow.target_url, jobRow.config);
    await insertResults(runId, rows);
    await markRunDone(runId, rows.length);
    status = "done";
    rowCount = rows.length;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Scrape gagal";
    await markRunFailed(runId, errorMessage);
  }

  if (jobRow.config.webhookUrl) {
    await notifyWebhook(jobRow.config.webhookUrl, {
      event: "run.completed",
      jobId,
      runId,
      status,
      rowCount,
      error: errorMessage,
      finishedAt: new Date().toISOString(),
    });
  }

  // Run terjadwal menjadwalkan run berikutnya. Kalau schedule udah dihapus
  // dari config, rantai berhenti sendiri.
  if (data.scheduled && jobRow.config.schedule) {
    await scheduleNextRun(jobId, jobRow.config.schedule.cron);
  }
}

// pg-boss mengirim job dalam batch array, bukan satu per satu.
export async function handleScrapeJob(jobs: BossJob<ScrapeJobData>[]) {
  for (const job of jobs) {
    await processScrape(job.data);
  }
}
