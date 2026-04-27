import { PortfolioWorkspace } from "@/components/portfolio/portfolio-workspace";
import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";

export default async function DashboardPage() {
  const email = await requireSessionEmail();
  const data = await getDashboardDataForEmail(email);
  return <PortfolioWorkspace data={data} />;
}
