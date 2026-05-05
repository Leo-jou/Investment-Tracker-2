import assert from "node:assert/strict";
import test from "node:test";

import { filterAssetsByReferencedTransactions } from "../lib/portfolio/asset-scope.ts";

test("asset scoping keeps only assets referenced by portfolio transactions", () => {
  const assets = [
    { id: "btc", symbol: "BTC" },
    { id: "nvda", symbol: "NVDA" },
    { id: "other-user", symbol: "SPY" }
  ];
  const transactions = [
    { id: "tx_1", assetId: "btc" },
    { id: "tx_2", assetId: null },
    { id: "tx_3", assetId: "nvda" }
  ];

  const scopedAssets = filterAssetsByReferencedTransactions(assets, transactions);

  assert.deepEqual(
    scopedAssets.map((asset) => asset.symbol),
    ["BTC", "NVDA"]
  );
});

test("asset scoping excludes unreferenced global assets from empty portfolios", () => {
  const scopedAssets = filterAssetsByReferencedTransactions(
    [{ id: "global", symbol: "GLOBAL" }],
    [{ id: "deposit", assetId: null }]
  );

  assert.deepEqual(scopedAssets, []);
});
