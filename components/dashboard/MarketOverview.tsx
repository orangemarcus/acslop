import { mockMarketData } from "@/lib/mockData";

export default function MarketOverview() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Market Overview</h2>
        <span className="text-xs text-muted-foreground">
          Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockMarketData.map((market) => (
          <div
            key={market.ticker}
            className="bg-secondary border border-border rounded-lg p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">{market.ticker}</div>
                <div className="font-semibold text-lg">
                  {market.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`text-right ${market.change >= 0 ? 'text-success' : 'text-danger'}`}>
                <div className="text-sm font-medium">
                  {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}
                </div>
                <div className="text-xs">
                  {market.changePercent >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {market.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
