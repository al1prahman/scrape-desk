"use client";

import { useActionState, useState } from "react";
import { createApiKeyAction, type KeyActionState } from "./actions";

const initialState: KeyActionState = { error: "" };

const inputClass =
  "flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-muted";

export function KeyForm() {
  const [state, formAction, pending] = useActionState(createApiKeyAction, initialState);
  const [copied, setCopied] = useState(false);
  const plaintext = state.plaintext;

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex gap-3">
        <input
          name="name"
          required
          placeholder="nama key, misal production"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-accent disabled:opacity-60"
        >
          {pending ? "Bikin..." : "Bikin key"}
        </button>
      </form>
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {plaintext ? (
        <div className="rounded-card border border-line bg-surface p-4">
          <p className="text-xs text-muted">Copy sekarang, nggak akan ditampilin lagi:</p>
          <div className="mt-2 flex items-center gap-3">
            <code className="flex-1 break-all font-mono text-xs text-ink">{plaintext}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(plaintext);
                setCopied(true);
              }}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {copied ? "Tersalin" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
