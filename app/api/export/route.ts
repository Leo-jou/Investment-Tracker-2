import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";
import {
  backupExportFilename,
  buildPortfolioBackupExport,
  buildPortfolioCsvExport,
  buildPortfolioExport,
  exportFilename
} from "@/lib/export/portfolio-export";

export async function GET(request: Request) {
  const email = await requireSessionEmail();
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get("portfolioId") ?? undefined;
  const requestedFormat = searchParams.get("format");
  const format =
    requestedFormat === "json" || requestedFormat === "backup-json" ? requestedFormat : "csv";
  const data = await getDashboardDataForEmail(email, portfolioId);

  if (format === "backup-json") {
    return NextResponse.json(buildPortfolioBackupExport(data), {
      headers: {
        "content-disposition": `attachment; filename="${backupExportFilename(data.portfolio.name)}"`
      }
    });
  }

  if (format === "json") {
    return NextResponse.json(buildPortfolioExport(data), {
      headers: {
        "content-disposition": `attachment; filename="${exportFilename(data.portfolio.name, "json")}"`
      }
    });
  }

  return new Response(buildPortfolioCsvExport(data), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(data.portfolio.name, "csv")}"`
    }
  });
}
