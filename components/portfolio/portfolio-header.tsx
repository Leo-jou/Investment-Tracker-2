import { ChevronDown, ChevronRight, Plus } from "lucide-react";

import { AddTransactionMenu } from "@/components/portfolio/add-transaction-menu";
import { GlobalMetricsBar } from "@/components/portfolio/global-metrics-bar";
import { PriceRefreshButton } from "@/components/portfolio/price-refresh-button";
import { Button } from "@/components/ui/button";
import type { Currency, Portfolio } from "@/lib/types";

type PortfolioHeaderProps = {
  portfolio: Portfolio;
  currency: Currency;
};

export function PortfolioHeader({ portfolio, currency }: PortfolioHeaderProps) {
  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 text-4xl font-bold text-zinc-200">
              {portfolio.name}
              <ChevronDown className="h-7 w-7" />
            </button>
            <Button variant="subtle" size="sm" title="Portfolio creation placeholder">
              <Plus className="h-4 w-4" />
              Add portfolio
            </Button>
          </div>
          <button className="mt-4 text-lg text-[#2f7df6]">Add description</button>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start">
          <PriceRefreshButton />
          <AddTransactionMenu />
        </div>
      </div>

      <button className="flex h-[70px] w-full items-center gap-4 rounded-[8px] border border-[#3a3a3f] px-7 text-left text-lg font-semibold text-zinc-200 hover:bg-[#050505]">
        <ChevronRight className="h-6 w-6" />
        Portfolio tips
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
          1
        </span>
      </button>

      <GlobalMetricsBar portfolio={portfolio} currency={currency} />
    </section>
  );
}
