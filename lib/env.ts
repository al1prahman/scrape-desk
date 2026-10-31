import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().startsWith("postgres"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  LLM_BASE_URL: z.string().url().default("http://localhost:20128/v1"),
  LLM_API_KEY: z.string().default("not-needed"),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Environment tidak valid, cek: ${fields}`);
  }
  return parsed.data;
}

export const env = loadEnv();
