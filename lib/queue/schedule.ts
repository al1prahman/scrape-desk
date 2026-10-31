import { parseExpression } from "cron-parser";
import PgBoss from "pg-boss";
import { env } from "@/lib/env";
import { SCRAPE_QUEUE } from "./enqueue";

// Jadwal self-perpetuating: tiap run yang datang dari schedule menjadwalkan
// run berikutnya. Kalau schedule dihapus dari config job, run terjadwal yang
// datang nggak menemukan schedule dan berhenti tanpa menjadwalkan lagi.
// Cara ini dipilih karena pg-boss native schedule cuma satu per queue,
// nggak muat buat banyak job dengan jadwal masing-masing.

export function computeNextRun(cron: string): Date {
  const interval = parseExpression(cron);
  return interval.next().toDate();
}

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
  const nextRun = computeNextRun(cron);
  await withBoss((boss) =>
    boss.sendAfter(SCRAPE_QUEUE, { jobId, scheduled: true }, {}, nextRun),
  );
}

export async function scheduleNextRun(jobId: string, cron: string): Promise<void> {
  await registerJobSchedule(jobId, cron);
}
