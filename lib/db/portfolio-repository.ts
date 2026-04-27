import { and, desc, eq } from "drizzle-orm";

import { convertCurrency, fallbackFxRates, toDisplayPair, type FxRateMap } from "@/lib/data/conversions";
import { demoAssets, demoTransactions } from "@/lib/data/demo-seed";
import { getDb } from "@/lib/db/client";
import {
  assets,
  fxSnapshots,
  manualPositions,
  portfolioSnapshots,
  portfolios,
  priceSnapshots,
  transactions,
  users
} from "@/lib/db/schema";
import type {
  AllocationSlice,
  ApiStatus,
  Asset,
  Currency,
  ManualPosition,
  Portfolio,
  PortfolioSnapshot,
  Position,
  PriceProvider,
  Transaction,
  TransactionType
} from "@/lib/types";
import { calculateTimeWeightedReturn } from "@/lib/performance/twr";
import {
  buildPositionStates,
  calculateAssetQuantity,
  calculateCashUsd,
  calculateExternalCashFlowEur,
  calculateNetContributionsUsd
} from "@/lib/portfolio/calculations";

export type DashboardData = {
  portfolio: Portfolio;
  assets: Asset[];
  positions: Position[];
  transactions: Transaction[];
  manualPositions: ManualPosition[];
  allocations: AllocationSlice[];
  snapshots: PortfolioSnapshot[];
  apiStatuses: ApiStatus[];
};

type DbAsset = typeof assets.$inferSelect;
type DbTransaction = typeof transactions.$inferSelect;
type DbManualPosition = typeof manualPositions.$inferSelect;

export type RefreshableAsset = Pick<
  DbAsset,
  "id" | "symbol" | "name" | "type" | "currency" | "exchange" | "provider" | "externalId"
>;

export type PriceSnapshotInput = {
  assetId: string;
  provider: PriceProvider;
  price: number;
  currency: Currency;
  capturedAt: Date;
};

export type FxSnapshotInput = {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  rate: number;
  capturedAt: Date;
};

const bootstrapTimestamp = new Date("2026-04-27T00:00:00.000Z");

export async function ensureUserWorkspace(email: string) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: normalizedEmail.split("@")[0] || "Owner"
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        updatedAt: new Date()
      }
    })
    .returning();

  const existingPortfolios = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, user.id))
    .limit(1);

  if (existingPortfolios.length > 0) return user;

  const [portfolio] = await db
    .insert(portfolios)
    .values({
      userId: user.id,
      name: "Personal",
      description: "Core portfolio",
      baseCurrency: "USD"
    })
    .returning();

  const assetBySymbol = new Map<string, DbAsset>();

  for (const demoAsset of demoAssets) {
    const [asset] = await db
      .insert(assets)
      .values({
        symbol: demoAsset.symbol,
        name: demoAsset.name,
        type: demoAsset.type,
        currency: demoAsset.currency,
        exchange: demoAsset.exchange,
        provider: demoAsset.provider,
        externalId: demoAsset.externalId,
        color: demoAsset.color
      })
      .onConflictDoUpdate({
        target: [assets.provider, assets.externalId],
        set: {
          symbol: demoAsset.symbol,
          name: demoAsset.name,
          exchange: demoAsset.exchange,
          color: demoAsset.color,
          updatedAt: new Date()
        }
      })
      .returning();

    assetBySymbol.set(asset.symbol, asset);

    await db
      .insert(priceSnapshots)
      .values({
        assetId: asset.id,
        provider: demoAsset.provider,
        capturedAt: bootstrapTimestamp,
        price: demoAsset.price,
        currency: demoAsset.currency
      })
      .onConflictDoNothing();
  }

  await db
    .insert(fxSnapshots)
    .values([
      {
        baseCurrency: "USD",
        quoteCurrency: "EUR",
        rate: fallbackFxRates.usdToEur,
        capturedAt: bootstrapTimestamp
      },
      {
        baseCurrency: "EUR",
        quoteCurrency: "USD",
        rate: fallbackFxRates.eurToUsd,
        capturedAt: bootstrapTimestamp
      }
    ])
    .onConflictDoNothing();

  for (const demoTransaction of demoTransactions) {
    const asset =
      "symbol" in demoTransaction && demoTransaction.symbol
        ? assetBySymbol.get(demoTransaction.symbol)
        : undefined;

    await db.insert(transactions).values({
      portfolioId: portfolio.id,
      assetId: asset?.id,
      type: demoTransaction.type,
      occurredOn: demoTransaction.occurredOn,
      quantity: "quantity" in demoTransaction ? demoTransaction.quantity : undefined,
      grossAmount: demoTransaction.grossAmount,
      currency: demoTransaction.currency,
      fees: demoTransaction.fees,
      platform: demoTransaction.platform,
      note: demoTransaction.note
    });
  }

  await db.insert(manualPositions).values({
    portfolioId: portfolio.id,
    label: "SpaceX fundraising participation",
    value: 5000,
    currency: "USD",
    note: "Manual private-market valuation",
    valuedOn: "2026-04-01"
  });

  await seedPortfolioSnapshots(portfolio.id);
  return user;
}

