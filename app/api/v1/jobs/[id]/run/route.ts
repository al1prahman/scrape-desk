import type { NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/api-key-auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getJobForUser, createRunForJob } from "@/lib/jobs/api-repository";
import { enqueueScrape } from "@/lib/queue/enqueue";

export async function POST(
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

  try {
    const run = await createRunForJob(job.id);
    await enqueueScrape({ runId: run.id, jobId: job.id });
    return apiSuccess({ run }, 201);
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Gagal trigger run");
  }
}
