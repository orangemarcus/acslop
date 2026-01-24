import {
  calculatePortfolioTotal,
  calculatePortfolioDayChange,
  calculatePortfolioPnL,
  mockPositions,
} from "@/lib/mockData";
import Link from "next/link";

export default function PortfolioSummary() {
  const totalValue = calculatePortfolioTotal();
  const dayChange = calculatePortfolioDayChange();
  const pnl = calculatePortfolioPnL();

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <Link
          href="/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Portfolio Value */}
      <div className="mb-6">
        <div className="text-3xl font-bold mb-2">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className={`flex items-center ${dayChange.amount >= 0 ? 'text-success' : 'text-danger'}`}>
            <span className="mr-1">{dayChange.amount >= 0 ? '↑' : '↓'}</span>
            <span className="font-medium">
              ${Math.abs(dayChange.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="ml-1">
              ({dayChange.percent >= 0 ? '+' : ''}{dayChange.percent.toFixed(2)}%)
            </span>
            <span className="ml-2 text-muted-foreground">today</span>
          </div>
        </div>
        {pnl && (
          <div className={`text-sm mt-1 ${pnl.amount >= 0 ? 'text-success' : 'text-danger'}`}>
            Total P&L: {pnl.amount >= 0 ? '+' : ''}${Math.abs(pnl.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {' '}({pnl.percent >= 0 ? '+' : ''}{pnl.percent.toFixed(2)}%)
          </div>
        )}
      </div>

      {/* Top Positions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Holdings</h3>
        {mockPositions.slice(0, 5).map((position) => (
          <div
            key={position.id}
            className="flex items-center justify-between py-2 hover:bg-secondary rounded-lg px-2 -mx-2 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-semibold text-sm">
                {position.ticker.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{position.ticker}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {position.quantity} {position.assetType === 'stock' ? 'shares' : 'units'}
                </div>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="font-medium">
                ${position.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-xs ${position.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {position.changePercent >= 0 ? '+' : ''}{position.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
