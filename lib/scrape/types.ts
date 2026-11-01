export type ExtractField = {
  name: string;
  selector: string;
};

export type AiField = {
  name: string;
  description: string;
};

export type Cookie = {
  name: string;
  value: string;
};

export type PaginationConfig =
  | { mode: "next-selector"; nextSelector: string; maxPages: number }
  | { mode: "url-pattern"; urlPattern: string; maxPages: number };

export type NavigationConfig = {
  pagination?: PaginationConfig;
  infiniteScroll?: { maxScrolls: number };
};

export type ScheduleConfig = {
  cron: string;
};

// Sumber data. Web = render halaman HTML (default), API = fetch JSON,
// feed = RSS/Atom, sitemap = crawl URL dari sitemap.xml.
export type SourceType = "web" | "api" | "feed" | "sitemap";

export type ApiPagination =
  | { type: "page"; pageParam: string; startPage?: number; maxPages: number; sizeParam?: string; pageSize?: number }
  | { type: "cursor"; cursorParam: string; cursorPath: string; maxPages: number }
  | { type: "link"; nextPath: string; maxPages: number };

export type ApiSourceConfig = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  // Dot path ke array item di response, misal "results" atau "data.papers".
  // Kosong berarti response itu sendiri array.
  itemsPath?: string;
  pagination?: ApiPagination;
};

export type SitemapSourceConfig = {
  // URL yang nggak mengandung substring ini dibuang, kosong berarti semua.
  urlFilter?: string;
  maxUrls?: number;
};

// Transform post-ekstraksi, dijalanin berurutan setelah rows terkumpul.
// Regex dipakai buat narik angka dari teks, template buat bikin kolom baru.
export type Transform =
  | { type: "regex"; field: string; pattern: string; group?: number; target?: string }
  | { type: "replace"; field: string; from: string; to: string }
  | { type: "number"; field: string; target?: string }
  | { type: "prefix"; field: string; value: string; target?: string }
  | { type: "suffix"; field: string; value: string; target?: string }
  | { type: "lowercase"; field: string; target?: string }
  | { type: "uppercase"; field: string; target?: string }
  | { type: "template"; template: string; target: string };

export type CssExtractConfig = {
  mode: "css";
  fields: ExtractField[];
  containerSelector?: string;
  limit?: number;
  navigation?: NavigationConfig;
  cookies?: Cookie[];
  proxies?: string[];
  schedule?: ScheduleConfig;
  webhookUrl?: string;
  sourceType?: SourceType;
  api?: ApiSourceConfig;
  sitemap?: SitemapSourceConfig;
  transforms?: Transform[];
};

export type AiExtractConfig = {
  mode: "ai";
  instruction: string;
  schema: AiField[];
  limit?: number;
  navigation?: NavigationConfig;
  cookies?: Cookie[];
  proxies?: string[];
  schedule?: ScheduleConfig;
  webhookUrl?: string;
  sourceType?: SourceType;
};

export type ExtractConfig = CssExtractConfig | AiExtractConfig;

export type ScrapedRow = Record<string, string>;
