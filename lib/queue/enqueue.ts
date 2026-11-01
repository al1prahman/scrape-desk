import PgBoss from "pg-boss";
import { env } from "@/lib/env";

export const SCRAPE_QUEUE = "scrape";

export type ScrapeJobData = {
  jobId: string;
  runId?: string;
  scheduled?: boolean;
};

// Instance short-lived, aman dipanggil dari server action atau environment serverless.
// Worker memakai instance long-lived sendiri lewat createBoss.
export async function enqueueScrape(data: ScrapeJobData): Promise<void> {
  const boss = new PgBoss({ connectionString: env.DATABASE_URL, max: 1 });
  await boss.start();
  try {
    // pg-boss v10 join send ke tabel queue, queue yang belum ada bikin insert gagal senyap.
    await boss.createQueue(SCRAPE_QUEUE);
    const jobId = await boss.send(SCRAPE_QUEUE, data, {
      // Retry dengan exponential backoff: attempt 1 gagal tunggu 30 detik,
      // attempt 2 tunggu 60 detik. Handler nge-throw buat memicu retry.
      retryLimit: 2,
      retryDelay: 30,
      retryBackoff: true,
    });
    if (!jobId) {
      throw new Error(`Enqueue gagal untuk queue ${SCRAPE_QUEUE}`);
    }
  } finally {
    await boss.stop();
  }
}
