"use client";

import { useState } from "react";

import { AnalysisPanels } from "@/components/portfolio/analysis-panels";
import { AssetAllocationChart } from "@/components/portfolio/asset-allocation-chart";
import { CurrencyToggle } from "@/components/portfolio/currency-toggle";
import { DailyMovers } from "@/components/portfolio/daily-movers";
import { ManualPositionsCard } from "@/components/portfolio/manual-positions-card";
import { NewsFeed } from "@/components/portfolio/news-feed";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { PortfolioTabs, type PortfolioTab } from "@/components/portfolio/portfolio-tabs";
import { PortfolioValueChart } from "@/components/portfolio/portfolio-value-chart";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { QuickAddTransactionForm } from "@/components/portfolio/quick-add-transaction-form";
import { TransactionsTable } from "@/components/portfolio/transactions-table";
import type { DashboardData } from "@/lib/db/portfolio-repository";
import type { Currency } from "@/lib/types";

export function PortfolioWorkspace({ data }: { data: DashboardData }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [activeTab, setActiveTab] = useState<PortfolioTab>("Overview");

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <CurrencyToggle currency={currency} onCurrencyChange={setCurrency} />
      </div>

      <PortfolioHeader portfolio={data.portfolio} currency={currency} />

      <PortfolioTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "Overview" && (
        <div className="space-y-20">
          <PortfolioValueChart snapshots={data.snapshots} currency={currency} />
          <DailyMovers />
          <AssetAllocationChart allocations={data.allocations} currency={currency} />
          <NewsFeed />
        </div>
      )}

      {activeTab === "Holdings" && (
        <div className="space-y-10">
          <PositionsTable positions={data.positions} assets={data.assets} currency={currency} />
          <ManualPositionsCard positions={data.manualPositions} currency={currency} />
        </div>
      )}

      {activeTab === "Transactions" && (
        <div className="space-y-10">
          <QuickAddTransactionForm />
          <TransactionsTable
            transactions={data.transactions}
            assets={data.assets}
            currency={currency}
          />
        </div>
      )}

      {activeTab === "Analysis" && <AnalysisPanels currency={currency} />}
    </div>
  );
}
