import { PageBackLink } from "@/components/layout/page-back-link";
import { AssetSearchInput } from "@/components/portfolio/asset-search-input";
import { PersistenceModeBanner } from "@/components/portfolio/persistence-mode-banner";
import { Badge } from "@/components/ui/badge";
import { requireSessionEmail } from "@/lib/auth/session";
import { demoModeMutationMessage, isDbConfigured } from "@/lib/db/client";
import { listAssetsForEmail } from "@/lib/db/portfolio-repository";
import { formatMoney } from "@/lib/format";
import {
  formatPriceTimestamp,
  getAssetPriceStatus,
  priceProviderLabel,
  type PriceStatusTone
} from "@/lib/portfolio/price-status";

export default async function AssetsPage() {
  const email = await requireSessionEmail();
  const assets = await listAssetsForEmail(email);
  const isDemoMode = !isDbConfigured();

  return (
    <div className="space-y-10">
      <PersistenceModeBanner
        mode={isDemoMode ? "demo" : "persistent"}
        message={isDemoMode ? demoModeMutationMessage : undefined}
      />
      <div>
        <PageBackLink />
        <h1 className="text-4xl font-bold">Assets</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          Search providers dynamically, then add selected instruments to the local database.
        </p>
      </div>

      <section className="grid gap-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
          <h2 className="mb-4 text-2xl font-bold">Add asset</h2>
          <AssetSearchInput disabled={isDemoMode} />
          {isDemoMode && (
            <p className="mt-3 text-sm text-[#f6b342]">
              Provider search is disabled in read-only demo mode.
            </p>
          )}
        </div>

        <div className="overflow-x-auto tv-scrollbar">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-[#2b2b2f] text-left text-zinc-500">
                <th className="py-3 font-medium">Symbol</th>
                <th className="py-3 font-medium">Name</th>
                <th className="py-3 font-medium">Type</th>
                <th className="py-3 font-medium">Provider</th>
                <th className="py-3 text-right font-medium">Price</th>
                <th className="py-3 text-right font-medium">Price status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const priceStatus = getAssetPriceStatus(asset);
                return (
                  <tr key={asset.id} className="border-b border-[#202024]">
                    <td className="py-4">
                      <Badge>{asset.symbol}</Badge>
                    </td>
                    <td className="py-4 text-zinc-200">{asset.name}</td>
                    <td className="py-4 text-zinc-500">{asset.type}</td>
                    <td className="py-4 text-zinc-500">
                      <span className="block text-zinc-300">{priceProviderLabel(asset.provider)}</span>
                      <span className="block text-xs text-zinc-600">{asset.exchange ?? asset.externalId}</span>
                    </td>
                    <td className="py-4 text-right text-zinc-200">
                      {asset.priceEur > 0 ? formatMoney(asset.priceEur, "EUR") : "Unavailable"}
                      <span className="block text-xs text-zinc-600">
                        {formatPriceTimestamp(asset.priceCapturedAt)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className={priceStatusClass(priceStatus.tone)}>{priceStatus.label}</span>
                      <span className="mt-1 block text-xs text-zinc-600">{priceStatus.detail}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function priceStatusClass(tone: PriceStatusTone) {
  const base = "inline-flex rounded-[5px] px-2 py-1 text-xs font-semibold";
  if (tone === "ok") return `${base} bg-[#05251f] text-[#00c2a8]`;
  if (tone === "danger") return `${base} bg-[#2a0710] text-[#ff4d64]`;
  if (tone === "warning") return `${base} bg-[#2f2107] text-[#f6b342]`;
  return `${base} bg-[#202024] text-zinc-300`;
}
