import { PortfolioWorkspace } from "@/components/portfolio/portfolio-workspace";
import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";
import { ALL_PORTFOLIOS_ID } from "@/lib/portfolio/aggregate";

export default async function DashboardPage() {
  const email = await requireSessionEmail();
  const data = await getDashboardDataForEmail(email, ALL_PORTFOLIOS_ID);
  return <PortfolioWorkspace data={data} />;
}
