import { Badge } from "@/components/ui/badge";

const news = [
  {
    time: "15 minutes ago",
    instrument: "BTC",
    headline: "Bitcoin liquidity improves as ETF flows recover",
    provider: "Reuters"
  },
  {
    time: "28 minutes ago",
    instrument: "MSFT",
    headline: "Mega-cap software names lead modest US equity gains",
    provider: "MarketWatch"
  },
  {
    time: "42 minutes ago",
    instrument: "ETH",
    headline: "Ethereum staking demand steadies after volatile week",
    provider: "The Block"
  },
  {
    time: "1 hour ago",
    instrument: "XAU",
    headline: "Gold holds near highs as traders watch central bank guidance",
    provider: "Reuters"
  }
];

export function NewsFeed() {
  return (
    <section>
      <h2 className="text-3xl font-bold">News</h2>
      <div className="mt-8 overflow-x-auto tv-scrollbar">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2b2b2f] text-left text-zinc-500">
              <th className="py-3 font-medium">Time</th>
              <th className="py-3 font-medium">Instrument</th>
              <th className="py-3 font-medium">Headline</th>
              <th className="py-3 text-right font-medium">Provider</th>
            </tr>
          </thead>
          <tbody>
            {news.map((item) => (
              <tr key={item.headline} className="border-b border-[#202024]">
                <td className="py-4 text-zinc-500">{item.time}</td>
                <td className="py-4">
                  <Badge>{item.instrument}</Badge>
                </td>
                <td className="py-4 text-base text-zinc-200">{item.headline}</td>
                <td className="py-4 text-right text-zinc-500">{item.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
