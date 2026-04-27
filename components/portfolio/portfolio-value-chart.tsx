"use client";

import { useState } from "react";

import { PerformanceChart } from "@/components/portfolio/performance-chart";
import type { Currency, PortfolioSnapshot } from "@/lib/types";

export function PortfolioValueChart({
  snapshots,
  currency
}: {
  snapshots: PortfolioSnapshot[];
  currency: Currency;
}) {
  const [mode, setMode] = useState<"value" | "performance">("value");

  return (
    <PerformanceChart
      snapshots={snapshots}
      currency={currency}
      mode={mode}
      onModeChange={setMode}
    />
  );
}
