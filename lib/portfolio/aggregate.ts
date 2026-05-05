import { calculateTimeWeightedReturn } from "../performance/twr.ts";
import type { PortfolioOption, PortfolioSnapshot } from "../types.ts";

export const ALL_PORTFOLIOS_ID = "portfolio_all";

export const allPortfoliosOption: PortfolioOption = {
  id: ALL_PORTFOLIOS_ID,
  name: "All portfolios",
  description: "Account total across portfolios"
};

export function isAllPortfoliosId(portfolioId?: string | null) {
  return portfolioId === ALL_PORTFOLIOS_ID;
}

export function withAllPortfoliosOption(options: PortfolioOption[]) {
  return [allPortfoliosOption, ...options];
}

export function buildAllPortfoliosSnapshotSeries(
  snapshots: Array<PortfolioSnapshot & { cashFlowUsd?: number }>
): PortfolioSnapshot[] {
  const byDate = new Map<string, PortfolioSnapshot>();

  for (const snapshot of snapshots) {
    const current =
      byDate.get(snapshot.date) ??
      ({
        date: snapshot.date,
        valueEur: 0,
        valueUsd: 0,
        investedCapitalEur: 0,
        cashFlowEur: 0,
        cashFlowUsd: 0,
        twr: 0
      } satisfies PortfolioSnapshot);

    current.valueEur += snapshot.valueEur;
    current.valueUsd += snapshot.valueUsd;
    current.investedCapitalEur += snapshot.investedCapitalEur;
    current.cashFlowEur += snapshot.cashFlowEur;
    current.cashFlowUsd = (current.cashFlowUsd ?? 0) + (snapshot.cashFlowUsd ?? 0);
    byDate.set(snapshot.date, current);
  }

  const ordered = [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
  return ordered.map((snapshot, index) => ({
    ...snapshot,
    twr: index === 0 ? 0 : calculateTimeWeightedReturn(ordered.slice(0, index + 1))
  }));
}
