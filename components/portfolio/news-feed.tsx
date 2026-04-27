"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PortfolioNewsItem } from "@/lib/types";

type NewsFeedProps = {
  portfolioId: string;
};

export function NewsFeed({ portfolioId }: NewsFeedProps) {
  const [items, setItems] = useState<PortfolioNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <h2 className="text-3xl font-bold">News</h2>
        <p className="text-sm text-zinc-500">
          {isLoading ? "Loading portfolio headlines" : `${items.length} portfolio headlines`}
        </p>
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

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
