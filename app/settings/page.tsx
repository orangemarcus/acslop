import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground">Dashboard</Link>
          <span>/</span>
          <span>Settings</span>
        </div>
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Appearance */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </div>
              </div>
              <select className="px-4 py-2 bg-secondary border border-border rounded-lg font-medium cursor-not-allowed opacity-50" disabled>
                <option>System</option>
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Data & Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Data Storage</div>
                <div className="text-sm text-muted-foreground">
                  Your portfolio is stored locally in your browser
                </div>
              </div>
              <span className="px-3 py-1 bg-secondary rounded-lg text-sm">
                Local Storage
              </span>
            </div>
            <div className="pt-4 border-t border-border">
              <button
                className="px-4 py-2 bg-danger/10 text-danger rounded-lg font-medium hover:bg-danger/20 transition-colors cursor-not-allowed opacity-50"
                disabled
              >
                Clear All Data (Coming Soon)
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Preferences */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Portfolio Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Default Currency</div>
                <div className="text-sm text-muted-foreground">
                  Display portfolio value in
                </div>
              </div>
              <select className="px-4 py-2 bg-secondary border border-border rounded-lg font-medium cursor-not-allowed opacity-50" disabled>
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <div className="font-medium">Show Purchase Prices</div>
                <div className="text-sm text-muted-foreground">
                  Display P&L calculations
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>
        </div>

        {/* News Preferences */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">News Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Filter by Portfolio</div>
                <div className="text-sm text-muted-foreground">
                  Only show news relevant to your holdings
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <div className="font-medium">News Sources</div>
                <div className="text-sm text-muted-foreground">
                  Select preferred news sources
                </div>
              </div>
              <button
                className="px-4 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-border transition-colors cursor-not-allowed opacity-50"
                disabled
              >
                Manage Sources
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0 (Phase 1)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="font-medium">Skeleton</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source</span>
              <span className="font-medium">Mock Data</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              This is Phase 1 of the Macro Economics Dashboard. Most features are coming in future phases.
              See <Link href="/PLAN.md" className="text-accent hover:underline">PLAN.md</Link> for the full roadmap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
