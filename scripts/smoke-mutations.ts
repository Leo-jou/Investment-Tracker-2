import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import {
  assets,
  portfolios,
  priceSnapshots,
  transactions,
  users
} from "../lib/db/schema.ts";

config({ path: ".env.local", quiet: true });
config({ path: ".vercel/.env.production.local", quiet: true });
config({ quiet: true });

const defaultBaseUrl = "https://foliocore.vercel.app";
const baseUrl = (process.env.SMOKE_BASE_URL ?? defaultBaseUrl).replace(/\/$/, "");
const email = process.env.SMOKE_MUTATION_EMAIL ?? process.env.SMOKE_EMAIL;
const enabled = process.env.SMOKE_MUTATIONS === "1";

const checks: string[] = [];

if (!enabled) {
  console.log("Mutation smoke skipped. Set SMOKE_MUTATIONS=1 to enable guarded DB/API mutation checks.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required so mutation smoke can clean up its test data.");
}

if (!email) {
  throw new Error("Set SMOKE_MUTATION_EMAIL or SMOKE_EMAIL to an allowlisted test account.");
}

const runId = `codex-${Date.now().toString(36)}`;
const primarySymbol = `SMK${runId.slice(-4).toUpperCase()}`;
const unknownSymbol = `UNK${runId.slice(-4).toUpperCase()}`;
const otherSymbol = `OTH${runId.slice(-4).toUpperCase()}`;
const primaryExternalId = `${runId}:primary`;
const otherExternalId = `${runId}:other`;
const otherEmail = `codex-mutation-other-${runId}@example.com`;
const portfolioIdsToDelete: string[] = [];
const transactionIdsToDelete: string[] = [];

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function main() {
  try {
    const cookie = await login();
    const portfolio = await createPortfolio(cookie);
    portfolioIdsToDelete.push(portfolio.id);

    const createdTransaction = await createBuyTransaction(cookie, portfolio.id, {
      symbol: primarySymbol,
      externalId: primaryExternalId,
      note: `mutation-smoke-created-${runId}`,
      quantity: "2",
      grossAmount: "20"
    });
    transactionIdsToDelete.push(createdTransaction.id);

    await updateBuyTransaction(cookie, createdTransaction.id, portfolio.id);
    await seedOtherAccountAsset();
    await expectAssetsPageScope(cookie);
    await expectBackupScope(cookie, portfolio.id);
    await expectCsvImportScope(cookie, portfolio.id);

    await deleteTransaction(cookie, createdTransaction.id);
    transactionIdsToDelete.splice(transactionIdsToDelete.indexOf(createdTransaction.id), 1);
    checks.push("created BUY transaction was editable and deletable through API routes");

    console.log(`Mutation smoke passed for ${baseUrl}`);
    for (const check of checks) console.log(`- ${check}`);
  } finally {
    await cleanup();
  }
}

