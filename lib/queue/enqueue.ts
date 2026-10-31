import PgBoss from "pg-boss";
import { env } from "@/lib/env";

export const SCRAPE_QUEUE = "scrape";

export type ScrapeJobData = {
  jobId: string;
  runId?: string;
};

// Instance short-lived, aman dipanggil dari server action atau environment serverless.
// Worker memakai instance long-lived sendiri lewat createBoss.
export async function enqueueScrape(data: ScrapeJobData): Promise<void> {
  const boss = new PgBoss({ connectionString: env.DATABASE_URL, max: 1 });
  await boss.start();
  try {
    // pg-boss v10 join send ke tabel queue, queue yang belum ada bikin insert gagal senyap.
    await boss.createQueue(SCRAPE_QUEUE);
    const jobId = await boss.send(SCRAPE_QUEUE, data);
    if (!jobId) {
      throw new Error(`Enqueue gagal untuk queue ${SCRAPE_QUEUE}`);
    }
  } finally {
    await boss.stop();
  }
}
