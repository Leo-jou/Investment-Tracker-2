import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageBackLink({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-200"
    >
      <ArrowLeft className="h-4 w-4" />
      Dashboard
    </Link>
  );
}
