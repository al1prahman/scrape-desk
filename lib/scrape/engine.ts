import { chromium } from "playwright";
import { extractRows } from "./extract";
import type { ExtractConfig, ScrapedRow } from "./types";

export async function scrapeUrl(url: string, config: ExtractConfig): Promise<ScrapedRow[]> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const html = await page.content();
    return extractRows(html, config);
  } finally {
    await browser.close();
  }
}
