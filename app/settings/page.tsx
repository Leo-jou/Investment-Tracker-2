import { CheckCircle2, CircleAlert } from "lucide-react";

import { PageBackLink } from "@/components/layout/page-back-link";
import { Badge } from "@/components/ui/badge";
import type { ApiStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const preferenceCards = [
  {
    title: "Default currency",
    value: "USD",
    detail: "Portfolio screens can still be toggled to EUR."
  },
  {
    title: "Daily snapshots",
    value: "On",
    detail: "One portfolio snapshot per day after refresh."
  },
  {
    title: "Backup email",
    value: "Not set",
    detail: "Placeholder for account recovery and exports."
  },
  {
    title: "Daily export",
    value: "Off",
    detail: "Placeholder for email reports once notifications exist."
  }
];

export default function SettingsPage() {
  const apiStatuses = buildApiStatuses();

  return (
    <div className="space-y-10">
      <div>
        <PageBackLink />
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          User preferences for portfolio display, snapshots, backups, and exports.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {preferenceCards.map((item) => (
          <div key={item.title} className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
            <p className="text-sm text-zinc-500">{item.title}</p>
            <p className="mt-3 text-2xl font-bold text-zinc-100">{item.value}</p>
            <p className="mt-2 text-sm text-zinc-500">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
        <h2 className="text-2xl font-bold">Operational status</h2>
        <div className="mt-6 divide-y divide-[#202024]">
          {apiStatuses.map((status) => (
            <div key={status.provider} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
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
                {status.configured ? "Configured" : "Mock fallback"}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildApiStatuses(): ApiStatus[] {
  return [
    {
      provider: "Market prices",
      configured: Boolean(process.env.COINGECKO_DEMO_API_KEY) && Boolean(process.env.TWELVE_DATA_API_KEY),
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
    }
  ];
}
