import PgBoss from "pg-boss";
import { env } from "@/lib/env";

export const SCRAPE_QUEUE = "scrape";

export type ScrapeJobData = {
  runId: string;
  jobId: string;
};

// Instance short-lived, aman dipanggil dari server action atau environment serverless.
// Worker memakai instance long-lived sendiri lewat createBoss.
export async function enqueueScrape(data: ScrapeJobData): Promise<void> {
  const boss = new PgBoss(env.DATABASE_URL);
  await boss.start();
  try {
    await boss.send(SCRAPE_QUEUE, data);
  } finally {
    await boss.stop();
  }
}
