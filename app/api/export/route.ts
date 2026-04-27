import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";
import {
  buildPortfolioCsvExport,
  buildPortfolioExport,
  exportFilename
} from "@/lib/export/portfolio-export";

export async function GET(request: Request) {
  const email = await requireSessionEmail();
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get("portfolioId") ?? undefined;
  const format = searchParams.get("format") === "json" ? "json" : "csv";
  const data = await getDashboardDataForEmail(email, portfolioId);
  const filename = exportFilename(data.portfolio.name, format);

  if (format === "json") {
    return NextResponse.json(buildPortfolioExport(data), {
      headers: {
        "content-disposition": `attachment; filename="${filename}"`
      }
    });
  }

  return new Response(buildPortfolioCsvExport(data), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}
