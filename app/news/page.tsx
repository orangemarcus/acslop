import { mockNews } from "@/lib/mockData";
import Link from "next/link";

export default function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground">Dashboard</Link>
          <span>/</span>
          <span>News</span>
        </div>
        <h1 className="text-3xl font-semibold mb-2">Financial News</h1>
        <p className="text-muted-foreground">
          Latest news relevant to your portfolio
        </p>
      </div>

      {/* Filters (Coming Soon) */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">Filters:</div>
          <button className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-sm font-medium">
            All
          </button>
          <button className="px-3 py-1 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-border">
            My Holdings
          </button>
          <button className="px-3 py-1 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-border">
            Markets
          </button>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {mockNews.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <article className="bg-card border border-border rounded-xl p-6 hover:border-accent hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {article.source}
                  </span>
                  {article.relevantTickers.length > 0 && (
                    <div className="flex gap-1">
                      {article.relevantTickers.slice(0, 3).map((ticker) => (
                        <span
                          key={ticker}
                          className="text-xs bg-secondary px-2 py-0.5 rounded border border-border font-medium"
                        >
                          {ticker}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                  {formatTimeAgo(article.publishedAt)}
                </span>
              </div>

              <h2 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
                {article.title}
              </h2>

              {article.excerpt && (
                <p className="text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              <div className="mt-4 flex items-center text-sm text-accent group-hover:underline">
                Read more →
              </div>
            </article>
          </a>
        ))}
      </div>

      {/* Load More (Coming Soon) */}
      <div className="mt-8 flex justify-center">
        <button
          className="px-6 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-border transition-colors cursor-not-allowed opacity-50"
          disabled
        >
          Load More (Coming in Phase 4)
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
