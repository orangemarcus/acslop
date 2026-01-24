import { mockEvents } from "@/lib/mockData";

export default function EventsCalendar() {
  // Sort events by date
  const sortedEvents = [...mockEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>
      </div>

      <div className="space-y-3">
        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className="border border-border rounded-lg p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-medium mb-1">{event.title}</h3>
                <div className="text-xs text-muted-foreground">
                  {formatDate(event.date)}
                  {event.time && ` at ${event.time}`}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${getImportanceColor(event.importance)}`}
              >
                {event.importance}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {event.description}
              </p>
            )}
            {event.affectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {event.affectedAssets.map((asset) => (
                  <span
                    key={asset}
                    className="text-xs bg-secondary px-2 py-0.5 rounded border border-border"
                  >
                    {asset}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays < 7) return `In ${diffInDays} days`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getImportanceColor(importance: string): string {
  switch (importance) {
    case 'high':
      return 'bg-danger/10 text-danger border border-danger/20';
    case 'medium':
      return 'bg-accent/10 text-accent border border-accent/20';
    case 'low':
      return 'bg-secondary text-muted-foreground border border-border';
    default:
      return 'bg-secondary text-muted-foreground border border-border';
  }
}
