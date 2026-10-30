import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

const KEY_COLUMNS = "id, name, key_prefix, last_used_at, created_at, revoked_at";

function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select(KEY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as ApiKey[];
}

export async function createApiKey(name: string): Promise<{ key: ApiKey; plaintext: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHORIZED");

  const plaintext = `sk_live_${randomBytes(24).toString("base64url")}`;

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name,
      key_hash: hashKey(plaintext),
      key_prefix: plaintext.slice(0, 12),
    })
    .select(KEY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return { key: data as ApiKey, plaintext };
}

export async function revokeApiKey(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// Dipakai public API yang nggak punya session user, jadi lewat admin client.
export async function findUserByApiKey(plaintext: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id, revoked_at")
    .eq("key_hash", hashKey(plaintext))
    .single();

  if (error || !data || data.revoked_at) return null;
  return data.user_id;
}

export async function touchApiKey(plaintext: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", hashKey(plaintext));
}
