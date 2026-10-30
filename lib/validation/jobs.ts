import { z } from "zod";

const extractFieldSchema = z.object({
  name: z.string().min(1, "Nama field wajib diisi").max(50),
  selector: z.string().min(1, "Selector wajib diisi").max(500),
});

export const createJobSchema = z.object({
  name: z.string().min(1, "Nama job wajib diisi").max(100),
  targetUrl: z.string().url("URL tidak valid"),
  fields: z.array(extractFieldSchema).min(1, "Minimal satu field ekstraksi"),
});

export const updateJobSchema = createJobSchema.partial();

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export function parseJobFormData(formData: FormData) {
  let fields: unknown = [];
  try {
    fields = JSON.parse(String(formData.get("fieldsJson") ?? "[]"));
  } catch {
    fields = [];
  }

  return {
    name: String(formData.get("name") ?? ""),
    targetUrl: String(formData.get("targetUrl") ?? ""),
    fields,
  };
}
