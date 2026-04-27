"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type RefreshResponse = {
  mode: "provider" | "mock" | "partial";
  message: string;
  errors?: { scope: string; message: string }[];
};

export function PriceRefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  async function refreshPrices() {
    setIsRefreshing(true);
    setMessage(null);
    setHasError(false);

    try {
      const response = await fetch("/api/prices/refresh", {
        method: "POST",
        headers: {
          "x-daily-snapshots-enabled": String(readDailySnapshotsEnabled())
        }
      });
      const payload = (await response.json()) as Partial<RefreshResponse>;

      if (!response.ok) {
        throw new Error(payload.message ?? "Refresh failed.");
      }

      setMessage(payload.message ?? "Prices refreshed.");
      setHasError(payload.mode === "partial" || Boolean(payload.errors?.length));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Refresh failed.");
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="flex max-w-full flex-col items-end gap-2">
      <Button
        type="button"
        variant="subtle"
        size="sm"
        onClick={refreshPrices}
        disabled={isRefreshing}
        title="Refresh saved market prices and FX rates"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Refreshing" : "Refresh prices"}
      </Button>
      {message && (
        <p
          className={`max-w-[360px] text-right text-xs ${
            hasError ? "text-[#ff4d6d]" : "text-zinc-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function readDailySnapshotsEnabled() {
  try {
    const raw = window.localStorage.getItem("foliocore.preferences");
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { dailySnapshotsEnabled?: boolean };
    return parsed.dailySnapshotsEnabled !== false;
  } catch {
    return true;
  }
}
