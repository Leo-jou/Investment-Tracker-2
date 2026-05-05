import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import {
  createTransactionForEmail,
  getDashboardDataForEmail,
  listAssetsForEmail
} from "@/lib/db/portfolio-repository";
import {
  buildImportPreview,
  importableRows,
  parseCsv,
  type ImportMapping
} from "@/lib/import/transaction-import";

type ImportRequest = {
  csvText?: string;
  mapping?: ImportMapping;
  portfolioId?: string;
  commit?: boolean;
};

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as ImportRequest;
    const csvText = String(body.csvText ?? "");
    const parsed = parseCsv(csvText);

    if (parsed.headers.length === 0) {
      return NextResponse.json({ error: "Upload a CSV with a header row." }, { status: 400 });
    }

    const data = await getDashboardDataForEmail(email, body.portfolioId);
    const accountAssets = await listAssetsForEmail(email);
    const preview = buildImportPreview({
      parsed,
      mapping: body.mapping ?? {},
      portfolioId: data.portfolio.id,
      existingTransactions: data.transactions,
      knownAssetSymbols: accountAssets.map((asset) => asset.symbol)
    });

    if (!body.commit) {
      return NextResponse.json({ preview });
    }

    const rows = importableRows(preview).filter(
      (row) => !row.messages.some((message) => /duplicate/i.test(message))
    );
    const imported: Array<{ lineNumber: number }> = [];
    const failed: Array<{ lineNumber: number; error: string }> = [];

    for (const row of rows) {
      if (!row.input) continue;
      try {
        await createTransactionForEmail(email, row.input);
        imported.push({ lineNumber: row.lineNumber });
      } catch (error) {
        failed.push({
          lineNumber: row.lineNumber,
          error: error instanceof Error ? error.message : "Could not import row."
        });
      }
    }

    return NextResponse.json({
      preview,
      importedCount: imported.length,
      skippedCount: preview.rows.length - rows.length,
      failedCount: failed.length,
      imported,
      failed
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not import transactions." },
      { status: 400 }
    );
  }
}
