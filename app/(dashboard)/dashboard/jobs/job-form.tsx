"use client";

import { useActionState, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { Cookie, ExtractConfig, NavigationConfig } from "@/lib/scrape/types";

type CssField = { name: string; selector: string };
type AiField = { name: string; description: string };
type PaginationMode = "none" | "next-selector" | "url-pattern";

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

function parseCookies(text: string): Cookie[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) return null;
      return {
        name: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((cookie): cookie is Cookie => cookie !== null);
}

export function JobForm({ action, submitLabel, initialValues }: JobFormProps) {
  const initialConfig = initialValues?.config;
  const initialNavigation = initialConfig?.navigation;

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

  const [paginationMode, setPaginationMode] = useState<PaginationMode>(
    initialNavigation?.pagination?.mode ?? "none",
  );
  const [nextSelector, setNextSelector] = useState(
    initialNavigation?.pagination?.mode === "next-selector"
      ? initialNavigation.pagination.nextSelector
      : "",
  );
  const [urlPattern, setUrlPattern] = useState(
    initialNavigation?.pagination?.mode === "url-pattern"
      ? initialNavigation.pagination.urlPattern
      : "",
  );
  const [maxPages, setMaxPages] = useState(initialNavigation?.pagination?.maxPages ?? 3);
  const [infiniteScroll, setInfiniteScroll] = useState(
    Boolean(initialNavigation?.infiniteScroll),
  );
  const [maxScrolls, setMaxScrolls] = useState(
    initialNavigation?.infiniteScroll?.maxScrolls ?? 5,
  );
  const [cookiesText, setCookiesText] = useState(
    initialConfig?.cookies?.map((cookie) => `${cookie.name}=${cookie.value}`).join("\n") ?? "",
  );
  const [proxiesText, setProxiesText] = useState(
    initialConfig?.proxies?.join("\n") ?? "",
  );
  const [cron, setCron] = useState(initialConfig?.schedule?.cron ?? "");
  const [webhookUrl, setWebhookUrl] = useState(initialConfig?.webhookUrl ?? "");
  const [containerSelector, setContainerSelector] = useState(
    initialConfig?.mode === "css" ? (initialConfig.containerSelector ?? "") : "",
  );

  const [state, formAction, pending] = useActionState(action, { error: "" });

  function buildNavigation(): NavigationConfig | undefined {
    const navigation: NavigationConfig = {};

    if (paginationMode === "next-selector" && nextSelector) {
      navigation.pagination = { mode: "next-selector", nextSelector, maxPages };
    }

    if (paginationMode === "url-pattern" && urlPattern.includes("{page}")) {
      navigation.pagination = { mode: "url-pattern", urlPattern, maxPages };
    }

    if (infiniteScroll) {
      navigation.infiniteScroll = { maxScrolls };
    }

    return Object.keys(navigation).length > 0 ? navigation : undefined;
  }

  function buildConfig(): ExtractConfig {
    const navigation = buildNavigation();
    const cookies = parseCookies(cookiesText);
    const proxies = proxiesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const trimmedCron = cron.trim();
    const trimmedWebhook = webhookUrl.trim();

    const base =
      mode === "css"
        ? {
            mode: "css" as const,
            fields: cssFields,
            ...(containerSelector.trim() ? { containerSelector: containerSelector.trim() } : {}),
          }
        : { mode: "ai" as const, instruction, schema: aiFields };

    return {
      ...base,
      ...(navigation ? { navigation } : {}),
      ...(cookies.length > 0 ? { cookies } : {}),
      ...(proxies.length > 0 ? { proxies } : {}),
      ...(trimmedCron ? { schedule: { cron: trimmedCron } } : {}),
      ...(trimmedWebhook ? { webhookUrl: trimmedWebhook } : {}),
    };
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
          <div>
            <label htmlFor="containerSelector" className="block text-sm text-muted">
              Container selector, opsional. Kalau diisi, tiap elemen yang match jadi satu baris dan
              field diekstrak relatif di dalamnya. Kalau kosong, field dikumpulkan sebagai kolom.
            </label>
            <input
              id="containerSelector"
              value={containerSelector}
              onChange={(event) => setContainerSelector(event.target.value)}
              className={inputClass}
              placeholder="article.product_pod"
            />
          </div>
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

      <div className="space-y-4 rounded-card border border-line p-4">
        <span className="block text-sm font-medium">Navigasi</span>

        <div>
          <span className="block text-xs text-muted">Pagination</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaginationMode("none")}
              className={modeButtonClass(paginationMode === "none")}
            >
              Tidak ada
            </button>
            <button
              type="button"
              onClick={() => setPaginationMode("next-selector")}
              className={modeButtonClass(paginationMode === "next-selector")}
            >
              Tombol Next
            </button>
            <button
              type="button"
              onClick={() => setPaginationMode("url-pattern")}
              className={modeButtonClass(paginationMode === "url-pattern")}
            >
              URL Pattern
            </button>
          </div>
        </div>

        {paginationMode === "next-selector" ? (
          <div>
            <label htmlFor="nextSelector" className="block text-xs text-muted">
              Selector tombol next
            </label>
            <input
              id="nextSelector"
              value={nextSelector}
              onChange={(event) => setNextSelector(event.target.value)}
              className={inputClass}
              placeholder="misal li.next a"
            />
          </div>
        ) : null}

        {paginationMode === "url-pattern" ? (
          <div>
            <label htmlFor="urlPattern" className="block text-xs text-muted">
              URL pattern, pakai tanda {"{page}"} buat nomor halaman
            </label>
            <input
              id="urlPattern"
              value={urlPattern}
              onChange={(event) => setUrlPattern(event.target.value)}
              className={inputClass}
              placeholder="https://contoh.com/listing?page={page}"
            />
          </div>
        ) : null}

        {paginationMode !== "none" ? (
          <div>
            <label htmlFor="maxPages" className="block text-xs text-muted">
              Maksimal halaman
            </label>
            <input
              id="maxPages"
              type="number"
              min={2}
              max={50}
              value={maxPages}
              onChange={(event) => setMaxPages(Number(event.target.value))}
              className={inputClass}
            />
          </div>
        ) : null}

        <div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={infiniteScroll}
              onChange={(event) => setInfiniteScroll(event.target.checked)}
            />
            Infinite scroll, scroll ke bawah sampai konten habis
          </label>
        </div>

        {infiniteScroll ? (
          <div>
            <label htmlFor="maxScrolls" className="block text-xs text-muted">
              Maksimal scroll
            </label>
            <input
              id="maxScrolls"
              type="number"
              min={1}
              max={50}
              value={maxScrolls}
              onChange={(event) => setMaxScrolls(Number(event.target.value))}
              className={inputClass}
            />
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="cookies" className="block text-sm text-muted">
          Cookies, satu per baris format name=value, opsional buat halaman yang butuh login
        </label>
        <textarea
          id="cookies"
          value={cookiesText}
          onChange={(event) => setCookiesText(event.target.value)}
          rows={3}
          className={inputClass}
          placeholder={"session=abc123\ncsrf=xyz789"}
        />
      </div>

      <div>
        <label htmlFor="proxies" className="block text-sm text-muted">
          Proxies, satu per baris format http://user:pass@ip:port, dirotasi per halaman, opsional
        </label>
        <textarea
          id="proxies"
          value={proxiesText}
          onChange={(event) => setProxiesText(event.target.value)}
          rows={3}
          className={inputClass}
          placeholder={"http://user:pass@1.2.3.4:8080\nhttp://user:pass@5.6.7.8:8080"}
        />
      </div>

      <div className="space-y-4 rounded-card border border-line p-4">
        <span className="block text-sm font-medium">Otomasi</span>

        <div>
          <label htmlFor="cron" className="block text-xs text-muted">
            Schedule cron, kosongin kalau mau manual doang. Format 5 field: menit jam hari bulan
            hari-dalam-minggu
          </label>
          <input
            id="cron"
            value={cron}
            onChange={(event) => setCron(event.target.value)}
            className={inputClass}
            placeholder="0 9 * * * (tiap hari jam 9 pagi)"
          />
        </div>

        <div>
          <label htmlFor="webhookUrl" className="block text-xs text-muted">
            Webhook URL, dikirimi notifikasi JSON pas run selesai, opsional
          </label>
          <input
            id="webhookUrl"
            type="url"
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.target.value)}
            className={inputClass}
            placeholder="https://domain-lo.com/webhook"
          />
        </div>
      </div>

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
