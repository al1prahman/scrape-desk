import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSitemapUrls } from "../lib/scrape/sitemap-source";

const plainSitemap = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://contoh.com/blog/artikel-1</loc></url>
  <url><loc>https://contoh.com/blog/artikel-2</loc></url>
  <url><loc>https://contoh.com/tentang</loc></url>
</urlset>`;

const indexSitemap = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://contoh.com/sitemap-1.xml</loc></sitemap>
  <sitemap><loc>https://contoh.com/sitemap-2.xml</loc></sitemap>
</sitemapindex>`;

const childSitemap = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://contoh.com/halaman-1</loc></url>
  <url><loc>https://contoh.com/halaman-2</loc></url>
</urlset>`;

function mockFetchByUrl(map: Record<string, string>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = map[url];
      if (!body) return { ok: false, status: 404, text: async () => "" };
      return { ok: true, status: 200, text: async () => body };
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSitemapUrls", () => {
  it("sitemap biasa: ambil semua loc", async () => {
    mockFetchByUrl({ "https://contoh.com/sitemap.xml": plainSitemap });
    const urls = await fetchSitemapUrls("https://contoh.com/sitemap.xml", {});

    expect(urls).toHaveLength(3);
    expect(urls).toContain("https://contoh.com/blog/artikel-1");
    expect(urls).toContain("https://contoh.com/tentang");
  });

  it("sitemap index: recurse ke children", async () => {
    mockFetchByUrl({
      "https://contoh.com/sitemap.xml": indexSitemap,
      "https://contoh.com/sitemap-1.xml": childSitemap,
      "https://contoh.com/sitemap-2.xml": childSitemap,
    });
    const urls = await fetchSitemapUrls("https://contoh.com/sitemap.xml", {});

    expect(urls).toContain("https://contoh.com/halaman-1");
    expect(urls).toContain("https://contoh.com/halaman-2");
  });

  it("urlFilter cuma nyelipkan URL yang match", async () => {
    mockFetchByUrl({ "https://contoh.com/sitemap.xml": plainSitemap });
    const urls = await fetchSitemapUrls("https://contoh.com/sitemap.xml", {
      urlFilter: "/blog/",
    });

    expect(urls).toHaveLength(2);
    expect(urls.every((url) => url.includes("/blog/"))).toBe(true);
  });

  it("maxUrls motong jumlah URL", async () => {
    mockFetchByUrl({ "https://contoh.com/sitemap.xml": plainSitemap });
    const urls = await fetchSitemapUrls("https://contoh.com/sitemap.xml", { maxUrls: 2 });
    expect(urls).toHaveLength(2);
  });

  it("sitemap nggak bisa diakses balik array kosong", async () => {
    mockFetchByUrl({});
    const urls = await fetchSitemapUrls("https://contoh.com/ngawur.xml", {});
    expect(urls).toEqual([]);
  });
});
