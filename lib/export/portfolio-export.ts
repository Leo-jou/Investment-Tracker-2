import type { DashboardData } from "../db/portfolio-repository.ts";

type CsvValue = string | number | boolean | null | undefined;

export function buildPortfolioExport(data: DashboardData) {
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]));
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    portfolio: {
      id: data.portfolio.id,
      name: data.portfolio.name,
      description: data.portfolio.description,
      baseCurrency: data.portfolio.baseCurrency,
      valueUsd: round(data.portfolio.valueUsd),
      valueEur: round(data.portfolio.valueEur),
      twrPercent: round(data.portfolio.twr),
      pnlEur: round(data.portfolio.pnlEur),
      netContributionsEur: round(data.portfolio.netContributionsEur)
    },
    positions: data.positions.map((position) => {
      const asset = assetById.get(position.assetId);
      return {
        symbol: asset?.symbol ?? "Unknown",
        name: asset?.name ?? "Unknown",
        type: asset?.type ?? "STOCK",
        provider: asset?.provider ?? "mock",
        externalId: asset?.externalId ?? "",
        quantity: round(position.quantity, 10),
        allocationPercent: round(position.allocationPercent),
        marketValueUsd: round(position.marketValueUsd),
        marketValueEur: round(position.marketValueEur),
        averageCostEur: round(position.averageCostEur),
        pnlEur: round(position.pnlEur),
        pnlPercent: round(position.pnlPercent),
        platform: position.platform ?? ""
      };
    }),
    manualPositions: data.manualPositions.map((position) => ({
      label: position.label,
      currency: position.currency,
      valueUsd: round(position.valueUsd),
      valueEur: round(position.valueEur),
      updatedAt: position.updatedAt,
      note: position.note ?? ""
    })),
    transactions: data.transactions.map((transaction) => ({
      date: transaction.date,
      type: transaction.type,
      symbol: transaction.assetSymbol ?? "",
      quantity: transaction.quantity ?? "",
      grossAmount: round(transaction.grossAmount),
      currency: transaction.currency,
      fees: round(transaction.fees),
      platform: transaction.platform ?? "",
      note: transaction.note ?? ""
    })),
    snapshots: data.snapshots.map((snapshot) => ({
      date: snapshot.date,
      valueUsd: round(snapshot.valueUsd),
      valueEur: round(snapshot.valueEur),
      investedCapitalEur: round(snapshot.investedCapitalEur),
      cashFlowEur: round(snapshot.cashFlowEur),
      twrPercent: round(snapshot.twr)
    })),
    allocations: data.allocations.map((allocation) => ({
      label: allocation.label,
      valueEur: round(allocation.value),
      percent: round(allocation.percent)
    }))
  };
}

export function buildPortfolioBackupExport(data: DashboardData) {
  return {
    schemaVersion: 1,
    app: "FolioCore",
    generatedAt: new Date().toISOString(),
    portfolio: data.portfolio,
    portfolios: data.portfolios,
    assets: data.assets,
    positions: data.positions,
    manualPositions: data.manualPositions,
    transactions: data.transactions,
    snapshots: data.snapshots,
    allocations: data.allocations
  };
}

export function buildPortfolioCsvExport(data: DashboardData) {
  const portfolioExport = buildPortfolioExport(data);
  return [
    csvSection("Portfolio", [portfolioExport.portfolio]),
    csvSection("Positions", portfolioExport.positions),
    csvSection("Manual Positions", portfolioExport.manualPositions),
    csvSection("Transactions", portfolioExport.transactions),
    csvSection("Snapshots", portfolioExport.snapshots),
    csvSection("Allocations", portfolioExport.allocations)
  ].join("\n\n");
}

export function csvSection(title: string, rows: Array<Record<string, CsvValue>>) {
  if (rows.length === 0) return `${escapeCsvCell(title)}\n`;
  const columns = Object.keys(rows[0]);
  return [
    escapeCsvCell(title),
    columns.map(escapeCsvCell).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(","))
  ].join("\n");
}

export function exportFilename(portfolioName: string, extension: "csv" | "json") {
  const slug = portfolioName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${slug || "portfolio"}-${date}.${extension}`;
}

export function backupExportFilename(portfolioName: string) {
  const slug = portfolioName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${slug || "portfolio"}-backup-${date}.json`;
}

function escapeCsvCell(value: CsvValue) {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "string" ? sanitizeStringCell(value) : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replaceAll("\"", "\"\"")}"`;
  return raw;
}

function sanitizeStringCell(value: string) {
  const trimmed = value.trimStart();
  return /^[=+\-@]/.test(trimmed) ? `'${value}` : value;
}

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}