async function login() {
  const formData = new FormData();
  formData.set("email", email ?? "");

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    body: formData,
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/auth/login returned ${response.status}; expected 200.`);
  }

  const cookies = getSetCookies(response.headers);
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("foliocore_session="));

  if (!sessionCookie) {
    throw new Error("/api/auth/login did not return a session cookie.");
  }

  checks.push("/api/auth/login returned a session cookie for mutation smoke");
  return sessionCookie.split(";")[0];
}

async function createPortfolio(cookie: string) {
  const payload = await postForm<{ portfolio?: { id?: unknown; name?: unknown } }>(
    "/api/portfolios",
    cookie,
    {
      name: `Mutation smoke ${runId}`,
      description: "Temporary portfolio created by guarded mutation smoke."
    }
  );

  if (typeof payload.portfolio?.id !== "string") {
    throw new Error("/api/portfolios did not return a portfolio id.");
  }

  checks.push("/api/portfolios created a temporary portfolio");
  return { id: payload.portfolio.id, name: String(payload.portfolio.name ?? "") };
}

async function createBuyTransaction(
  cookie: string,
  portfolioId: string,
  input: {
    symbol: string;
    externalId: string;
    note: string;
    quantity: string;
    grossAmount: string;
  }
) {
  const payload = await postForm<{ transaction?: { id?: unknown } }>("/api/transactions", cookie, {
    portfolioId,
    type: "BUY",
    assetSymbol: input.symbol,
    assetName: `${input.symbol} Smoke Asset`,
    assetType: "STOCK",
    assetCurrency: "USD",
    assetProvider: "twelve-data",
    assetExternalId: input.externalId,
    assetExchange: "SMOKE",
    assetPriceUsd: "10",
    assetQuotedAt: new Date().toISOString(),
    quantity: input.quantity,
    grossAmount: input.grossAmount,
    currency: "USD",
    fees: "0",
    occurredOn: "2026-05-05",
    platform: "Codex Smoke",
    note: input.note
  });

  if (typeof payload.transaction?.id !== "string") {
    throw new Error("/api/transactions did not return a transaction id.");
  }

  checks.push("/api/transactions created a provider-backed BUY transaction");
  return { id: payload.transaction.id };
}

async function updateBuyTransaction(cookie: string, transactionId: string, portfolioId: string) {
  await patchForm(`/api/transactions/${transactionId}`, cookie, {
    portfolioId,
    type: "BUY",
    assetSymbol: primarySymbol,
    assetName: `${primarySymbol} Smoke Asset`,
    assetType: "STOCK",
    assetCurrency: "USD",
    assetProvider: "twelve-data",
    assetExternalId: primaryExternalId,
    assetExchange: "SMOKE",
    assetPriceUsd: "10",
    assetQuotedAt: new Date().toISOString(),
    quantity: "3",
    grossAmount: "30",
    currency: "USD",
    fees: "0",
    occurredOn: "2026-05-05",
    platform: "Codex Smoke",
    note: `mutation-smoke-updated-${runId}`
  });

  checks.push("/api/transactions/[id] updated the BUY transaction");
}

async function seedOtherAccountAsset() {
  const [otherUser] = await db
    .insert(users)
    .values({
      email: otherEmail,
      name: "Codex mutation other account"
    })
    .returning();

  const [otherPortfolio] = await db
    .insert(portfolios)
    .values({
      userId: otherUser.id,
      name: `Other mutation smoke ${runId}`,
      description: "Temporary other-account portfolio",
      baseCurrency: "USD"
    })
    .returning();

  const [otherAsset] = await db
    .insert(assets)
    .values({
      symbol: otherSymbol,
      name: `${otherSymbol} Other Account Asset`,
      type: "STOCK",
      currency: "USD",
      exchange: "SMOKE",
      provider: "twelve-data",
      externalId: otherExternalId,
      color: "#ef4444"
    })
    .returning();

  await db.insert(priceSnapshots).values({
    assetId: otherAsset.id,
    provider: "twelve-data",
    price: 12,
    currency: "USD",
    capturedAt: new Date()
  });

  await db.insert(transactions).values({
    portfolioId: otherPortfolio.id,
    assetId: otherAsset.id,
    type: "BUY",
    occurredOn: "2026-05-05",
    quantity: 1,
    grossAmount: 12,
    currency: "USD",
    fees: 0,
    platform: "Codex Smoke",
    note: `mutation-smoke-other-${runId}`
  });

  checks.push("seeded another-account asset fixture directly in the database");
}

async function expectAssetsPageScope(cookie: string) {
  const response = await fetch(`${baseUrl}/assets`, {
    headers: { cookie },
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/assets returned ${response.status}; expected 200.`);
  }

  const html = await response.text();
  if (!html.includes(primarySymbol)) {
    throw new Error(`/assets did not include the signed-in account asset ${primarySymbol}.`);
  }
  if (html.includes(otherSymbol)) {
    throw new Error(`/assets leaked another account's asset ${otherSymbol}.`);
  }

  checks.push("/assets included account assets and excluded another account's asset");
}

async function expectBackupScope(cookie: string, portfolioId: string) {
  const backup = await getJson<{
    assets?: Array<{ symbol?: unknown }>;
    transactions?: Array<{ id?: unknown; note?: unknown }>;
  }>(`/api/export?format=backup-json&portfolioId=${encodeURIComponent(portfolioId)}`, cookie);

  const assetSymbols = new Set((backup.assets ?? []).map((asset) => String(asset.symbol ?? "")));
  if (!assetSymbols.has(primarySymbol)) {
    throw new Error(`Backup JSON did not include selected portfolio asset ${primarySymbol}.`);
  }
  if (assetSymbols.has(otherSymbol)) {
    throw new Error(`Backup JSON leaked another account's asset ${otherSymbol}.`);
  }

  const updated = (backup.transactions ?? []).find(
    (transaction) => transaction.note === `mutation-smoke-updated-${runId}`
  );
  if (typeof updated?.id !== "string") {
    throw new Error("Backup JSON did not include the updated transaction with its id.");
  }

  checks.push("/api/export backup JSON scoped assets to the selected portfolio");
}

