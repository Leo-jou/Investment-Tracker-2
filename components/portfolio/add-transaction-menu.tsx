import Link from "next/link";
import {
  Banknote,
  ChevronDown,
  CircleDollarSign,
  Landmark,
  Plus,
  ReceiptText,
  Upload
} from "lucide-react";

import { Button } from "@/components/ui/button";

const menuGroups = [
  {
    label: "Holdings",
    items: [
      { label: "Add trade...", icon: Plus, href: "/transactions#quick-add" },
      { label: "Upload transactions...", icon: Upload, href: "/transactions#quick-add" },
      { label: "Add dividends...", icon: ReceiptText, href: "/transactions#quick-add" }
    ]
  },
  {
    label: "Cash",
    items: [
      { label: "Deposit...", icon: Banknote, href: "/transactions#quick-add" },
      { label: "Withdrawal...", icon: CircleDollarSign, href: "/transactions#quick-add" },
      { label: "Taxes and fees...", icon: Landmark, href: "/transactions#quick-add" }
    ]
  }
];

export function AddTransactionMenu() {
  return (
    <div className="relative flex overflow-visible">
      <div className="flex overflow-hidden rounded-[8px] bg-white text-black">
        <Button asChild className="rounded-none px-6">
          <Link href="/transactions#quick-add">Add transaction</Link>
        </Button>
        <details className="group">
          <summary className="list-none">
          <Button className="rounded-none border-l border-zinc-300 px-4" size="icon">
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </Button>
          </summary>
          <div className="absolute right-0 top-12 z-30 w-[300px] rounded-[8px] bg-[#1f1f22] p-2 shadow-2xl">
            {menuGroups.map((group, groupIndex) => (
              <div
                key={group.label}
                className={groupIndex > 0 ? "border-t border-[#3b3b40] pt-2" : ""}
              >
                <p className="px-2 py-2 text-xs uppercase tracking-[0.08em] text-zinc-500">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex h-10 w-full items-center gap-3 rounded-[6px] px-2 text-left text-sm text-zinc-200 hover:bg-[#303035]"
                  >
                    <item.icon className="h-5 w-5 text-zinc-300" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
