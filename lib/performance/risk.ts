import type { Currency, PortfolioSnapshot } from "../types.ts";

export type RiskMetricStatus = "ready" | "low-sample" | "unavailable";

export type RiskMetricValue = {
  value: number | null;
  status: RiskMetricStatus;
  detail: string;
};

export type RiskAnalytics = {
  returns: number[];
  sampleSize: number;
  currency: Currency;
  annualizationFactor: number;
  cadence: {
    status: "regular" | "irregular" | "insufficient";
    medianDays: number | null;
    minDays: number | null;
    maxDays: number | null;
  };
  annualizedReturn: number | null;
  annualizedVolatility: number | null;
  downsideDeviation: number | null;
  sharpe: RiskMetricValue;
  sortino: RiskMetricValue;
  beta: RiskMetricValue;
  riskFreeRateAnnual: number;
};

export type BenchmarkReturn = {
  date: string;
  return: number;
};

type RiskReturnPeriod = {
  date: string;
  days: number;
  periodReturn: number;
};

const minimumReadyPeriods = 30;

export function calculateRiskAnalytics({
  snapshots,
  benchmarkReturns = [],
  riskFreeRateAnnual = 0,
  currency = "USD"
}: {
  snapshots: PortfolioSnapshot[];
  benchmarkReturns?: BenchmarkReturn[];
  riskFreeRateAnnual?: number;
  currency?: Currency;
}): RiskAnalytics {
  const periods = buildRiskReturnPeriods(snapshots, currency);
  const returns = periods.map((period) => period.periodReturn);
  const cadence = analyzeCadence(periods);
  const annualizationFactor = cadence.medianDays ? Math.max(1, 365 / cadence.medianDays) : 365;
  const sampleSize = returns.length;
  const annualizedReturn = calculateAnnualizedReturn(periods);
  const annualizedVolatility =
    sampleSize >= 2 && cadence.status === "regular"
      ? sampleStandardDeviation(returns) * Math.sqrt(annualizationFactor)
      : null;
  const riskFreePeriod = Math.pow(1 + riskFreeRateAnnual, 1 / annualizationFactor) - 1;
  const downsideDeviation =
    sampleSize > 0 && cadence.status === "regular"
      ? calculateDownsideDeviation(returns, riskFreePeriod) * Math.sqrt(annualizationFactor)
      : null;
  const beta = calculateBetaMetric(periods, benchmarkReturns, cadence);

  return {
    returns,
    sampleSize,
    currency,
    annualizationFactor,
    cadence,
    annualizedReturn,
    annualizedVolatility,
    downsideDeviation,
    riskFreeRateAnnual,
    sharpe: calculateSharpeMetric({
      sampleSize,
      cadence,
      annualizedReturn,
      annualizedVolatility,
      riskFreeRateAnnual
    }),
    sortino: calculateSortinoMetric({
      sampleSize,
      cadence,
      annualizedReturn,
      downsideDeviation,
      riskFreeRateAnnual
    }),
    beta
  };
}

function calculateSharpeMetric({
  sampleSize,
  cadence,
  annualizedReturn,
  annualizedVolatility,
  riskFreeRateAnnual
}: {
  sampleSize: number;
  cadence: RiskAnalytics["cadence"];
  annualizedReturn: number | null;
  annualizedVolatility: number | null;
  riskFreeRateAnnual: number;
}): RiskMetricValue {
  if (cadence.status === "irregular") {
    return {
      value: null,
      status: "unavailable",
      detail: cadenceDetail(cadence)
    };
  }

  if (annualizedReturn === null || annualizedVolatility === null || annualizedVolatility === 0) {
    return {
      value: null,
      status: "unavailable",
      detail: "Needs at least two regular portfolio return periods with non-zero volatility."
    };
  }

  return {
    value: (annualizedReturn - riskFreeRateAnnual) / annualizedVolatility,
    status: sampleSize >= minimumReadyPeriods ? "ready" : "low-sample",
    detail: `${sampleSize} ${cadenceLabel(cadence)} TWR return periods; assumes ${(
      riskFreeRateAnnual * 100
    ).toFixed(2)}% annual risk-free rate.`
  };
}

function calculateSortinoMetric({
  sampleSize,
  cadence,
  annualizedReturn,
  downsideDeviation,
  riskFreeRateAnnual
}: {
  sampleSize: number;
  cadence: RiskAnalytics["cadence"];
  annualizedReturn: number | null;
  downsideDeviation: number | null;
  riskFreeRateAnnual: number;
}): RiskMetricValue {
  if (cadence.status === "irregular") {
    return {
      value: null,
      status: "unavailable",
      detail: cadenceDetail(cadence)
    };
  }

  if (annualizedReturn === null || downsideDeviation === null) {
    return {
      value: null,
      status: "unavailable",
      detail: "Needs regular portfolio return periods before downside risk can be measured."
    };
  }

  if (downsideDeviation === 0) {
    return {
      value: null,
      status: "unavailable",
      detail: "No observed return period fell below the risk-free target."
    };
  }

  return {
    value: (annualizedReturn - riskFreeRateAnnual) / downsideDeviation,
    status: sampleSize >= minimumReadyPeriods ? "ready" : "low-sample",
    detail: `${sampleSize} ${cadenceLabel(
      cadence
    )} TWR return periods; downside only counts returns below the risk-free target.`
  };
}

