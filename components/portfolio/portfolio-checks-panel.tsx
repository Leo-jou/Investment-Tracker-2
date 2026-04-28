"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PortfolioCheck } from "@/lib/portfolio/checks";
import { cn } from "@/lib/utils";

type PortfolioChecksPanelProps = {
  checks: PortfolioCheck[];
};

const reviewedChecksStorageKey = "foliocore.reviewedPortfolioChecks.v1";

export function PortfolioChecksPanel({ checks }: PortfolioChecksPanelProps) {
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(readReviewedKeys);
  const [showReviewed, setShowReviewed] = useState(false);

  if (checks.length === 0) return null;

  const visibleChecks = checks.filter((check) => showReviewed || !reviewedKeys.has(checkKey(check)));
  const reviewedCount = checks.length - visibleChecks.length;
  const hasReviewed = reviewedCount > 0;

  const warningCount = visibleChecks.filter((check) => check.severity === "warning").length;

  return (
    <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {warningCount > 0 ? (
            <AlertTriangle className="h-5 w-5 text-[#f6b342]" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[#00c2a8]" />
          )}
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Portfolio checks</h2>
            <p className="text-sm text-zinc-500">
              {visibleChecks.length === 0
                ? `${reviewedCount} current check${reviewedCount === 1 ? "" : "s"} reviewed`
                : warningCount > 0
                ? `${warningCount} item${warningCount === 1 ? "" : "s"} need attention`
                : "No critical portfolio issues detected"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasReviewed && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReviewed((value) => !value)}
            >
              {showReviewed ? "Hide reviewed" : `Show reviewed (${reviewedCount})`}
            </Button>
          )}
          {hasReviewed && (
            <Button type="button" variant="ghost" size="sm" onClick={resetReviewed}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
      {visibleChecks.length === 0 ? (
        <p className="mt-4 rounded-[7px] border border-[#202024] bg-[#070707] p-3 text-sm text-zinc-500">
          All current checks are marked reviewed. They will reappear if the underlying issue changes.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleChecks.map((check) => {
            const isReviewed = reviewedKeys.has(checkKey(check));
            return (
              <article
                key={check.id}
                className={cn(
                  "rounded-[7px] border p-3",
                  check.severity === "warning"
                    ? "border-[#4a3820] bg-[#120d05]"
                    : "border-[#202024] bg-[#070707]"
                  )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info
                      className={cn(
                        "h-4 w-4",
                        check.severity === "warning" ? "text-[#f6b342]" : "text-[#3b82f6]"
                      )}
                    />
                    <p className="text-sm font-semibold text-zinc-100">{check.title}</p>
                  </div>
                  {isReviewed && (
                    <span className="rounded-[5px] bg-[#202024] px-2 py-1 text-[10px] font-semibold uppercase text-zinc-500">
                      Reviewed
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{check.detail}</p>
                {!isReviewed && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 px-2"
                    onClick={() => markReviewed(check)}
                  >
                    Mark reviewed
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  function markReviewed(check: PortfolioCheck) {
    const next = new Set(reviewedKeys);
    next.add(checkKey(check));
    setReviewedKeys(next);
    writeReviewed(next);
  }

  function resetReviewed() {
    setReviewedKeys(new Set());
    setShowReviewed(false);
    writeReviewed(new Set());
  }

  function writeReviewed(next: Set<string>) {
    try {
      window.localStorage.setItem(reviewedChecksStorageKey, JSON.stringify([...next]));
    } catch {
      // Non-critical preference; ignore private browsing/storage failures.
    }
  }
}

function readReviewedKeys() {
  try {
    if (typeof window === "undefined") return new Set<string>();
    const raw = window.localStorage.getItem(reviewedChecksStorageKey);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter(isString)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function checkKey(check: PortfolioCheck) {
  return `${check.id}:${check.detail}`;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
