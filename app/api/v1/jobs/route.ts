import type { NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/api-key-auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createJobSchema } from "@/lib/validation/jobs";
import { listJobsForUser, createJobForUser } from "@/lib/jobs/api-repository";

export async function GET(request: NextRequest) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "API key tidak valid");
  }

  const jobs = await listJobsForUser(userId);
  return apiSuccess({ jobs });
}

export async function POST(request: NextRequest) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "API key tidak valid");
  }

  const parsed = createJobSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Input tidak valid");
  }

  try {
    const job = await createJobForUser(userId, parsed.data);
    return apiSuccess({ job }, 201);
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Gagal membuat job");
  }
}
