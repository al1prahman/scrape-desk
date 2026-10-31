import { chatComplete } from "@/lib/llm/client";
import { htmlToMarkdown } from "./markdown";
import type { AiExtractConfig, AiField, ScrapedRow } from "./types";

const MAX_CONTENT_CHARS = 24000;

const SYSTEM_PROMPT = [
  "You are a data extraction engine.",
  "Extract structured data from web page content according to the user's instruction.",
  "Return ONLY a valid JSON array of objects, no markdown code fences, no explanation.",
  "Each object must use exactly the field names from the provided schema.",
  "If no matching data exists on the page, return an empty array [].",
].join(" ");

function buildUserPrompt(config: AiExtractConfig, markdown: string): string {
  const schemaDescription = config.schema
    .map((field) => `- ${field.name}: ${field.description}`)
    .join("\n");

  return [
    `Instruction: ${config.instruction}`,
    "",
    "Output schema (JSON array of objects with these exact keys):",
    schemaDescription,
    "",
    "Page content:",
    markdown.slice(0, MAX_CONTENT_CHARS),
  ].join("\n");
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// LLM kadang ngasih key yang beda dikit dari schema, jadi dicocokkan longgar.
function normalizeRow(row: Record<string, unknown>, schema: AiField[]): ScrapedRow {
  const normalized: ScrapedRow = {};

  for (const field of schema) {
    const matchKey = Object.keys(row).find(
      (key) => normalizeKey(key) === normalizeKey(field.name),
    );
    const value = matchKey ? row[matchKey] : row[field.name];
    normalized[field.name] =
      value === undefined || value === null ? "" : String(value);
  }

  return normalized;
}

export function parseRowsFromLlm(raw: string, schema: AiField[]): ScrapedRow[] {
  const withoutFence = raw.replace(/```(?:json)?/gi, "").trim();
  const start = withoutFence.indexOf("[");
  const end = withoutFence.lastIndexOf("]");

  if (start === -1 || end <= start) {
    throw new Error("LLM nggak balikin JSON array");
  }

  const parsed: unknown = JSON.parse(withoutFence.slice(start, end + 1));

  if (!Array.isArray(parsed)) {
    throw new Error("Response LLM bukan array");
  }

  return parsed
    .filter(
      (row): row is Record<string, unknown> =>
        typeof row === "object" && row !== null && !Array.isArray(row),
    )
    .map((row) => normalizeRow(row, schema));
}

export async function extractWithAi(html: string, config: AiExtractConfig): Promise<ScrapedRow[]> {
  const markdown = htmlToMarkdown(html);

  if (markdown.length === 0) {
    throw new Error("Halaman nggak punya konten yang bisa diekstrak");
  }

  const raw = await chatComplete(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(config, markdown) },
    ],
    { maxTokens: 8192 },
  );

  return parseRowsFromLlm(raw, config.schema);
}
