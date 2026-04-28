"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PortfolioNewsItem } from "@/lib/types";

type NewsFeedProps = {
  portfolioId: string;
  holdings: NewsFeedHolding[];
};

export type NewsFeedHolding = {
  symbol: string;
  label: string;
  isManual?: boolean;
};

export function NewsFeed({ portfolioId, holdings }: NewsFeedProps) {
  const [items, setItems] = useState<PortfolioNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const coverage = buildCoverage(holdings, items);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/news?portfolioId=${encodeURIComponent(portfolioId)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as { news?: PortfolioNewsItem[] };
        if (!controller.signal.aborted) setItems(payload.news ?? []);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadNews();
    return () => controller.abort();
  }, [portfolioId]);

  return (
    <section>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Matched headlines</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Source-backed headlines matched to current holdings. Coverage is strongest for crypto,
            major US tickers, ETFs, and official US company filings when configured.
          </p>
        </div>
        <p className="text-sm text-zinc-500">{isLoading ? "Loading" : `${items.length} matches`}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {coverage.map((entry) => (
          <span
            key={entry.symbol}
            className="rounded-[6px] border border-[#2b2b2f] px-3 py-1 text-xs text-zinc-400"
            title={entry.detail}
          >
            <span className="font-semibold text-zinc-200">{entry.symbol}</span>{" "}
            {entry.count > 0 ? `${entry.count} matched` : "no fresh match"}
          </span>
        ))}
      </div>
      <div className="mt-8 overflow-x-auto tv-scrollbar">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2b2b2f] text-left text-zinc-500">
              <th className="py-3 font-medium">Time</th>
              <th className="py-3 font-medium">Instrument</th>
              <th className="py-3 font-medium">Headline</th>
              <th className="py-3 text-right font-medium">Provider</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#202024]">
                <td className="py-4 text-zinc-500">{formatRelativeTime(item.publishedAt)}</td>
                <td className="py-4">
                  <Badge>{item.symbol ?? "Market"}</Badge>
                </td>
                <td className="py-4">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-base text-zinc-200 hover:text-white"
                  >
                    {item.title}
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                  <p className="mt-1 text-xs text-zinc-500">{item.summary}</p>
                  <p className="mt-1 text-xs text-zinc-600">{sourceTypeLabel(item.sourceType)}</p>
                </td>
                <td className="py-4 text-right text-zinc-500">{item.source}</td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && (
              <tr>
                <td className="py-6 text-zinc-500" colSpan={4}>
                  No portfolio headlines available right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildCoverage(holdings: NewsFeedHolding[], items: PortfolioNewsItem[]) {
  return holdings.slice(0, 12).map((holding) => {
    const count = items.filter((item) => item.matchedSymbols?.includes(holding.symbol) || item.symbol === holding.symbol)
      .length;
    return {
      symbol: holding.symbol,
      count,
      detail: holding.isManual
        ? "Manual holdings are matched only against trusted source text; private labels are not sent to broad-news providers."
        : `${holding.label} matched against configured feeds and symbol-aware sources.`
    };
  });
}

function sourceTypeLabel(sourceType: PortfolioNewsItem["sourceType"]) {
  if (sourceType === "filing") return "Official US filing";
  if (sourceType === "broad-news") return "Optional broad news search";
  return "News feed";
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