async function expectCsvImportScope(cookie: string, portfolioId: string) {
  const csvText = [
    "date,type,symbol,quantity,total,currency,platform,notes",
    `2026-05-05,BUY,${primarySymbol},1,10,USD,Codex Smoke,mutation-smoke-import-${runId}`,
    `2026-05-05,BUY,${unknownSymbol},1,10,USD,Codex Smoke,mutation-smoke-unknown-${runId}`
  ].join("\n");
  const mapping = {
    date: "date",
    type: "type",
    symbol: "symbol",
    quantity: "quantity",
    total: "total",
    currency: "currency",
    platform: "platform",
    notes: "notes"
  };
  const preview = await postJson<{
    preview?: {
      rows?: Array<{ status?: unknown; input?: { assetSymbol?: unknown }; messages?: unknown[] }>;
    };
  }>("/api/transactions/import", cookie, {
    csvText,
    mapping,
    portfolioId,
    commit: false
  });

  const rows = preview.preview?.rows ?? [];
  const knownRow = rows.find((row) => row.input?.assetSymbol === primarySymbol);
  const unknownRow = rows.find((row) =>
    row.messages?.some((message) => String(message).includes("mock-priced assets"))
  );

  if (knownRow?.status !== "valid") {
    throw new Error("CSV import preview did not accept an account-known symbol.");
  }
  if (unknownRow?.status !== "invalid") {
    throw new Error("CSV import preview did not reject an unknown symbol.");
  }

  const committed = await postJson<{
    importedCount?: unknown;
    failedCount?: unknown;
  }>("/api/transactions/import", cookie, {
    csvText,
    mapping,
    portfolioId,
    commit: true
  });

  if (committed.importedCount !== 1 || committed.failedCount !== 0) {
    throw new Error("CSV import commit did not import exactly the account-known row.");
  }

  const backup = await getJson<{
    transactions?: Array<{ id?: unknown; note?: unknown }>;
  }>(`/api/export?format=backup-json&portfolioId=${encodeURIComponent(portfolioId)}`, cookie);
  const imported = (backup.transactions ?? []).find(
    (transaction) => transaction.note === `mutation-smoke-import-${runId}`
  );

  if (typeof imported?.id !== "string") {
    throw new Error("Could not find imported smoke transaction id for cleanup.");
  }

  transactionIdsToDelete.push(imported.id);
  await deleteTransaction(cookie, imported.id);
  transactionIdsToDelete.splice(transactionIdsToDelete.indexOf(imported.id), 1);

  checks.push("/api/transactions/import accepted account-known symbols and rejected unknown symbols");
}

async function deleteTransaction(cookie: string, transactionId: string) {
  const response = await fetch(`${baseUrl}/api/transactions/${transactionId}`, {
    method: "DELETE",
    headers: { cookie },
    redirect: "manual"
  });

  if (response.status !== 200) {
    const body = await response.text();
    throw new Error(`/api/transactions/${transactionId} DELETE returned ${response.status}: ${body}`);
  }
}

async function postForm<T>(path: string, cookie: string, values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { cookie },
    body: formData,
    redirect: "manual"
  });

  return readExpectedJson<T>(response, path);
}

async function patchForm(path: string, cookie: string, values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "PATCH",
    headers: { cookie },
    body: formData,
    redirect: "manual"
  });

  await readExpectedJson(response, path);
}

async function postJson<T>(path: string, cookie: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json"
    },
    body: JSON.stringify(body),
    redirect: "manual"
  });

  return readExpectedJson<T>(response, path);
}

async function getJson<T>(path: string, cookie: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { cookie },
    redirect: "manual"
  });

  return readExpectedJson<T>(response, path);
}

async function readExpectedJson<T = unknown>(response: Response, path: string) {
  if (response.status !== 200) {
    const body = await response.text();
    throw new Error(`${path} returned ${response.status}; expected 200. ${body}`);
  }

  return (await response.json()) as T;
}

function getSetCookies(headers: Headers) {
  const headersWithCookies = headers as Headers & { getSetCookie?: () => string[] };
  return headersWithCookies.getSetCookie?.() ?? [headers.get("set-cookie")].filter(Boolean);
}

async function cleanup() {
  for (const transactionId of transactionIdsToDelete) {
    await db.delete(transactions).where(eq(transactions.id, transactionId)).catch(() => undefined);
  }

  if (portfolioIdsToDelete.length > 0) {
    await db.delete(portfolios).where(inArray(portfolios.id, portfolioIdsToDelete));
  }

  await db.delete(users).where(eq(users.email, otherEmail)).catch(() => undefined);
  await db.delete(assets).where(inArray(assets.externalId, [primaryExternalId, otherExternalId]));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
