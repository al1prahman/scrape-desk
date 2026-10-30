"use client";

import { useActionState, useState } from "react";
import { buttonClass } from "@/components/ui/button";

type Field = { name: string; selector: string };

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
    fields: Field[];
  };
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-muted";

export function JobForm({ action, submitLabel, initialValues }: JobFormProps) {
  const [fields, setFields] = useState<Field[]>(
    initialValues?.fields.length ? initialValues.fields : [{ name: "", selector: "" }],
  );
  const [state, formAction, pending] = useActionState(action, { error: "" });

  function updateField(index: number, key: keyof Field, value: string) {
    setFields((prev) => prev.map((field, i) => (i === index ? { ...field, [key]: value } : field)));
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
        <div className="flex items-center justify-between">
          <span className="block text-sm text-muted">Field ekstraksi</span>
          <button
            type="button"
            onClick={() => setFields((prev) => [...prev, { name: "", selector: "" }])}
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            Tambah field
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1">
                <input
                  aria-label={`Nama field ${index + 1}`}
                  value={field.name}
                  onChange={(event) => updateField(index, "name", event.target.value)}
                  className={inputClass}
                  placeholder="nama field, misal title"
                />
              </div>
              <div className="flex-1">
                <input
                  aria-label={`Selector field ${index + 1}`}
                  value={field.selector}
                  onChange={(event) => updateField(index, "selector", event.target.value)}
                  className={inputClass}
                  placeholder="CSS selector, misal h2.title"
                />
              </div>
              <button
                type="button"
                onClick={() => setFields((prev) => prev.filter((_, i) => i !== index))}
                disabled={fields.length === 1}
                className="mb-2 text-sm text-subtle transition-colors hover:text-ink disabled:opacity-40"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
      <input type="hidden" name="fieldsJson" value={JSON.stringify(fields)} />
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
