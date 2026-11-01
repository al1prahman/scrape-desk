import { describe, expect, it } from "vitest";
import { diffResults } from "../lib/results/diff-logic";

describe("diffResults", () => {
  const previous = [
    { title: "A", price: "£10" },
    { title: "B", price: "£20" },
    { title: "C", price: "£30" },
  ];

  it("data identik: 0 added, 0 removed, semua unchanged", () => {
    const result = diffResults(previous, [...previous]);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.unchanged).toBe(3);
  });

  it("baris baru kedeteksi sebagai added", () => {
    const result = diffResults(previous, [...previous, { title: "D", price: "£40" }]);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.unchanged).toBe(3);
    expect(result.samples.added[0]).toEqual({ title: "D", price: "£40" });
  });

  it("baris hilang kedeteksi sebagai removed", () => {
    const result = diffResults(previous, previous.slice(0, 2));
    expect(result.added).toBe(0);
    expect(result.removed).toBe(1);
    expect(result.unchanged).toBe(2);
    expect(result.samples.removed[0]).toEqual({ title: "C", price: "£30" });
  });

  it("baris berubah muncul sebagai 1 removed plus 1 added", () => {
    const current = [
      { title: "A", price: "£10" },
      { title: "B", price: "£25" },
      { title: "C", price: "£30" },
    ];
    const result = diffResults(previous, current);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.unchanged).toBe(2);
  });

  it("urutan baris nggak pengaruh, diff berbasis konten", () => {
    const shuffled = [previous[2], previous[0], previous[1]];
    const result = diffResults(previous, shuffled);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.unchanged).toBe(3);
  });

  it("samples dibatasi 3", () => {
    const current = Array.from({ length: 6 }, (_, i) => ({ title: `New ${i}` }));
    const result = diffResults([], current);
    expect(result.added).toBe(6);
    expect(result.samples.added).toHaveLength(3);
  });

  it("previous kosong: semua added", () => {
    const result = diffResults([], previous);
    expect(result.added).toBe(3);
    expect(result.removed).toBe(0);
    expect(result.unchanged).toBe(0);
  });
});
