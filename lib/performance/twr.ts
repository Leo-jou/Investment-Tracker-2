import type { PortfolioSnapshot } from "../types.ts";

export type TwrPeriod = {
  date: string;
  startValue: number;
  endValue: number;
  externalCashFlow: number;
  periodReturn: number;
  compoundedReturn: number;
};

export function buildTwrPeriods(snapshots: PortfolioSnapshot[]): TwrPeriod[] {
  const periods: TwrPeriod[] = [];
  let compounded = 1;
  const orderedSnapshots = [...snapshots].sort((left, right) => left.date.localeCompare(right.date));

  for (let i = 1; i < orderedSnapshots.length; i += 1) {
    const previous = orderedSnapshots[i - 1];
    const current = orderedSnapshots[i];

    if (previous.valueEur <= 0) continue;

    const periodReturn =
      (current.valueEur - current.cashFlowEur - previous.valueEur) / previous.valueEur;
    compounded *= 1 + periodReturn;

    periods.push({
      date: current.date,
      startValue: previous.valueEur,
      endValue: current.valueEur,
      externalCashFlow: current.cashFlowEur,
      periodReturn,
      compoundedReturn: compounded - 1
    });
  }

  return periods;
}

export function calculateTimeWeightedReturn(snapshots: PortfolioSnapshot[]) {
  const periods = buildTwrPeriods(snapshots);
  const lastPeriod = periods.at(-1);
  return lastPeriod ? lastPeriod.compoundedReturn * 100 : 0;
}
