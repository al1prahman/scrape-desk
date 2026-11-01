import { describe, expect, it } from "vitest";
import { extractRows } from "../lib/scrape/extract";

const listingHtml = [
  "<html><body>",
  '  <article class="product">',
  '    <h3><a href="#">Buku Satu</a></h3>',
  '    <p class="price">10.00</p>',
  '    <p class="stock">In stock</p>',
  "  </article>",
  '  <article class="product">',
  '    <h3><a href="#">Buku Dua</a></h3>',
  '    <p class="price">20.00</p>',
  '    <p class="stock">Out of stock</p>',
  "  </article>",
  "</body></html>",
].join("\n");

describe("extractRows", () => {
  it("container mode: tiap elemen match jadi satu baris, field relatif", () => {
    const rows = extractRows(listingHtml, {
      mode: "css",
      containerSelector: "article.product",
      fields: [
        { name: "title", selector: "h3 a" },
        { name: "price", selector: "p.price" },
        { name: "stock", selector: "p.stock" },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ title: "Buku Satu", price: "10.00", stock: "In stock" });
    expect(rows[1]).toEqual({ title: "Buku Dua", price: "20.00", stock: "Out of stock" });
  });

  it("container mode: field nggak bocor antar baris", () => {
    const rows = extractRows(listingHtml, {
      mode: "css",
      containerSelector: "article.product",
      fields: [
        { name: "title", selector: "h3 a" },
        { name: "price", selector: "p.price" },
      ],
    });

    expect(rows[0].price).toBe("10.00");
    expect(rows[1].price).toBe("20.00");
  });

  it("column mode: baris disusun per index", () => {
    const rows = extractRows(listingHtml, {
      mode: "css",
      fields: [
        { name: "title", selector: "article.product h3 a" },
        { name: "price", selector: "article.product p.price" },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ title: "Buku Satu", price: "10.00" });
    expect(rows[1]).toEqual({ title: "Buku Dua", price: "20.00" });
  });

  it("limit dipotong", () => {
    const rows = extractRows(listingHtml, {
      mode: "css",
      containerSelector: "article.product",
      fields: [{ name: "title", selector: "h3 a" }],
      limit: 1,
    });
    expect(rows).toHaveLength(1);
  });

  it("field yang nggak ketemu jadi string kosong", () => {
    const rows = extractRows(listingHtml, {
      mode: "css",
      containerSelector: "article.product",
      fields: [{ name: "rating", selector: ".rating" }],
    });
    expect(rows[0].rating).toBe("");
  });

  it("container yang nggak ada balik array kosong", () => {
    const rows = extractRows(listingHtml, {
      mode: "css",
      containerSelector: ".ngawur",
      fields: [{ name: "title", selector: "h3 a" }],
    });
    expect(rows).toEqual([]);
  });
});
