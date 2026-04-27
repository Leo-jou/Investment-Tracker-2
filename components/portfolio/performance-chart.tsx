"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Currency, PortfolioSnapshot } from "@/lib/types";

type ChartMode = "value" | "performance";

type PerformanceChartProps = {
  snapshots: PortfolioSnapshot[];
  currency: Currency;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
};

export function PerformanceChart({
  snapshots,
  currency,
  mode,
  onModeChange
}: PerformanceChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const data = snapshots.map((snapshot) => ({
    date: snapshot.date.slice(5),
    value: currency === "EUR" ? snapshot.valueEur : snapshot.valueUsd,
    capital: currency === "EUR" ? snapshot.investedCapitalEur : snapshot.investedCapitalEur * 1.077,
    twr: snapshot.twr,
    benchmark: snapshot.twr * 0.72 + 1.2
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
        <h2 className="text-3xl font-bold">Portfolio change</h2>
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
        {isMounted ? (
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
              {mode === "performance" && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="SPX"
                  stroke="#4ed6e7"
                  strokeWidth={3}
                  dot={false}
                />
              )}
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

      <div className="grid gap-4 pt-5 text-center sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["1 month", mode === "value" ? "+4.03%" : "+1.51%"],
          ["3 months", "+6.81%"],
          ["6 months", "+10.42%"],
          ["Year to date", "+8.98%"],
          ["1 year", "+17.62%"],
          ["All time", "+18.42%"]
        ].map(([period, value], index) => (
          <div
            key={period}
            className={index === 5 ? "rounded-[8px] bg-[#2c2c2f] py-4" : "py-4"}
          >
            <p className="text-base text-zinc-200">{period}</p>
            <p className="mt-1 text-base font-semibold text-[#00c2a8]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