export async function getDashboardDataForEmail(email: string): Promise<DashboardData> {
  const user = await ensureUserWorkspace(email);
  const db = getDb();
  const portfolio = await getPrimaryPortfolioForUser(user.id);

  const [dbAssets, dbTransactions, dbManualPositions, dbSnapshots, rates] = await Promise.all([
    db.select().from(assets).where(eq(assets.isActive, true)),
    db
      .select()
      .from(transactions)
      .where(eq(transactions.portfolioId, portfolio.id))
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt)),
    db.select().from(manualPositions).where(eq(manualPositions.portfolioId, portfolio.id)),
    db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.portfolioId, portfolio.id))
      .orderBy(portfolioSnapshots.snapshotDate),
    getLatestFxRates()
  ]);

  const latestPrices = await getLatestPrices();
  const assetViews = buildAssetViews(dbAssets, latestPrices, rates);
  const transactionViews = buildTransactionViews(dbTransactions, dbAssets);
  const manualViews = buildManualPositionViews(dbManualPositions, rates);
  const positions = buildPositions(dbTransactions, dbAssets, latestPrices, rates, portfolio.id);
  const snapshots = buildSnapshotViews(dbSnapshots);
  const portfolioView = buildPortfolioView(
    portfolio.id,
    portfolio.name,
    portfolio.description ?? "",
    positions,
    dbTransactions,
    manualViews,
    snapshots,
    rates
  );
  const allocations = buildAllocations(positions, manualViews, dbAssets);

  return {
    portfolio: portfolioView,
    assets: assetViews,
    positions,
    transactions: transactionViews,
    manualPositions: manualViews,
    allocations,
    snapshots,
    apiStatuses: buildApiStatuses()
  };
}

export async function listAssetsForEmail(email: string) {
  await ensureUserWorkspace(email);
  const dbAssets = await getDb().select().from(assets).where(eq(assets.isActive, true));
  const rates = await getLatestFxRates();
  const latestPrices = await getLatestPrices();
  return buildAssetViews(dbAssets, latestPrices, rates);
}

export async function listAssetsForPriceRefresh(): Promise<RefreshableAsset[]> {
  const rows = await getDb().select().from(assets).where(eq(assets.isActive, true));
  return rows.filter((asset) => !["manual", "mock"].includes(asset.provider));
}

export async function insertPriceSnapshotsForRefresh(snapshots: PriceSnapshotInput[]) {
  if (snapshots.length === 0) return 0;

  await getDb()
    .insert(priceSnapshots)
    .values(
      snapshots.map((snapshot) => ({
        assetId: snapshot.assetId,
        provider: snapshot.provider,
        capturedAt: snapshot.capturedAt,
        price: snapshot.price,
        currency: snapshot.currency
      }))
    )
    .onConflictDoNothing();

  return snapshots.length;
}

