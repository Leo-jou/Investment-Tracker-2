import { AlertTriangle } from "lucide-react";

type PersistenceModeBannerProps = {
  mode?: "persistent" | "demo";
  message?: string;
};

export function PersistenceModeBanner({ mode, message }: PersistenceModeBannerProps) {
  if (mode !== "demo") return null;

  return (
    <section className="rounded-[8px] border border-[#4a3820] bg-[#120d05] p-4 text-[#f6b342]">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Read-only demo mode</p>
          <p className="mt-1 text-sm leading-6 text-[#e0b96f]">
            {message ??
              "DATABASE_URL is not configured. Demo data is visible, but real entries cannot be saved until Neon persistence is configured."}
          </p>
        </div>
      </div>
    </section>
  );
}
