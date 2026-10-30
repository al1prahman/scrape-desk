"use server";

import { revalidatePath } from "next/cache";
import { createApiKey, revokeApiKey } from "@/lib/api-keys/repository";

export type KeyActionState = { error: string; plaintext?: string };

export async function createApiKeyAction(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Nama key wajib diisi." };
  }

  try {
    const { plaintext } = await createApiKey(name);
    revalidatePath("/dashboard/keys");
    return { error: "", plaintext };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal bikin key" };
  }
}

export async function revokeApiKeyAction(id: string): Promise<void> {
  await revokeApiKey(id);
  revalidatePath("/dashboard/keys");
}
