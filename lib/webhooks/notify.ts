import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

const WEBHOOK_TIMEOUT_MS = 10_000;

export type WebhookPayload = {
  event: "run.completed";
  jobId: string;
  runId: string;
  status: string;
  rowCount: number;
  error: string | null;
  finishedAt: string;
};

// Payload ditandatangani HMAC-SHA256 pakai WEBHOOK_SECRET. Receiver bisa
// verifikasi payload beneran dari sistem ini. Kalau secret nggak diset,
// webhook tetap jalan tanpa tanda tangan.
function signPayload(body: string): string | null {
  if (!env.WEBHOOK_SECRET) return null;
  return createHmac("sha256", env.WEBHOOK_SECRET).update(body).digest("hex");
}

// Fire and forget: kegagalan webhook nggak boleh gagalin run yang udah sukses.
export async function notifyWebhook(url: string, payload: WebhookPayload): Promise<void> {
  try {
    const body = JSON.stringify(payload);
    const signature = signPayload(body);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (signature) {
      headers["X-ScrapeDesk-Signature"] = `sha256=${signature}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
  } catch (error) {
    console.error(
      `[webhook] gagal kirim ke ${url}:`,
      error instanceof Error ? error.message : "unknown",
    );
  }
}
