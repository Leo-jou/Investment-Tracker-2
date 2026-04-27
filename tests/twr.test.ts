import assert from "node:assert/strict";
import test from "node:test";

import { calculateTimeWeightedReturn } from "../lib/performance/twr.ts";
import type { PortfolioSnapshot } from "../lib/types.ts";

function snapshot(date: string, valueEur: number, cashFlowEur: number): PortfolioSnapshot {
  return {
    date,
    valueEur,
    valueUsd: valueEur,
    investedCapitalEur: 0,
    cashFlowEur,
    twr: 0
  };
}

test("TWR treats deposits as external cash flow, not performance", () => {
  const twr = calculateTimeWeightedReturn([
    snapshot("2026-01-01", 100, 100),
    snapshot("2026-01-02", 150, 50)
  ]);

  assert.equal(twr, 0);
});

test("TWR treats withdrawals as external cash flow, not losses", () => {
  const twr = calculateTimeWeightedReturn([
    snapshot("2026-01-01", 100, 100),
    snapshot("2026-01-02", 50, -50)
  ]);

  assert.equal(twr, 0);
});

test("TWR compounds sorted snapshot periods", () => {
  const twr = calculateTimeWeightedReturn([
    snapshot("2026-01-03", 121, 0),
    snapshot("2026-01-01", 100, 100),
    snapshot("2026-01-02", 110, 0)
  ]);

  assert.equal(Math.round(twr * 100) / 100, 21);
});
