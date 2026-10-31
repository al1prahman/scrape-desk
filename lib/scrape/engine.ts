import { chromium } from "playwright";
import { extractRows } from "./extract";
import { extractWithAi } from "./ai-extract";
import type { ExtractConfig, ScrapedRow } from "./types";

const NAV_TIMEOUT_MS = 30_000;
const SELECTOR_TIMEOUT_MS = 10_000;
const AI_SETTLE_MS = 2000;
const LAUNCH_ATTEMPTS = 3;

type FetchOptions = {
  waitSelector?: string;
  waitUntil?: "domcontentloaded" | "load";
  settleMs?: number;
};

async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: options.waitUntil ?? "domcontentloaded",
      timeout: NAV_TIMEOUT_MS,
    });

    if (options.waitSelector) {
      await page
        .waitForSelector(options.waitSelector, { timeout: SELECTOR_TIMEOUT_MS })
        .catch(() => null);
    }

    if (options.settleMs) {
      await page.waitForTimeout(options.settleMs);
    }

    return await page.content();
  } finally {
    await browser.close();
  }
}

// Launch chromium di Windows kadang gagal dengan 0xC0000142 (DLL init failed)
// yang bersifat transient, biasanya ketabrak real-time scanning antivirus.
async function fetchHtmlWithRetry(url: string, options: FetchOptions): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= LAUNCH_ATTEMPTS; attempt++) {
    try {
      return await fetchHtml(url, options);
    } catch (error) {
      lastError = error;
      if (attempt === LAUNCH_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gagal ambil halaman");
}

export async function scrapeJob(url: string, config: ExtractConfig): Promise<ScrapedRow[]> {
  const html =
    config.mode === "css"
      ? await fetchHtmlWithRetry(url, { waitSelector: config.fields[0]?.selector })
      : await fetchHtmlWithRetry(url, { waitUntil: "load", settleMs: AI_SETTLE_MS });

  const rows =
    config.mode === "ai"
      ? await extractWithAi(html, config)
      : extractRows(html, config);

  return config.limit ? rows.slice(0, config.limit) : rows;
}
