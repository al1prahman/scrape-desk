import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs/repository";
import { listRuns } from "@/lib/runs/repository";
import { buttonClass } from "@/components/ui/button";
import { JobForm } from "../job-form";
import { RunMonitor } from "./run-monitor";
import { updateJobAction, deleteJobAction, triggerRunAction } from "../actions";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) notFound();

  const runs = await listRuns(id);

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{job.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {job.target_url}{" "}
          <span className="text-subtle">
            mode {job.config.mode === "ai" ? "AI extract" : "CSS selector"}
          </span>
        </p>
      </div>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Run history</h2>
          <form action={triggerRunAction.bind(null, job.id)}>
            <button type="submit" className={buttonClass("primary")}>
              Run Now
            </button>
          </form>
        </div>
        <div className="mt-4">
          <RunMonitor jobId={job.id} initialRuns={runs} />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium">Edit job</h2>
        <JobForm
          action={updateJobAction.bind(null, job.id)}
          submitLabel="Simpan perubahan"
          initialValues={{
            name: job.name,
            targetUrl: job.target_url,
            config: job.config,
          }}
        />
      </section>
      <section className="border-t border-line pt-6">
        <form action={deleteJobAction.bind(null, job.id)}>
          <button type="submit" className="text-sm text-red-400 transition-colors hover:text-red-300">
            Hapus job
          </button>
        </form>
      </section>
    </div>
  );
}