export async function insertFxSnapshotsForRefresh(snapshots: FxSnapshotInput[]) {
  if (snapshots.length === 0) return 0;

  await getDb()
    .insert(fxSnapshots)
    .values(
      snapshots.map((snapshot) => ({
        baseCurrency: snapshot.baseCurrency,
        quoteCurrency: snapshot.quoteCurrency,
        rate: snapshot.rate,
        capturedAt: snapshot.capturedAt
      }))
    )
    .onConflictDoNothing();

  return snapshots.length;
}

export async function refreshCurrentPortfolioSnapshotsForEmail(email: string) {
  const user = await ensureUserWorkspace(email);
  const userPortfolios = await getDb().select().from(portfolios).where(eq(portfolios.userId, user.id));

  for (const portfolio of userPortfolios) {
    await upsertCurrentPortfolioSnapshot(portfolio.id);
  }

  return userPortfolios.length;
}

export async function createTransactionForEmail(email: string, input: FormData | Record<string, unknown>) {
  const user = await ensureUserWorkspace(email);
  const parsed = parseTransactionInput(input);
  const db = getDb();
  const portfolio = await getPrimaryPortfolioForUser(user.id);
  const asset = await resolveTransactionAsset(parsed.type, parsed.assetSymbol);

  if (parsed.type === "SELL") {
    if (!asset) throw new Error("Cannot sell an asset that is not in the local asset list.");
    await assertSellQuantityAvailable(portfolio.id, asset.id, parsed.quantity ?? 0);
  }

  await db.insert(transactions).values({
    portfolioId: portfolio.id,
    assetId: asset?.id,
    type: parsed.type,
    occurredOn: parsed.occurredOn,
    quantity: parsed.quantity,
    grossAmount: parsed.grossAmount,
    currency: parsed.currency,
    fees: parsed.fees,
    platform: parsed.platform,
    note: parsed.note
  });

  await upsertCurrentPortfolioSnapshot(portfolio.id);
}

export async function updateTransactionForEmail(
  email: string,
  transactionId: string,
  input: FormData | Record<string, unknown>
) {
  const user = await ensureUserWorkspace(email);
  const parsed = parseTransactionInput(input);
  const db = getDb();
  const portfolio = await getPrimaryPortfolioForUser(user.id);
  const [existing] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.portfolioId, portfolio.id)))
    .limit(1);

  if (!existing) throw new Error("Transaction not found.");

  const asset = await resolveTransactionAsset(parsed.type, parsed.assetSymbol);

  if (parsed.type === "SELL") {
    if (!asset) throw new Error("Cannot sell an asset that is not in the local asset list.");
    await assertSellQuantityAvailable(
      portfolio.id,
      asset.id,
      parsed.quantity ?? 0,
      transactionId
    );
  }

  await db
    .update(transactions)
    .set({
      assetId: asset?.id ?? null,
      type: parsed.type,
      occurredOn: parsed.occurredOn,
      quantity: parsed.quantity,
      grossAmount: parsed.grossAmount,
      currency: parsed.currency,
      fees: parsed.fees,
      platform: parsed.platform,
      note: parsed.note,
      updatedAt: new Date()
    })
    .where(and(eq(transactions.id, transactionId), eq(transactions.portfolioId, portfolio.id)));

  await upsertCurrentPortfolioSnapshot(portfolio.id);
}

export async function deleteTransactionForEmail(email: string, transactionId: string) {
  const user = await ensureUserWorkspace(email);
  const portfolio = await getPrimaryPortfolioForUser(user.id);

  await getDb()
    .delete(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.portfolioId, portfolio.id)));

  await upsertCurrentPortfolioSnapshot(portfolio.id);
}

