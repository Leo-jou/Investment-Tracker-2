import assert from "node:assert/strict";
import test from "node:test";

import { calculateRiskAnalytics } from "../lib/performance/risk.ts";
import type { PortfolioSnapshot } from "../lib/types.ts";

test("risk analytics derives Sharpe and Sortino from cash-flow-neutral TWR returns", () => {
  const risk = calculateRiskAnalytics({
    snapshots: [
      snapshot("2026-01-01", 100, 0),
      snapshot("2026-01-02", 110, 0),
      snapshot("2026-01-03", 121, 0),
      snapshot("2026-01-04", 108.9, 0)
    ]
  });

  assert.equal(risk.sampleSize, 3);
  assert.equal(risk.minimumReadyPeriods, 30);
  assert.equal(risk.alignedBenchmarkPeriods, 0);
  assert.equal(risk.sharpe.status, "low-sample");
  assert.equal(risk.sortino.status, "low-sample");
  assert.ok(risk.sharpe.value !== null);
  assert.ok(risk.sortino.value !== null);
});

test("risk analytics returns unavailable beta until benchmark history is aligned", () => {
  const risk = calculateRiskAnalytics({
    snapshots: [snapshot("2026-01-01", 100, 0), snapshot("2026-01-02", 105, 0)]
  });

  assert.equal(risk.beta.value, null);
  assert.equal(risk.beta.status, "unavailable");
  assert.match(risk.beta.detail, /benchmark/i);
});

test("risk analytics calculates benchmark-relative beta when data exists", () => {
  const risk = calculateRiskAnalytics({
    snapshots: [
      snapshot("2026-01-01", 100, 0),
      snapshot("2026-01-02", 102, 0),
      snapshot("2026-01-03", 101, 0),
      snapshot("2026-01-04", 106, 0)
    ],
    benchmarkReturns: [
      { date: "2026-01-02", return: 0.01 },
      { date: "2026-01-03", return: -0.005 },
      { date: "2026-01-04", return: 0.025 }
    ]
  });

  assert.equal(risk.beta.status, "low-sample");
  assert.equal(risk.alignedBenchmarkPeriods, 3);
  assert.ok(risk.beta.value !== null);
  assert.ok(risk.beta.value > 0);
});

test("risk analytics gates beta readiness on aligned benchmark periods", () => {
  const risk = calculateRiskAnalytics({
    snapshots: dailySnapshots(35),
    benchmarkReturns: [
      { date: "2026-01-02", return: 0.01 },
      { date: "2026-01-03", return: -0.004 }
    ]
  });

  assert.equal(risk.sampleSize, 34);
  assert.equal(risk.alignedBenchmarkPeriods, 2);
  assert.equal(risk.beta.status, "low-sample");
  assert.match(risk.beta.detail, /2 aligned/);
});

test("risk analytics withholds ratios when snapshot intervals are irregular", () => {
  const risk = calculateRiskAnalytics({
    snapshots: [
      snapshot("2026-01-01", 100, 0),
      snapshot("2026-01-02", 101, 0),
      snapshot("2026-02-01", 104, 0)
    ]
  });

  assert.equal(risk.cadence.status, "irregular");
  assert.equal(risk.sharpe.status, "unavailable");
  assert.equal(risk.sortino.status, "unavailable");
  assert.match(risk.sharpe.detail, /regular snapshot intervals/);
});

test("risk analytics uses the selected currency basis", () => {
  const usdRisk = calculateRiskAnalytics({
    currency: "USD",
    snapshots: [
      snapshotWithUsd("2026-01-01", 100, 0, 100),
      snapshotWithUsd("2026-01-02", 100, 0, 110)
    ]
  });
  const eurRisk = calculateRiskAnalytics({
    currency: "EUR",
    snapshots: [
      snapshotWithUsd("2026-01-01", 100, 0, 100),
      snapshotWithUsd("2026-01-02", 100, 0, 110)
    ]
  });

  assert.deepEqual(usdRisk.returns.map((value) => Number(value.toFixed(4))), [0.1]);
  assert.deepEqual(eurRisk.returns.map((value) => Number(value.toFixed(4))), [0]);
});

test("risk analytics treats deposits as cash flows, not investment returns", () => {
  const risk = calculateRiskAnalytics({
    snapshots: [
      snapshot("2026-01-01", 100, 0),
      snapshot("2026-01-02", 150, 50),
      snapshot("2026-01-03", 165, 0)
    ]
  });

  assert.deepEqual(
    risk.returns.map((value) => Number(value.toFixed(4))),
    [0, 0.1]
  );
});

function snapshot(date: string, valueEur: number, cashFlowEur: number): PortfolioSnapshot {
  return snapshotWithUsd(date, valueEur, cashFlowEur, valueEur);
}

function snapshotWithUsd(
  date: string,
  valueEur: number,
  cashFlowEur: number,
  valueUsd: number,
  cashFlowUsd?: number
): PortfolioSnapshot {
  return {
    date,
    valueEur,
    valueUsd,
    investedCapitalEur: 0,
    cashFlowEur,
    cashFlowUsd,
    twr: 0
  };
}

function dailySnapshots(count: number): PortfolioSnapshot[] {
  const start = new Date("2026-01-01T00:00:00.000Z");
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return snapshot(date.toISOString().slice(0, 10), 100 + index, 0);
  });
}
