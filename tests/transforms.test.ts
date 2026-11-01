import { describe, expect, it } from "vitest";
import { applyTransforms } from "../lib/scrape/transforms";

const rows = [
  { title: "Buku Satu", price: "£51.77", stock: "In stock" },
  { title: "Buku Dua", price: "£12.30", stock: "Out of stock" },
];

describe("applyTransforms", () => {
  it("tanpa transform balik rows apa adanya", () => {
    expect(applyTransforms(rows, [])).toEqual(rows);
  });

  it("regex narik angka dari harga", () => {
    const result = applyTransforms(rows, [
      { type: "regex", field: "price", pattern: "([\\d.]+)", target: "priceNumber" },
    ]);
    expect(result[0].priceNumber).toBe("51.77");
    expect(result[0].price).toBe("£51.77");
  });

  it("regex nggak match jadi string kosong", () => {
    const result = applyTransforms(rows, [
      { type: "regex", field: "title", pattern: "\\d+", target: "angka" },
    ]);
    expect(result[0].angka).toBe("");
  });

  it("number buang simbol mata uang", () => {
    const result = applyTransforms(rows, [{ type: "number", field: "price", target: "harga" }]);
    expect(result[0].harga).toBe("51.77");
    expect(result[1].harga).toBe("12.30");
  });

  it("number handle koma desimal", () => {
    const result = applyTransforms([{ harga: "Rp1.234,56" }], [
      { type: "number", field: "harga", target: "angka" },
    ]);
    expect(result[0].angka).toBe("1234.56");
  });

  it("replace teks", () => {
    const result = applyTransforms(rows, [
      { type: "replace", field: "stock", from: "In stock", to: "Tersedia" },
    ]);
    expect(result[0].stock).toBe("Tersedia");
    expect(result[1].stock).toBe("Out of stock");
  });

  it("prefix dan suffix", () => {
    const result = applyTransforms(rows, [
      { type: "prefix", field: "title", value: "JUDUL: " },
      { type: "suffix", field: "title", value: " [END]" },
    ]);
    expect(result[0].title).toBe("JUDUL: Buku Satu [END]");
  });

  it("lowercase dan uppercase", () => {
    const result = applyTransforms(rows, [
      { type: "lowercase", field: "title", target: "slug" },
      { type: "uppercase", field: "stock", target: "status" },
    ]);
    expect(result[0].slug).toBe("buku satu");
    expect(result[0].status).toBe("IN STOCK");
  });

  it("template bikin kolom baru dari kolom lain", () => {
    const result = applyTransforms(rows, [
      { type: "template", template: "{{title}} - {{price}}", target: "ringkasan" },
    ]);
    expect(result[0].ringkasan).toBe("Buku Satu - £51.77");
  });

  it("template pakai hasil transform sebelumnya", () => {
    const result = applyTransforms(rows, [
      { type: "number", field: "price", target: "harga" },
      { type: "template", template: "{{title}} Rp{{harga}}", target: "label" },
    ]);
    expect(result[0].label).toBe("Buku Satu Rp51.77");
  });

  it("transform ke field yang nggak ada dilewat", () => {
    const result = applyTransforms(rows, [{ type: "uppercase", field: "ngawur" }]);
    expect(result[0]).toEqual(rows[0]);
  });

  it("tanpa target nimpa field asal", () => {
    const result = applyTransforms(rows, [{ type: "uppercase", field: "title" }]);
    expect(result[0].title).toBe("BUKU SATU");
  });

  it("multiple transform berurutan", () => {
    const result = applyTransforms(rows, [
      { type: "number", field: "price", target: "harga" },
      { type: "prefix", field: "harga", value: "Rp" },
      { type: "template", template: "{{title}} ({{harga}})", target: "kartu" },
    ]);
    expect(result[0].kartu).toBe("Buku Satu (Rp51.77)");
  });
});
