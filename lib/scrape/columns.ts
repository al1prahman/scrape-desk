import type { ExtractConfig } from "./types";
import { normalizeConfig } from "./normalize";

// Kolom hasil konsisten di semua mode ekstraksi, dipakai viewer, export, dan API.
// Config dinormalize dulu karena job lama bisa punya config tanpa mode field,
// yang bikin config.schema undefined dan crash halaman hasil run.
export function getColumns(config: ExtractConfig): string[] {
  const normalized = normalizeConfig(config);

  if (normalized.mode === "ai") {
    return normalized.schema.map((field) => field.name);
  }
  return normalized.fields.map((field) => field.name);
}
