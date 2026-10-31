import { z } from "zod";

const cssConfigSchema = z.object({
  mode: z.literal("css"),
  fields: z
    .array(
      z.object({
        name: z.string().min(1, "Nama field wajib diisi").max(50),
        selector: z.string().min(1, "Selector wajib diisi").max(500),
      }),
    )
    .min(1, "Minimal satu field ekstraksi"),
  limit: z.number().int().positive().max(10000).optional(),
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
    .min(1, "Minimal satu field di schema"),
  limit: z.number().int().positive().max(10000).optional(),
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