export async function createManualPositionForEmail(
  email: string,
  input: FormData | Record<string, unknown>
) {
  const user = await ensureUserWorkspace(email);
  const values = readInput(input);
  const label = String(values.label ?? "").trim();
  const value = parseRequiredNumber(values.value, "Value");
  const currency = normalizeCurrency(String(values.currency ?? "USD"));
  const valuedOn = String(values.valuedOn ?? new Date().toISOString().slice(0, 10));

  if (!label) throw new Error("Manual position label is required.");
  if (value < 0) throw new Error("Manual position value cannot be negative.");

  const portfolio = await getPrimaryPortfolioForUser(user.id);

  await getDb().insert(manualPositions).values({
    portfolioId: portfolio.id,
    label,
    value,
    currency,
    valuedOn,
    note: emptyToNull(String(values.note ?? ""))
  });

  await upsertCurrentPortfolioSnapshot(portfolio.id);
}

export async function updateManualPositionForEmail(
  email: string,
  positionId: string,
  input: FormData | Record<string, unknown>
) {
  const user = await ensureUserWorkspace(email);
  const values = readInput(input);
  const label = String(values.label ?? "").trim();
  const value = parseRequiredNumber(values.value, "Value");
  const currency = normalizeCurrency(String(values.currency ?? "USD"));
  const valuedOn = String(values.valuedOn ?? new Date().toISOString().slice(0, 10));

  if (!label) throw new Error("Manual position label is required.");
  if (value < 0) throw new Error("Manual position value cannot be negative.");

  const portfolio = await getPrimaryPortfolioForUser(user.id);
  const [existing] = await getDb()
    .select()
    .from(manualPositions)
    .where(and(eq(manualPositions.id, positionId), eq(manualPositions.portfolioId, portfolio.id)))
    .limit(1);

  if (!existing) throw new Error("Manual position not found.");

  await getDb()
    .update(manualPositions)
    .set({
      label,
      value,
      currency,
      valuedOn,
      note: emptyToNull(String(values.note ?? "")),
      updatedAt: new Date()
    })
    .where(and(eq(manualPositions.id, positionId), eq(manualPositions.portfolioId, portfolio.id)));

  await upsertCurrentPortfolioSnapshot(portfolio.id);
}

export async function deleteManualPositionForEmail(email: string, positionId: string) {
  const user = await ensureUserWorkspace(email);
  const portfolio = await getPrimaryPortfolioForUser(user.id);

  await getDb()
    .delete(manualPositions)
    .where(and(eq(manualPositions.id, positionId), eq(manualPositions.portfolioId, portfolio.id)));

  await upsertCurrentPortfolioSnapshot(portfolio.id);
}

async function getPrimaryPortfolioForUser(userId: string) {
  const [portfolio] = await getDb()
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, userId))
    .orderBy(desc(portfolios.createdAt))
    .limit(1);

  if (!portfolio) throw new Error("No portfolio found.");
  return portfolio;
}

async function assertSellQuantityAvailable(
  portfolioId: string,
  assetId: string,
  requestedQuantity: number,
  excludeTransactionId?: string
) {
  const rows = await getDb()
    .select()
    .from(transactions)
    .where(and(eq(transactions.portfolioId, portfolioId), eq(transactions.assetId, assetId)));
  const rates = await getLatestFxRates();
  const relevantRows = excludeTransactionId
    ? rows.filter((row) => row.id !== excludeTransactionId)
    : rows;
  const availableQuantity = calculateAssetQuantity(relevantRows, assetId, rates);

  if (requestedQuantity > availableQuantity) {
    throw new Error(
      `Sell quantity exceeds current holding. Available quantity: ${availableQuantity.toFixed(8)}.`
    );
  }
}

async function findAssetBySymbol(symbol: string) {
  const [existing] = await getDb().select().from(assets).where(eq(assets.symbol, symbol)).limit(1);
  return existing;
}

async function resolveTransactionAsset(type: TransactionType, assetSymbol: string) {
  if (!assetSymbol || !["BUY", "SELL"].includes(type)) return undefined;
  return type === "BUY" ? findOrCreateAssetBySymbol(assetSymbol) : findAssetBySymbol(assetSymbol);
}

