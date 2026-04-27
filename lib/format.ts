import type { Currency } from "@/lib/types";

export function formatMoney(value: number, currency: Currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

export function formatCompactMoney(value: number, currency: Currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value: number, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 1 ? 6 : 3
  }).format(value);
}

export function currencyValue(
  values: { valueEur: number; valueUsd: number },
  currency: Currency
) {
  return currency === "EUR" ? values.valueEur : values.valueUsd;
}

export function trendClass(value: number) {
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-rose-700";
  return "text-muted-foreground";
}
