# Macro Economics Dashboard - Project Plan

## Vision
A streamlined, low-noise macro economics dashboard that gives users a 5-minute glance at their portfolio, relevant news, and market trends. Think: Reddit + Claude.ai + Wealthsimple.

## Core Principles
- **Glanceable**: Information density without clutter
- **Curated**: Only show what matters to the user's portfolio
- **Fast**: 5-minute review, not 30-minute doom scroll
- **Clean UX**: Claude.ai-inspired minimal, comfortable design

---

## The API Problem (And Our Solution)

### The Trap
"100 APIs" means 100 rate limits, 100 auth flows, 100 points of failure, 100 schema changes to track.

### Our Strategy: Minimal API Surface
**Phase 1 (Skeleton - NOW):**
- ZERO external APIs
- Mock data only
- Focus on UI/UX patterns

**Phase 2 (First Data):**
- ONE API: **Polygon.io** (free tier: 5 calls/min, stocks + forex + crypto)
  - Alternative: **Alpha Vantage** (free tier: 25 calls/day)
- Implement smart caching (1 hour staleness = fine for most users)
- Server-side proxy to hide keys

**Phase 3 (News):**
- Start with **RSS feeds** (free, no API key)
  - Bloomberg, Reuters, Financial Times RSS
  - Parse and filter by user's portfolio tickers
- Later: NewsAPI if needed

**Phase 4 (Events):**
- Start with **manual curated events** (JSON file)
  - Fed meetings, earnings seasons, major economic releases
- Later: Scrape economic calendars or use Trading Economics API

### Data Freshness Strategy
- **Stocks/Crypto**: 5-minute cache (good enough for non-traders)
- **News**: 15-minute cache
- **Portfolio value**: Real-time calculation from cached prices
- **Events**: Daily cache

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** (utility-first, fast iterations)
- **Shadcn/ui** (component library with Claude.ai aesthetics)
- **Recharts** (for simple, clean charts)

### Backend
- **Next.js API Routes** (serverless functions)
- **Local Storage** for portfolio (Phase 1-2)
- **PostgreSQL + Prisma** (Phase 3+ for multi-device sync)

### Deployment
- **Vercel** (free tier, perfect for Next.js)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           User Browser                      │
│  ┌──────────────────────────────────────┐  │
│  │  Next.js App (Client Components)     │  │
│  │  - Dashboard Layout                  │  │
│  │  - Portfolio View                    │  │
│  │  - News Feed                         │  │
│  │  - Market Overview                   │  │
│  └─────────────┬────────────────────────┘  │
└────────────────┼───────────────────────────┘
                 │
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────┐
│   Next.js Server (API Routes)               │
│  ┌──────────────────────────────────────┐  │
│  │  /api/portfolio                      │  │
│  │  /api/market-data                    │  │
│  │  /api/news                           │  │
│  │  /api/events                         │  │
│  └─────────────┬────────────────────────┘  │
│                │                            │
│    ┌───────────┴──────────┐                │
│    │   Cache Layer         │                │
│    │   (5-15 min TTL)     │                │
│    └───────────┬──────────┘                │
└────────────────┼───────────────────────────┘
                 │
                 │ External Calls
                 ▼
