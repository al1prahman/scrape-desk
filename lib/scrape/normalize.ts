import type {
  AiField,
  ApiSourceConfig,
  Cookie,
  ExtractConfig,
  ExtractField,
  NavigationConfig,
  ScheduleConfig,
  SitemapSourceConfig,
  SourceType,
} from "./types";

// Config job lama (sebelum mode jadi wajib) atau config dari luar bisa saja
// nggak lengkap. Normalize sekali di sini biar semua consumer aman, termasuk
// halaman hasil run yang crash kalau config.schema undefined.
export function normalizeConfig(config: unknown): ExtractConfig {
  const raw = (config ?? {}) as Record<string, unknown>;

  const fields = Array.isArray(raw.fields) ? (raw.fields as ExtractField[]) : [];
  const schema = Array.isArray(raw.schema) ? (raw.schema as AiField[]) : [];

  // Mode dibaca dari isi config: ada schema tanpa fields berarti ai,
  // selain itu css. Config lama tanpa mode field jatuh ke css.
  const mode =
    raw.mode === "ai" || (raw.mode === undefined && schema.length > 0 && fields.length === 0)
      ? "ai"
      : "css";

  const sourceType: SourceType =
    raw.sourceType === "api" ||
    raw.sourceType === "feed" ||
    raw.sourceType === "sitemap" ||
    raw.sourceType === "web"
      ? raw.sourceType
      : "web";

  const shared = {
    limit: typeof raw.limit === "number" ? raw.limit : undefined,
    navigation: raw.navigation as NavigationConfig | undefined,
    cookies: Array.isArray(raw.cookies) ? (raw.cookies as Cookie[]) : undefined,
    proxies: Array.isArray(raw.proxies) ? (raw.proxies as string[]) : undefined,
    schedule: raw.schedule as ScheduleConfig | undefined,
    webhookUrl: typeof raw.webhookUrl === "string" ? raw.webhookUrl : undefined,
    sourceType,
  };

  if (mode === "ai") {
    return {
      mode: "ai",
      instruction: typeof raw.instruction === "string" ? raw.instruction : "",
      schema,
      ...shared,
    };
  }

  return {
    mode: "css",
    fields,
    containerSelector:
      typeof raw.containerSelector === "string" ? raw.containerSelector : undefined,
    ...shared,
    api: raw.api as ApiSourceConfig | undefined,
    sitemap: raw.sitemap as SitemapSourceConfig | undefined,
  };
}
