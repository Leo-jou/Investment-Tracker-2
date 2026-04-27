import { Info } from "lucide-react";

import { AssetAllocationChart } from "@/components/portfolio/asset-allocation-chart";
import { DailyMovers } from "@/components/portfolio/daily-movers";
import { calculateRiskAnalytics, type RiskMetricValue } from "@/lib/performance/risk";
import type {
  AllocationSlice,
  Asset,
  Currency,
  ManualPosition,
  PortfolioSnapshot,
  Position
} from "@/lib/types";

export function AnalysisPanels({
  currency,
  snapshots,
  allocations,
  assets,
  positions,
  manualPositions
}: {
  currency: Currency;
  snapshots: PortfolioSnapshot[];
  allocations: AllocationSlice[];
  assets: Asset[];
  positions: Position[];
  manualPositions: ManualPosition[];
}) {
  const risk = calculateRiskAnalytics({ snapshots, currency });
  const latestTwr = snapshots.at(-1)?.twr ?? 0;
  const firstValue = currency === "USD" ? snapshots[0]?.valueUsd ?? 0 : snapshots[0]?.valueEur ?? 0;
  const latestValue =
    currency === "USD" ? snapshots.at(-1)?.valueUsd ?? 0 : snapshots.at(-1)?.valueEur ?? 0;
  const valueReturn = firstValue > 0 ? ((latestValue - firstValue) / firstValue) * 100 : 0;

  return (
    <div className="space-y-20">
      <section>
        <h2 className="text-3xl font-bold">Portfolio profitability</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ProfitabilityMetric
            label="TWR"
            value={`${latestTwr.toFixed(2)}%`}
            detail="Cash-flow neutral performance"
          />
          <ProfitabilityMetric
            label="Value return"
            value={`${valueReturn.toFixed(2)}%`}
            detail="Raw portfolio value change, including cash effects"
          />
          <ProfitabilityMetric
            label="Return periods"
            value={String(risk.sampleSize)}
            detail={`${cadenceLabel(risk.cadence.status)}; ${currency} basis`}
          />
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Risks</h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-500">
              Calculated from portfolio snapshots using {currency}-basis TWR returns so deposits and withdrawals do not create fake gains or losses.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-10 xl:grid-cols-3">
          <RiskMetric
            title="Beta"
            metric={risk.beta}
            tooltip="Beta = covariance(portfolio TWR returns, benchmark returns) / variance(benchmark returns). For this mixed portfolio, the intended benchmark is weighted by asset class: stocks/ETFs to SPY, crypto to BTC, commodities to XAU/USD, cash/manual to 0. It is not shown until aligned benchmark history exists."
          />
          <RiskMetric
            title="Sharpe ratio"
            metric={risk.sharpe}
            tooltip="Sharpe = (annualized TWR return - annual risk-free rate) / annualized volatility. The current MVP assumes a 0% annual risk-free rate until a Treasury/FRED source is added. It is only shown for regular snapshot intervals."
          />
          <RiskMetric
            title="Sortino ratio"
            metric={risk.sortino}
            tooltip="Sortino uses the same excess-return numerator as Sharpe, but divides by downside deviation only. Upside volatility is not penalized. It is only shown for regular snapshot intervals."
          />
        </div>

        <div className="mt-8 rounded-[8px] border border-[#2b2b2f] bg-black p-4 text-sm text-zinc-500">
          <p className="font-semibold text-zinc-300">Methodology</p>
          <p className="mt-2">
            These are historical diagnostics, not forecasts. Metrics use the selected display currency and regular snapshot intervals; irregular daily/monthly mixes are withheld instead of normalized into misleading ratios. Thirty aligned periods is the first ready threshold.
          </p>
        </div>
      </section>

      <DailyMovers />
      <AssetAllocationChart
        allocations={allocations}
        currency={currency}
        assets={assets}
        positions={positions}
        manualPositions={manualPositions}
      />
    </div>
  );
}

function ProfitabilityMetric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-100">{value}</p>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function RiskMetric({
  title,
  metric,
  tooltip
}: {
  title: string;
  metric: RiskMetricValue;
  tooltip: string;
}) {
  const isReady = metric.status === "ready";
  const value =
    metric.value === null
      ? metric.status === "low-sample"
        ? "Low sample"
        : "Not ready"
      : metric.value.toFixed(2);

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-2xl font-bold">{title}</h3>
        <span className="group relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#3a3a3f] text-zinc-400">
          <Info className="h-3 w-3" />
          <span className="pointer-events-none absolute left-0 top-7 z-10 hidden w-80 rounded-[6px] border border-[#2b2b2f] bg-[#111113] p-3 text-left text-xs leading-5 text-zinc-300 shadow-xl group-hover:block">
            {tooltip}
          </span>
        </span>
      </div>
      <p className="mt-1 min-h-12 text-base text-zinc-300">{metric.detail}</p>
      <p className="mt-3 inline-flex rounded-[5px] bg-[#2c2c2f] px-3 py-1 text-xs font-bold uppercase text-zinc-200">
        {value}
      </p>
      <p className="mt-2 text-xs uppercase tracking-wide text-[#f6b342]">
        {isReady ? "Ready" : metric.status === "low-sample" ? "Low confidence" : "Unavailable"}
      </p>
    </div>
  );
}

function cadenceLabel(status: "regular" | "irregular" | "insufficient") {
  if (status === "regular") return "regular cadence";
  if (status === "irregular") return "irregular cadence";
  return "insufficient cadence";
}
