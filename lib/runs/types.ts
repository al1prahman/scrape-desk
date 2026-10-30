export type RunStatus = "queued" | "running" | "done" | "failed" | "cancelled";
export type RunTrigger = "manual" | "api" | "schedule";

export type Run = {
  id: string;
  job_id: string;
  status: RunStatus;
  trigger: RunTrigger;
  error: string | null;
  row_count: number;
  queued_at: string;
  started_at: string | null;
  finished_at: string | null;
};
