"use client";

import { useActionState, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { ExtractConfig } from "@/lib/scrape/types";

type CssField = { name: string; selector: string };
type AiField = { name: string; description: string };

type JobFormAction = (
  prev: { error: string },
  formData: FormData,
) => Promise<{ error: string }>;

type JobFormProps = {
  action: JobFormAction;
  submitLabel: string;
  initialValues?: {
    name: string;
    targetUrl: string;
    config: ExtractConfig;
  };
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-muted";

const modeButtonClass = (active: boolean) =>
  `rounded-full px-4 py-1.5 text-xs transition-colors ${
    active ? "bg-ink text-canvas" : "border border-line text-muted hover:text-ink"
  }`;

export function JobForm({ action, submitLabel, initialValues }: JobFormProps) {
  const initialConfig = initialValues?.config;

  const [mode, setMode] = useState<"css" | "ai">(initialConfig?.mode ?? "css");
  const [cssFields, setCssFields] = useState<CssField[]>(
    initialConfig?.mode === "css" && initialConfig.fields.length
      ? initialConfig.fields
      : [{ name: "", selector: "" }],
  );
  const [aiFields, setAiFields] = useState<AiField[]>(
    initialConfig?.mode === "ai" && initialConfig.schema.length
      ? initialConfig.schema
      : [{ name: "", description: "" }],
  );
  const [instruction, setInstruction] = useState(
    initialConfig?.mode === "ai" ? initialConfig.instruction : "",
  );
  const [state, formAction, pending] = useActionState(action, { error: "" });

  function buildConfig(): ExtractConfig {
    return mode === "css"
      ? { mode: "css", fields: cssFields }
      : { mode: "ai", instruction, schema: aiFields };
  }

  function updateCssField(index: number, key: keyof CssField, value: string) {
    setCssFields((prev) => prev.map((field, i) => (i === index ? { ...field, [key]: value } : field)));
  }

  function updateAiField(index: number, key: keyof AiField, value: string) {
    setAiFields((prev) => prev.map((field, i) => (i === index ? { ...field, [key]: value } : field)));
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm text-muted">
          Nama job
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initialValues?.name}
          className={inputClass}
          placeholder="misal Harga kompetitor"
        />
      </div>
      <div>
        <label htmlFor="targetUrl" className="block text-sm text-muted">
          Target URL
        </label>
        <input
          id="targetUrl"
          name="targetUrl"
          type="url"
          required
          defaultValue={initialValues?.targetUrl}
          className={inputClass}
          placeholder="https://contoh.com/listing"
        />
      </div>

      <div>
        <span className="block text-sm text-muted">Mode ekstraksi</span>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("css")}
            className={modeButtonClass(mode === "css")}
          >
            CSS Selector
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={modeButtonClass(mode === "ai")}
          >
            AI Extract
          </button>
        </div>
        <p className="mt-2 text-xs text-subtle">
          {mode === "css"
            ? "Tepat per elemen, cocok buat halaman dengan struktur konsisten."
            : "LLM baca konten halaman dan ekstrak sesuai instruksi, cocok buat halaman berantapan."}
        </p>
      </div>

      {mode === "css" ? (
        <div>
          <div className="flex items-center justify-between">
            <span className="block text-sm text-muted">Field ekstraksi</span>
            <button
              type="button"
              onClick={() => setCssFields((prev) => [...prev, { name: "", selector: "" }])}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Tambah field
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {cssFields.map((field, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  <input
                    aria-label={`Nama field ${index + 1}`}
                    value={field.name}
                    onChange={(event) => updateCssField(index, "name", event.target.value)}
                    className={inputClass}
                    placeholder="nama field, misal title"
                  />
                </div>
                <div className="flex-1">
                  <input
                    aria-label={`Selector field ${index + 1}`}
                    value={field.selector}
                    onChange={(event) => updateCssField(index, "selector", event.target.value)}
                    className={inputClass}
                    placeholder="CSS selector, misal h2.title"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCssFields((prev) => prev.filter((_, i) => i !== index))}
                  disabled={cssFields.length === 1}
                  className="mb-2 text-sm text-subtle transition-colors hover:text-ink disabled:opacity-40"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="instruction" className="block text-sm text-muted">
              Instruksi ekstraksi
            </label>
            <textarea
              id="instruction"
              required
              minLength={10}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              rows={3}
              className={inputClass}
              placeholder="misal Ambil nama produk, harga, dan rating untuk setiap item di halaman ini"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="block text-sm text-muted">Schema output</span>
              <button
                type="button"
                onClick={() => setAiFields((prev) => [...prev, { name: "", description: "" }])}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                Tambah field
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {aiFields.map((field, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1">
                    <input
                      aria-label={`Nama field ${index + 1}`}
                      value={field.name}
                      onChange={(event) => updateAiField(index, "name", event.target.value)}
                      className={inputClass}
                      placeholder="nama field, misal price"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      aria-label={`Deskripsi field ${index + 1}`}
                      value={field.description}
                      onChange={(event) => updateAiField(index, "description", event.target.value)}
                      className={inputClass}
                      placeholder="deskripsi, misal harga dalam rupiah"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiFields((prev) => prev.filter((_, i) => i !== index))}
                    disabled={aiFields.length === 1}
                    className="mb-2 text-sm text-subtle transition-colors hover:text-ink disabled:opacity-40"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <input type="hidden" name="configJson" value={JSON.stringify(buildConfig())} />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-accent disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
