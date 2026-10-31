import { env } from "@/lib/env";

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

// Client OpenAI-compatible, jadi bisa colok ke 9Router, OpenRouter, atau provider lain.
export async function chatComplete(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const response = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages,
      temperature: options.temperature ?? 0,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LLM request gagal ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: unknown = data.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.length === 0) {
    throw new Error("LLM balikin response kosong");
  }

  return content;
}
