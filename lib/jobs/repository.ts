import { createClient } from "@/lib/supabase/server";
import type { CreateJobInput, UpdateJobInput } from "@/lib/validation/jobs";
import type { Job } from "./types";

export async function listJobs(): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Job[];
}

export async function getJob(id: string): Promise<Job | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();

  if (error) return null;
  return data as Job;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      name: input.name,
      target_url: input.targetUrl,
      config: input.config,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.targetUrl !== undefined) patch.target_url = input.targetUrl;
  if (input.config !== undefined) patch.config = input.config;

  const { data, error } = await supabase
    .from("jobs")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}

export async function deleteJob(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
