"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatMoney, trendClass } from "@/lib/format";
import type { AllocationSlice, Asset, Currency, ManualPosition, Position } from "@/lib/types";
import { cn } from "@/lib/utils";

type AssetAllocationChartProps = {
  allocations: AllocationSlice[];
  currency: Currency;
  assets?: Asset[];
  positions?: Position[];
  manualPositions?: ManualPosition[];
};

type AllocationMode = "Assets" | "Asset types" | "Currency" | "Sectors";

export function AssetAllocationChart({
  allocations,
  currency,
  assets = [],
  positions = [],
  manualPositions = []
}: AssetAllocationChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<AllocationMode>("Assets");
  const fx = currency === "EUR" ? 1 : 1.077;
  const visibleAllocations = getAllocationsForMode(
    mode,
    allocations,
    assets,
    positions,
    manualPositions
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Portfolio distribution</h2>
        <div className="mt-7 flex flex-wrap gap-7 text-lg">
          {(["Assets", "Asset types", "Sectors", "Currency"] as AllocationMode[]).map((tab) => (
            <button
              key={tab}
              type="button"
              disabled={tab === "Sectors"}
              onClick={() => setMode(tab)}
              className={cn(
                "rounded-[6px] px-4 py-2 text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-600",
                mode === tab && "bg-[#2c2c2f] font-semibold"
              )}
              title={tab === "Sectors" ? "Sector data is not available yet." : undefined}
            >
              {tab}
              {tab === "Sectors" && <span className="ml-2 text-xs text-zinc-600">Soon</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-[1fr_1.25fr]">
        <div className="h-[390px] min-w-0">
          {isMounted ? (
            <ResponsiveContainer width="100%" height={390}>
              <PieChart>
                <Pie
                  data={visibleAllocations}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="43%"
                  outerRadius="74%"
                  paddingAngle={0}
                  label={({ name, percent }) => {
                    const percentage = (percent ?? 0) * 100;
                    return percentage >= 3 ? `${name} ${percentage.toFixed(1)}%` : "";
                  }}
                  labelLine={false}
                >
                  {visibleAllocations.map((slice) => (
                    <Cell key={slice.label} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#2a2a2d",
                    border: "none",
                    borderRadius: 6,
                    color: "#f4f4f5"
                  }}
                  formatter={(value) => {
                    const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                    return formatMoney(numericValue * fx, currency);
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-full border-[48px] border-[#202024]" />
          )}
          <div className="-mt-[228px] flex flex-col items-center">
            <p className="text-3xl font-bold">{visibleAllocations.length}</p>
            <p className="text-lg font-semibold">{mode}</p>
          </div>
        </div>

        <div className="overflow-x-auto tv-scrollbar">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#2b2b2f] text-left text-zinc-500">
                <th className="py-3 font-medium">Asset</th>
                <th className="py-3 text-right font-medium">Holding value</th>
                <th className="py-3 text-right font-medium">Allocation</th>
                <th className="py-3 text-right font-medium">Unrealized gain</th>
              </tr>
            </thead>
            <tbody>
              {visibleAllocations.map((slice, index) => {
                const gain = index % 3 === 0 ? -slice.value * 0.024 : slice.value * 0.018;
                return (
                  <tr key={slice.label} className="border-b border-[#202024]">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-semibold text-zinc-200">{slice.label}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right text-zinc-300">
                      {formatMoney(slice.value * fx, currency)}
                    </td>
                    <td className="py-4 text-right text-zinc-300">
                      {slice.percent.toFixed(2)}%
                    </td>
                    <td className={cn("py-4 text-right", trendClass(gain))}>
                      {formatMoney(gain * fx, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function getAllocationsForMode(
  mode: AllocationMode,
  allocations: AllocationSlice[],
  assets: Asset[],
  positions: Position[],
  manualPositions: ManualPosition[]
) {
  if (mode === "Assets" || mode === "Sectors") return allocations;
  if (positions.length === 0 && manualPositions.length === 0) return allocations;

  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const grouped = new Map<string, { value: number; color: string }>();

  for (const position of positions) {
    const asset = assetById.get(position.assetId);
    const label = mode === "Asset types" ? asset?.type ?? "Unknown" : asset?.currency ?? "USD";
    addGroupedValue(grouped, label, position.marketValueEur, asset?.color ?? "#3b82f6");
  }

  for (const position of manualPositions) {
    const label = mode === "Asset types" ? "Manual" : position.currency;
    addGroupedValue(grouped, label, position.valueEur, "#14b8a6");
  }

  const slices = Array.from(grouped.entries()).map(([label, value]) => ({
    label,
    value: value.value,
    percent: 0,
    color: value.color
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return slices.map((slice) => ({
    ...slice,
    percent: total === 0 ? 0 : (slice.value / total) * 100
  }));
}

function addGroupedValue(
  grouped: Map<string, { value: number; color: string }>,
  label: string,
  value: number,
  color: string
) {
  const current = grouped.get(label);
  if (current) {
    current.value += value;
    return;
  }
  grouped.set(label, { value, color });
}
