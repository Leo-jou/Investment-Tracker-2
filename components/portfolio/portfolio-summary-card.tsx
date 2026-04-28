import { Info } from "lucide-react";

import { formatMoney, formatPercent, trendClass } from "@/lib/format";
import type { Currency } from "@/lib/types";
import { cn } from "@/lib/utils";

type PortfolioSummaryCardProps = {
  label: string;
  value: number;
  currency: Currency;
  detail?: string;
  secondaryDetail?: string;
  tooltip?: string;
  calculationLines?: string[];
  change?: number;
  changeLabel?: string;
  emphasis?: "neutral" | "positive" | "negative";
  valueKind?: "money" | "percent";
};

export function PortfolioSummaryCard({
  label,
  value,
  currency,
  detail,
  secondaryDetail,
  tooltip,
  calculationLines,
  change,
  changeLabel,
  emphasis = "neutral",
  valueKind = "money"
}: PortfolioSummaryCardProps) {
  return (
    <section className="min-h-[118px] rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-medium text-zinc-300">{label}</p>
        {tooltip && (
          <span className="group relative inline-flex">
            <Info className="h-4 w-4 text-zinc-500" />
            <span className="pointer-events-none absolute right-0 top-6 z-20 hidden w-64 rounded-[6px] border border-[#2b2b2f] bg-[#111114] p-3 text-xs leading-5 text-zinc-300 shadow-xl group-hover:block">
              {tooltip}
            </span>
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p
          className={cn(
            "text-3xl font-bold leading-none tracking-normal text-zinc-100",
            emphasis === "positive" && "text-[#00c2a8]",
            emphasis === "negative" && "text-[#ff4d64]"
          )}
        >
          {valueKind === "money" ? formatMoney(value, currency) : formatPercent(value)}
        </p>
        {change !== undefined && (
          <p className={cn("text-base font-medium", trendClass(change))} title={changeLabel}>
            {changeLabel ? `${changeLabel} ` : ""}
            {formatPercent(change)}
          </p>
        )}
      </div>
      {detail && <p className="mt-3 text-sm text-zinc-500">{detail}</p>}
      {secondaryDetail && <p className="mt-1 text-xs text-zinc-600">{secondaryDetail}</p>}
      {calculationLines && calculationLines.length > 0 && (
        <details className="mt-3 text-xs text-zinc-500">
          <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200">Calculation</summary>
          <ul className="mt-2 space-y-1">
            {calculationLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
