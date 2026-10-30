import { JobForm } from "../job-form";
import { createJobAction } from "../actions";

export default function NewJobPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">New Job</h1>
      <p className="mt-2 text-sm text-muted">
        Define target URL dan field yang mau diekstrak.
      </p>
      <JobForm action={createJobAction} submitLabel="Buat job" />
    </div>
  );
}
