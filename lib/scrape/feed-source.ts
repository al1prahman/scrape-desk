import * as cheerio from "cheerio";
import type { ScrapedRow } from "./types";

const FETCH_TIMEOUT_MS = 30_000;

// RSS 2.0 dan Atom dipetakan ke kolom standar: title, link, date, summary.
export async function scrapeFeed(url: string, limit?: number): Promise<ScrapedRow[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let xml: string;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Feed balik HTTP ${response.status}`);
    }
    xml = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(xml, { xmlMode: true });
  const rows: ScrapedRow[] = [];

  // RSS: channel > item
  $("channel > item").each((_, element) => {
    rows.push({
      title: $(element).children("title").first().text().trim(),
      link: $(element).children("link").first().text().trim(),
      date: $(element).children("pubDate").first().text().trim(),
      summary: $(element).children("description").first().text().trim(),
    });
  });

  // Atom: feed > entry, link pakai atribut href
  if (rows.length === 0) {
    $("feed > entry").each((_, element) => {
      rows.push({
        title: $(element).children("title").first().text().trim(),
        link: $(element).children("link").first().attr("href")?.trim() ?? "",
        date:
          $(element).children("updated").first().text().trim() ||
          $(element).children("published").first().text().trim(),
        summary: $(element).children("summary").first().text().trim(),
      });
    });
  }

  if (rows.length === 0) {
    throw new Error("Feed nggak punya item RSS atau entry Atom");
  }

  return limit ? rows.slice(0, limit) : rows;
}
