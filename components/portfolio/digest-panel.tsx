"use client";

import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PortfolioDigest } from "@/lib/types";
import { cn } from "@/lib/utils";

type DigestPanelProps = {
  portfolioId: string;
};

type SendResult = {
  sent: boolean;
  id?: string;
  reason?: string;
};

export function DigestPanel({ portfolioId }: DigestPanelProps) {
  const [digest, setDigest] = useState<PortfolioDigest | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasWarning, setHasWarning] = useState(false);

  async function previewDigest() {
    setIsLoading(true);
    setStatus(null);
    setHasWarning(false);

    try {
      const response = await fetch(`/api/digest?portfolioId=${encodeURIComponent(portfolioId)}`);
      const payload = (await response.json()) as { digest?: PortfolioDigest };
      setDigest(payload.digest ?? null);
      setStatus(payload.digest ? "Digest ready" : "Digest unavailable");
      setHasWarning(!payload.digest);
    } catch {
      setStatus("Digest unavailable");
      setHasWarning(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function emailDigest() {
    setIsLoading(true);
    setStatus(null);
    setHasWarning(false);

    try {
      const response = await fetch(`/api/digest?portfolioId=${encodeURIComponent(portfolioId)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      });
      const payload = (await response.json()) as {
        result?: SendResult;
        digest?: PortfolioDigest;
      };
      if (payload.digest) setDigest(payload.digest);
      setStatus(
        payload.result?.sent
          ? "Digest email sent"
          : payload.result?.reason ?? "Digest email not sent"
      );
      setHasWarning(!payload.result?.sent);
    } catch {
      setStatus("Digest email not sent");
      setHasWarning(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio digest</h2>
          <p className="mt-1 text-sm text-zinc-500">
            On-demand summary with portfolio metrics, recent activity, and headlines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="subtle" size="sm" onClick={previewDigest} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Preview
          </Button>
          <Button type="button" variant="blue" size="sm" onClick={emailDigest} disabled={isLoading}>
            <Mail className="h-4 w-4" />
            Email me
          </Button>
        </div>
      </div>

      {status && (
        <p className={cn("mt-4 text-sm", hasWarning ? "text-[#f59e0b]" : "text-[#00c2a8]")}>
          {status}
        </p>
      )}

      {digest && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-zinc-300">Highlights</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              {digest.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300">Headlines</p>
            <div className="mt-3 space-y-2">
              {digest.news.slice(0, 3).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-zinc-400 hover:text-white"
                >
                  {item.symbol ? `${item.symbol}: ` : ""}
                  {item.title}
                </a>
              ))}
              {digest.news.length === 0 && <p className="text-sm text-zinc-500">No headlines available.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
