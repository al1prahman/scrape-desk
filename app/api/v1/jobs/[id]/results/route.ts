import type { NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/api-key-auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  getJobForUser,
  getLatestDoneRun,
  getResultsForRun,
} from "@/lib/jobs/api-repository";
import { toCsv } from "@/lib/export/csv";

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

  const run = await getLatestDoneRun(job.id);
  if (!run) {
    return apiError(404, "NOT_FOUND", "Belum ada run selesai buat job ini");
  }

  const rows = await getResultsForRun(run.id);
  const columns = job.config.fields.map((field) => field.name);

  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new Response(toCsv(rows, columns), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="scrapedesk-${job.id}.csv"`,
      },
    });
  }

  return apiSuccess({ jobId: job.id, runId: run.id, columns, rows });
}
