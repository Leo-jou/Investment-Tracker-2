import type { Asset, PriceProvider } from "../types.ts";

const staleAfterMs = 48 * 60 * 60 * 1000;

export type PriceStatusTone = "ok" | "warning" | "danger" | "neutral";

export type PriceStatus = {
  label: string;
  detail: string;
  tone: PriceStatusTone;
};

export function getAssetPriceStatus(asset: Pick<Asset, "provider" | "priceCapturedAt" | "priceEur" | "priceUsd">, now = new Date()): PriceStatus {
  if (asset.provider === "manual" || asset.provider === "mock") {
    return {
      label: "Saved price",
      detail: `${priceProviderLabel(asset.provider)} prices are not refreshed automatically.`,
      tone: "warning"
    };
  }

  if (asset.priceEur <= 0 && asset.priceUsd <= 0) {
    return {
      label: "Unavailable",
      detail: "No provider quote has been saved for this asset.",
      tone: "danger"
    };
  }

  if (!asset.priceCapturedAt) {
    return {
      label: "No timestamp",
      detail: "A saved price exists, but its capture time is unknown.",
      tone: "warning"
    };
  }

  const capturedAt = Date.parse(asset.priceCapturedAt);
  if (!Number.isFinite(capturedAt)) {
    return {
      label: "Invalid timestamp",
      detail: "The saved quote timestamp could not be read.",
      tone: "warning"
    };
  }

  if (now.getTime() - capturedAt > staleAfterMs) {
    return {
      label: "Stale",
      detail: `Last quote ${formatPriceTimestamp(asset.priceCapturedAt)}.`,
      tone: "warning"
    };
  }

  return {
    label: "Fresh",
    detail: `Last quote ${formatPriceTimestamp(asset.priceCapturedAt)}.`,
    tone: "ok"
  };
}

export function priceProviderLabel(provider: PriceProvider) {
  if (provider === "coingecko") return "CoinGecko";
  if (provider === "twelve-data") return "Twelve Data";
  if (provider === "fmp") return "FMP";
  if (provider === "manual") return "Manual";
  return "Mock";
}

export function formatPriceTimestamp(value?: string) {
  if (!value) return "not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not recorded";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