┌─────────────────────────────────────────────┐
│        External APIs (Rate Limited)         │
│  - Polygon.io / Alpha Vantage               │
│  - RSS Feeds (Bloomberg, Reuters)           │
│  - Economic Calendar (JSON)                 │
└─────────────────────────────────────────────┘
```

---

## Phased Implementation

### **Phase 1: Skeleton (This Week)** ✓ CURRENT
**Goal:** Working UI with mock data, zero external dependencies

**Deliverables:**
1. Next.js project scaffold
2. Basic layout structure:
   - Header with minimal nav
   - Dashboard grid layout
   - Empty component placeholders
3. Mock data structures:
   - Portfolio (5-10 mock positions)
   - Market data (S&P 500, BTC, Gold)
   - News feed (5-10 mock articles)
   - Events calendar (upcoming Fed meeting, earnings)
4. Design system setup:
   - Tailwind config
   - Color palette (neutral grays, accent colors)
   - Typography scale
   - Component library (buttons, cards, etc.)

**Pages:**
- `/` - Dashboard (main glance view)
- `/portfolio` - Detailed portfolio breakdown
- `/news` - News feed
- `/settings` - User preferences (mock)

**No Authentication Yet:** Single-user, localStorage only

---

### **Phase 2: First Real Data (Week 2)**
**Goal:** Connect one API, prove the data flow

**Tasks:**
1. Set up Polygon.io or Alpha Vantage API
2. Create `/api/market-data` endpoint with caching
3. Replace mock stock prices with real prices
4. Add loading states and error handling
5. Implement simple portfolio value calculation

**Scope:**
- Stocks ONLY (no crypto/forex yet)
- 5-minute cache
- Max 10 portfolio positions (API limit)

---

### **Phase 3: Portfolio Management (Week 3)**
**Goal:** User can build their own portfolio

**Tasks:**
1. Portfolio CRUD (Create/Read/Update/Delete positions)
2. localStorage persistence
3. Position entry form:
   - Ticker symbol
   - Number of shares
   - Purchase price (optional, for P&L)
4. Portfolio metrics:
   - Total value
   - Today's change
   - Overall P&L (if purchase price provided)
5. Search/autocomplete for ticker symbols

---

### **Phase 4: News Integration (Week 4)**
**Goal:** Show relevant news without NewsAPI costs

**Tasks:**
1. RSS feed parser for financial news
2. Filter news by portfolio tickers (keyword matching)
3. News card component
4. "Mark as read" functionality (localStorage)
5. News sources:
   - Bloomberg RSS
   - Reuters Business
   - Yahoo Finance RSS

---

### **Phase 5: Expand Asset Classes (Week 5)**
**Goal:** Add crypto, forex, commodities

**Tasks:**
1. Extend API to support multiple asset types
2. Add crypto prices (BTC, ETH, etc.)
3. Add forex pairs (EUR/USD, etc.)
4. Add commodities (Gold, Silver, Oil)
5. Asset class filters on dashboard

---

### **Phase 6: Events & Calendar (Week 6)**
**Goal:** Curated economic events

**Tasks:**
1. Economic calendar component
2. Manual curated events JSON:
   - Fed meetings
   - Earnings seasons
   - CPI/unemployment releases
3. Filter events by user's portfolio sectors
4. Event countdown timers

---

### **Phase 7: Polish & Performance (Week 7)**
**Goal:** Production-ready

**Tasks:**
1. Mobile responsive design
2. Performance optimization (code splitting, lazy loading)
3. Error boundaries and fallback UI
4. Loading skeletons
5. Dark mode (optional)
6. Analytics (basic usage tracking)

---

## Data Models

### Portfolio Position
```typescript
interface Position {
  id: string;
  ticker: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'forex' | 'commodity';
  quantity: number;
  purchasePrice?: number; // Optional for P&L calculation
  purchaseDate?: string;
  notes?: string;
}
```

### Market Data
```typescript
interface MarketData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: string;
}
```

### News Article
```typescript
interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  relevantTickers: string[];
  excerpt?: string;
  imageUrl?: string;
}
```

### Economic Event
```typescript
interface EconomicEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  importance: 'low' | 'medium' | 'high';
  description?: string;
  affectedAssets: string[]; // ['USD', 'bonds', 'tech-stocks']
}
```

---

## UI Component Structure

```
app/
├── (dashboard)/
│   ├── layout.tsx          # Main dashboard layout
│   ├── page.tsx            # Dashboard home (glance view)
│   ├── portfolio/
│   │   └── page.tsx        # Portfolio detail page
│   ├── news/
│   │   └── page.tsx        # News feed page
│   └── settings/
│       └── page.tsx        # Settings page
├── api/
│   ├── market-data/
│   │   └── route.ts        # Market data API endpoint
│   ├── news/
│   │   └── route.ts        # News API endpoint
│   └── events/
│       └── route.ts        # Events API endpoint
└── components/
    ├── dashboard/
    │   ├── PortfolioSummary.tsx
    │   ├── MarketOverview.tsx
    │   ├── NewsFeed.tsx
    │   └── EventsCalendar.tsx
    ├── portfolio/
    │   ├── PositionCard.tsx
    │   ├── AddPositionForm.tsx
    │   └── PortfolioMetrics.tsx
    ├── ui/               # Shadcn/ui components
    │   ├── button.tsx
    │   ├── card.tsx
    │   ├── input.tsx
    │   └── ...
    └── layout/
        ├── Header.tsx
        ├── Sidebar.tsx
        └── Footer.tsx
