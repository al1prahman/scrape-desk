import PgBoss from "pg-boss";
import { env } from "@/lib/env";

// Schedule name unik per job, dipakai pg-boss buat nyimpen jadwal cron.
export function scheduleNameFor(jobId: string): string {
  return `scrape-schedule-${jobId}`;
}

// Instance short-lived, aman dipanggil dari server action.
async function withBoss<T>(fn: (boss: PgBoss) => Promise<T>): Promise<T> {
  const boss = new PgBoss({ connectionString: env.DATABASE_URL, max: 1 });
  await boss.start();
  try {
    return await fn(boss);
  } finally {
    await boss.stop();
  }
}

export async function registerJobSchedule(jobId: string, cron: string): Promise<void> {
  await withBoss((boss) =>
    boss.schedule(scheduleNameFor(jobId), cron, { jobId }, { retryLimit: 1 }),
  );
}

export async function unregisterJobSchedule(jobId: string): Promise<void> {
  await withBoss((boss) => boss.unschedule(scheduleNameFor(jobId)));
}
