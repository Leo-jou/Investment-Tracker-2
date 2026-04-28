import type { Currency, PortfolioSnapshot } from "@/lib/types";

export type TimeframeKey = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export type TimeframeOption = {
  key: TimeframeKey;
  label: string;
  shortLabel: string;
};

export type TimeframeStats = {
  timeframe: TimeframeKey;
  label: string;
  snapshots: PortfolioSnapshot[];
  startDate: string | null;
  endDate: string | null;
  startValue: number | null;
  endValue: number | null;
  valueChange: number | null;
  valueChangePercent: number | null;
  twr: number | null;
  hasEnoughData: boolean;
};

export const timeframeOptions: TimeframeOption[] = [
  { key: "1D", label: "1 day", shortLabel: "1D" },
  { key: "1W", label: "1 week", shortLabel: "1W" },
  { key: "1M", label: "1 month", shortLabel: "1M" },
  { key: "3M", label: "3 months", shortLabel: "3M" },
  { key: "6M", label: "6 months", shortLabel: "6M" },
  { key: "YTD", label: "Year to date", shortLabel: "YTD" },
  { key: "1Y", label: "1 year", shortLabel: "1Y" },
  { key: "ALL", label: "All time", shortLabel: "All" }
];

const dayMs = 86_400_000;

export function getTimeframeOption(key: TimeframeKey) {
  return timeframeOptions.find((option) => option.key === key) ?? timeframeOptions.at(-1)!;
}

export function calculateTimeframeStats(
  snapshots: PortfolioSnapshot[],
  timeframe: TimeframeKey,
  currency: Currency
): TimeframeStats {
  const sorted = sortSnapshots(snapshots);
  const label = getTimeframeOption(timeframe).label;
  if (sorted.length === 0) {
    return emptyStats(timeframe, label);
  }

  const end = sorted.at(-1)!;
  const filtered = filterSnapshotsForTimeframe(sorted, timeframe);
  const start = filtered[0] ?? end;
  const endValue = snapshotValue(end, currency);
  const startValue = snapshotValue(start, currency);
  const hasEnoughData = filtered.length >= 2;
  const valueChange = hasEnoughData ? endValue - startValue : null;
  const valueChangePercent =
    hasEnoughData && startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : null;
  const twr = hasEnoughData ? calculatePeriodTwr(start.twr, end.twr) : null;

  return {
    timeframe,
    label,
    snapshots: filtered,
    startDate: start.date,
    endDate: end.date,
    startValue,
    endValue,
    valueChange,
    valueChangePercent,
    twr,
    hasEnoughData
  };
}

export function filterSnapshotsForTimeframe(
  snapshots: PortfolioSnapshot[],
  timeframe: TimeframeKey
) {
  const sorted = sortSnapshots(snapshots);
  if (timeframe === "ALL" || sorted.length === 0) return sorted;
  const end = sorted.at(-1)!;
  const startDate = resolveStartDate(timeframe, end.date);
  return sorted.filter((snapshot) => snapshot.date >= startDate);
}

export function calculatePeriodTwr(startTwr: number, endTwr: number) {
  return ((1 + endTwr / 100) / (1 + startTwr / 100) - 1) * 100;
}

function resolveStartDate(timeframe: TimeframeKey, endDate: string) {
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const start = new Date(end);

  if (timeframe === "1D") start.setTime(end.getTime() - dayMs);
  if (timeframe === "1W") start.setTime(end.getTime() - 7 * dayMs);
  if (timeframe === "1M") start.setUTCMonth(end.getUTCMonth() - 1);
  if (timeframe === "3M") start.setUTCMonth(end.getUTCMonth() - 3);
  if (timeframe === "6M") start.setUTCMonth(end.getUTCMonth() - 6);
  if (timeframe === "1Y") start.setUTCFullYear(end.getUTCFullYear() - 1);
  if (timeframe === "YTD") start.setUTCMonth(0, 1);

  return start.toISOString().slice(0, 10);
}

function snapshotValue(snapshot: PortfolioSnapshot, currency: Currency) {
  return currency === "EUR" ? snapshot.valueEur : snapshot.valueUsd;
}

function sortSnapshots(snapshots: PortfolioSnapshot[]) {
  return [...snapshots].sort((left, right) => left.date.localeCompare(right.date));
}

function emptyStats(timeframe: TimeframeKey, label: string): TimeframeStats {
  return {
    timeframe,
    label,
    snapshots: [],
    startDate: null,
    endDate: null,
    startValue: null,
    endValue: null,
    valueChange: null,
    valueChangePercent: null,
    twr: null,
    hasEnoughData: false
  };
}
