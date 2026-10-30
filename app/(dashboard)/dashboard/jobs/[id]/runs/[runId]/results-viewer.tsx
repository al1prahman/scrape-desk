"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { ScrapedRow } from "@/lib/scrape/types";

type ResultsViewerProps = {
  runId: string;
  columns: string[];
  rows: ScrapedRow[];
  page: number;
  pageSize: number;
  total: number;
};

const viewButtonClass = (active: boolean) =>
  `rounded-full px-3 py-1.5 text-xs transition-colors ${
    active ? "bg-ink text-canvas" : "border border-line text-muted hover:text-ink"
  }`;

export function ResultsViewer({
  runId,
  columns,
  rows,
  page,
  pageSize,
  total,
}: ResultsViewerProps) {
  const [view, setView] = useState<"table" | "json">("table");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setView("table")} className={viewButtonClass(view === "table")}>
            Tabel
          </button>
          <button type="button" onClick={() => setView("json")} className={viewButtonClass(view === "json")}>
            JSON
          </button>
        </div>
        <div className="flex gap-2">
          <a href={`/api/runs/${runId}/results?format=csv`} className={buttonClass("secondary")}>
            Export CSV
          </a>
          <a href={`/api/runs/${runId}/results?format=json`} className={buttonClass("secondary")}>
            Export JSON
          </a>
        </div>
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-subtle">
                {columns.map((column) => (
                  <th key={column} className="pb-3 pr-4 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-line">
                  {columns.map((column) => (
                    <td key={column} className="py-3 pr-4 align-top">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <pre className="max-h-96 overflow-auto rounded-card border border-line bg-surface p-4 text-xs text-muted">
          {JSON.stringify(rows, null, 2)}
        </pre>
      )}

      <div className="flex items-center justify-between text-sm text-muted">
        <span>{total} rows total</span>
        <div className="flex items-center gap-4">
          {page > 1 ? (
            <Link href={`?page=${page - 1}`} className="hover:text-ink">
              Sebelumnya
            </Link>
          ) : (
            <span className="text-subtle">Sebelumnya</span>
          )}
          <span>
            Halaman {page} dari {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`?page=${page + 1}`} className="hover:text-ink">
              Berikutnya
            </Link>
          ) : (
            <span className="text-subtle">Berikutnya</span>
          )}
        </div>
      </div>
    </div>
  );
}
