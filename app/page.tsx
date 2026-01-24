import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import MarketOverview from "@/components/dashboard/MarketOverview";
import NewsFeed from "@/components/dashboard/NewsFeed";
import EventsCalendar from "@/components/dashboard/EventsCalendar";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Your macro economics overview at a glance
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Portfolio & Markets */}
        <div className="lg:col-span-2 space-y-6">
          <PortfolioSummary />
          <MarketOverview />
        </div>

        {/* Right Column - News & Events */}
        <div className="space-y-6">
          <NewsFeed />
          <EventsCalendar />
        </div>
      </div>
    </div>
  );
}
