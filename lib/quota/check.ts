import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Kuota harian per user, dasar metering buat billing nanti.
// Default 50 run per hari, bisa dioverride lewat env DAILY_RUN_QUOTA.
const DEFAULT_DAILY_QUOTA = 50;

export function getDailyQuota(): number {
  const parsed = Number(process.env.DAILY_RUN_QUOTA);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_QUOTA;
}

export type QuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
};

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const limit = getDailyQuota();

  // Admin client karena dipakai dari API route yang authenticate via API key,
  // bukan session cookie. job_runs nggak punya user_id, join lewat jobs.
  const supabase = createAdminClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("job_runs")
    .select("id, jobs!inner(user_id)", { count: "exact", head: true })
    .eq("jobs.user_id", userId)
    .gte("queued_at", startOfDay.toISOString());

  const used = count ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export async function assertQuota(userId: string): Promise<void> {
  const status = await getQuotaStatus(userId);
  if (status.remaining <= 0) {
    throw new Error(
      `Kuota harian habis: ${status.used}/${status.limit} run dipakai hari ini`,
    );
  }
}
