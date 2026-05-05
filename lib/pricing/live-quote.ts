import { convertCurrency } from "@/lib/data/conversions";
import { getLatestFxRates, type RefreshableAsset } from "@/lib/db/portfolio-repository";
import { fetchLivePriceSnapshot } from "@/lib/pricing/refresh";
import type { AssetSearchResult, AssetType, Currency, PriceProvider } from "@/lib/types";

export type LiveQuoteResult = AssetSearchResult & {
  quotedAt?: string;
  quoteSource: "live" | "saved" | "unavailable";
  message?: string;
};

export async function quoteAssetForTransaction(input: AssetSearchResult): Promise<LiveQuoteResult> {
  const asset = normalizeTransientAsset(input);
  const capturedAt = new Date();
  const liveSnapshot = await fetchProviderSnapshot(asset, capturedAt);
  const rates = await getLatestFxRates();

  if (liveSnapshot) {
    return {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      exchange: asset.exchange ?? undefined,
      currency: asset.currency,
      provider: asset.provider,
      externalId: asset.externalId,
      priceEur: convertCurrency(liveSnapshot.price, liveSnapshot.currency, "EUR", rates),
      priceUsd: convertCurrency(liveSnapshot.price, liveSnapshot.currency, "USD", rates),
      quotedAt: liveSnapshot.capturedAt.toISOString(),
      quoteSource: "live"
    };
  }

  return {
    ...input,
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    exchange: asset.exchange ?? undefined,
    currency: asset.currency,
    provider: asset.provider,
    externalId: asset.externalId,
    quotedAt: input.priceCapturedAt,
    quoteSource: input.priceUsd || input.priceEur ? "saved" : "unavailable",
    message:
      asset.provider === "fmp"
        ? "Live quotes for FMP assets are not wired yet."
        : "Live quote unavailable. The latest saved price was kept."
  };
}

async function fetchProviderSnapshot(asset: RefreshableAsset, capturedAt: Date) {
  try {
    return await fetchLivePriceSnapshot(asset, capturedAt);
  } catch {
    return null;
  }
}

function normalizeTransientAsset(input: AssetSearchResult): RefreshableAsset {
  const symbol = input.symbol.trim().toUpperCase();
  const externalId = input.externalId.trim();

  if (!symbol) throw new Error("Asset symbol is required.");
  if (!externalId) throw new Error("Asset external ID is required.");

  return {
    id: `transient:${input.provider}:${externalId}`,
    symbol,
    name: input.name.trim() || symbol,
    type: normalizeAssetType(input.type),
    currency: normalizeCurrency(input.currency),
    exchange: input.exchange?.trim() || null,
    provider: normalizeProvider(input.provider),
    externalId
  };
}

function normalizeCurrency(value: string): Currency {
  return value.toUpperCase() === "EUR" ? "EUR" : "USD";
}

function normalizeAssetType(value: string): AssetType {
  const normalized = value.toUpperCase();
  if (
    normalized === "CRYPTO" ||
    normalized === "STOCK" ||
    normalized === "ETF" ||
    normalized === "COMMODITY" ||
    normalized === "CASH" ||
    normalized === "MANUAL"
  ) {
    return normalized;
  }
  return "STOCK";
}

function normalizeProvider(value: string): PriceProvider {
  if (
    value === "coingecko" ||
    value === "twelve-data" ||
    value === "fmp" ||
    value === "manual" ||
    value === "mock"
  ) {
    return value;
  }
  return "mock";
}
