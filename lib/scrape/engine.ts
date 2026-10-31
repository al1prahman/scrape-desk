import { chromium } from "playwright";
import { extractRows } from "./extract";
import type { ExtractConfig, ScrapedRow } from "./types";

const NAV_TIMEOUT_MS = 30_000;
const SELECTOR_TIMEOUT_MS = 10_000;
const LAUNCH_ATTEMPTS = 3;

async function scrapeOnce(url: string, config: ExtractConfig): Promise<ScrapedRow[]> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });

    // Situs yang render via JS butuh waktu sebelum selector muncul.
    // Timeout di sini nggak fatal, halaman statis lanjut tanpa nunggu.
    const firstSelector = config.fields[0]?.selector;
    if (firstSelector) {
      await page.waitForSelector(firstSelector, { timeout: SELECTOR_TIMEOUT_MS }).catch(() => null);
    }

    const html = await page.content();
    return extractRows(html, config);
  } finally {
    await browser.close();
  }
}

export async function scrapeUrl(url: string, config: ExtractConfig): Promise<ScrapedRow[]> {
  // Launch chromium di Windows kadang gagal dengan 0xC0000142 (DLL init failed)
  // yang bersifat transient, biasanya ketabrak real-time scanning antivirus.
  let lastError: unknown;

  for (let attempt = 1; attempt <= LAUNCH_ATTEMPTS; attempt++) {
    try {
      return await scrapeOnce(url, config);
    } catch (error) {
      lastError = error;
      if (attempt === LAUNCH_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Scrape gagal");
}
