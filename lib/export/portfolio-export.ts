import type { DashboardData } from "../db/portfolio-repository.ts";

type CsvValue = string | number | boolean | null | undefined;

export type ExportSection =
  | "portfolio"
  | "positions"
  | "manualPositions"
  | "transactions"
  | "snapshots"
  | "allocations";

export type PortfolioExportOptions = {
  sections?: ExportSection[];
  startDate?: string;
  endDate?: string;
};

type ExportRow = Record<string, CsvValue>;

export type PortfolioExportPayload = {
  generatedAt: string;
  sections: ExportSection[];
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  portfolio?: ExportRow;
  positions?: ExportRow[];
  manualPositions?: ExportRow[];
  transactions?: ExportRow[];
  snapshots?: ExportRow[];
  allocations?: ExportRow[];
};

export const exportSections: ExportSection[] = [
  "portfolio",
  "positions",
  "manualPositions",
  "transactions",
  "snapshots",
  "allocations"
];

export function buildPortfolioExport(data: DashboardData, options: PortfolioExportOptions = {}) {
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]));
  const generatedAt = new Date().toISOString();
  const sections = normalizeSections(options.sections);
  const filteredTransactions = filterDatedRows(data.transactions, options);
  const filteredSnapshots = filterDatedRows(data.snapshots, options);
  const latestSnapshot = data.snapshots.at(-1);

  const exported: PortfolioExportPayload = {
    generatedAt,
    sections,
    dateRange: {
      startDate: options.startDate ?? null,
      endDate: options.endDate ?? null
    }
  };

  if (sections.includes("portfolio")) {
    exported.portfolio = {
      id: data.portfolio.id,
      name: data.portfolio.name,
      description: data.portfolio.description,
      baseCurrency: data.portfolio.baseCurrency,
      valueUsd: round(data.portfolio.valueUsd),
      valueEur: round(data.portfolio.valueEur),
      snapshotTwrPercent: roundOptional(latestSnapshot?.twr),
      twrSource: latestSnapshot ? "portfolio_snapshot" : "needs_snapshots",
      totalPnlEur: round(data.portfolio.pnlEur),
      netContributionsEur: round(data.portfolio.netContributionsEur),
      netContributionsUsd: round(data.portfolio.netContributionsUsd ?? 0),
      cashEur: round(data.portfolio.cashEur ?? 0),
      cashUsd: round(data.portfolio.cashUsd ?? 0),
      openPositionPnlEur: round(data.portfolio.unrealizedGainEur ?? 0),
      openPositionPnlUsd: round(data.portfolio.unrealizedGainUsd ?? 0),
      realizedGainEur: round(data.portfolio.realizedGainEur ?? 0),
      realizedGainUsd: round(data.portfolio.realizedGainUsd ?? 0)
    };
  }

  if (sections.includes("positions")) {
    exported.positions = data.positions.map((position) => {
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
        openPositionPnlEur: round(position.pnlEur),
        openPositionPnlPercent: round(position.pnlPercent),
        platform: position.platform ?? ""
      };
    });
  }

  if (sections.includes("manualPositions")) {
    exported.manualPositions = data.manualPositions.map((position) => ({
      label: position.label,
      currency: position.currency,
      valueUsd: round(position.valueUsd),
      valueEur: round(position.valueEur),
      updatedAt: position.updatedAt,
      note: position.note ?? ""
    }));
  }

  if (sections.includes("transactions")) {
    exported.transactions = filteredTransactions.map((transaction) => ({
      date: transaction.date,
      type: transaction.type,
      symbol: transaction.assetSymbol ?? "",
      quantity: transaction.quantity ?? "",
      grossAmount: round(transaction.grossAmount),
      currency: transaction.currency,
      fees: round(transaction.fees),
      platform: transaction.platform ?? "",
      note: transaction.note ?? ""
    }));
  }

  if (sections.includes("snapshots")) {
    exported.snapshots = filteredSnapshots.map((snapshot) => ({
      date: snapshot.date,
      valueUsd: round(snapshot.valueUsd),
      valueEur: round(snapshot.valueEur),
      investedCapitalEur: round(snapshot.investedCapitalEur),
      cashFlowEur: round(snapshot.cashFlowEur),
      twrPercent: round(snapshot.twr)
    }));
  }

  if (sections.includes("allocations")) {
    exported.allocations = data.allocations.map((allocation) => ({
      label: allocation.label,
      valueEur: round(allocation.value),
      percent: round(allocation.percent)
    }));
  }

  return exported;
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

export function buildPortfolioCsvExport(data: DashboardData, options: PortfolioExportOptions = {}) {
  const portfolioExport = buildPortfolioExport(data, options);
  const sections = normalizeSections(options.sections);
  const chunks: string[] = [];

  if (sections.includes("portfolio") && isRecord(portfolioExport.portfolio)) {
    chunks.push(csvSection("Portfolio", [portfolioExport.portfolio]));
  }
  if (sections.includes("positions") && Array.isArray(portfolioExport.positions)) {
    chunks.push(csvSection("Positions", portfolioExport.positions));
  }
  if (sections.includes("manualPositions") && Array.isArray(portfolioExport.manualPositions)) {
    chunks.push(csvSection("Manual Positions", portfolioExport.manualPositions));
  }
  if (sections.includes("transactions") && Array.isArray(portfolioExport.transactions)) {
    chunks.push(csvSection("Transactions", portfolioExport.transactions));
  }
  if (sections.includes("snapshots") && Array.isArray(portfolioExport.snapshots)) {
    chunks.push(csvSection("Snapshots", portfolioExport.snapshots));
  }
  if (sections.includes("allocations") && Array.isArray(portfolioExport.allocations)) {
    chunks.push(csvSection("Allocations", portfolioExport.allocations));
  }

  return chunks.join("\n\n");
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

function roundOptional(value: number | null | undefined, digits = 4) {
  return typeof value === "number" && Number.isFinite(value) ? round(value, digits) : null;
}

function normalizeSections(sections?: ExportSection[]) {
  if (!sections?.length) return exportSections;
  const allowed = new Set(exportSections);
  const normalized = sections.filter((section) => allowed.has(section));
  return normalized.length > 0 ? normalized : exportSections;
}

function filterDatedRows<T extends { date: string }>(rows: T[], options: PortfolioExportOptions) {
  return rows.filter((row) => {
    if (options.startDate && row.date < options.startDate) return false;
    if (options.endDate && row.date > options.endDate) return false;
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, CsvValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
