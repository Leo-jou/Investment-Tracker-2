import assert from "node:assert/strict";
import test from "node:test";

import {
  buildImportPreview,
  importableRows,
  parseCsv,
  suggestImportMapping
} from "../lib/import/transaction-import.ts";
import type { Transaction } from "../lib/types.ts";

test("CSV import parses quoted rows and suggests common mappings", () => {
  const parsed = parseCsv(
    'Trade Date,Side,Ticker,Shares,Total,Commission,Currency,Notes\n2026-04-01,Buy,NVDA,2,"1,800.50",1.25,USD,"starter, position"'
  );
  const mapping = suggestImportMapping(parsed.headers);

  assert.deepEqual(parsed.headers, [
    "Trade Date",
    "Side",
    "Ticker",
    "Shares",
    "Total",
    "Commission",
    "Currency",
    "Notes"
  ]);
  assert.equal(mapping.date, "Trade Date");
  assert.equal(mapping.type, "Side");
  assert.equal(mapping.symbol, "Ticker");
  assert.equal(mapping.quantity, "Shares");
  assert.equal(mapping.fees, "Commission");
});

test("CSV import builds valid trade and cash-flow preview rows", () => {
  const parsed = parseCsv(`date,type,symbol,quantity,total,fees,currency,platform,notes
2026-04-01,BUY,NVDA,2,1800.50,1.25,USD,IBKR,Starter position
2026-04-02,DEPOSIT,, ,1000,0,EUR,Bank,Cash in`);
  const mapping = suggestImportMapping(parsed.headers);
  const preview = buildImportPreview({ parsed, mapping, portfolioId: "portfolio_1" });

  assert.equal(preview.totalRows, 2);
  assert.equal(preview.validRows, 2);
  assert.equal(preview.invalidRows, 0);
  assert.equal(preview.rows[0].input?.type, "BUY");
  assert.equal(preview.rows[0].input?.assetSymbol, "NVDA");
  assert.equal(preview.rows[0].input?.quantity, 2);
  assert.equal(preview.rows[0].input?.grossAmount, 1800.5);
  assert.equal(preview.rows[1].input?.type, "DEPOSIT");
  assert.equal(preview.rows[1].input?.currency, "EUR");
});

test("CSV import flags unsupported rows and possible duplicates", () => {
  const parsed = parseCsv(`date,type,symbol,quantity,total,fees,currency,platform
2026-04-01,BUY,NVDA,2,1800.5,1.25,USD,IBKR
2026-04-01,BUY,NVDA,2,1800.5,1.25,USD,IBKR
2026-04-03,DIVIDEND,NVDA,,5,0,USD,IBKR`);
  const mapping = suggestImportMapping(parsed.headers);
  const existingTransactions: Transaction[] = [
    {
      id: "tx_1",
      portfolioId: "portfolio_1",
      type: "BUY",
      assetSymbol: "NVDA",
      date: "2026-04-01",
      quantity: 2,
      grossAmount: 1800.5,
      currency: "USD",
      fees: 1.25,
      platform: "IBKR"
    }
  ];

  const preview = buildImportPreview({ parsed, mapping, existingTransactions });

  assert.equal(preview.validRows, 0);
  assert.equal(preview.warningRows, 2);
  assert.equal(preview.invalidRows, 1);
  assert.equal(preview.duplicateRows, 2);
  assert.match(preview.rows[2].messages.join(" "), /Unsupported transaction type/);
  assert.equal(importableRows(preview).length, 2);
});

test("CSV import accepts European decimal formatting and day-first dates", () => {
  const parsed = parseCsv(`Date,Type,Symbol,Quantity,Total,Currency
30/04/2026,BUY,SPY,"1,5","750,25",USD`);
  const preview = buildImportPreview({ parsed, mapping: suggestImportMapping(parsed.headers) });

  assert.equal(preview.validRows, 1);
  assert.equal(preview.rows[0].input?.occurredOn, "2026-04-30");
  assert.equal(preview.rows[0].input?.quantity, 1.5);
  assert.equal(preview.rows[0].input?.grossAmount, 750.25);
});
