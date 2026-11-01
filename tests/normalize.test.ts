import { describe, expect, it } from "vitest";
import { normalizeConfig } from "../lib/scrape/normalize";

describe("normalizeConfig", () => {
  it("config legacy tanpa mode field jatuh ke css", () => {
    const result = normalizeConfig({
      fields: [{ name: "title", selector: "h3 a" }],
    });
    expect(result.mode).toBe("css");
    expect(result.sourceType).toBe("web");
  });

  it("config css lengkap dipreserve", () => {
    const result = normalizeConfig({
      mode: "css",
      fields: [{ name: "title", selector: "h3 a" }],
      containerSelector: "article",
      limit: 10,
    });
    expect(result.mode).toBe("css");
    if (result.mode !== "css") throw new Error("expected css");
    expect(result.fields).toHaveLength(1);
    expect(result.containerSelector).toBe("article");
    expect(result.limit).toBe(10);
  });

  it("config ai lengkap dipreserve", () => {
    const result = normalizeConfig({
      mode: "ai",
      instruction: "ambil judul",
      schema: [{ name: "title", description: "judul buku" }],
    });
    expect(result.mode).toBe("ai");
    if (result.mode !== "ai") throw new Error("expected ai");
    expect(result.schema).toHaveLength(1);
    expect(result.instruction).toBe("ambil judul");
  });

  it("schema tanpa fields dan tanpa mode dibaca sebagai ai", () => {
    const result = normalizeConfig({
      schema: [{ name: "title", description: "judul" }],
    });
    expect(result.mode).toBe("ai");
  });

  it("config kosong nggak crash", () => {
    const result = normalizeConfig({});
    expect(result.mode).toBe("css");
    if (result.mode !== "css") throw new Error("expected css");
    expect(result.fields).toEqual([]);
    expect(result.sourceType).toBe("web");
  });

  it("null dan undefined nggak crash", () => {
    expect(normalizeConfig(null).mode).toBe("css");
    expect(normalizeConfig(undefined).mode).toBe("css");
  });

  it("sourceType nggak valid fallback ke web", () => {
    const result = normalizeConfig({ mode: "css", fields: [], sourceType: "ngawur" });
    expect(result.sourceType).toBe("web");
  });

  it("sourceType valid dipreserve", () => {
    expect(normalizeConfig({ mode: "css", fields: [], sourceType: "api" }).sourceType).toBe("api");
    expect(normalizeConfig({ mode: "css", fields: [], sourceType: "feed" }).sourceType).toBe("feed");
    expect(
      normalizeConfig({ mode: "css", fields: [], sourceType: "sitemap" }).sourceType,
    ).toBe("sitemap");
  });

  it("config api dan sitemap dipreserve lewat normalize", () => {
    const result = normalizeConfig({
      mode: "css",
      fields: [{ name: "t", selector: "title" }],
      sourceType: "api",
      api: { itemsPath: "results", pagination: { type: "page", pageParam: "page", maxPages: 3 } },
    });
    if (result.mode !== "css") throw new Error("expected css");
    expect(result.api?.itemsPath).toBe("results");
    expect(result.api?.pagination?.type).toBe("page");
  });

  it("array yang nggak valid jadi array kosong", () => {
    const result = normalizeConfig({ mode: "css", fields: "bukan array", cookies: 123 });
    if (result.mode !== "css") throw new Error("expected css");
    expect(result.fields).toEqual([]);
    expect(result.cookies).toBeUndefined();
  });
});
