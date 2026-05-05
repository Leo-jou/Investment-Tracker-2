import { PageBackLink } from "@/components/layout/page-back-link";
import { AssetSearchInput } from "@/components/portfolio/asset-search-input";
import { Badge } from "@/components/ui/badge";
import { requireSessionEmail } from "@/lib/auth/session";
import { listAssetsForEmail } from "@/lib/db/portfolio-repository";
import { formatMoney } from "@/lib/format";

export default async function AssetsPage() {
  const email = await requireSessionEmail();
  const assets = await listAssetsForEmail(email);

  return (
    <div className="space-y-10">
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
          <AssetSearchInput />
        </div>

        <div className="overflow-x-auto tv-scrollbar">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-[#2b2b2f] text-left text-zinc-500">
                <th className="py-3 font-medium">Symbol</th>
                <th className="py-3 font-medium">Name</th>
                <th className="py-3 font-medium">Type</th>
                <th className="py-3 font-medium">Provider</th>
                <th className="py-3 text-right font-medium">Price</th>
                <th className="py-3 text-right font-medium">24h data</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b border-[#202024]">
                  <td className="py-4">
                    <Badge>{asset.symbol}</Badge>
                  </td>
                  <td className="py-4 text-zinc-200">{asset.name}</td>
                  <td className="py-4 text-zinc-500">{asset.type}</td>
                  <td className="py-4 text-zinc-500">{asset.provider}</td>
                  <td className="py-4 text-right text-zinc-200">
                    {formatMoney(asset.priceEur, "EUR")}
                  </td>
                  <td className="py-4 text-right text-zinc-500">
                    Not connected
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
