import { describe, expect, it } from "vitest";
import { createJobSchema, updateJobSchema } from "../lib/validation/jobs";

const validCssJob = {
  name: "Job Tes",
  targetUrl: "https://books.toscrape.com/",
  config: {
    mode: "css",
    fields: [{ name: "title", selector: "h3 a" }],
  },
};

describe("createJobSchema", () => {
  it("job css valid lolos", () => {
    const result = createJobSchema.safeParse(validCssJob);
    expect(result.success).toBe(true);
  });

  it("nama kosong ditolak", () => {
    const result = createJobSchema.safeParse({ ...validCssJob, name: "" });
    expect(result.success).toBe(false);
  });

  it("URL nggak valid ditolak", () => {
    const result = createJobSchema.safeParse({ ...validCssJob, targetUrl: "bukan-url" });
    expect(result.success).toBe(false);
  });

  it("fields kosong ditolak", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: { mode: "css", fields: [] },
    });
    expect(result.success).toBe(false);
  });

  it("fields lebih dari 50 ditolak", () => {
    const fields = Array.from({ length: 51 }, (_, i) => ({
      name: `field${i}`,
      selector: "a",
    }));
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: { mode: "css", fields },
    });
    expect(result.success).toBe(false);
  });

  it("mode ai valid lolos", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: {
        mode: "ai",
        instruction: "Ambil judul dan harga setiap buku di halaman ini",
        schema: [{ name: "title", description: "judul buku" }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("instruksi ai kurang dari 10 karakter ditolak", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: {
        mode: "ai",
        instruction: "ambil",
        schema: [{ name: "title", description: "judul" }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("sourceType api dengan paginasi valid lolos", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: {
        mode: "css",
        sourceType: "api",
        fields: [{ name: "title", selector: "title" }],
        api: {
          itemsPath: "results",
          pagination: { type: "page", pageParam: "page", maxPages: 5 },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("cron nggak 5 field ditolak", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: { ...validCssJob.config, schedule: { cron: "0 9 * *" } },
    });
    expect(result.success).toBe(false);
  });

  it("cron 5 field lolos", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: { ...validCssJob.config, schedule: { cron: "0 9 * * *" } },
    });
    expect(result.success).toBe(true);
  });

  it("proxy bukan URL ditolak", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: { ...validCssJob.config, proxies: ["bukan-url"] },
    });
    expect(result.success).toBe(false);
  });

  it("webhookUrl bukan URL ditolak", () => {
    const result = createJobSchema.safeParse({
      ...validCssJob,
      config: { ...validCssJob.config, webhookUrl: "bukan-url" },
    });
    expect(result.success).toBe(false);
  });
});

describe("updateJobSchema", () => {
  it("update valid lolos", () => {
    const result = updateJobSchema.safeParse(validCssJob);
    expect(result.success).toBe(true);
  });

  it("update nggak valid ditolak", () => {
    const result = updateJobSchema.safeParse({ ...validCssJob, name: "" });
    expect(result.success).toBe(false);
  });
});
