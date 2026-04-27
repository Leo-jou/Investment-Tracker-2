import Link from "next/link";
import { Bot, Settings } from "lucide-react";

export function TopBar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center gap-4 bg-black px-4 md:px-8 xl:px-11">
      <Link href="/dashboard" className="flex min-w-fit items-center gap-3">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#2b2b2f] bg-[#090909]">
          <span className="absolute left-[10px] top-[9px] h-[22px] w-[5px] rounded-full bg-[#3b82f6]" />
          <span className="absolute left-[18px] top-[14px] h-[17px] w-[5px] rounded-full bg-[#00c2a8]" />
          <span className="absolute left-[26px] top-[6px] h-[25px] w-[5px] rounded-full bg-zinc-100" />
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-xl font-bold text-zinc-100">FolioCore</span>
          <span className="block text-xs font-medium text-zinc-500">Portfolio tracker</span>
        </span>
      </Link>

      <Link
        href="/settings"
        className="ml-auto hidden h-10 items-center gap-2 rounded-[6px] border border-[#2b2b2f] px-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-[#111113] sm:flex"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>

      <button
        type="button"
        className="flex h-10 items-center gap-2 rounded-[6px] bg-[#1b84ff] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#2f8fff]"
        title="AI portfolio assistant placeholder"
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7657ad] text-base font-semibold">
        L
      </div>
    </header>
  );
}
