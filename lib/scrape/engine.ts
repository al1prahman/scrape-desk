import { chromium, type BrowserContext, type Page } from "playwright";
import { extractRows } from "./extract";
import { extractWithAi } from "./ai-extract";
import type { ExtractConfig, ScrapedRow } from "./types";

const NAV_TIMEOUT_MS = 30_000;
const SELECTOR_TIMEOUT_MS = 10_000;
const AI_SETTLE_MS = 2000;
const SCROLL_SETTLE_MS = 1500;
const LAUNCH_ATTEMPTS = 3;

// chrome-headless-shell kadang gagal launch dengan 0xC0000142 (DLL init failed)
// di Windows. Full chromium lebih stabil, jadi dicoba dulu dengan fallback.
async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chromium" });
  } catch {
    return await chromium.launch();
  }
}

// Evasion dasar buat deteksi headless. Bukan anti-bot sempurna,
// tapi ngangkat ambang minimum buat situs yang cek navigator.webdriver.
async function applyStealth(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "languages", { get: () => ["id-ID", "id", "en-US", "en"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });

    const fakeChrome = { runtime: {}, app: {}, csi: () => {}, loadTimes: () => {} };
    Object.defineProperty(window, "chrome", { get: () => fakeChrome });

    const originalQuery = window.navigator.permissions?.query.bind(window.navigator.permissions);
    if (originalQuery) {
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters);
    }
  });
}

async function scrollToBottom(page: Page, maxScrolls: number): Promise<void> {
  let previousHeight = 0;

  for (let scroll = 0; scroll < maxScrolls; scroll++) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    if (height === previousHeight) break;

    previousHeight = height;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(SCROLL_SETTLE_MS);
  }
}

async function collectPageHtmls(url: string, config: ExtractConfig): Promise<string[]> {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext();

    if (config.cookies?.length) {
      await context.addCookies(
        config.cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          url,
        })),
      );
    }

    await applyStealth(context);
    const page = await context.newPage();

    const htmls: string[] = [];
    const pagination = config.navigation?.pagination;
    const maxPages = pagination?.maxPages ?? 1;
    const waitSelector = config.mode === "css" ? config.fields[0]?.selector : undefined;

    let currentUrl = url;

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
      await page.goto(currentUrl, {
        waitUntil: config.mode === "ai" ? "load" : "domcontentloaded",
        timeout: NAV_TIMEOUT_MS,
      });

      if (waitSelector) {
        await page
          .waitForSelector(waitSelector, { timeout: SELECTOR_TIMEOUT_MS })
          .catch(() => null);
      }

      if (config.mode === "ai") {
        await page.waitForTimeout(AI_SETTLE_MS);
      }

      if (config.navigation?.infiniteScroll) {
        await scrollToBottom(page, config.navigation.infiniteScroll.maxScrolls);
      }

      htmls.push(await page.content());

      if (!pagination || pageNumber === maxPages) break;

      if (pagination.mode === "next-selector") {
        const nextButton = await page.$(pagination.nextSelector);
        if (!nextButton) break;

        await nextButton.click();
        await page.waitForLoadState("domcontentloaded").catch(() => null);
        currentUrl = page.url();
      } else {
        currentUrl = pagination.urlPattern.replace("{page}", String(pageNumber + 1));
      }
    }

    return htmls;
  } finally {
    await browser.close();
  }
}

// Launch chromium di Windows kadang gagal dengan 0xC0000142 (DLL init failed)
// yang bersifat transient, biasanya ketabrak real-time scanning antivirus.
async function collectWithRetry(url: string, config: ExtractConfig): Promise<string[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= LAUNCH_ATTEMPTS; attempt++) {
    try {
      return await collectPageHtmls(url, config);
    } catch (error) {
      lastError = error;
      if (attempt === LAUNCH_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gagal ambil halaman");
}

export async function scrapeJob(url: string, config: ExtractConfig): Promise<ScrapedRow[]> {
  const htmls = await collectWithRetry(url, config);
  const allRows: ScrapedRow[] = [];

  for (const html of htmls) {
    const rows =
      config.mode === "ai"
        ? await extractWithAi(html, config)
        : extractRows(html, config);

    allRows.push(...rows);
  }

  return config.limit ? allRows.slice(0, config.limit) : allRows;
}
