import { convertCurrency, type FxRateMap } from "../data/conversions.ts";
import type { Currency, TransactionType } from "../types.ts";

export type PortfolioMathTransaction = {
  id?: string;
  assetId?: string | null;
  type: TransactionType;
  occurredOn: string;
  createdAt?: Date | string | null;
  quantity?: number | null;
  grossAmount: number;
  currency: Currency;
  fees: number;
  platform?: string | null;
};

export type PositionState = {
  quantity: number;
  costBasisUsd: number;
  platform?: string;
  platforms?: string[];
};

export function sortTransactionsForPositioning<T extends PortfolioMathTransaction>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const dateOrder = left.occurredOn.localeCompare(right.occurredOn);
    if (dateOrder !== 0) return dateOrder;

    const createdOrder = toTimestamp(left.createdAt) - toTimestamp(right.createdAt);
    if (createdOrder !== 0) return createdOrder;

    return (left.id ?? "").localeCompare(right.id ?? "");
  });
}

export function buildPositionStates(
  rows: PortfolioMathTransaction[],
  rates: FxRateMap
): Map<string, PositionState> {
  const states = new Map<string, PositionState>();

  for (const row of sortTransactionsForPositioning(rows)) {
    if (!row.assetId || !row.quantity || !["BUY", "SELL"].includes(row.type)) continue;
    const current = states.get(row.assetId) ?? { quantity: 0, costBasisUsd: 0 };
    const amountUsd = convertCurrency(row.grossAmount + row.fees, row.currency, "USD", rates);

    if (row.type === "BUY") {
      current.costBasisUsd += amountUsd;
      current.quantity += row.quantity;
      if (row.platform) {
        current.platform = row.platform;
        current.platforms = addUniquePlatform(current.platforms, row.platform);
      }
    } else {
      const sellQuantity = Math.min(row.quantity, current.quantity);
      const averageCost = current.quantity > 0 ? current.costBasisUsd / current.quantity : 0;
      current.quantity = Math.max(0, current.quantity - sellQuantity);
      current.costBasisUsd = Math.max(0, current.costBasisUsd - averageCost * sellQuantity);
    }

    states.set(row.assetId, current);
  }

  return states;
}

export function calculateRealizedGainUsd(rows: PortfolioMathTransaction[], rates: FxRateMap) {
  const states = new Map<string, PositionState>();
  let realizedGainUsd = 0;

  for (const row of sortTransactionsForPositioning(rows)) {
    if (!row.assetId || !row.quantity || !["BUY", "SELL"].includes(row.type)) continue;
    const current = states.get(row.assetId) ?? { quantity: 0, costBasisUsd: 0 };

    if (row.type === "BUY") {
      current.costBasisUsd += convertCurrency(row.grossAmount + row.fees, row.currency, "USD", rates);
      current.quantity += row.quantity;
      states.set(row.assetId, current);
      continue;
    }

    const sellQuantity = Math.min(row.quantity, current.quantity);
    if (sellQuantity <= 0) {
      states.set(row.assetId, current);
      continue;
    }

    const averageCost = current.quantity > 0 ? current.costBasisUsd / current.quantity : 0;
    const saleFraction = row.quantity > 0 ? sellQuantity / row.quantity : 0;
    const netProceedsUsd =
      convertCurrency(row.grossAmount, row.currency, "USD", rates) * saleFraction -
      convertCurrency(row.fees, row.currency, "USD", rates) * saleFraction;

    realizedGainUsd += netProceedsUsd - averageCost * sellQuantity;
    current.quantity = Math.max(0, current.quantity - sellQuantity);
    current.costBasisUsd = Math.max(0, current.costBasisUsd - averageCost * sellQuantity);
    states.set(row.assetId, current);
  }

  return realizedGainUsd;
}

export function calculateAssetQuantity(
  rows: PortfolioMathTransaction[],
  assetId: string,
  rates: FxRateMap
) {
  return buildPositionStates(rows, rates).get(assetId)?.quantity ?? 0;
}

export function calculateAssetQuantityBeforeTransaction(
  rows: PortfolioMathTransaction[],
  assetId: string,
  transaction: PortfolioMathTransaction,
  rates: FxRateMap
) {
  const candidate = { ...transaction, assetId, id: transaction.id ?? "__pending_transaction__" };
  const rowsBeforeCandidate: PortfolioMathTransaction[] = [];

  for (const row of sortTransactionsForPositioning([...rows, candidate])) {
    if (row === candidate) break;
    rowsBeforeCandidate.push(row);
  }

  return calculateAssetQuantity(rowsBeforeCandidate, assetId, rates);
}

export function calculateCashUsd(rows: PortfolioMathTransaction[], rates: FxRateMap) {
  return rows.reduce((cash, row) => {
    const grossUsd = convertCurrency(row.grossAmount, row.currency, "USD", rates);
    const feesUsd = convertCurrency(row.fees, row.currency, "USD", rates);

    if (row.type === "DEPOSIT" || row.type === "TRANSFER_IN") return cash + grossUsd;
    if (row.type === "WITHDRAW" || row.type === "TRANSFER_OUT") return cash - grossUsd - feesUsd;
    if (row.type === "BUY") return cash - grossUsd - feesUsd;
    if (row.type === "SELL") return cash + grossUsd - feesUsd;
    if (row.type === "CASH_ADJUSTMENT") return cash + grossUsd;
    return cash;
  }, 0);
}

export function calculateNetContributionsUsd(rows: PortfolioMathTransaction[], rates: FxRateMap) {
  return rows.reduce((total, row) => {
    const grossUsd = convertCurrency(row.grossAmount, row.currency, "USD", rates);
    if (row.type === "DEPOSIT") return total + grossUsd;
    if (row.type === "WITHDRAW") return total - grossUsd;
    return total;
  }, 0);
}

export function calculateExternalCashFlowEur(
  rows: PortfolioMathTransaction[],
  rates: FxRateMap,
  date?: string
) {
  return rows.reduce((total, row) => {
    if (date && row.occurredOn !== date) return total;
    const grossEur = convertCurrency(row.grossAmount, row.currency, "EUR", rates);
    if (row.type === "DEPOSIT") return total + grossEur;
    if (row.type === "WITHDRAW") return total - grossEur;
    return total;
  }, 0);
}

function toTimestamp(value: Date | string | null | undefined) {
  if (!value) return 0;
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

function addUniquePlatform(platforms: string[] | undefined, platform: string) {
  const trimmed = platform.trim();
  if (!trimmed) return platforms;
  const next = platforms ?? [];
  return next.includes(trimmed) ? next : [...next, trimmed];
}
