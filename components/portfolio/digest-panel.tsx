"use client";

import { useState } from "react";
import { ExternalLink, Mail, RefreshCw } from "lucide-react";

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
      setStatus(payload.result?.sent ? "Digest email sent" : userSafeEmailStatus(payload.result?.reason));
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
            Branded portfolio report with metrics, holdings, recent activity, and matched headlines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="subtle" size="sm">
            <a
              href={`/api/digest?format=html&portfolioId=${encodeURIComponent(portfolioId)}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open report
            </a>
          </Button>
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
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-zinc-300">Highlights</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {digest.highlightCards.map((highlight) => (
                <article
                  key={highlight.label}
                  className="rounded-[7px] border border-[#202024] bg-[#070707] p-3"
                >
                  <p className="text-xs uppercase tracking-wide text-zinc-600">{highlight.label}</p>
                  <p
                    className={cn(
                      "mt-2 text-lg font-bold text-zinc-100",
                      highlight.tone === "positive" && "text-[#00c2a8]",
                      highlight.tone === "negative" && "text-[#ff4d64]",
                      highlight.tone === "warning" && "text-[#f6b342]"
                    )}
                  >
                    {highlight.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{highlight.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-zinc-300">Report sections</p>
              <div className="mt-3 grid gap-2 text-sm text-zinc-500 sm:grid-cols-2">
                {["Metrics", "Allocation", "Top positions", "Matched headlines", "Recent transactions"].map(
                  (section) => (
                    <span key={section} className="rounded-[6px] border border-[#202024] px-3 py-2">
                      {section}
                    </span>
                  )
                )}
              </div>
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
        </div>
      )}
    </section>
  );
}

function userSafeEmailStatus(reason?: string) {
  if (!reason) return "Digest email not sent";
  if (/provider|resend|configured|api|env/i.test(reason)) return "Email delivery is not configured";
  return reason;
}
