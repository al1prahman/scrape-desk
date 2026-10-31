import * as cheerio from "cheerio";
import type { SitemapSourceConfig } from "./types";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_SITEMAP_DEPTH = 2;

// Sitemap index isinya <sitemap><loc>, sitemap biasa isinya <url><loc>.
// Rekursi satu level: index -> sitemap anak -> URL.
export async function fetchSitemapUrls(
  url: string,
  config: SitemapSourceConfig,
): Promise<string[]> {
  const urls = new Set<string>();
  const visited = new Set<string>();

  async function walk(sitemapUrl: string, depth: number): Promise<void> {
    if (depth > MAX_SITEMAP_DEPTH || visited.has(sitemapUrl)) return;
    visited.add(sitemapUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let xml: string;
    try {
      const response = await fetch(sitemapUrl, { signal: controller.signal });
      if (!response.ok) return;
      xml = await response.text();
    } catch {
      return;
    } finally {
      clearTimeout(timeout);
    }

    const $ = cheerio.load(xml, { xmlMode: true });

    $("url > loc").each((_, element) => {
      const loc = $(element).text().trim();
      if (loc) urls.add(loc);
    });

    // Kalau ini sitemap index, recurse ke anak-anaknya. Dikumpulkan dulu
    // terus di-await barengan, kalau nggak hasil child walk bisa ketinggalan.
    const childSitemaps: string[] = [];
    $("sitemap > loc").each((_, element) => {
      const loc = $(element).text().trim();
      if (loc) childSitemaps.push(loc);
    });
    await Promise.all(childSitemaps.map((loc) => walk(loc, depth + 1)));
  }

  await walk(url, 1);

  let result = [...urls];
  if (config.urlFilter) {
    const filter = config.urlFilter;
    result = result.filter((candidate) => candidate.includes(filter));
  }
  if (config.maxUrls) {
    result = result.slice(0, config.maxUrls);
  }

  return result;
}
