"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { mockAssetSearchResults } from "@/lib/mock-data";
import type { AssetSearchResult } from "@/lib/types";

type AssetSearchInputProps = {
  inputName?: string;
  disabled?: boolean;
  onQueryChange?: (query: string) => void;
  onSelect?: (asset: AssetSearchResult) => void;
};

export function AssetSearchInput({
  inputName,
  disabled = false,
  onQueryChange,
  onSelect
}: AssetSearchInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetSearchResult[]>(mockAssetSearchResults);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/assets/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { results?: AssetSearchResult[] };
        if (!controller.signal.aborted) {
          setResults(data.results?.length ? data.results : mockAssetSearchResults);
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        setResults(mockAssetSearchResults);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [disabled, query]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const visibleResults = useMemo(() => results.slice(0, 6), [results]);

  function handleQueryChange(nextQuery: string) {
    if (disabled) return;
    setQuery(nextQuery);
    setIsOpen(true);
    onQueryChange?.(nextQuery);
  }

  function handleSelect(asset: AssetSearchResult) {
    if (disabled) return;
    setQuery(asset.symbol);
    setIsOpen(false);
    onSelect?.(asset);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          name={inputName}
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          placeholder="Search by symbol or name"
          className="pl-9"
          disabled={disabled}
        />
      </label>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[280px] overflow-y-auto rounded-[8px] border border-[#2b2b2f] bg-[#090909] p-1 shadow-2xl tv-scrollbar">
          {visibleResults.map((asset) => (
            <button
              key={`${asset.provider}:${asset.externalId}`}
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                handleSelect(asset);
              }}
              onClick={() => handleSelect(asset)}
              className="flex w-full items-center justify-between gap-3 rounded-[6px] px-3 py-2 text-left hover:bg-[#17171a]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge>{asset.symbol}</Badge>
                  <span className="truncate text-sm font-medium text-zinc-200">{asset.name}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {asset.provider} {asset.exchange ? `- ${asset.exchange}` : ""}
                  {asset.priceUsd ? ` - ${formatMoney(asset.priceUsd, "USD")}` : ""}
                </p>
              </div>
              <span className="rounded-[5px] bg-[#202024] px-2 py-1 text-xs text-zinc-400">
                {asset.type}
              </span>
            </button>
          ))}
          {isLoading && <p className="px-3 py-2 text-xs text-zinc-500">Searching providers...</p>}
        </div>
      )}
    </div>
  );
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