async function upsertCurrentPortfolioSnapshot(portfolioId: string) {
  const db = getDb();
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const [dbAssets, dbTransactions, dbManualPositions, dbSnapshots, latestPrices, rates] =
    await Promise.all([
      db.select().from(assets).where(eq(assets.isActive, true)),
      db.select().from(transactions).where(eq(transactions.portfolioId, portfolioId)),
      db.select().from(manualPositions).where(eq(manualPositions.portfolioId, portfolioId)),
      db
        .select()
        .from(portfolioSnapshots)
        .where(eq(portfolioSnapshots.portfolioId, portfolioId))
        .orderBy(portfolioSnapshots.snapshotDate),
      getLatestPrices(),
      getLatestFxRates()
    ]);

  const positions = buildPositions(dbTransactions, dbAssets, latestPrices, rates, portfolioId);
  const manualViews = buildManualPositionViews(dbManualPositions, rates);
  const positionsValueUsd = positions.reduce((sum, position) => sum + position.marketValueUsd, 0);
  const manualValueUsd = manualViews.reduce((sum, position) => sum + position.valueUsd, 0);
  const cashUsd = calculateCashUsd(dbTransactions, rates);
  const valueUsd = positionsValueUsd + manualValueUsd + cashUsd;
  const valueEur = convertCurrency(valueUsd, "USD", "EUR", rates);
  const investedCapitalEur = convertCurrency(
    calculateNetContributionsUsd(dbTransactions, rates),
    "USD",
    "EUR",
    rates
  );
  const externalCashFlowEur = calculateExternalCashFlowEur(dbTransactions, rates, snapshotDate);
  const baseSnapshots = buildSnapshotViews(
    dbSnapshots.filter((snapshot) => snapshot.snapshotDate !== snapshotDate)
  );
  const liveSnapshot: PortfolioSnapshot = {
    date: snapshotDate,
    valueEur,
    valueUsd,
    investedCapitalEur,
    cashFlowEur: externalCashFlowEur,
    twr: 0
  };
  const twrPercent = calculateTimeWeightedReturn([...baseSnapshots, liveSnapshot]);

  await db
    .insert(portfolioSnapshots)
    .values({
      portfolioId,
      snapshotDate,
      valueEur,
      valueUsd,
      investedCapitalEur,
      externalCashFlowEur,
      twrPercent
    })
    .onConflictDoUpdate({
      target: [portfolioSnapshots.portfolioId, portfolioSnapshots.snapshotDate],
      set: {
        valueEur,
        valueUsd,
        investedCapitalEur,
        externalCashFlowEur,
        twrPercent
      }
    });
}

async function findOrCreateAssetBySymbol(symbol: string) {
  const db = getDb();
  const [existing] = await db.select().from(assets).where(eq(assets.symbol, symbol)).limit(1);
  if (existing) return existing;

  const [asset] = await db
    .insert(assets)
    .values({
      symbol,
      name: symbol,
      type: "STOCK",
      currency: "USD",
      provider: "mock",
      externalId: symbol,
      color: "#3b82f6"
    })
    .onConflictDoUpdate({
      target: [assets.provider, assets.externalId],
      set: {
        updatedAt: new Date()
      }
    })
    .returning();

  await db
    .insert(priceSnapshots)
    .values({
      assetId: asset.id,
      provider: "mock",
      capturedAt: bootstrapTimestamp,
      price: 1,
      currency: "USD"
    })
    .onConflictDoNothing();

  return asset;
}

async function getLatestPrices() {
  const rows = await getDb()
    .select()
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.capturedAt));
  const latest = new Map<string, typeof priceSnapshots.$inferSelect>();

  for (const row of rows) {
    if (!latest.has(row.assetId)) {
      latest.set(row.assetId, row);
    }
  }

  return latest;
}

