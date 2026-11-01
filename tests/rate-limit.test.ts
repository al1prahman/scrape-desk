import { describe, expect, it } from "vitest";
import { respectDomainDelay } from "../lib/scrape/rate-limit";

describe("respectDomainDelay", () => {
  it("delay 0 langsung lewat", async () => {
    process.env.DOMAIN_DELAY_MS = "0";
    const start = Date.now();
    await respectDomainDelay("https://contoh.com/a");
    await respectDomainDelay("https://contoh.com/b");
    expect(Date.now() - start).toBeLessThan(50);
  });

  it("domain yang sama dijedain sesuai delay", async () => {
    process.env.DOMAIN_DELAY_MS = "300";
    const start = Date.now();
    await respectDomainDelay("https://contoh.com/1");
    await respectDomainDelay("https://contoh.com/2");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(250);
    expect(elapsed).toBeLessThan(1500);
  });

  it("domain beda nggak saling nunggu", async () => {
    process.env.DOMAIN_DELAY_MS = "2000";
    const start = Date.now();
    await respectDomainDelay("https://domain-a.com/1");
    await respectDomainDelay("https://domain-b.com/1");
    expect(Date.now() - start).toBeLessThan(100);
  });

  it("URL ngawur nggak crash", async () => {
    process.env.DOMAIN_DELAY_MS = "0";
    await respectDomainDelay("bukan-url");
  });
});
