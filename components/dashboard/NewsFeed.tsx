import { mockNews } from "@/lib/mockData";
import Link from "next/link";

export default function NewsFeed() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">News</h2>
        <Link
          href="/news"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-4">
        {mockNews.slice(0, 5).map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="border border-border rounded-lg p-4 hover:border-accent hover:bg-secondary transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-muted-foreground">{article.source}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(article.publishedAt)}
                </div>
              </div>
              <h3 className="font-medium mb-2 group-hover:text-accent transition-colors line-clamp-2">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {article.excerpt}
                </p>
              )}
              {article.relevantTickers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {article.relevantTickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="text-xs bg-secondary px-2 py-0.5 rounded border border-border"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
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
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
