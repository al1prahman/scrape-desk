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

export type CssExtractConfig = {
  mode: "css";
  fields: ExtractField[];
  limit?: number;
  navigation?: NavigationConfig;
  cookies?: Cookie[];
  proxies?: string[];
  schedule?: ScheduleConfig;
  webhookUrl?: string;
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
};

export type ExtractConfig = CssExtractConfig | AiExtractConfig;

export type ScrapedRow = Record<string, string>;
