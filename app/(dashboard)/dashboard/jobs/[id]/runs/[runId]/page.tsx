import { notFound } from "next/navigation";
import { getRunWithJob, getResults } from "@/lib/results/repository";
import { getColumns } from "@/lib/scrape/columns";
import { ResultsViewer } from "./results-viewer";

const PAGE_SIZE = 50;

export default async function RunResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { runId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);

  const runWithJob = await getRunWithJob(runId);
  if (!runWithJob) notFound();

  const results = await getResults(runId, page, PAGE_SIZE);
  const columns = getColumns(runWithJob.job.config);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-subtle">
          {runWithJob.job.name}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Hasil run</h1>
        <p className="mt-1 text-sm text-muted">
          Status {runWithJob.run.status}, {runWithJob.run.row_count} rows
        </p>
      </div>
      {results.rows.length === 0 ? (
        <p className="text-sm text-muted">Belum ada hasil buat run ini.</p>
      ) : (
        <ResultsViewer
          runId={runId}
          columns={columns}
          rows={results.rows}
          page={results.page}
          pageSize={results.pageSize}
          total={results.total}
        />
      )}
    </div>
  );
}
