import PgBoss from "pg-boss";
import { env } from "@/lib/env";

export function createBoss(): PgBoss {
  return new PgBoss(env.DATABASE_URL);
}
