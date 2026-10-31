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

// Fire and forget: kegagalan webhook nggak boleh gagalin run yang udah sukses.
export async function notifyWebhook(url: string, payload: WebhookPayload): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
