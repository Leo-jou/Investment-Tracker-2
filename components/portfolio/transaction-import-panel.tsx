"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { CheckCircle2, FileSpreadsheet, MoreHorizontal, Upload, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildImportPreview,
  parseCsv,
  suggestImportMapping,
  type ImportField,
  type ImportMapping,
  type ImportPreview
} from "@/lib/import/transaction-import";
import { cn } from "@/lib/utils";

const importFields: Array<{ field: ImportField; label: string; required?: boolean }> = [
  { field: "date", label: "Date", required: true },
  { field: "type", label: "Type", required: true },
  { field: "symbol", label: "Symbol" },
  { field: "quantity", label: "Quantity" },
  { field: "total", label: "Total", required: true },
  { field: "fees", label: "Fees" },
  { field: "currency", label: "Currency" },
  { field: "platform", label: "Platform" },
  { field: "notes", label: "Notes" }
];

export function TransactionImportPanel({ portfolioId }: { portfolioId?: string }) {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [serverPreview, setServerPreview] = useState<ImportPreview | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseCsv(csvText), [csvText]);
  const localPreview = useMemo(
    () => buildImportPreview({ parsed, mapping, portfolioId }),
    [mapping, parsed, portfolioId]
  );
  const preview = serverPreview ?? localPreview;
  const canPreview = parsed.headers.length > 0 && parsed.rows.length > 0;
  const importableCount = preview.validRows + preview.warningRows - preview.duplicateRows;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const nextParsed = parseCsv(text);
    setFileName(file.name);
    setCsvText(text);
    setMapping(suggestImportMapping(nextParsed.headers));
    setServerPreview(null);
    setMessage(null);
    setError(null);
  }

  function handleMappingChange(field: ImportField, header: string) {
    setMapping((current) => ({
      ...current,
      [field]: header || undefined
    }));
    setServerPreview(null);
    setMessage(null);
    setError(null);
  }

  async function submitImport(commit: boolean) {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/transactions/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csvText, mapping, portfolioId, commit })
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      preview?: ImportPreview;
      importedCount?: number;
      failedCount?: number;
      skippedCount?: number;
      failed?: Array<{ lineNumber: number; error: string }>;
    };

    setIsBusy(false);

    if (!response.ok || !payload.preview) {
      setError(payload.error ?? "Could not preview import.");
      return;
    }

    setServerPreview(payload.preview);

    if (!commit) {
      setMessage("Dry run complete. Review warnings before importing.");
      return;
    }

    if (payload.failedCount && payload.failedCount > 0) {
      const firstFailure = payload.failed?.[0];
      setError(
        `Imported ${payload.importedCount ?? 0} rows, but ${payload.failedCount} failed${
          firstFailure ? ` — line ${firstFailure.lineNumber}: ${firstFailure.error}` : "."
        }`
      );
      return;
    }

    setMessage(
      `Imported ${payload.importedCount ?? 0} rows. Skipped ${payload.skippedCount ?? 0} invalid or duplicate rows.`
    );
    window.setTimeout(() => window.location.reload(), 800);
  }

  return (
    <section id="import-transactions" className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#00c2a8]" />
            <h2 className="text-2xl font-bold">CSV transaction import</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            Upload a generic CSV, map the columns, preview validation, then import clean rows. Broker
            presets stay off until real sample exports are available.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
          <Upload className="h-4 w-4" />
          Choose CSV
          <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        </label>
      </div>

      {fileName && <p className="mt-4 text-sm text-zinc-400">Selected: {fileName}</p>}

      {canPreview && (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <ImportStat label="Rows" value={preview.totalRows} />
            <ImportStat label="Clean" value={preview.validRows} tone="positive" />
            <ImportStat label="Warnings" value={preview.warningRows} tone="warning" />
            <ImportStat label="Invalid" value={preview.invalidRows} tone="negative" />
            <ImportStat label="Duplicates" value={preview.duplicateRows} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {importFields.map(({ field, label, required }) => (
              <label key={field} className="text-sm text-zinc-400">
                {label} {required && <span className="text-[#f6b342]">*</span>}
                <select
                  value={mapping[field] ?? ""}
                  onChange={(event) => handleMappingChange(field, event.target.value)}
                  className="mt-1 h-10 w-full rounded-[6px] border border-[#2b2b2f] bg-[#050505] px-3 text-sm text-zinc-100 outline-none focus:border-[#3b82f6]"
                >
                  <option value="">Not mapped</option>
                  {parsed.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" disabled={isBusy} onClick={() => submitImport(false)}>
              {isBusy ? <MoreHorizontal className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              Dry run
            </Button>
            <Button
              type="button"
              disabled={isBusy || importableCount <= 0}
              onClick={() => submitImport(true)}
            >
              {isBusy ? <MoreHorizontal className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              Import valid rows
            </Button>
            <p className="text-sm text-zinc-500">
              Invalid and duplicate rows are skipped. Warning rows import unless blocked by the server.
            </p>
          </div>

          {message && <p className="mt-4 text-sm text-[#00c2a8]">{message}</p>}
          {error && <p className="mt-4 text-sm text-[#ff4d64]">{error}</p>}

          <div className="mt-5 overflow-x-auto tv-scrollbar">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-[#2b2b2f] text-left text-zinc-500">
                  <th className="py-3 font-medium">Line</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Type</th>
                  <th className="py-3 font-medium">Symbol</th>
                  <th className="py-3 text-right font-medium">Date</th>
                  <th className="py-3 text-right font-medium">Qty</th>
                  <th className="py-3 text-right font-medium">Total</th>
                  <th className="py-3 font-medium">Messages</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 12).map((row) => (
                  <tr key={`${row.lineNumber}-${row.fingerprint ?? "invalid"}`} className="border-b border-[#202024]">
                    <td className="py-3 text-zinc-500">{row.lineNumber}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold uppercase",
                          row.status === "valid" && "bg-emerald-500/10 text-emerald-300",
                          row.status === "warning" && "bg-[#4a3820] text-[#f6b342]",
                          row.status === "invalid" && "bg-red-500/10 text-red-300"
                        )}
                      >
                        {row.status === "invalid" && <XCircle className="h-3 w-3" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-300">{row.input?.type ?? "-"}</td>
                    <td className="py-3 text-zinc-300">{row.input?.assetSymbol ?? "-"}</td>
                    <td className="py-3 text-right text-zinc-300">{row.input?.occurredOn ?? "-"}</td>
                    <td className="py-3 text-right text-zinc-300">{row.input?.quantity ?? "-"}</td>
                    <td className="py-3 text-right text-zinc-200">
                      {row.input ? `${row.input.grossAmount.toFixed(2)} ${row.input.currency}` : "-"}
                    </td>
                    <td className="max-w-[360px] py-3 text-zinc-500">
                      {row.messages.length > 0 ? row.messages.join(" ") : "Ready to import."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 12 && (
              <p className="mt-3 text-xs text-zinc-500">Showing first 12 rows of {preview.rows.length}.</p>
            )}
          </div>
        </>
      )}

      {!canPreview && (
        <div className="mt-5 rounded-[7px] border border-dashed border-[#2b2b2f] p-5 text-sm text-zinc-500">
          Expected columns: date, type, symbol, quantity, total, fees, currency, platform, notes.
          Required: date, type, total. Trades also need symbol and quantity.
        </div>
      )}
    </section>
  );
}

function ImportStat({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: number;
  tone?: "neutral" | "positive" | "warning" | "negative";
}) {
  return (
    <div className="rounded-[7px] border border-[#202024] bg-[#050505] p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-600">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "positive" && "text-emerald-300",
          tone === "warning" && "text-[#f6b342]",
          tone === "negative" && "text-red-300",
          tone === "neutral" && "text-zinc-100"
        )}
      >
        {value}
      </p>
    </div>
  );
}
