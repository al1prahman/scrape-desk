import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getRunWithJob, getResults } from "@/lib/results/repository";
import { toCsv } from "@/lib/export/csv";

const EXPORT_LIMIT = 10000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError(401, "UNAUTHORIZED", "Belum login");
  }

  const { runId } = await params;
  const runWithJob = await getRunWithJob(runId);

  if (!runWithJob) {
    return apiError(404, "NOT_FOUND", "Run tidak ditemukan");
  }

  const { rows } = await getResults(runId, 1, EXPORT_LIMIT);
  const columns = runWithJob.job.config.fields.map((field) => field.name);

  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new Response(toCsv(rows, columns), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="scrapedesk-${runId}.csv"`,
      },
    });
  }

  return apiSuccess({ runId, columns, rows });
}
