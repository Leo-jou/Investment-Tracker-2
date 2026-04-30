"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
      { label: "Add trade...", icon: Plus, href: "/transactions?type=BUY#quick-add" },
      { label: "Upload transactions...", icon: Upload, href: "/transactions#import-transactions" },
      { label: "Add dividends...", icon: ReceiptText, href: "/transactions#quick-add", disabled: true }
    ]
  },
  {
    label: "Cash",
    items: [
      { label: "Deposit...", icon: Banknote, href: "/transactions?type=DEPOSIT#quick-add" },
      { label: "Withdrawal...", icon: CircleDollarSign, href: "/transactions?type=WITHDRAW#quick-add" },
      { label: "Taxes and fees...", icon: Landmark, href: "/transactions#quick-add", disabled: true }
    ]
  }
];

export function AddTransactionMenu() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex overflow-visible">
      <div className="flex rounded-[8px] bg-white text-black">
        <Button asChild className="rounded-none px-6">
          <Link href="/transactions?type=BUY#quick-add">Add transaction</Link>
        </Button>
        <Button
          type="button"
          className="rounded-none border-l border-zinc-300 px-4"
          size="icon"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => setIsOpen((value) => !value)}
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-12 z-30 w-[300px] rounded-[8px] bg-[#1f1f22] p-2 shadow-2xl">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? "border-t border-[#3b3b40] pt-2" : ""}>
              <p className="px-2 py-2 text-xs uppercase tracking-[0.08em] text-zinc-500">
                {group.label}
              </p>
              {group.items.map((item) => {
                const content = (
                  <>
                    <item.icon className="h-5 w-5 text-zinc-300" strokeWidth={1.5} />
                    {item.label}
                    {item.disabled && <span className="ml-auto text-xs text-zinc-500">Soon</span>}
                  </>
                );

                if (item.disabled) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled
                      className="flex h-10 w-full items-center gap-3 rounded-[6px] px-2 text-left text-sm text-zinc-500"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex h-10 w-full items-center gap-3 rounded-[6px] px-2 text-left text-sm text-zinc-200 hover:bg-[#303035]"
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
