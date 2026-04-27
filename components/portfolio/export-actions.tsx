import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportActionsProps = {
  portfolioId: string;
};

export function ExportActions({ portfolioId }: ExportActionsProps) {
  const csvHref = `/api/export?format=csv&portfolioId=${encodeURIComponent(portfolioId)}`;
  const jsonHref = `/api/export?format=json&portfolioId=${encodeURIComponent(portfolioId)}`;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild variant="subtle" size="sm">
        <a href={csvHref}>
          <Download className="h-4 w-4" />
          CSV
        </a>
      </Button>
      <Button asChild variant="subtle" size="sm">
        <a href={jsonHref}>
          <Download className="h-4 w-4" />
          JSON
        </a>
      </Button>
    </div>
  );
}
