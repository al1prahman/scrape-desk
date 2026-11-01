import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { scrapeApi } from "../lib/scrape/api-source";

// Matiin domain delay di test biar nggak nunggu.
beforeAll(() => {
  process.env.DOMAIN_DELAY_MS = "0";
});

function mockFetchOnce(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => body,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("scrapeApi", () => {
  it("map field lewat dot path dari response", async () => {
    mockFetchOnce({
      results: [
        { title: "Paper A", publication_year: 2020, cited_by_count: 5 },
        { title: "Paper B", publication_year: 2021, cited_by_count: 10 },
      ],
    });

    const { rows, pagesFetched } = await scrapeApi("https://api.contoh.com/works", {
      fields: [
        { name: "title", selector: "title" },
        { name: "year", selector: "publication_year" },
        { name: "cited", selector: "cited_by_count" },
      ],
      api: { itemsPath: "results" },
    });

    expect(pagesFetched).toBe(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ title: "Paper A", year: "2020", cited: "5" });
  });

  it("nested path dan array index jalan", async () => {
    mockFetchOnce({
      data: {
        papers: [{ meta: { title: "Nested" }, authors: [{ name: "Ani" }, { name: "Budi" }] }],
      },
    });

    const { rows } = await scrapeApi("https://api.contoh.com/x", {
      fields: [
        { name: "title", selector: "meta.title" },
        { name: "firstAuthor", selector: "authors[0].name" },
      ],
      api: { itemsPath: "data.papers" },
    });

    expect(rows[0]).toEqual({ title: "Nested", firstAuthor: "Ani" });
  });

  it("response array langsung tanpa itemsPath", async () => {
    mockFetchOnce([{ title: "A" }, { title: "B" }]);

    const { rows } = await scrapeApi("https://api.contoh.com/list", {
      fields: [{ name: "title", selector: "title" }],
    });

    expect(rows).toHaveLength(2);
  });

  it("null dan object jadi string, bukan crash", async () => {
    mockFetchOnce({ results: [{ title: "A", year: null, meta: { x: 1 } }] });

    const { rows } = await scrapeApi("https://api.contoh.com/x", {
      fields: [
        { name: "title", selector: "title" },
        { name: "year", selector: "year" },
        { name: "meta", selector: "meta" },
      ],
      api: { itemsPath: "results" },
    });

    expect(rows[0].year).toBe("");
    expect(rows[0].meta).toBe('{"x":1}');
  });

  it("paginasi page number jalan sampai maxPages", async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{ title: `Item dari ${url.includes("page=2") ? "halaman 2" : "halaman 1"}` }],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { rows, pagesFetched } = await scrapeApi("https://api.contoh.com/works", {
      fields: [{ name: "title", selector: "title" }],
      api: {
        itemsPath: "results",
        pagination: { type: "page", pageParam: "page", startPage: 1, maxPages: 2 },
      },
    });

    expect(pagesFetched).toBe(2);
    expect(rows).toHaveLength(2);
    expect(rows[1].title).toContain("halaman 2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("itemsPath nggak nemu array lempar error", async () => {
    mockFetchOnce({ results: { bukan: "array" } });

    await expect(
      scrapeApi("https://api.contoh.com/x", {
        fields: [{ name: "title", selector: "title" }],
        api: { itemsPath: "results" },
      }),
    ).rejects.toThrow(/nggak nemu array/);
  });

  it("HTTP error dilempar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );

    await expect(
      scrapeApi("https://api.contoh.com/x", {
        fields: [{ name: "title", selector: "title" }],
      }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it("limit dipotong setelah kumpul rows", async () => {
    mockFetchOnce({ results: [{ title: "A" }, { title: "B" }, { title: "C" }] });

    const { rows } = await scrapeApi("https://api.contoh.com/x", {
      fields: [{ name: "title", selector: "title" }],
      limit: 2,
      api: { itemsPath: "results" },
    });

    expect(rows).toHaveLength(2);
  });

  it("headers dan cookies dikirim", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await scrapeApi("https://api.contoh.com/x", {
      fields: [{ name: "title", selector: "title" }],
      cookies: [{ name: "session", value: "abc" }],
      api: {
        itemsPath: "results",
        headers: { Authorization: "Bearer token123" },
      },
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer token123",
      Cookie: "session=abc",
    });
  });
});
