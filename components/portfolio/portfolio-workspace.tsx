"use client";

import { useState } from "react";

import { AnalysisPanels } from "@/components/portfolio/analysis-panels";
import { AssetAllocationChart } from "@/components/portfolio/asset-allocation-chart";
import { CurrencyToggle } from "@/components/portfolio/currency-toggle";
import { DailyMovers } from "@/components/portfolio/daily-movers";
import { DigestPanel } from "@/components/portfolio/digest-panel";
import { ExportActions } from "@/components/portfolio/export-actions";
import { ManualPositionsCard } from "@/components/portfolio/manual-positions-card";
import { NewsFeed, type NewsFeedHolding } from "@/components/portfolio/news-feed";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { PortfolioTabs, type PortfolioTab } from "@/components/portfolio/portfolio-tabs";
import { PortfolioValueChart } from "@/components/portfolio/portfolio-value-chart";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { QuickAddTransactionForm } from "@/components/portfolio/quick-add-transaction-form";
import { TransactionsTable } from "@/components/portfolio/transactions-table";
import type { DashboardData } from "@/lib/db/portfolio-repository";
import type { Currency } from "@/lib/types";

export function PortfolioWorkspace({ data }: { data: DashboardData }) {
  const [currency, setCurrency] = useState<Currency>(() => readStoredDefaultCurrency() ?? "USD");
  const [activeTab, setActiveTab] = useState<PortfolioTab>("Overview");
  const newsHoldings = buildNewsHoldings(data);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ExportActions portfolioId={data.portfolio.id} />
        <CurrencyToggle currency={currency} onCurrencyChange={setCurrency} />
      </div>

      <PortfolioHeader
        key={data.portfolio.id}
        portfolio={data.portfolio}
        portfolios={data.portfolios}
        currency={currency}
      />

      <PortfolioTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "Overview" && (
        <div className="space-y-20">
          <PortfolioValueChart snapshots={data.snapshots} currency={currency} />
          <DailyMovers />
          <AssetAllocationChart
            allocations={data.allocations}
            currency={currency}
            assets={data.assets}
            positions={data.positions}
            manualPositions={data.manualPositions}
          />
          <NewsFeed portfolioId={data.portfolio.id} holdings={newsHoldings} />
          <DigestPanel portfolioId={data.portfolio.id} />
        </div>
      )}

      {activeTab === "Holdings" && (
        <div className="space-y-10">
          <PositionsTable positions={data.positions} assets={data.assets} currency={currency} />
          <ManualPositionsCard
            positions={data.manualPositions}
            currency={currency}
            portfolioId={data.portfolio.id}
          />
        </div>
      )}

      {activeTab === "Transactions" && (
        <div className="space-y-10">
          <QuickAddTransactionForm portfolioId={data.portfolio.id} />
          <TransactionsTable
            transactions={data.transactions}
            assets={data.assets}
            currency={currency}
          />
        </div>
      )}

      {activeTab === "Analysis" && (
        <AnalysisPanels
          currency={currency}
          snapshots={data.snapshots}
          allocations={data.allocations}
          assets={data.assets}
          positions={data.positions}
          manualPositions={data.manualPositions}
        />
      )}
    </div>
  );
}

function buildNewsHoldings(data: DashboardData): NewsFeedHolding[] {
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]));
  return [
    ...data.positions.flatMap((position) => {
      const asset = assetById.get(position.assetId);
      return asset
        ? [{ symbol: asset.symbol, label: asset.name } satisfies NewsFeedHolding]
        : [];
    }),
    ...data.manualPositions.map((position) => ({
      symbol: position.label,
      label: position.label,
      isManual: true
    }))
  ];
}

function readStoredDefaultCurrency(): Currency | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("foliocore.preferences");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { defaultCurrency?: string };
    return parsed.defaultCurrency === "EUR" ? "EUR" : "USD";
  } catch {
    return null;
  }
}