function calculateBetaMetric(
  periods: RiskReturnPeriod[],
  benchmarkReturns: BenchmarkReturn[],
  cadence: RiskAnalytics["cadence"]
): RiskMetricValue {
  if (cadence.status === "irregular") {
    return {
      value: null,
      status: "unavailable",
      detail: cadenceDetail(cadence)
    };
  }

  const benchmarkByDate = new Map(benchmarkReturns.map((entry) => [entry.date, entry.return]));
  const aligned = periods.flatMap((period) => {
    const benchmarkReturn = benchmarkByDate.get(period.date);
    return typeof benchmarkReturn === "number"
      ? [{ portfolio: period.periodReturn, benchmark: benchmarkReturn }]
      : [];
  });

  if (aligned.length < 2) {
    return {
      value: null,
      status: "unavailable",
      detail:
        "Needs aligned portfolio and benchmark return history. Mixed-asset beta will use a weighted benchmark once benchmark snapshots are available."
    };
  }

  const benchmarkSeries = aligned.map((entry) => entry.benchmark);
  const variance = sampleVariance(benchmarkSeries);
  if (variance === 0) {
    return {
      value: null,
      status: "unavailable",
      detail: "Benchmark variance is zero, so beta is undefined."
    };
  }

  return {
    value: covariance(
      aligned.map((entry) => entry.portfolio),
      benchmarkSeries
    ) / variance,
    status: aligned.length >= minimumReadyPeriods ? "ready" : "low-sample",
    detail: `${aligned.length} aligned benchmark periods.`
  };
}

function buildRiskReturnPeriods(snapshots: PortfolioSnapshot[], currency: Currency) {
  const periods: RiskReturnPeriod[] = [];
  const orderedSnapshots = [...snapshots].sort((left, right) => left.date.localeCompare(right.date));

  for (let index = 1; index < orderedSnapshots.length; index += 1) {
    const previous = orderedSnapshots[index - 1];
    const current = orderedSnapshots[index];
    const startValue = snapshotValue(previous, currency);
    const endValue = snapshotValue(current, currency);
    const cashFlow = snapshotCashFlow(current, currency);
    const days = daysBetween(previous.date, current.date);

    if (startValue <= 0 || days <= 0) continue;

    periods.push({
      date: current.date,
      days,
      periodReturn: (endValue - cashFlow - startValue) / startValue
    });
  }

  return periods;
}

function snapshotValue(snapshot: PortfolioSnapshot, currency: Currency) {
  return currency === "USD" ? snapshot.valueUsd : snapshot.valueEur;
}

function snapshotCashFlow(snapshot: PortfolioSnapshot, currency: Currency) {
  if (currency === "EUR") return snapshot.cashFlowEur;
  if (typeof snapshot.cashFlowUsd === "number") return snapshot.cashFlowUsd;
  const impliedRate = snapshot.valueEur > 0 ? snapshot.valueUsd / snapshot.valueEur : 1;
  return snapshot.cashFlowEur * impliedRate;
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const days = (end - start) / 86_400_000;
  return Number.isFinite(days) ? days : 0;
}

function analyzeCadence(periods: RiskReturnPeriod[]): RiskAnalytics["cadence"] {
  if (periods.length < 2) {
    return {
      status: "insufficient",
      medianDays: periods[0]?.days ?? null,
      minDays: periods[0]?.days ?? null,
      maxDays: periods[0]?.days ?? null
    };
  }

  const days = periods.map((period) => period.days).sort((left, right) => left - right);
  const minDays = days[0];
  const maxDays = days.at(-1) ?? minDays;
  const medianDays = days[Math.floor(days.length / 2)];
  const toleranceDays = Math.max(1, medianDays * 0.2);
  const status = minDays > 0 && maxDays - minDays <= toleranceDays ? "regular" : "irregular";

  return { status, medianDays, minDays, maxDays };
}

function calculateAnnualizedReturn(periods: RiskReturnPeriod[]) {
  if (periods.length === 0) return null;
  const totalDays = periods.reduce((sum, period) => sum + period.days, 0);
  const compounded = periods.reduce((value, period) => value * (1 + period.periodReturn), 1);
  if (totalDays <= 0 || compounded <= 0) return null;
  return Math.pow(compounded, 365 / totalDays) - 1;
}

function cadenceDetail(cadence: RiskAnalytics["cadence"]) {
  if (!cadence.minDays || !cadence.maxDays) {
    return "Needs at least two regular snapshot intervals.";
  }
  return `Requires regular snapshot intervals; current gaps range from ${cadence.minDays.toFixed(
    0
  )} to ${cadence.maxDays.toFixed(0)} days.`;
}

function cadenceLabel(cadence: RiskAnalytics["cadence"]) {
  if (!cadence.medianDays) return "regular";
  if (cadence.medianDays <= 2) return "daily";
  if (cadence.medianDays <= 10) return "weekly";
  if (cadence.medianDays <= 45) return "monthly";
  return "regular";
}

function calculateDownsideDeviation(returns: number[], targetReturn: number) {
  const downsideSquares = returns.map((value) => Math.min(0, value - targetReturn) ** 2);
  return Math.sqrt(arithmeticMean(downsideSquares));
}

function covariance(left: number[], right: number[]) {
  const leftMean = arithmeticMean(left);
  const rightMean = arithmeticMean(right);
  const products = left.map((value, index) => (value - leftMean) * (right[index] - rightMean));
  return products.reduce((sum, value) => sum + value, 0) / (products.length - 1);
}

function sampleVariance(values: number[]) {
  const mean = arithmeticMean(values);
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}

function sampleStandardDeviation(values: number[]) {
  return Math.sqrt(sampleVariance(values));
}

function arithmeticMean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
