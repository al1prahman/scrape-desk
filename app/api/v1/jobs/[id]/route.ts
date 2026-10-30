import type { NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/api-key-auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getJobForUser } from "@/lib/jobs/api-repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "API key tidak valid");
  }

  const { id } = await params;
  const job = await getJobForUser(userId, id);

  if (!job) {
    return apiError(404, "NOT_FOUND", "Job tidak ditemukan");
  }

  return apiSuccess({ job });
}
