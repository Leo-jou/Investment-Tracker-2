"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, MoreHorizontal, Plus, Save, X } from "lucide-react";

import { AddTransactionMenu } from "@/components/portfolio/add-transaction-menu";
import { GlobalMetricsBar } from "@/components/portfolio/global-metrics-bar";
import { PriceRefreshButton } from "@/components/portfolio/price-refresh-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL_PORTFOLIOS_ID } from "@/lib/portfolio/aggregate";
import type { TimeframeStats } from "@/lib/portfolio/timeframes";
import type { Currency, Portfolio, PortfolioOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type PortfolioHeaderProps = {
  portfolio: Portfolio;
  portfolios: PortfolioOption[];
  currency: Currency;
  timeframeStats: TimeframeStats;
  disabledReason?: string;
  writeDisabledReason?: string;
  isAggregate?: boolean;
};

export function PortfolioHeader({
  portfolio,
  portfolios,
  currency,
  timeframeStats,
  disabledReason,
  writeDisabledReason,
  isAggregate = false
}: PortfolioHeaderProps) {
  const router = useRouter();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [description, setDescription] = useState(portfolio.description);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreatePortfolio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabledReason) {
      setError(disabledReason);
      return;
    }
    setIsSavingPortfolio(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/portfolios", {
      method: "POST",
      body: formData
    });
    const payload = (await response.json().catch(() => ({}))) as {
      portfolio?: PortfolioOption;
      error?: string;
    };

    setIsSavingPortfolio(false);

    if (!response.ok || !payload.portfolio) {
      setError(payload.error ?? "Could not create portfolio.");
      return;
    }

    setIsAddingPortfolio(false);
    setNewPortfolioName("");
    router.push(`/portfolios/${payload.portfolio.id}`);
    router.refresh();
  }

  async function handleDescriptionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isAggregate) {
      setError("Choose a specific portfolio before editing its description.");
      return;
    }
    if (disabledReason) {
      setError(disabledReason);
      return;
    }
    setIsSavingPortfolio(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/portfolios/${portfolio.id}`, {
      method: "PATCH",
      body: formData
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    setIsSavingPortfolio(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not update description.");
      return;
    }

    setIsEditingDescription(false);
    router.refresh();
  }

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 text-4xl font-bold text-zinc-200"
                onClick={() => setIsSwitcherOpen((value) => !value)}
              >
                {portfolio.name}
                <ChevronDown
                  className={cn("h-7 w-7 transition-transform", isSwitcherOpen && "rotate-180")}
                />
              </button>
              {isSwitcherOpen && (
                <div className="absolute left-0 top-full z-30 mt-3 w-[280px] rounded-[8px] border border-[#2b2b2f] bg-[#090909] p-2 shadow-2xl">
                  {portfolios.map((option) => (
                    <Link
                      key={option.id}
                      href={option.id === ALL_PORTFOLIOS_ID ? "/dashboard" : `/portfolios/${option.id}`}
                      className={cn(
                        "block rounded-[6px] px-3 py-2 text-sm text-zinc-300 hover:bg-[#17171a]",
                        option.id === portfolio.id && "bg-[#1a1a1d] text-white"
                      )}
                      onClick={() => setIsSwitcherOpen(false)}
                    >
                      <span className="block font-semibold">{option.name}</span>
                      {option.description && (
                        <span className="mt-1 block truncate text-xs text-zinc-500">
                          {option.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="subtle"
              size="sm"
              type="button"
              disabled={Boolean(disabledReason)}
              title={disabledReason ?? "Add portfolio"}
              onClick={() => setIsAddingPortfolio((value) => !value)}
            >
              <Plus className="h-4 w-4" />
              Add portfolio
            </Button>
          </div>
          {isAddingPortfolio && (
            <form onSubmit={handleCreatePortfolio} className="mt-4 flex max-w-lg gap-2">
              <Input
                name="name"
                value={newPortfolioName}
                onChange={(event) => setNewPortfolioName(event.target.value)}
                placeholder="Portfolio name"
                disabled={Boolean(disabledReason)}
                required
              />
              <Button disabled={Boolean(disabledReason) || isSavingPortfolio}>
                {isSavingPortfolio ? <MoreHorizontal className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                Create
              </Button>
            </form>
          )}
          {isAggregate ? (
            <p className="mt-4 max-w-2xl text-lg text-zinc-500">{portfolio.description}</p>
          ) : isEditingDescription ? (
            <form onSubmit={handleDescriptionSubmit} className="mt-4 flex max-w-2xl gap-2">
              <Input
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Portfolio description"
                disabled={Boolean(disabledReason)}
              />
              <Button
                size="compactIcon"
                disabled={Boolean(disabledReason) || isSavingPortfolio}
                title={disabledReason ?? "Save description"}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="compactIcon"
                variant="ghost"
                title="Cancel"
                onClick={() => {
                  setDescription(portfolio.description);
                  setIsEditingDescription(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <button
              type="button"
              className="mt-4 text-left text-lg text-[#2f7df6] hover:text-[#5c9bff] disabled:text-zinc-500"
              disabled={Boolean(disabledReason)}
              title={disabledReason ?? "Edit description"}
              onClick={() => {
                setDescription(portfolio.description);
                setIsEditingDescription(true);
              }}
            >
              {portfolio.description || "Add description"}
            </button>
          )}
          {error && <p className="mt-3 text-sm text-[#ff4d64]">{error}</p>}
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start">
          <PriceRefreshButton disabledReason={disabledReason} />
          <AddTransactionMenu disabledReason={writeDisabledReason ?? disabledReason} />
        </div>
      </div>

      <GlobalMetricsBar portfolio={portfolio} currency={currency} timeframeStats={timeframeStats} />
    </section>
  );
}
