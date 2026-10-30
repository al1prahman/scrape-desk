import type { ScrapedRow } from "@/lib/scrape/types";

function escapeValue(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: ScrapedRow[], columns: string[]): string {
  const lines = [columns.join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => escapeValue(row[column] ?? "")).join(","));
  }

  return lines.join("\n");
}
