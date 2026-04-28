import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";
import {
  backupExportFilename,
  buildPortfolioBackupExport,
  buildPortfolioCsvExport,
  buildPortfolioExport,
  exportFilename,
  exportSections,
  type ExportSection,
  type PortfolioExportOptions
} from "@/lib/export/portfolio-export";
import type { DashboardData } from "@/lib/db/portfolio-repository";

export async function GET(request: Request) {
  const email = await requireSessionEmail();
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get("portfolioId") ?? undefined;
  const requestedFormat = searchParams.get("format");
  const format =
    requestedFormat === "json" || requestedFormat === "backup-json" ? requestedFormat : "csv";
  const data = await getDashboardDataForEmail(email, portfolioId);
  const options = parseExportOptions(searchParams, data);

  if (format === "backup-json") {
    return NextResponse.json(buildPortfolioBackupExport(data), {
      headers: {
        "content-disposition": `attachment; filename="${backupExportFilename(data.portfolio.name)}"`
      }
    });
  }

  if (format === "json") {
    return NextResponse.json(buildPortfolioExport(data, options), {
      headers: {
        "content-disposition": `attachment; filename="${exportFilename(data.portfolio.name, "json")}"`
      }
    });
  }

  return new Response(buildPortfolioCsvExport(data, options), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(data.portfolio.name, "csv")}"`
    }
  });
}

function parseExportOptions(searchParams: URLSearchParams, data: DashboardData): PortfolioExportOptions {
  const sections = parseSections(searchParams);
  const range = searchParams.get("range") ?? "all";
  const latestDate = latestDataDate(data);

  if (range === "custom") {
    return {
      sections,
      startDate: normalizeDate(searchParams.get("start")),
      endDate: normalizeDate(searchParams.get("end"))
    };
  }

  if (!latestDate || range === "all") return { sections };

  return {
    sections,
    startDate: rangeStartDate(range, latestDate),
    endDate: latestDate
  };
}

function parseSections(searchParams: URLSearchParams): ExportSection[] | undefined {
  const raw = [
    ...searchParams.getAll("section"),
    ...(searchParams.get("sections")?.split(",") ?? [])
  ];
  const allowed = new Set<string>(exportSections);
  const sections = raw.map((value) => value.trim()).filter((value): value is ExportSection => allowed.has(value));
  return sections.length > 0 ? sections : undefined;
}

function latestDataDate(data: DashboardData) {
  return [...data.transactions.map((row) => row.date), ...data.snapshots.map((row) => row.date)]
    .sort()
    .at(-1);
}

function rangeStartDate(range: string, latestDate: string) {
  const date = new Date(`${latestDate}T00:00:00.000Z`);
  if (range === "1d") date.setUTCDate(date.getUTCDate() - 1);
  else if (range === "1w") date.setUTCDate(date.getUTCDate() - 7);
  else if (range === "1m") date.setUTCMonth(date.getUTCMonth() - 1);
  else if (range === "6m") date.setUTCMonth(date.getUTCMonth() - 6);
  else if (range === "ytd") date.setUTCMonth(0, 1);
  else return undefined;
  return date.toISOString().slice(0, 10);
}

function normalizeDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}
