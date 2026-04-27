import { CheckCircle2, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { apiStatuses } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          MVP configuration for currency display, provider keys, mock mode, and database readiness.
        </p>
      </div>

      <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
        <h2 className="text-2xl font-bold">API status</h2>
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

      <section className="grid gap-5 lg:grid-cols-3">
        {["Single-user auth", "EUR/USD display", "Daily snapshots"].map((item) => (
          <div key={item} className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
            <h3 className="font-semibold text-zinc-200">{item}</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Structured for the MVP and ready to harden once the UI and core model settle.
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
