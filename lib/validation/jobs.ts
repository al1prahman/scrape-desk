import { z } from "zod";

const paginationSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("next-selector"),
    nextSelector: z.string().min(1, "Selector tombol next wajib diisi").max(500),
    maxPages: z.number().int().min(2).max(50),
  }),
  z.object({
    mode: z.literal("url-pattern"),
    urlPattern: z
      .string()
      .min(1)
      .refine((value) => value.includes("{page}"), "Pattern harus mengandung {page}"),
    maxPages: z.number().int().min(2).max(50),
  }),
]);

const navigationSchema = z.object({
  pagination: paginationSchema.optional(),
  infiniteScroll: z
    .object({ maxScrolls: z.number().int().min(1).max(50) })
    .optional(),
});

const cookieSchema = z.object({
  name: z.string().min(1).max(200),
  value: z.string().max(4000),
});

const scheduleSchema = z.object({
  cron: z
    .string()
    .min(9)
    .refine((value) => value.trim().split(/\s+/).length === 5, "Cron harus 5 field: menit jam hari bulan hari-dalam-minggu"),
});

const proxySchema = z.string().url().max(500);

const cssConfigSchema = z.object({
  mode: z.literal("css"),
  fields: z
    .array(
      z.object({
        name: z.string().min(1, "Nama field wajib diisi").max(50),
        selector: z.string().min(1, "Selector wajib diisi").max(500),
      }),
    )
    .min(1, "Minimal satu field ekstraksi")
    .max(50, "Maksimal 50 field ekstraksi"),
  containerSelector: z.string().max(500).optional(),
  limit: z.number().int().positive().max(10000).optional(),
  navigation: navigationSchema.optional(),
  cookies: z.array(cookieSchema).max(50).optional(),
  proxies: z.array(proxySchema).max(20).optional(),
  schedule: scheduleSchema.optional(),
  webhookUrl: z.string().url().max(500).optional(),
});

const aiConfigSchema = z.object({
  mode: z.literal("ai"),
  instruction: z.string().min(10, "Instruksi minimal 10 karakter").max(2000),
  schema: z
    .array(
      z.object({
        name: z.string().min(1, "Nama field wajib diisi").max(50),
        description: z.string().min(1, "Deskripsi field wajib diisi").max(500),
      }),
    )
    .min(1, "Minimal satu field di schema")
    .max(50, "Maksimal 50 field di schema"),
  limit: z.number().int().positive().max(10000).optional(),
  navigation: navigationSchema.optional(),
  cookies: z.array(cookieSchema).max(50).optional(),
  proxies: z.array(proxySchema).max(20).optional(),
  schedule: scheduleSchema.optional(),
  webhookUrl: z.string().url().max(500).optional(),
});

export const extractConfigSchema = z.discriminatedUnion("mode", [cssConfigSchema, aiConfigSchema]);

export const createJobSchema = z.object({
  name: z.string().min(1, "Nama job wajib diisi").max(100),
  targetUrl: z.string().url("URL tidak valid"),
  config: extractConfigSchema,
});

export const updateJobSchema = createJobSchema.partial();

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export function parseJobFormData(formData: FormData) {
  let config: unknown = {};
  try {
    config = JSON.parse(String(formData.get("configJson") ?? "{}"));
  } catch {
    config = {};
  }

  return {
    name: String(formData.get("name") ?? ""),
    targetUrl: String(formData.get("targetUrl") ?? ""),
    config,
  };
}