async function getLatestFxRates(): Promise<FxRateMap> {
  const rows = await getDb().select().from(fxSnapshots).orderBy(desc(fxSnapshots.capturedAt));
  const rates = { ...fallbackFxRates };
  const seenPairs = new Set<string>();

  for (const row of rows) {
    const pair = `${row.baseCurrency}:${row.quoteCurrency}`;
    if (seenPairs.has(pair)) continue;
    seenPairs.add(pair);

    if (row.baseCurrency === "USD" && row.quoteCurrency === "EUR") {
      rates.usdToEur = row.rate;
    }
    if (row.baseCurrency === "EUR" && row.quoteCurrency === "USD") {
      rates.eurToUsd = row.rate;
    }
  }

  return rates;
}

function buildAssetViews(
  dbAssets: DbAsset[],
  latestPrices: Map<string, typeof priceSnapshots.$inferSelect>,
  rates: FxRateMap
): Asset[] {
  return dbAssets.map((asset) => {
    const latestPrice = latestPrices.get(asset.id);
    const nativePrice = latestPrice?.price ?? 0;
    const priceCurrency = latestPrice?.currency ?? asset.currency;
    return {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      currency: asset.currency,
      exchange: asset.exchange ?? undefined,
      provider: asset.provider as PriceProvider,
      externalId: asset.externalId,
      priceEur: convertCurrency(nativePrice, priceCurrency, "EUR", rates),
      priceUsd: convertCurrency(nativePrice, priceCurrency, "USD", rates),
      change24hPercent: estimateDailyChange(asset.symbol),
      color: asset.color
    };
  });
}

function buildTransactionViews(rows: DbTransaction[], dbAssets: DbAsset[]): Transaction[] {
  const assetById = new Map(dbAssets.map((asset) => [asset.id, asset]));

  return rows.map((row) => {
    const asset = row.assetId ? assetById.get(row.assetId) : undefined;
    return {
      id: row.id,
      portfolioId: row.portfolioId,
      type: row.type,
      assetId: row.assetId ?? undefined,
      assetSymbol: asset?.symbol,
      date: row.occurredOn,
      quantity: row.quantity ?? undefined,
      grossAmount: row.grossAmount,
      currency: row.currency,
      fees: row.fees,
      note: row.note ?? undefined,
      platform: row.platform ?? undefined
    };
  });
}

function buildManualPositionViews(rows: DbManualPosition[], rates: FxRateMap): ManualPosition[] {
  return rows.map((row) => ({
    id: row.id,
    portfolioId: row.portfolioId,
    label: row.label,
    ...toDisplayPair(row.value, row.currency, rates),
    currency: row.currency,
    updatedAt: row.valuedOn,
    note: row.note ?? undefined
  }));
}

function buildPositions(
  rows: DbTransaction[],
  dbAssets: DbAsset[],
  latestPrices: Map<string, typeof priceSnapshots.$inferSelect>,
  rates: FxRateMap,
  portfolioId: string
): Position[] {
  const assetById = new Map(dbAssets.map((asset) => [asset.id, asset]));
  const costBasisByAsset = buildPositionStates(rows, rates);

  const rawPositions = Array.from(costBasisByAsset.entries())
    .map(([assetId, position]) => {
      const asset = assetById.get(assetId);
      const latestPrice = latestPrices.get(assetId);
      if (!asset || !latestPrice || position.quantity <= 0) return null;

      const priceUsd = convertCurrency(latestPrice.price, latestPrice.currency, "USD", rates);
      const marketValueUsd = position.quantity * priceUsd;
      const marketValueEur = convertCurrency(marketValueUsd, "USD", "EUR", rates);
      const pnlUsd = marketValueUsd - position.costBasisUsd;
      const pnlEur = convertCurrency(pnlUsd, "USD", "EUR", rates);
      const averageCostEur = convertCurrency(
        position.costBasisUsd / position.quantity,
        "USD",
        "EUR",
        rates
      );

      const view: Position = {
        id: `position_${assetId}`,
        portfolioId,
        assetId,
        quantity: position.quantity,
        averageCostEur,
        marketValueEur,
        marketValueUsd,
        pnlEur,
        pnlPercent: position.costBasisUsd === 0 ? 0 : (pnlUsd / position.costBasisUsd) * 100,
        allocationPercent: 0
      };

      if (position.platform) {
        view.platform = position.platform;
      }

      return view;
    })
    .filter((position): position is Position => Boolean(position));

  const totalValue = rawPositions.reduce((sum, position) => sum + position.marketValueUsd, 0);
  return rawPositions.map((position) => ({
    ...position,
    allocationPercent: totalValue === 0 ? 0 : (position.marketValueUsd / totalValue) * 100
  }));
}

