import type { Currency } from "@/lib/types";

export type FxRateMap = {
  usdToEur: number;
  eurToUsd: number;
};

export const fallbackFxRates: FxRateMap = {
  usdToEur: 0.9285,
  eurToUsd: 1.077
};

export function convertCurrency(
  value: number,
  from: Currency,
  to: Currency,
  rates: FxRateMap = fallbackFxRates
) {
  if (from === to) return value;
  return from === "USD" ? value * rates.usdToEur : value * rates.eurToUsd;
}

export function toDisplayPair(value: number, currency: Currency, rates: FxRateMap) {
  return {
    valueUsd: convertCurrency(value, currency, "USD", rates),
    valueEur: convertCurrency(value, currency, "EUR", rates)
  };
}
