import type { ApiPagination, ApiSourceConfig, Cookie, ScrapedRow } from "./types";

const FETCH_TIMEOUT_MS = 30_000;

// Dot path dengan dukungan index array: "data.children", "authors[0].name".
function getPath(value: unknown, path: string): unknown {
  if (!path) return value;

  const segments = path.split(".").flatMap((segment) => {
    const match = segment.match(/^([^[]+)(\[(\d+)\])?$/);
    if (!match) return [segment];
    return match[3] !== undefined ? [match[1], Number(match[3])] : [match[1]];
  });

  let current: unknown = value;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string | number, unknown>)[segment];
  }
  return current;
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function cookiesToHeader(cookies: Cookie[]): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

function buildUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function fetchJson(
  url: string,
  api: ApiSourceConfig,
  cookies: Cookie[],
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...api.headers,
  };
  if (cookies.length > 0) {
    headers.Cookie = cookiesToHeader(cookies);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: api.method ?? "GET",
      headers,
      body: api.method === "POST" ? api.body : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API balik HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function mapRows(items: unknown[], fields: { name: string; selector: string }[]): ScrapedRow[] {
  return items.map((item) => {
    const row: ScrapedRow = {};
    for (const field of fields) {
      row[field.name] = stringify(getPath(item, field.selector));
    }
    return row;
  });
}

// State paginasi yang dibawa antar request.
type PageState = { url: string; page: number; cursor?: string };

function nextState(
  current: PageState,
  body: unknown,
  pagination: ApiPagination,
): PageState | null {
  switch (pagination.type) {
    case "page": {
      const nextPage = current.page + 1;
      if (nextPage - (pagination.startPage ?? 1) >= pagination.maxPages) return null;
      const params: Record<string, string> = { [pagination.pageParam]: String(nextPage) };
      if (pagination.sizeParam && pagination.pageSize) {
        params[pagination.sizeParam] = String(pagination.pageSize);
      }
      return { url: buildUrl(current.url, params), page: nextPage };
    }
    case "cursor": {
      const cursor = getPath(body, pagination.cursorPath);
      if (cursor === undefined || cursor === null || cursor === "") return null;
      return {
        url: buildUrl(current.url, { [pagination.cursorParam]: String(cursor) }),
        page: current.page + 1,
        cursor: String(cursor),
      };
    }
    case "link": {
      const next = getPath(body, pagination.nextPath);
      if (typeof next !== "string" || !next) return null;
      return { url: next, page: current.page + 1 };
    }
  }
}

export type ApiScrapeResult = {
  rows: ScrapedRow[];
  pagesFetched: number;
};

export async function scrapeApi(
  url: string,
  config: {
    fields: { name: string; selector: string }[];
    limit?: number;
    cookies?: Cookie[];
    api?: ApiSourceConfig;
  },
): Promise<ApiScrapeResult> {
  const api = config.api ?? {};
  const cookies = config.cookies ?? [];
  const pagination = api.pagination;

  const rows: ScrapedRow[] = [];
  let pagesFetched = 0;

  let state: PageState | null = {
    url: pagination?.type === "page" && pagination.sizeParam && pagination.pageSize
      ? buildUrl(url, { [pagination.sizeParam]: String(pagination.pageSize) })
      : url,
    page: pagination?.type === "page" ? (pagination.startPage ?? 1) : 1,
  };

  while (state) {
    const body = await fetchJson(state.url, api, cookies);
    pagesFetched++;

    const items = api.itemsPath ? getPath(body, api.itemsPath) : body;
    if (!Array.isArray(items)) {
      if (pagesFetched === 1) {
        throw new Error(
          `itemsPath "${api.itemsPath ?? "(root)"}" nggak nemu array di response`,
        );
      }
      break;
    }

    rows.push(...mapRows(items, config.fields));

    if (config.limit && rows.length >= config.limit) break;
    if (!pagination) break;

    state = nextState(state, body, pagination);
  }

  return {
    rows: config.limit ? rows.slice(0, config.limit) : rows,
    pagesFetched,
  };
}
