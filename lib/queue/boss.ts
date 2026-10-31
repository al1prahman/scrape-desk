import PgBoss from "pg-boss";
import { env } from "@/lib/env";

// Pooler Supabase free tier maksimal 15 koneksi session mode,
// jadi pool sengaja dibatasi kecil biar worker nggak makan kuota sendirian.
export function createBoss(): PgBoss {
  return new PgBoss({ connectionString: env.DATABASE_URL, max: 2 });
}
