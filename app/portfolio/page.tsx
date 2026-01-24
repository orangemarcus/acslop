import { mockPositions, calculatePortfolioTotal, calculatePortfolioDayChange, calculatePortfolioPnL } from "@/lib/mockData";
import Link from "next/link";

export default function PortfolioPage() {
  const totalValue = calculatePortfolioTotal();
  const dayChange = calculatePortfolioDayChange();
  const pnl = calculatePortfolioPnL();

  // Group positions by asset type
  const groupedPositions = mockPositions.reduce((acc, position) => {
    if (!acc[position.assetType]) {
      acc[position.assetType] = [];
    }
    acc[position.assetType].push(position);
    return acc;
  }, {} as Record<string, typeof mockPositions>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground">Dashboard</Link>
          <span>/</span>
          <span>Portfolio</span>
        </div>
        <h1 className="text-3xl font-semibold">Portfolio</h1>
      </div>

      {/* Portfolio Summary Card */}
      <div className="bg-card border border-border rounded-xl p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Total Value</div>
            <div className="text-4xl font-bold">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Today's Change</div>
            <div className={`text-2xl font-bold ${dayChange.amount >= 0 ? 'text-success' : 'text-danger'}`}>
              {dayChange.amount >= 0 ? '+' : ''}${Math.abs(dayChange.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-lg ml-2">
                ({dayChange.percent >= 0 ? '+' : ''}{dayChange.percent.toFixed(2)}%)
              </span>
            </div>
          </div>
          {pnl && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Total P&L</div>
              <div className={`text-2xl font-bold ${pnl.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                {pnl.amount >= 0 ? '+' : ''}${Math.abs(pnl.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-lg ml-2">
                  ({pnl.percent >= 0 ? '+' : ''}{pnl.percent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Positions by Asset Type */}
      <div className="space-y-8">
        {Object.entries(groupedPositions).map(([assetType, positions]) => (
          <div key={assetType}>
            <h2 className="text-xl font-semibold mb-4 capitalize">{assetType}s</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Asset</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Quantity</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Price</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Value</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Today</th>
                      {positions.some(p => p.purchasePrice) && (
                        <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">P&L</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => {
                      const positionPnL = position.purchasePrice
                        ? {
                            amount: (position.currentPrice - position.purchasePrice) * position.quantity,
                            percent: ((position.currentPrice - position.purchasePrice) / position.purchasePrice) * 100,
                          }
                        : null;

                      return (
                        <tr key={position.id} className="border-b border-border last:border-b-0 hover:bg-secondary/50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium">{position.ticker}</div>
                              <div className="text-sm text-muted-foreground">{position.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {position.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            ${position.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            ${position.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-6 py-4 text-right ${position.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                            <div>{position.changePercent >= 0 ? '+' : ''}{position.changePercent.toFixed(2)}%</div>
                            <div className="text-xs">
                              {position.change >= 0 ? '+' : ''}${Math.abs(position.change * position.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          {positions.some(p => p.purchasePrice) && (
                            <td className={`px-6 py-4 text-right ${positionPnL && positionPnL.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                              {positionPnL ? (
                                <>
                                  <div>{positionPnL.amount >= 0 ? '+' : ''}${Math.abs(positionPnL.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div className="text-xs">
                                    ({positionPnL.percent >= 0 ? '+' : ''}{positionPnL.percent.toFixed(2)}%)
                                  </div>
                                </>
                              ) : (
                                <div className="text-muted-foreground text-sm">—</div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Position Button (Coming Soon) */}
      <div className="mt-8 flex justify-center">
        <button
          className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity cursor-not-allowed opacity-50"
          disabled
        >
          Add Position (Coming in Phase 3)
        </button>
      </div>
    </div>
  );
}
