"use client";

import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, Save } from "lucide-react";

import { AssetSearchInput } from "@/components/portfolio/asset-search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { convertCurrency } from "@/lib/data/conversions";
import { formatMoney } from "@/lib/format";
import type { AssetSearchResult, TransactionType } from "@/lib/types";

type LastEditedTradeField = "quantity" | "grossAmount";

const transactionTypes: Array<{ label: string; value: TransactionType }> = [
  { label: "Buy", value: "BUY" },
  { label: "Sell", value: "SELL" },
  { label: "Deposit", value: "DEPOSIT" },
  { label: "Withdraw", value: "WITHDRAW" },
  { label: "Manual", value: "MANUAL_VALUE" }
];

export function QuickAddTransactionForm({
  portfolioId,
  initialType
}: {
  portfolioId?: string;
  initialType?: string;
}) {
  const [type, setType] = useState<TransactionType>(normalizeTransactionType(initialType));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetSearchResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [lastEdited, setLastEdited] = useState<LastEditedTradeField | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null);
  const quoteRequestIdRef = useRef(0);

  const isPricedTrade = type === "BUY" || type === "SELL";
  const isCashFlow = type === "DEPOSIT" || type === "WITHDRAW";
  const isManualValue = type === "MANUAL_VALUE";
  const selectedPriceUsd = useMemo(() => getAssetPriceUsd(selectedAsset), [selectedAsset]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const endpoint = isManualValue ? "/api/manual-positions" : "/api/transactions";
    formData.set("currency", String(formData.get("currency") || "USD").toUpperCase());

    if (!isManualValue) {
      formData.set("type", type);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    setIsSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save entry.");
      return;
    }

    window.location.reload();
  }

  function handleTypeChange(nextType: string) {
    setType(nextType as TransactionType);
    setError(null);
    setSelectedAsset(null);
    setQuantity("");
    setGrossAmount("");
    setLastEdited(null);
  }

  function handleAssetSelect(asset: AssetSearchResult) {
    setSelectedAsset(asset);
    setQuoteMessage(null);
    recalculateFromPrice(getAssetPriceUsd(asset));
    void refreshSelectedAssetQuote(asset);
  }

  async function refreshSelectedAssetQuote(asset: AssetSearchResult) {
    const requestId = quoteRequestIdRef.current + 1;
    quoteRequestIdRef.current = requestId;
    setIsQuoting(true);

    try {
      const response = await fetch("/api/assets/quote", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(asset)
      });
      const payload = (await response.json().catch(() => ({}))) as {
        quote?: AssetSearchResult & { quoteSource?: string; message?: string; quotedAt?: string };
        error?: string;
      };

      if (quoteRequestIdRef.current !== requestId) return;

      if (!response.ok || !payload.quote) {
        setQuoteMessage(payload.error ?? "Live quote unavailable.");
        return;
      }

      setSelectedAsset(payload.quote);
      recalculateFromPrice(getAssetPriceUsd(payload.quote));
      setQuoteMessage(
        payload.quote.quoteSource === "live"
          ? `Live quote refreshed for ${payload.quote.symbol}.`
          : payload.quote.message ?? `Using latest saved price for ${payload.quote.symbol}.`
      );
    } catch {
      if (quoteRequestIdRef.current === requestId) {
        setQuoteMessage("Live quote unavailable. Using the latest saved price if present.");
      }
    } finally {
      if (quoteRequestIdRef.current === requestId) {
        setIsQuoting(false);
      }
    }
  }

  function handleQuantityChange(nextQuantity: string) {
    setQuantity(nextQuantity);
    setLastEdited("quantity");

    if (!isPricedTrade || !selectedPriceUsd) return;
    const parsedQuantity = parseDecimalInput(nextQuantity);
    if (parsedQuantity !== null) {
      setGrossAmount(formatMoneyInput(parsedQuantity * selectedPriceUsd));
    }
  }

  function handleGrossAmountChange(nextGrossAmount: string) {
    setGrossAmount(nextGrossAmount);
    setLastEdited("grossAmount");

    if (!isPricedTrade || !selectedPriceUsd) return;
    const parsedGrossAmount = parseDecimalInput(nextGrossAmount);
    if (parsedGrossAmount !== null) {
      setQuantity(formatQuantityInput(parsedGrossAmount / selectedPriceUsd));
    }
  }

  function recalculateFromPrice(priceUsd: number | undefined) {
    if (!isPricedTrade || !priceUsd || !lastEdited) return;

    if (lastEdited === "quantity") {
      const parsedQuantity = parseDecimalInput(quantity);
      if (parsedQuantity !== null) {
        setGrossAmount(formatMoneyInput(parsedQuantity * priceUsd));
      }
      return;
    }

    const parsedGrossAmount = parseDecimalInput(grossAmount);
    if (parsedGrossAmount !== null) {
      setQuantity(formatQuantityInput(parsedGrossAmount / priceUsd));
    }
  }

  return (
    <form
      id="quick-add"
      onSubmit={handleSubmit}
      className="rounded-[8px] border border-[#2b2b2f] bg-black p-4"
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quick add transaction</h2>
          <p className="mt-1 text-sm text-zinc-500">Designed for a few-second manual entry flow.</p>
        </div>
        <SegmentedControl value={type} onChange={handleTypeChange} options={transactionTypes} />
      </div>

      {isPricedTrade && (
        <>
          {portfolioId && <input type="hidden" name="portfolioId" value={portfolioId} />}
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
            <AssetSearchInput
              inputName="assetSymbol"
              onQueryChange={(query) => {
                if (selectedAsset && query.trim().toUpperCase() !== selectedAsset.symbol) {
                  setSelectedAsset(null);
                  setQuoteMessage(null);
                }
              }}
              onSelect={handleAssetSelect}
            />
            {selectedAsset && (
              <>
                <input type="hidden" name="assetName" value={selectedAsset.name} />
                <input type="hidden" name="assetType" value={selectedAsset.type} />
                <input type="hidden" name="assetCurrency" value={selectedAsset.currency} />
                <input type="hidden" name="assetProvider" value={selectedAsset.provider} />
                <input type="hidden" name="assetExternalId" value={selectedAsset.externalId} />
                <input type="hidden" name="assetExchange" value={selectedAsset.exchange ?? ""} />
                <input type="hidden" name="assetPriceUsd" value={selectedAsset.priceUsd ?? ""} />
                <input type="hidden" name="assetPriceEur" value={selectedAsset.priceEur ?? ""} />
                <input
                  type="hidden"
                  name="assetQuotedAt"
                  value={"quotedAt" in selectedAsset ? String(selectedAsset.quotedAt ?? "") : ""}
                />
              </>
            )}
            <Input
              name="quantity"
              value={quantity}
              placeholder="Quantity"
              inputMode="decimal"
              required
              onChange={(event) => handleQuantityChange(event.target.value)}
            />
            <Input
              name="grossAmount"
              value={grossAmount}
              placeholder="Total paid/received"
              inputMode="decimal"
              required
              onChange={(event) => handleGrossAmountChange(event.target.value)}
            />
            <Input name="fees" placeholder="Fees" inputMode="decimal" />
          </div>
          {selectedAsset && (
            <p className="mt-2 text-xs text-zinc-500">
              {isQuoting
                ? `Fetching live quote for ${selectedAsset.symbol}...`
                : selectedPriceUsd
                  ? `${quoteMessage ?? "Using quote"} Price: ${formatMoney(
                      selectedPriceUsd,
                      "USD"
                    )}. Fees stay separate.`
                  : quoteMessage ??
                    `No live quote for ${selectedAsset.symbol} yet. Enter quantity and total manually.`}
            </p>
          )}
        </>
      )}

      {isCashFlow && (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.4fr_0.8fr]">
          {portfolioId && <input type="hidden" name="portfolioId" value={portfolioId} />}
          <Input
            name="grossAmount"
            value={grossAmount}
            placeholder={type === "DEPOSIT" ? "Deposit amount" : "Withdrawal amount"}
            inputMode="decimal"
            required
            onChange={(event) => setGrossAmount(event.target.value)}
          />
          <Input name="currency" placeholder="Currency" defaultValue="USD" />
          <Input name="fees" placeholder="Fees" inputMode="decimal" />
        </div>
      )}

      {isManualValue && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_0.4fr]">
          {portfolioId && <input type="hidden" name="portfolioId" value={portfolioId} />}
          <Input name="label" placeholder="Label, e.g. SpaceX fundraising participation" required />
          <Input name="value" placeholder="Value" inputMode="decimal" required />
          <Input name="currency" placeholder="Currency" defaultValue="USD" />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_0.8fr_1.4fr_auto]">
        <Input
          name={isManualValue ? "valuedOn" : "occurredOn"}
          type="date"
          defaultValue="2026-04-27"
        />
        {!isManualValue ? (
          <Input name="platform" placeholder="Platform" list="platform-options" />
        ) : (
          <Input name="source" placeholder="Source" disabled />
        )}
        <datalist id="platform-options">
          <option value="IBKR" />
          <option value="Kraken" />
          <option value="Coinbase" />
          <option value="Binance" />
          <option value="Bux Zero" />
        </datalist>
        <Input name="note" placeholder="Optional note" />
        <Button className="w-full lg:w-auto" disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Saving" : "Save"}
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-[#ff4d64]">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3 text-[#00c2a8]" />
          Buy/Sell derives total or quantity from the selected live quote when available.
        </span>
        <span className="flex items-center gap-1">
          <ArrowDownLeft className="h-3 w-3 text-[#ff4d64]" />
          Deposits and withdrawals are cash flows, not gains.
        </span>
      </div>
    </form>
  );
}

function getAssetPriceUsd(asset: AssetSearchResult | null) {
  if (!asset) return undefined;
  if (asset.priceUsd) return asset.priceUsd;
  if (asset.priceEur) return convertCurrency(asset.priceEur, "EUR", "USD");
  return undefined;
}

function parseDecimalInput(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatMoneyInput(value: number) {
  return value.toFixed(2);
}

function formatQuantityInput(value: number) {
  return value.toFixed(8).replace(/\.?0+$/, "");
}

function normalizeTransactionType(value?: string | null): TransactionType {
  const normalized = String(value ?? "").toUpperCase();
  if (
    normalized === "BUY" ||
    normalized === "SELL" ||
    normalized === "DEPOSIT" ||
    normalized === "WITHDRAW" ||
    normalized === "MANUAL_VALUE"
  ) {
    return normalized;
  }
  return "BUY";
}
