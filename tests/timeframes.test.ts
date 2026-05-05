import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePeriodTwr,
  calculateTimeframeStats,
  filterSnapshotsForTimeframe
} from "../lib/portfolio/timeframes.ts";
import type { PortfolioSnapshot } from "../lib/types.ts";

test("timeframe filtering is inclusive from latest snapshot range", () => {
  const filtered = filterSnapshotsForTimeframe(snapshots, "1M");

  assert.deepEqual(
    filtered.map((snapshot) => snapshot.date),
    ["2026-04-01", "2026-04-27"]
  );
});

test("YTD timeframe starts from January 1 of latest snapshot year", () => {
  const filtered = filterSnapshotsForTimeframe(snapshots, "YTD");

  assert.deepEqual(
    filtered.map((snapshot) => snapshot.date),
    ["2026-01-03", "2026-03-01", "2026-04-01", "2026-04-27"]
  );
});

test("timeframe stats derive value change and period TWR", () => {
  const stats = calculateTimeframeStats(snapshots, "1M", "USD");

  assert.equal(stats.hasEnoughData, true);
  assert.equal(stats.valueChange, 2000);
  assert.equal(Number(stats.valueChangePercent?.toFixed(4)), 2);
  assert.equal(Number(stats.twr?.toFixed(4)), Number(calculatePeriodTwr(5, 7).toFixed(4)));
});

test("sparse timeframe reports not enough data instead of fake zero", () => {
  const stats = calculateTimeframeStats(snapshots, "1D", "USD");

  assert.equal(stats.hasEnoughData, false);
  assert.equal(stats.valueChange, null);
  assert.equal(stats.twr, null);
});

test("empty persisted history withholds all-time performance", () => {
  const stats = calculateTimeframeStats([], "ALL", "USD");

  assert.equal(stats.hasEnoughData, false);
  assert.equal(stats.valueChange, null);
  assert.equal(stats.twr, null);
  assert.deepEqual(stats.snapshots, []);
});

const snapshots: PortfolioSnapshot[] = [
  {
    date: "2025-12-31",
    valueEur: 80_000,
    valueUsd: 90_000,
    investedCapitalEur: 75_000,
    cashFlowEur: 0,
    twr: 2
  },
  {
    date: "2026-01-03",
    valueEur: 82_000,
    valueUsd: 92_000,
    investedCapitalEur: 75_000,
    cashFlowEur: 0,
    twr: 3
  },
  {
    date: "2026-03-01",
    valueEur: 90_000,
    valueUsd: 98_000,
    investedCapitalEur: 75_000,
    cashFlowEur: 0,
    twr: 4
  },
  {
    date: "2026-04-01",
    valueEur: 92_000,
    valueUsd: 100_000,
    investedCapitalEur: 75_000,
    cashFlowEur: 0,
    twr: 5
  },
  {
    date: "2026-04-27",
    valueEur: 94_000,
    valueUsd: 102_000,
    investedCapitalEur: 75_000,
    cashFlowEur: 0,
    twr: 7
  }
];
