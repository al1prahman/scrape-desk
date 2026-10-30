import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Dipakai worker dan proses sistem yang bertindak atas nama platform,
// bukan atas nama user. Bypass RLS secara sengaja.
export function createAdminClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
}
