import assert from "node:assert/strict";
import test from "node:test";

import { getAssetPriceStatus, priceProviderLabel } from "../lib/portfolio/price-status.ts";
import type { Asset } from "../lib/types.ts";

const now = new Date("2026-05-05T14:00:00.000Z");

test("provider-backed assets with recent captured prices are fresh", () => {
  const status = getAssetPriceStatus(
    asset({ provider: "twelve-data", priceCapturedAt: "2026-05-05T13:00:00.000Z" }),
    now
  );

  assert.equal(status.label, "Fresh");
  assert.equal(status.tone, "ok");
});

test("provider-backed assets with old captured prices are stale", () => {
  const status = getAssetPriceStatus(
    asset({ provider: "coingecko", priceCapturedAt: "2026-05-01T13:00:00.000Z" }),
    now
  );

  assert.equal(status.label, "Stale");
  assert.equal(status.tone, "warning");
});

test("manual and mock prices are labeled as saved prices", () => {
  const status = getAssetPriceStatus(asset({ provider: "manual", priceCapturedAt: undefined }), now);

  assert.equal(status.label, "Saved price");
  assert.equal(status.tone, "warning");
  assert.equal(priceProviderLabel("twelve-data"), "Twelve Data");
});

test("missing provider price is unavailable", () => {
  const status = getAssetPriceStatus(
    asset({ provider: "twelve-data", priceEur: 0, priceUsd: 0, priceCapturedAt: undefined }),
    now
  );

  assert.equal(status.label, "Unavailable");
  assert.equal(status.tone, "danger");
});

function asset(overrides: Partial<Asset>): Asset {
  return {
    id: "asset-1",
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    type: "ETF",
    currency: "USD",
    provider: "twelve-data",
    externalId: "SPY:NYSE",
    priceEur: 450,
    priceUsd: 480,
    change24hPercent: 0,
    color: "#2563eb",
    ...overrides
  };
}
