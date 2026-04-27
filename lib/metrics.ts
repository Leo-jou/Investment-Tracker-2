import {
  allocationByAsset,
  assets,
  getAssetById,
  manualPositions,
  portfolios,
  positions,
  transactions
} from "@/lib/mock-data";
import type {
  AllocationSlice,
  Currency,
  Portfolio,
  PortfolioSnapshot,
  Position,
  Transaction
} from "@/lib/types";

export function getGlobalPortfolio(): Portfolio {
  return portfolios[0];
}

export function getPortfolioPositions(portfolioId: string): Position[] {
  if (portfolioId === "portfolio_global") return positions;
  return positions.filter((position) => position.portfolioId === portfolioId);
}

export function getPortfolioTransactions(portfolioId: string): Transaction[] {
  if (portfolioId === "portfolio_global") return transactions;
  return transactions.filter((transaction) => transaction.portfolioId === portfolioId);
}

export function getPortfolioAllocation(portfolioId: string): AllocationSlice[] {
  if (portfolioId === "portfolio_global") return allocationByAsset;

  const scopedPositions = getPortfolioPositions(portfolioId);
  const total = scopedPositions.reduce((sum, position) => sum + position.marketValueEur, 0);

  return scopedPositions.map((position) => {
    const asset = getAssetById(position.assetId);
    return {
      label: asset?.symbol ?? "Unknown",
      value: position.marketValueEur,
      percent: total === 0 ? 0 : (position.marketValueEur / total) * 100,
      color: asset?.color ?? "#71717a"
    };
  });
}

export function getAssetTypeAllocation(): AllocationSlice[] {
  const grouped = new Map<string, { value: number; color: string }>();

  for (const position of positions) {
    const asset = getAssetById(position.assetId);
    const key = asset?.type ?? "MANUAL";
    grouped.set(key, {
      value: (grouped.get(key)?.value ?? 0) + position.marketValueEur,
      color: asset?.color ?? "#71717a"
    });
  }

  const manualTotal = manualPositions.reduce((sum, position) => sum + position.valueEur, 0);
  grouped.set("MANUAL", {
    value: (grouped.get("MANUAL")?.value ?? 0) + manualTotal,
    color: "#14b8a6"
  });

  const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.value, 0);

  return Array.from(grouped.entries()).map(([label, item]) => ({
    label,
    value: item.value,
    percent: total === 0 ? 0 : (item.value / total) * 100,
    color: item.color
  }));
}

export function convertAmount(value: number, from: Currency, to: Currency) {
  if (from === to) return value;
  const eurUsd = 1.077;
  return from === "EUR" ? value * eurUsd : value / eurUsd;
}

export function calculateTwrFromSnapshots(snapshots: PortfolioSnapshot[]) {
  if (snapshots.length < 2) return 0;

  let compoundedReturn = 1;

  for (let i = 1; i < snapshots.length; i += 1) {
    const previous = snapshots[i - 1];
    const current = snapshots[i];
    if (previous.valueEur <= 0) continue;

    const periodReturn =
      (current.valueEur - current.cashFlowEur - previous.valueEur) / previous.valueEur;
    compoundedReturn *= 1 + periodReturn;
  }

  return (compoundedReturn - 1) * 100;
}

export function calculateUnitPrice(transaction: Transaction) {
  if (!transaction.quantity || transaction.quantity === 0) return null;
  return (transaction.grossAmount + transaction.fees) / transaction.quantity;
}

export function searchLocalAssets(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return assets;

  return assets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(normalized) ||
      asset.name.toLowerCase().includes(normalized) ||
      asset.exchange?.toLowerCase().includes(normalized)
  );
}