```

---

## Design Inspiration (Claude.ai Style)

### Color Palette
- **Background**: `#1E1E1E` (dark) / `#FFFFFF` (light)
- **Surface**: `#2A2A2A` (dark) / `#F5F5F5` (light)
- **Border**: `#3A3A3A` (dark) / `#E5E5E5` (light)
- **Text Primary**: `#E0E0E0` (dark) / `#1A1A1A` (light)
- **Text Secondary**: `#A0A0A0` (dark) / `#666666` (light)
- **Accent**: `#E07B53` (Claude orange) or custom brand color
- **Success**: `#4CAF50`
- **Danger**: `#F44336`

### Typography
- **Font**: Inter or System UI Stack
- **Headings**: 600-700 weight
- **Body**: 400 weight
- **Scale**: 12px, 14px, 16px, 20px, 24px, 32px

### Spacing
- Use 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- Generous whitespace (don't cram information)
- Card-based layout with subtle shadows

### Interaction
- Smooth transitions (150-200ms)
- Hover states with slight lift or border highlight
- Focus states with clear outline
- Loading skeletons (not spinners) for content

---

## Success Metrics

### Phase 1 Success
- [ ] User can view dashboard with mock data
- [ ] All core pages render without errors
- [ ] Design feels "Claude.ai-like" (clean, minimal, comfortable)
- [ ] Responsive on mobile/tablet/desktop

### Phase 2 Success
- [ ] Real stock prices display correctly
- [ ] API caching works (no rate limit errors)
- [ ] Error states handled gracefully
- [ ] Loading states feel fast (<1s perceived load time)

### Overall Success (End of Phase 7)
- [ ] User can glance at dashboard in <5 minutes
- [ ] Portfolio value accurate within 5 minutes
- [ ] News relevant to user's holdings
- [ ] Zero API rate limit errors in normal usage
- [ ] Mobile experience feels native
- [ ] App feels "calm" not "noisy"

---

## Avoiding Scope Creep

### We Will NOT Build (Initially)
- ❌ Real-time trading execution
- ❌ Advanced charting (TradingView-level)
- ❌ Social features (sharing, following)
- ❌ AI-generated insights (save for later)
- ❌ Multi-user authentication (until Phase 8+)
- ❌ Browser notifications
- ❌ Custom alerts/triggers
- ❌ Historical portfolio tracking

### Keep It Simple
- Start with localStorage (not database)
- Use RSS feeds (not NewsAPI initially)
- Manual economic calendar (not live scraping)
- Static list of popular tickers (not full market search)

---

## Next Steps: Phase 1 Execution

1. ✅ Initialize Next.js project
2. ✅ Set up Tailwind + Shadcn/ui
3. ✅ Create mock data files
4. ✅ Build dashboard layout
5. ✅ Build core components (portfolio summary, market overview, news feed)
6. ✅ Deploy to Vercel (prove deployment works early)

Let's build the skeleton! 🏗️
