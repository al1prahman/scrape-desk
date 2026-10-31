"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createJobSchema,
  updateJobSchema,
  parseJobFormData,
} from "@/lib/validation/jobs";
import { createJob, updateJob, deleteJob } from "@/lib/jobs/repository";
import { createRun } from "@/lib/runs/repository";
import { enqueueScrape } from "@/lib/queue/enqueue";
import { registerJobSchedule } from "@/lib/queue/schedule";
import type { Job } from "@/lib/jobs/types";

export type JobActionState = { error: string };

export async function createJobAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = createJobSchema.safeParse(parseJobFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  let job: Job;
  try {
    job = await createJob(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal membuat job" };
  }

  if (job.config.schedule) {
    try {
      await registerJobSchedule(job.id, job.config.schedule.cron);
    } catch (error) {
      return {
        error: `Job dibuat tapi schedule gagal: ${error instanceof Error ? error.message : "unknown"}`,
      };
    }
  }

  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${job.id}`);
}

export async function updateJobAction(
  id: string,
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = updateJobSchema.safeParse(parseJobFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  try {
    const job = await updateJob(id, parsed.data);

    // Schedule baru didaftarin, run terjadwal lama berhenti sendiri kalau
    // schedule dihapus karena config job nggak lagi punya schedule.
    if (job.config.schedule) {
      await registerJobSchedule(id, job.config.schedule.cron);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan perubahan" };
  }

  revalidatePath(`/dashboard/jobs/${id}`);
  redirect(`/dashboard/jobs/${id}`);
}

export async function deleteJobAction(id: string): Promise<void> {
  await deleteJob(id);
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}

export async function triggerRunAction(jobId: string): Promise<void> {
  const run = await createRun(jobId, "manual");
  await enqueueScrape({ runId: run.id, jobId });
  revalidatePath(`/dashboard/jobs/${jobId}`);
}
