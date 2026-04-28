"use client";

import { useMemo, useState } from "react";
import { Download, FileArchive, FileJson, Sheet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExportSection } from "@/lib/export/portfolio-export";
import { cn } from "@/lib/utils";

type ExportActionsProps = {
  portfolioId: string;
};

type ExportFormat = "csv" | "json" | "backup-json";
type ExportRange = "all" | "1d" | "1w" | "1m" | "6m" | "ytd" | "custom";

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  detail: string;
  icon: typeof Sheet;
}> = [
  {
    value: "csv",
    label: "CSV",
    detail: "Spreadsheet-friendly rows for review.",
    icon: Sheet
  },
  {
    value: "json",
    label: "Report JSON",
    detail: "Structured summary for processing or debugging.",
    icon: FileJson
  },
  {
    value: "backup-json",
    label: "Backup JSON",
    detail: "Full restore-oriented export with IDs and schema version.",
    icon: FileArchive
  }
];

const rangeOptions: Array<{ value: ExportRange; label: string }> = [
  { value: "all", label: "All time" },
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "6m", label: "6 months" },
  { value: "ytd", label: "YTD" },
  { value: "custom", label: "Custom" }
];

const sectionOptions: Array<{ value: ExportSection; label: string }> = [
  { value: "portfolio", label: "Summary" },
  { value: "positions", label: "Holdings" },
  { value: "transactions", label: "Transactions" },
  { value: "manualPositions", label: "Manual positions" },
  { value: "snapshots", label: "Snapshots" },
  { value: "allocations", label: "Allocations" }
];

export function ExportActions({ portfolioId }: ExportActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [range, setRange] = useState<ExportRange>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sections, setSections] = useState<Set<ExportSection>>(
    () => new Set(sectionOptions.map((section) => section.value))
  );
  const isBackup = format === "backup-json";
  const href = useMemo(
    () => buildExportHref({ portfolioId, format, range, startDate, endDate, sections }),
    [portfolioId, format, range, startDate, endDate, sections]
  );

  return (
    <div className="flex justify-end">
      <Button type="button" variant="subtle" size="sm" onClick={() => setIsOpen(true)}>
        <Download className="h-4 w-4" />
        Export
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Export portfolio"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[8px] border border-[#2b2b2f] bg-black p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Export portfolio</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Choose the format, range, and sections to download.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="compactIcon"
                aria-label="Close export modal"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-zinc-300">Format</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormat(option.value)}
                        className={cn(
                          "rounded-[7px] border p-3 text-left transition-colors",
                          option.value === format
                            ? "border-[#3b82f6] bg-[#071427]"
                            : "border-[#202024] bg-[#070707] hover:border-[#3a3a3f]"
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-zinc-500">
                          {option.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={cn(isBackup && "opacity-45")}>
                <p className="text-sm font-semibold text-zinc-300">Date range</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rangeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isBackup}
                      onClick={() => setRange(option.value)}
                      className={cn(
                        "h-9 rounded-[6px] px-3 text-sm font-semibold transition-colors disabled:pointer-events-none",
                        option.value === range
                          ? "bg-white text-black"
                          : "bg-[#202024] text-zinc-300 hover:bg-[#2c2c2f]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {range === "custom" && !isBackup && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="h-10 rounded-[6px] border border-[#2b2b2f] bg-[#050505] px-3 text-sm text-zinc-100 outline-none focus:border-[#3b82f6]"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="h-10 rounded-[6px] border border-[#2b2b2f] bg-[#050505] px-3 text-sm text-zinc-100 outline-none focus:border-[#3b82f6]"
                    />
                  </div>
                )}
              </div>

              <div className={cn(isBackup && "opacity-45")}>
                <p className="text-sm font-semibold text-zinc-300">Sections</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 rounded-[6px] border border-[#202024] bg-[#070707] px-3 py-2 text-sm text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        disabled={isBackup}
                        checked={sections.has(option.value)}
                        onChange={() => toggleSection(option.value)}
                        className="h-4 w-4 accent-[#3b82f6]"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {isBackup && (
                  <p className="mt-3 text-xs text-zinc-500">
                    Backup JSON always includes all sections and all dates so it can be restored later.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-[#202024] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                {isBackup
                  ? "Full backup export."
                  : `${sections.size} section${sections.size === 1 ? "" : "s"} selected.`}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button asChild variant="default">
                  <a href={href} onClick={() => setIsOpen(false)}>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );

  function toggleSection(section: ExportSection) {
    const next = new Set(sections);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    setSections(next.size > 0 ? next : new Set([section]));
  }
}

function buildExportHref({
  portfolioId,
  format,
  range,
  startDate,
  endDate,
  sections
}: {
  portfolioId: string;
  format: ExportFormat;
  range: ExportRange;
  startDate: string;
  endDate: string;
  sections: Set<ExportSection>;
}) {
  const params = new URLSearchParams({
    portfolioId,
    format
  });

  if (format !== "backup-json") {
    params.set("range", range);
    if (range === "custom") {
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
    }
    params.set("sections", [...sections].join(","));
  }

  return `/api/export?${params.toString()}`;
}
