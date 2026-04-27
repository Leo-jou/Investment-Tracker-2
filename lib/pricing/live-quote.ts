import { convertCurrency } from "@/lib/data/conversions";
import {
  getLatestFxRates,
  insertPriceSnapshotsForRefresh,
  upsertAssetFromSearchResult
} from "@/lib/db/portfolio-repository";
import { fetchLivePriceSnapshot } from "@/lib/pricing/refresh";
import type { AssetSearchResult } from "@/lib/types";

export type LiveQuoteResult = AssetSearchResult & {
  quotedAt?: string;
  quoteSource: "live" | "saved" | "unavailable";
  message?: string;
};

export async function quoteAssetForTransaction(input: AssetSearchResult): Promise<LiveQuoteResult> {
  const asset = await upsertAssetFromSearchResult(input);
  const capturedAt = new Date();
  const liveSnapshot = await fetchLivePriceSnapshot(asset, capturedAt);
  const rates = await getLatestFxRates();

  if (liveSnapshot) {
    await insertPriceSnapshotsForRefresh([liveSnapshot]);

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
    quoteSource: input.priceUsd || input.priceEur ? "saved" : "unavailable",
    message:
      asset.provider === "fmp"
        ? "Live quotes for FMP assets are not wired yet."
        : "Live quote unavailable. The latest saved price was kept."
  };
}