function buildPortfolioView(
  id: string,
  name: string,
  description: string,
  positions: Position[],
  dbTransactions: DbTransaction[],
  manualViews: ManualPosition[],
  snapshots: PortfolioSnapshot[],
  rates: FxRateMap
): Portfolio {
  const positionsValueUsd = positions.reduce((sum, position) => sum + position.marketValueUsd, 0);
  const manualValueUsd = manualViews.reduce((sum, position) => sum + position.valueUsd, 0);
  const cashUsd = calculateCashUsd(dbTransactions, rates);
  const valueUsd = positionsValueUsd + manualValueUsd + cashUsd;
  const valueEur = convertCurrency(valueUsd, "USD", "EUR", rates);
  const netContributionsUsd = calculateNetContributionsUsd(dbTransactions, rates);
  const pnlUsd = valueUsd - netContributionsUsd;
  const latestSnapshot = snapshots.at(-1);

  return {
    id,
    name,
    description,
    baseCurrency: "USD",
    valueEur,
    valueUsd,
    twr: latestSnapshot?.twr ?? estimateReturn(valueUsd, netContributionsUsd),
    pnlEur: convertCurrency(pnlUsd, "USD", "EUR", rates),
    dayChangePercent: 0.74,
    netContributionsEur: convertCurrency(netContributionsUsd, "USD", "EUR", rates)
  };
}

function buildAllocations(
  positions: Position[],
  manualViews: ManualPosition[],
  dbAssets: DbAsset[]
): AllocationSlice[] {
  const assetById = new Map(dbAssets.map((asset) => [asset.id, asset]));
  const slices = [
    ...positions.map((position) => {
      const asset = assetById.get(position.assetId);
      return {
        label: asset?.symbol ?? "Unknown",
        value: position.marketValueEur,
        percent: 0,
        color: asset?.color ?? "#3b82f6"
      };
    }),
    ...manualViews.map((position) => ({
      label: position.label,
      value: position.valueEur,
      percent: 0,
      color: "#14b8a6"
    }))
  ];

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return slices.map((slice) => ({
    ...slice,
    percent: total === 0 ? 0 : (slice.value / total) * 100
  }));
}

function buildSnapshotViews(rows: (typeof portfolioSnapshots.$inferSelect)[]): PortfolioSnapshot[] {
  return rows.map((row) => ({
    date: row.snapshotDate,
    valueEur: row.valueEur,
    valueUsd: row.valueUsd,
    investedCapitalEur: row.investedCapitalEur,
    cashFlowEur: row.externalCashFlowEur,
    twr: row.twrPercent
  }));
}

async function seedPortfolioSnapshots(portfolioId: string) {
  await getDb()
    .insert(portfolioSnapshots)
    .values([
      {
        portfolioId,
        snapshotDate: "2026-01-03",
        valueEur: 46425,
        valueUsd: 50000,
        investedCapitalEur: 46425,
        externalCashFlowEur: 46425,
        twrPercent: 0
      },
      {
        portfolioId,
        snapshotDate: "2026-02-01",
        valueEur: 49280,
        valueUsd: 53075,
        investedCapitalEur: 46425,
        externalCashFlowEur: 0,
        twrPercent: 6.15
      },
      {
        portfolioId,
        snapshotDate: "2026-03-01",
        valueEur: 52110,
        valueUsd: 56122,
        investedCapitalEur: 46425,
        externalCashFlowEur: 0,
        twrPercent: 12.24
      },
      {
        portfolioId,
        snapshotDate: "2026-04-27",
        valueEur: 54290,
        valueUsd: 58469,
        investedCapitalEur: 43640,
        externalCashFlowEur: -2785,
        twrPercent: 18.42
      }
    ])
    .onConflictDoNothing();
}

