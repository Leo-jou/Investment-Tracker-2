import { CheckCircle2, CircleAlert } from "lucide-react";

import { PageBackLink } from "@/components/layout/page-back-link";
import { SettingsPreferences } from "@/components/settings/settings-preferences";
import { Badge } from "@/components/ui/badge";
import { requireSessionEmail } from "@/lib/auth/session";
import { getNewsSourceRegistry, type NewsSourceRegistryEntry } from "@/lib/news/portfolio-news";
import type { ApiStatus, UserPreferences } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const email = await requireSessionEmail();
  const apiStatuses = buildApiStatuses();
  const newsSources = getNewsSourceRegistry();

  return (
    <div className="space-y-10">
      <div>
        <PageBackLink />
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          User preferences for portfolio display, snapshots, backups, and exports.
        </p>
      </div>

      <SettingsPreferences accountEmail={email} initialPreferences={defaultPreferences} />

      <NewsSourceRegistry sources={newsSources} />

      <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
        <h2 className="text-2xl font-bold">Operational status</h2>
        <div className="mt-6 divide-y divide-[#202024]">
          {apiStatuses.map((status) => (
            <div
              key={status.provider}
              className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                {status.configured ? (
                  <CheckCircle2 className="h-5 w-5 text-[#00c2a8]" />
                ) : (
                  <CircleAlert className="h-5 w-5 text-[#f59e0b]" />
                )}
                <div>
                  <p className="font-semibold text-zinc-200">{status.provider}</p>
                  <p className="mt-1 text-sm text-zinc-500">{status.purpose}</p>
                </div>
              </div>
              <Badge className={status.configured ? "bg-[#063b33] text-[#00c2a8]" : ""}>
                {status.configured ? "Configured" : (status.unconfiguredLabel ?? "Mock fallback")}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NewsSourceRegistry({ sources }: { sources: NewsSourceRegistryEntry[] }) {
  const enabledCount = sources.filter((source) => source.enabled).length;

  return (
    <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">News source registry</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            These are the deterministic sources used by matched headlines and digest previews. Broad
            search stays opt-in and restricted to trusted HTTPS domains.
          </p>
        </div>
        <p className="text-sm text-zinc-500">
          {enabledCount} / {sources.length} enabled
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {sources.map((source) => (
          <div key={source.id} className="rounded-[7px] border border-[#202024] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-100">{source.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{sourceTypeLabel(source.sourceType)}</p>
              </div>
              <Badge className={source.enabled ? "bg-[#063b33] text-[#00c2a8]" : ""}>
                {source.enabled ? source.trust : "Disabled"}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-zinc-400">Coverage: {source.coverage}</p>
            <p className="mt-2 text-sm text-zinc-500">{source.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function sourceTypeLabel(sourceType: NewsSourceRegistryEntry["sourceType"]) {
  if (sourceType === "crypto-rss") return "Crypto RSS";
  if (sourceType === "market-rss") return "Market RSS";
  if (sourceType === "filing") return "Official filings";
  return "Optional broad news";
}

const defaultPreferences: UserPreferences = {
  defaultCurrency: "USD",
  dailySnapshotsEnabled: true,
  backupEmailEnabled: false,
  dailyExportEnabled: false
};

function buildApiStatuses(): ApiStatus[] {
  return [
    {
      provider: "Market prices",
      configured:
        Boolean(process.env.COINGECKO_DEMO_API_KEY) && Boolean(process.env.TWELVE_DATA_API_KEY),
      purpose: "CoinGecko and Twelve Data provider access"
    },
    {
      provider: "Database",
      configured: Boolean(process.env.DATABASE_URL),
      purpose: "Persistent portfolios, transactions, prices, FX, and snapshots"
    },
    {
      provider: "Email gate",
      configured: Boolean(process.env.APP_ALLOWED_EMAILS),
      purpose: "Private MVP access control"
    },
    {
      provider: "Google login",
      configured: Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET),
      purpose: "OAuth sign-in for allowlisted Google accounts"
    },
    {
      provider: "Email delivery",
      configured: Boolean(process.env.RESEND_API_KEY) && Boolean(process.env.EMAIL_FROM),
      purpose: "On-demand portfolio digest email",
      unconfiguredLabel: "Not configured"
    }
  ];
}
