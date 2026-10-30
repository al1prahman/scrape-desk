import { listApiKeys } from "@/lib/api-keys/repository";
import { KeyForm } from "./key-form";
import { revokeApiKeyAction } from "./actions";

export default async function KeysPage() {
  const keys = await listApiKeys();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="mt-2 text-sm text-muted">
          Key dipakai buat akses public API. Plaintext cuma ditampilin sekali saat create.
        </p>
      </div>
      <KeyForm />
      {keys.length === 0 ? (
        <p className="text-sm text-muted">Belum ada key.</p>
      ) : (
        <ul className="space-y-2">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm">{key.name}</p>
                <p className="font-mono text-xs text-subtle">{key.key_prefix}...</p>
              </div>
              {key.revoked_at ? (
                <span className="text-xs text-subtle">revoked</span>
              ) : (
                <form action={revokeApiKeyAction.bind(null, key.id)}>
                  <button
                    type="submit"
                    className="text-sm text-red-400 transition-colors hover:text-red-300"
                  >
                    Revoke
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
