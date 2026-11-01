import { afterEach, describe, expect, it, vi } from "vitest";
import { scrapeFeed } from "../lib/scrape/feed-source";

const rssXml = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Feed Tes</title>
  <item>
    <title>Berita Satu</title>
    <link>https://contoh.com/1</link>
    <pubDate>Sat, 31 Oct 2026 10:00:00 GMT</pubDate>
    <description>Isi berita satu</description>
  </item>
  <item>
    <title>Berita Dua</title>
    <link>https://contoh.com/2</link>
    <pubDate>Sat, 31 Oct 2026 11:00:00 GMT</pubDate>
    <description>Isi berita dua</description>
  </item>
</channel></rss>`;

const atomXml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Feed Atom</title>
  <entry>
    <title>Entry Satu</title>
    <link href="https://contoh.com/atom/1"/>
    <updated>2026-10-31T10:00:00Z</updated>
    <summary>Ringkasan atom</summary>
  </entry>
</feed>`;

function mockFetch(xml: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => xml,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("scrapeFeed", () => {
  it("parse RSS 2.0 jadi kolom standar", async () => {
    mockFetch(rssXml);
    const rows = await scrapeFeed("https://contoh.com/feed.xml");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      title: "Berita Satu",
      link: "https://contoh.com/1",
      date: "Sat, 31 Oct 2026 10:00:00 GMT",
      summary: "Isi berita satu",
    });
  });

  it("parse Atom pakai href buat link", async () => {
    mockFetch(atomXml);
    const rows = await scrapeFeed("https://contoh.com/atom.xml");

    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Entry Satu");
    expect(rows[0].link).toBe("https://contoh.com/atom/1");
    expect(rows[0].date).toBe("2026-10-31T10:00:00Z");
  });

  it("limit dipotong", async () => {
    mockFetch(rssXml);
    const rows = await scrapeFeed("https://contoh.com/feed.xml", 1);
    expect(rows).toHaveLength(1);
  });

  it("feed tanpa item lempar error", async () => {
    mockFetch("<?xml version='1.0'?><rss><channel><title>Kosong</title></channel></rss>");
    await expect(scrapeFeed("https://contoh.com/kosong.xml")).rejects.toThrow(
      /nggak punya item/,
    );
  });

  it("HTTP error dilempar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, text: async () => "" })),
    );
    await expect(scrapeFeed("https://contoh.com/ngawur.xml")).rejects.toThrow(/HTTP 404/);
  });
});
