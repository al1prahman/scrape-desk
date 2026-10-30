import Link from "next/link";
import { listJobs } from "@/lib/jobs/repository";
import { buttonClass } from "@/components/ui/button";

export default async function JobsPage() {
  const jobs = await listJobs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <Link href="/dashboard/jobs/new" className={buttonClass("primary")}>
          New Job
        </Link>
      </div>
      {jobs.length === 0 ? (
        <p className="text-sm text-muted">
          Belum ada job. Bikin job pertama buat mulai scraping.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-subtle">
              <th className="pb-3 font-medium">Nama</th>
              <th className="pb-3 font-medium">Target</th>
              <th className="pb-3 font-medium">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-line">
                <td className="py-3">
                  <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                    {job.name}
                  </Link>
                </td>
                <td className="max-w-xs truncate py-3 text-muted">{job.target_url}</td>
                <td className="py-3 text-muted">
                  {new Date(job.created_at).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
