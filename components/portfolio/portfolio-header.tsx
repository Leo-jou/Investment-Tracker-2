"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Save, X } from "lucide-react";

import { AddTransactionMenu } from "@/components/portfolio/add-transaction-menu";
import { GlobalMetricsBar } from "@/components/portfolio/global-metrics-bar";
import { PriceRefreshButton } from "@/components/portfolio/price-refresh-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Currency, Portfolio, PortfolioOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type PortfolioHeaderProps = {
  portfolio: Portfolio;
  portfolios: PortfolioOption[];
  currency: Currency;
};

export function PortfolioHeader({ portfolio, portfolios, currency }: PortfolioHeaderProps) {
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
                      href={`/portfolios/${option.id}`}
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
                required
              />
              <Button disabled={isSavingPortfolio}>
                {isSavingPortfolio ? <MoreHorizontal className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                Create
              </Button>
            </form>
          )}
          {isEditingDescription ? (
            <form onSubmit={handleDescriptionSubmit} className="mt-4 flex max-w-2xl gap-2">
              <Input
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Portfolio description"
              />
              <Button size="compactIcon" disabled={isSavingPortfolio} title="Save description">
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
              className="mt-4 text-left text-lg text-[#2f7df6] hover:text-[#5c9bff]"
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
          <PriceRefreshButton />
          <AddTransactionMenu />
        </div>
      </div>

      <details className="rounded-[8px] border border-[#3a3a3f]">
        <summary className="flex h-[70px] cursor-pointer list-none items-center gap-4 px-7 text-left text-lg font-semibold text-zinc-200 hover:bg-[#050505]">
          <ChevronRight className="h-6 w-6" />
          Portfolio tips
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
            1
          </span>
        </summary>
        <p className="border-t border-[#202024] px-7 py-4 text-sm text-zinc-500">
          Use deposits and withdrawals for cash flows; use buy and sell only for investment trades.
        </p>
      </details>

      <GlobalMetricsBar portfolio={portfolio} currency={currency} />
    </section>
  );
}
