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
      current.platform = row.platform ?? current.platform;
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

export function calculateAssetQuantity(
  rows: PortfolioMathTransaction[],
  assetId: string,
  rates: FxRateMap
) {
  return buildPositionStates(rows, rates).get(assetId)?.quantity ?? 0;
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
