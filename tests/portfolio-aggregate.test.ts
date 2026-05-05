import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_PORTFOLIOS_ID,
  buildAllPortfoliosSnapshotSeries,
  isAllPortfoliosId,
  withAllPortfoliosOption
} from "../lib/portfolio/aggregate.ts";
import type { PortfolioSnapshot } from "../lib/types.ts";

test("aggregate portfolio option is added before real portfolios", () => {
  const options = withAllPortfoliosOption([
    { id: "portfolio-1", name: "Personal", description: "Core" }
  ]);

  assert.equal(options[0].id, ALL_PORTFOLIOS_ID);
  assert.equal(options[0].name, "All portfolios");
  assert.equal(options[1].id, "portfolio-1");
  assert.equal(isAllPortfoliosId(ALL_PORTFOLIOS_ID), true);
});

test("all-portfolio snapshots sum matching dates and recompute aggregate TWR", () => {
  const snapshots: PortfolioSnapshot[] = [
    snapshot("2026-05-01", 100, 0),
    snapshot("2026-05-02", 110, 0),
    snapshot("2026-05-01", 200, 0),
    snapshot("2026-05-02", 220, 10)
  ];

  const aggregate = buildAllPortfoliosSnapshotSeries(snapshots);

  assert.deepEqual(
    aggregate.map((item) => ({
      date: item.date,
      valueEur: item.valueEur,
      cashFlowEur: item.cashFlowEur
    })),
    [
      { date: "2026-05-01", valueEur: 300, cashFlowEur: 0 },
      { date: "2026-05-02", valueEur: 330, cashFlowEur: 10 }
    ]
  );
  assert.equal(aggregate[1].twr, 6.666666666666665);
});

function snapshot(date: string, valueEur: number, cashFlowEur: number): PortfolioSnapshot {
  return {
    date,
    valueEur,
    valueUsd: valueEur * 1.1,
    investedCapitalEur: valueEur,
    cashFlowEur,
    twr: 0
  };
}
