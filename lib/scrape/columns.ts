import type { ExtractConfig } from "./types";

// Kolom hasil konsisten di semua mode ekstraksi, dipakai viewer, export, dan API.
export function getColumns(config: ExtractConfig): string[] {
  return config.mode === "css"
    ? config.fields.map((field) => field.name)
    : config.schema.map((field) => field.name);
}
