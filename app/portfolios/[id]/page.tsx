import { PortfolioWorkspace } from "@/components/portfolio/portfolio-workspace";
import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";

export default async function PortfolioPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = await requireSessionEmail();
  const data = await getDashboardDataForEmail(email, id);
  return <PortfolioWorkspace data={data} />;
}
