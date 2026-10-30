import { createBrowserClient } from "@supabase/ssr";

// NEXT_PUBLIC_ diinline saat build, jadi nilai dijamin ada di bundle client.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
