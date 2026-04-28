import type { BenchmarkReturn } from "@/lib/performance/risk";
import type { PortfolioSnapshot } from "@/lib/types";

export type AnalyticsHistoryMode = "actual" | "simulated";

export type AnalyticsHistory = {
  snapshots: PortfolioSnapshot[];
  benchmarkReturns: BenchmarkReturn[];
  mode: AnalyticsHistoryMode;
  notice?: string;
};

type AnalyticsHistoryInput = {
  snapshots: PortfolioSnapshot[];
  currentValueUsd: number;
  currentValueEur: number;
  now?: Date;
  dayCount?: number;
};

const minimumReadySnapshots = 31;

export function buildAnalyticsHistory({
  snapshots,
  currentValueUsd,
  currentValueEur,
  now = new Date(),
  dayCount = 120
}: AnalyticsHistoryInput): AnalyticsHistory {
  const sortedSnapshots = [...snapshots].sort((left, right) => left.date.localeCompare(right.date));

  if (hasRegularReadyHistory(sortedSnapshots)) {
    return {
      snapshots: sortedSnapshots,
      benchmarkReturns: buildBenchmarkReturns(sortedSnapshots),
      mode: "actual"
    };
  }

  const generatedSnapshots = buildSimulatedSnapshots({
    currentValueUsd,
    currentValueEur,
    now,
    dayCount
  });

  return {
    snapshots: generatedSnapshots,
    benchmarkReturns: buildBenchmarkReturns(generatedSnapshots),
    mode: "simulated",
    notice:
      "Demo analytics history is being shown until enough regular portfolio snapshots exist for charts and risk metrics."
  };
}

export function buildSimulatedSnapshots({
  currentValueUsd,
  currentValueEur,
  now = new Date(),
  dayCount = 120
}: Omit<AnalyticsHistoryInput, "snapshots">): PortfolioSnapshot[] {
  const safeDayCount = Math.max(minimumReadySnapshots, dayCount);
  const endDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const returns = Array.from({ length: safeDayCount - 1 }, (_unused, index) =>
    simulatedPortfolioReturn(index)
  );
  const cumulative = returns.reduce((values, periodReturn) => {
    values.push(values.at(-1)! * (1 + periodReturn));
    return values;
  }, [1]);
  const finalFactor = cumulative.at(-1) ?? 1;
  const finalUsd = currentValueUsd > 0 ? currentValueUsd : 100_000;
  const finalEur = currentValueEur > 0 ? currentValueEur : finalUsd * 0.9285;
  const startUsd = finalUsd / finalFactor;
  const startEur = finalEur / finalFactor;

  return cumulative.map((factor, index) => {
    const date = new Date(endDate);
    date.setUTCDate(date.getUTCDate() - (safeDayCount - 1 - index));
    const valueUsd = startUsd * factor;
    const valueEur = startEur * factor;
    return {
      date: date.toISOString().slice(0, 10),
      valueUsd,
      valueEur,
      investedCapitalEur: startEur,
      cashFlowEur: 0,
      cashFlowUsd: 0,
      twr: (factor - 1) * 100
    };
  });
}

export function buildBenchmarkReturns(snapshots: PortfolioSnapshot[]): BenchmarkReturn[] {
  const sortedSnapshots = [...snapshots].sort((left, right) => left.date.localeCompare(right.date));
  return sortedSnapshots.slice(1).map((snapshot, index) => ({
    date: snapshot.date,
    return: simulatedBenchmarkReturn(index)
  }));
}

function hasRegularReadyHistory(snapshots: PortfolioSnapshot[]) {
  if (snapshots.length < minimumReadySnapshots) return false;
  const gaps = [];
  for (let index = 1; index < snapshots.length; index += 1) {
    const gap = daysBetween(snapshots[index - 1].date, snapshots[index].date);
    if (gap <= 0) return false;
    gaps.push(gap);
  }
  const min = Math.min(...gaps);
  const max = Math.max(...gaps);
  return max - min <= Math.max(1, min * 0.2);
}

function simulatedPortfolioReturn(index: number) {
  return (
    0.00075 +
    Math.sin(index * 0.17) * 0.0045 +
    Math.cos(index * 0.41) * 0.0032 +
    (index % 23 === 7 ? -0.014 : 0) +
    (index % 37 === 11 ? 0.012 : 0)
  );
}

function simulatedBenchmarkReturn(index: number) {
  return (
    0.0005 +
    Math.sin(index * 0.17 + 0.35) * 0.0037 +
    Math.cos(index * 0.29) * 0.0028 +
    (index % 23 === 7 ? -0.009 : 0) +
    (index % 41 === 13 ? 0.007 : 0)
  );
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const days = (end - start) / 86_400_000;
  return Number.isFinite(days) ? days : 0;
}
