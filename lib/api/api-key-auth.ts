import type { NextRequest } from "next/server";
import { findUserByApiKey, touchApiKey } from "@/lib/api-keys/repository";

export async function authenticateApiKey(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const plaintext = header.slice("Bearer ".length).trim();
  const userId = await findUserByApiKey(plaintext);

  if (userId) {
    void touchApiKey(plaintext);
  }

  return userId;
}