function buildApiStatuses(): ApiStatus[] {
  return [
    {
      provider: "CoinGecko",
      configured: Boolean(process.env.COINGECKO_DEMO_API_KEY),
      purpose: "Crypto search and prices"
    },
    {
      provider: "Twelve Data",
      configured: Boolean(process.env.TWELVE_DATA_API_KEY),
      purpose: "Stocks, ETFs, commodities, FX"
    },
    {
      provider: "Financial Modeling Prep",
      configured: Boolean(process.env.FMP_API_KEY),
      purpose: "Optional fallback and enrichment"
    },
    {
      provider: "Neon Postgres",
      configured: Boolean(process.env.DATABASE_URL),
      purpose: "Persistent app data"
    }
  ];
}

function estimateDailyChange(symbol: string) {
  const changes: Record<string, number> = {
    BTC: 1.8,
    ETH: -0.7,
    SPY: 0.38,
    NVDA: 2.4
  };
  return changes[symbol] ?? 0;
}

function estimateReturn(valueUsd: number, netContributionsUsd: number) {
  if (netContributionsUsd <= 0) return 0;
  return ((valueUsd - netContributionsUsd) / netContributionsUsd) * 100;
}

function readInput(input: FormData | Record<string, unknown>) {
  if (input instanceof FormData) {
    return Object.fromEntries(input.entries());
  }
  return input;
}

function parseTransactionInput(input: FormData | Record<string, unknown>) {
  const values = readInput(input);
  const type = String(values.type ?? "BUY") as TransactionType;
  const currency = normalizeCurrency(String(values.currency ?? "USD"));
  const assetSymbol = String(values.assetSymbol ?? "").trim().toUpperCase();
  const quantity = parseOptionalNumber(values.quantity);
  const grossAmount = parseRequiredNumber(values.grossAmount, "Total amount");
  const fees = parseOptionalNumber(values.fees) ?? 0;
  const occurredOn = String(values.occurredOn ?? new Date().toISOString().slice(0, 10));

  validateTransactionInput(type, assetSymbol, quantity, grossAmount, fees);

  return {
    type,
    currency,
    assetSymbol,
    quantity: ["BUY", "SELL"].includes(type) ? quantity : undefined,
    grossAmount,
    fees,
    occurredOn,
    platform: emptyToNull(String(values.platform ?? "")),
    note: emptyToNull(String(values.note ?? ""))
  };
}

function parseOptionalNumber(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error("Invalid number.");
  return parsed;
}

function parseRequiredNumber(value: unknown, label: string) {
  const parsed = parseOptionalNumber(value);
  if (parsed === undefined) throw new Error(`${label} is required.`);
  return parsed;
}

function normalizeCurrency(value: string): Currency {
  return value.toUpperCase() === "EUR" ? "EUR" : "USD";
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validateTransactionInput(
  type: TransactionType,
  assetSymbol: string,
  quantity: number | undefined,
  grossAmount: number,
  fees: number
) {
  if (grossAmount <= 0) throw new Error("Total amount must be positive.");
  if (fees < 0) throw new Error("Fees cannot be negative.");
  if (["TRANSFER_IN", "TRANSFER_OUT"].includes(type)) {
    throw new Error("Transfers need paired portfolio support and are not enabled in quick add yet.");
  }

  if (["BUY", "SELL"].includes(type)) {
    if (!assetSymbol) throw new Error("Asset is required for buy/sell transactions.");
    if (!quantity || quantity <= 0) throw new Error("Quantity is required for buy/sell transactions.");
  }
}
