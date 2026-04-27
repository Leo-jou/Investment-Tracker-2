import { AssetAllocationChart } from "@/components/portfolio/asset-allocation-chart";
import { DailyMovers } from "@/components/portfolio/daily-movers";
import { getAssetTypeAllocation } from "@/lib/metrics";
import type { Currency } from "@/lib/types";

export function AnalysisPanels({ currency }: { currency: Currency }) {
  return (
    <div className="space-y-20">
      <section>
        <h2 className="text-3xl font-bold">Portfolio profitability</h2>
        <div className="mt-8 h-[260px] border-y border-[#202024] bg-[linear-gradient(180deg,transparent,transparent_50%,#0a0a0a_50%,transparent)]">
          <div className="mx-auto grid h-full max-w-md grid-cols-2 items-center gap-2">
            <div className="h-[92px] rounded-t-[3px] bg-[#3b82f6]" />
            <div className="h-[54px] self-start rounded-t-[3px] bg-[#4ed6e7]" />
            <p className="text-center text-sm text-zinc-500">Portfolio %</p>
            <p className="text-center text-sm text-zinc-500">SPX %</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold">Risks</h2>
        <div className="mt-8 grid gap-10 xl:grid-cols-3">
          <RiskMetric title="Beta" detail="Enough data to analyze by May 1, 2026" value="Market" />
          <RiskMetric title="Sharpe ratio" detail="Enough data to analyze by May 1, 2026" value="-" />
          <RiskMetric title="Sortino ratio" detail="Portfolio is profitable" value="1.4" />
        </div>
      </section>

      <DailyMovers />
      <AssetAllocationChart allocations={getAssetTypeAllocation()} currency={currency} />
    </div>
  );
}

function RiskMetric({
  title,
  detail,
  value
}: {
  title: string;
  detail: string;
  value: string;
}) {
  return (
    <div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-1 text-base text-zinc-300">{detail}</p>
      <div className="mt-8 h-2 rounded-full bg-[linear-gradient(90deg,#ff4d8d,#f6b342,#36c7b7)]">
        <span className="block h-3 w-3 translate-y-[-2px] rounded-full bg-zinc-200" />
      </div>
      <p className="mt-3 inline-flex rounded-[5px] bg-[#2c2c2f] px-3 py-1 text-xs font-bold uppercase text-zinc-200">
        {value}
      </p>
    </div>
  );
}
