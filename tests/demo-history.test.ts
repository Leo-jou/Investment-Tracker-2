import assert from "node:assert/strict";
import test from "node:test";

import { buildAnalyticsHistory } from "../lib/data/demo-history.ts";
import { calculateRiskAnalytics } from "../lib/performance/risk.ts";

test("simulated analytics history provides regular snapshots and ready risk metrics", () => {
  const history = buildAnalyticsHistory({
    snapshots: [],
    currentValueUsd: 100_000,
    currentValueEur: 92_850,
    now: new Date("2026-04-28T00:00:00.000Z"),
    dayCount: 120
  });

  const risk = calculateRiskAnalytics({
    snapshots: history.snapshots,
    benchmarkReturns: history.benchmarkReturns,
    currency: "USD"
  });

  assert.equal(history.mode, "simulated");
  assert.equal(history.snapshots.length, 120);
  assert.equal(history.benchmarkReturns.length, 119);
  assert.equal(risk.cadence.status, "regular");
  assert.equal(risk.sharpe.status, "ready");
  assert.equal(risk.sortino.status, "ready");
  assert.equal(risk.beta.status, "ready");
  assert.ok(risk.beta.value !== null);
});

test("empty real portfolio history does not generate fake chart values", () => {
  const history = buildAnalyticsHistory({
    snapshots: [],
    currentValueUsd: 0,
    currentValueEur: 0,
    now: new Date("2026-04-28T00:00:00.000Z")
  });

  assert.equal(history.mode, "actual");
  assert.equal(history.snapshots.length, 0);
  assert.equal(history.benchmarkReturns.length, 0);
  assert.match(history.notice ?? "", /No portfolio history exists yet/);
});
