"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatMoney, formatPercent } from "@/lib/format";
import {
  calculateTimeframeStats,
  timeframeOptions,
  type TimeframeKey
} from "@/lib/portfolio/timeframes";
import type { Currency, PortfolioSnapshot } from "@/lib/types";

type ChartMode = "value" | "performance";

type PerformanceChartProps = {
  snapshots: PortfolioSnapshot[];
  currency: Currency;
  timeframe: TimeframeKey;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
};

export function PerformanceChart({
  snapshots,
  currency,
  timeframe,
  mode,
  onModeChange
}: PerformanceChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const activeStats = calculateTimeframeStats(snapshots, timeframe, currency);
  const chartSnapshots = activeStats.snapshots.length > 0 ? activeStats.snapshots : snapshots;
  const data = chartSnapshots.map((snapshot) => ({
    date: snapshot.date.slice(5),
    value: currency === "EUR" ? snapshot.valueEur : snapshot.valueUsd,
    twr: snapshot.twr
  }));

  const valueKey = mode === "value" ? "value" : "twr";
  const label = mode === "value" ? "Portfolio" : "Portfolio TWR";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Portfolio change</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {mode === "value"
              ? "Persisted snapshot value, including holdings, cash, and manual positions. Backdated entries update today's snapshot, not a historical backfill."
              : "Snapshot-based time-weighted return, excluding external deposits and withdrawals."}
          </p>
        </div>
        <SegmentedControl
          options={[
            { label: "Value", value: "value" },
            { label: "Performance", value: "performance" }
          ]}
          value={mode}
          onChange={(value) => onModeChange(value as ChartMode)}
        />
      </div>

      <div className="mt-7 h-[420px] min-w-0 w-full">
        {data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-[8px] border border-dashed border-[#2b2b2f] bg-[#050505] px-6 text-center">
            <p className="max-w-sm text-sm leading-6 text-zinc-500">
              No portfolio history yet. Add real entries or refresh snapshots before this chart
              populates. Backdated entries are validated, but historical snapshots are not rebuilt.
            </p>
          </div>
        ) : isMounted ? (
          <ResponsiveContainer width="100%" height={420}>
            <AreaChart data={data} margin={{ left: 0, right: 14, top: 18, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#202024" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#c4c4c7", fontSize: 13, fontWeight: 700 }}
              />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#c4c4c7", fontSize: 13 }}
                tickFormatter={(value: number) =>
                  mode === "value" ? value.toLocaleString("en-US") : `${value.toFixed(1)}%`
                }
                width={76}
              />
              <Tooltip
                contentStyle={{
                  background: "#2a2a2d",
                  border: "none",
                  borderRadius: 6,
                  color: "#f4f4f5"
                }}
                formatter={(value, name) => {
                  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                  const seriesName = String(name);
                  return [
                    mode === "value"
                      ? formatMoney(numericValue, currency)
                      : formatPercent(numericValue),
                    seriesName === valueKey ? label : seriesName
                  ];
                }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Area
                type="monotone"
                dataKey={valueKey}
                name={label}
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#portfolioFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full border-y border-[#202024]" />
        )}
      </div>

      <div className="grid gap-4 pt-5 text-center sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {timeframeOptions.map((option) => {
          const stats = calculateTimeframeStats(snapshots, option.key, currency);
          const display =
            mode === "value"
              ? stats.valueChange === null
                ? "Need data"
                : formatMoney(stats.valueChange, currency)
              : stats.twr === null
                ? "Need data"
                : formatPercent(stats.twr);
          const trendValue = mode === "value" ? stats.valueChange : stats.twr;
          return (
          <div
            key={option.key}
            className={
              option.key === timeframe
                ? "rounded-[8px] bg-[#2c2c2f] py-4"
                : "rounded-[8px] py-4"
            }
          >
            <p className="text-sm text-zinc-200">{option.shortLabel}</p>
            <p
              className={
                trendValue === null
                  ? "mt-1 text-sm font-semibold text-zinc-600"
                  : trendValue >= 0
                    ? "mt-1 text-sm font-semibold text-[#00c2a8]"
                    : "mt-1 text-sm font-semibold text-[#ff4d64]"
              }
            >
              {display}
            </p>
          </div>
          );
        })}
      </div>
    </section>
  );
}
