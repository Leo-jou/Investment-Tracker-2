import assert from "node:assert/strict";
import test from "node:test";

import { buildAllocationRows } from "../lib/portfolio/allocation-rows.ts";
import type { AllocationSlice, Asset, ManualPosition, Position } from "../lib/types.ts";

test("allocation rows use actual position P&L instead of generated row-index gains", () => {
  const rows = buildAllocationRows({
    mode: "Assets",
    allocations: fallbackAllocations,
    assets,
    positions,
    manualPositions: []
  });

  assert.deepEqual(
    rows.map((row) => ({
      label: row.label,
      value: row.value,
      unrealizedGainEur: row.unrealizedGainEur
    })),
    [
      { label: "BTC", value: 12_000, unrealizedGainEur: 2_000 },
      { label: "NVDA", value: 8_000, unrealizedGainEur: -500 }
    ]
  );
});

test("grouped allocation rows aggregate position P&L and withhold manual-only gain", () => {
  const rows = buildAllocationRows({
    mode: "Asset types",
    allocations: fallbackAllocations,
    assets,
    positions,
    manualPositions
  });

  assert.deepEqual(
    rows.map((row) => ({
      label: row.label,
      value: row.value,
      unrealizedGainEur: row.unrealizedGainEur
    })),
    [
      { label: "CRYPTO", value: 12_000, unrealizedGainEur: 2_000 },
      { label: "STOCK", value: 8_000, unrealizedGainEur: -500 },
      { label: "Manual", value: 3_000, unrealizedGainEur: null }
    ]
  );
});

const assets: Asset[] = [
  asset("asset-btc", "BTC", "Bitcoin", "CRYPTO", "#f59e0b"),
  asset("asset-nvda", "NVDA", "Nvidia", "STOCK", "#22c55e")
];

const positions: Position[] = [
  position("asset-btc", 12_000, 2_000),
  position("asset-nvda", 8_000, -500)
];

const manualPositions: ManualPosition[] = [
  {
    id: "manual-1",
    portfolioId: "portfolio-1",
    label: "Private note",
    valueEur: 3_000,
    valueUsd: 3_300,
    currency: "EUR",
    updatedAt: "2026-05-05"
  }
];

const fallbackAllocations: AllocationSlice[] = [
  { label: "Fallback", value: 20_000, percent: 100, color: "#71717a" }
];

function asset(
  id: string,
  symbol: string,
  name: string,
  type: Asset["type"],
  color: string
): Asset {
  return {
    id,
    symbol,
    name,
    type,
    currency: "USD",
    provider: "twelve-data",
    externalId: symbol,
    priceEur: 100,
    priceUsd: 110,
    change24hPercent: 0,
    color
  };
}

function position(assetId: string, marketValueEur: number, pnlEur: number): Position {
  return {
    id: `position-${assetId}`,
    portfolioId: "portfolio-1",
    assetId,
    quantity: 1,
    averageCostEur: marketValueEur - pnlEur,
    marketValueEur,
    marketValueUsd: marketValueEur * 1.1,
    pnlEur,
    pnlPercent: 0,
    allocationPercent: 0
  };
}
