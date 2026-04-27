import type { Currency, PriceProvider } from "../types";

export type ProviderPriceSnapshot = {
  assetId: string;
  provider: PriceProvider;
  price: number;
  currency: Currency;
  capturedAt: Date;
};

type SnapshotAsset = {
  id: string;
  provider: PriceProvider;
  currency: Currency;
};

export function normalizeCoinGeckoPrice(
  asset: SnapshotAsset,
  price: { usd?: number; eur?: number } | undefined,
  capturedAt: Date
): ProviderPriceSnapshot | null {
  const nativePrice =
    asset.currency === "EUR" && isPositiveNumber(price?.eur)
      ? { price: price.eur, currency: "EUR" as Currency }
      : isPositiveNumber(price?.usd)
        ? { price: price.usd, currency: "USD" as Currency }
        : isPositiveNumber(price?.eur)
          ? { price: price.eur, currency: "EUR" as Currency }
          : null;

  if (!nativePrice) return null;

  return {
    assetId: asset.id,
    provider: asset.provider,
    price: nativePrice.price,
    currency: nativePrice.currency,
    capturedAt
  };
}

export function normalizeTwelveDataQuote(
  asset: SnapshotAsset,
  quote: { close?: string; currency?: string },
  capturedAt: Date
): ProviderPriceSnapshot | null {
  const close = Number(quote.close);
  if (!isPositiveNumber(close)) return null;

  return {
    assetId: asset.id,
    provider: asset.provider,
    price: close,
    currency: normalizeProviderCurrency(quote.currency, asset.currency),
    capturedAt
  };
}

function normalizeProviderCurrency(value: string | undefined, fallback: Currency): Currency {
  const normalized = value?.toUpperCase();
  if (normalized === "EUR" || normalized === "USD") return normalized;
  return fallback;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
