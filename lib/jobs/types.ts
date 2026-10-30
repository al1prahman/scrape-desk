export type ExtractField = {
  name: string;
  selector: string;
};

export type JobConfig = {
  fields: ExtractField[];
};

export type Job = {
  id: string;
  user_id: string;
  name: string;
  target_url: string;
  config: JobConfig;
  created_at: string;
  updated_at: string;
};
