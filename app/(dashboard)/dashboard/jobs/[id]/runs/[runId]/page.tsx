import { notFound } from "next/navigation";
import {
  getRunWithJob,
  getResults,
  getResultsForDiff,
} from "@/lib/results/repository";
import { diffResults, getPreviousRunResults } from "@/lib/results/diff";
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

  // Change detection: bandingin sama run sebelumnya yang selesai.
  const [currentRows, previousRows] = await Promise.all([
    getResultsForDiff(runId),
    getPreviousRunResults(runWithJob.job.id, runWithJob.run.queued_at),
  ]);
  const change =
    previousRows.length > 0 && currentRows.length > 0
      ? diffResults(previousRows, currentRows)
      : null;

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

      {change && (
        <div className="rounded-card border border-line p-4">
          <span className="block text-sm font-medium">Perubahan vs run sebelumnya</span>
          <div className="mt-3 flex gap-6 text-sm">
            <span className="text-emerald-400">+{change.added} baru</span>
            <span className="text-rose-400">-{change.removed} hilang</span>
            <span className="text-muted">{change.unchanged} sama</span>
          </div>
          {change.samples.added.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-subtle">Contoh baris baru</span>
              <ul className="mt-1 space-y-1">
                {change.samples.added.map((row, index) => (
                  <li key={index} className="truncate font-mono text-xs text-muted">
                    {JSON.stringify(row)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {change.samples.removed.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-subtle">Contoh baris hilang</span>
              <ul className="mt-1 space-y-1">
                {change.samples.removed.map((row, index) => (
                  <li key={index} className="truncate font-mono text-xs text-subtle line-through">
                    {JSON.stringify(row)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
