"use client";

import { useState } from "react";

import { PerformanceChart } from "@/components/portfolio/performance-chart";
import type { TimeframeKey } from "@/lib/portfolio/timeframes";
import type { Currency, PortfolioSnapshot } from "@/lib/types";

export function PortfolioValueChart({
  snapshots,
  currency,
  timeframe
}: {
  snapshots: PortfolioSnapshot[];
  currency: Currency;
  timeframe: TimeframeKey;
}) {
  const [mode, setMode] = useState<"value" | "performance">("value");

  return (
    <PerformanceChart
      snapshots={snapshots}
      currency={currency}
      mode={mode}
      timeframe={timeframe}
      onModeChange={setMode}
    />
  );
}
