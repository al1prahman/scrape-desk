import * as cheerio from "cheerio";
import type { ExtractConfig, ScrapedRow } from "./types";

// Strategi MVP: tiap selector dikumpulkan sebagai kolom, baris disusun per index.
// Cocok untuk halaman listing di mana tiap field muncul urut dan sama banyak.
export function extractRows(html: string, config: ExtractConfig): ScrapedRow[] {
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
