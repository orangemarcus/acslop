# Macro Economics Dashboard

A streamlined macro economics dashboard for tracking your portfolio, market trends, and financial news at a glance.

## Features (Phase 1 - Skeleton)

- **Portfolio Summary**: View your holdings and daily performance
- **Market Overview**: Track major indices (S&P 500, Dow, NASDAQ, VIX)
- **News Feed**: Stay updated with relevant financial news
- **Events Calendar**: Track upcoming economic events and earnings

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── portfolio/         # Portfolio page
│   ├── news/             # News page
│   ├── settings/         # Settings page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard home
├── components/
│   ├── dashboard/        # Dashboard components
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
└── lib/
    └── mockData.ts       # Mock data (Phase 1)
```

## Development Phases

See [PLAN.md](./PLAN.md) for the complete development roadmap.

**Current Phase**: Phase 1 - Skeleton (Mock data only)

**Next Phase**: Phase 2 - Connect real API for stock prices
