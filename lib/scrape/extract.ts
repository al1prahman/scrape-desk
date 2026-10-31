import * as cheerio from "cheerio";
import type { CssExtractConfig, ScrapedRow } from "./types";

// Container mode: tiap elemen yang match containerSelector jadi satu baris,
// field diekstrak relatif di dalam container. Ini cara bener buat listing
// page karena field nggak bisa bocor ke baris lain.
export function extractRowsByContainer(
  html: string,
  config: CssExtractConfig,
  containerSelector: string,
): ScrapedRow[] {
  const $ = cheerio.load(html);

  const rows: ScrapedRow[] = [];
  $(containerSelector).each((_, container) => {
    const row: ScrapedRow = {};
    for (const field of config.fields) {
      const element = $(container).find(field.selector).first();
      row[field.name] = element.length > 0 ? element.text().trim() : "";
    }
    rows.push(row);
  });

  return config.limit ? rows.slice(0, config.limit) : rows;
}

// Column mode: tiap selector dikumpulkan sebagai kolom, baris disusun per
// index. Cocok buat halaman di mana tiap field muncul urut dan sama banyak.
export function extractRowsByColumn(html: string, config: CssExtractConfig): ScrapedRow[] {
  const $ = cheerio.load(html);

  const columns = config.fields.map((field) => ({
    name: field.name,
    values: $(field.selector)
      .map((_, element) => $(element).text().trim())
      .get(),
  }));

  const rowCount = columns.reduce((max, column) => Math.max(max, column.values.length), 0);
  const rows: ScrapedRow[] = [];

  for (let index = 0; index < rowCount; index++) {
    const row: ScrapedRow = {};
    for (const column of columns) {
      row[column.name] = column.values[index] ?? "";
    }
    rows.push(row);
  }

  return config.limit ? rows.slice(0, config.limit) : rows;
}

export function extractRows(html: string, config: CssExtractConfig): ScrapedRow[] {
  if (config.containerSelector) {
    return extractRowsByContainer(html, config, config.containerSelector);
  }
  return extractRowsByColumn(html, config);
}
