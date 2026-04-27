import { cn } from "@/lib/utils";

const tabs = ["Overview", "Holdings", "Transactions", "Analysis"] as const;

export type PortfolioTab = (typeof tabs)[number];

export function PortfolioTabs({
  activeTab,
  onChange
}: {
  activeTab: PortfolioTab;
  onChange: (tab: PortfolioTab) => void;
}) {
  return (
    <div className="border-b-[5px] border-[#4a4a4d]">
      <div className="flex gap-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={cn(
              "relative pb-3 text-lg font-semibold text-zinc-300 transition-colors hover:text-white",
              activeTab === tab && "text-white"
            )}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-[-5px] left-0 h-[5px] w-full rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
