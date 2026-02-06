import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard — dashboard stats: totals, trend data, recent translations
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all translations for this user ordered by date
  const translations = await prisma.translation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      inputText: true,
      level: true,
      slopScore: true,
      createdAt: true,
      result: true,
    },
  });

  const totalTranslations = translations.length;

  // Calculate average slop score
  const avgSlopScore =
    totalTranslations > 0
      ? Math.round(
          translations.reduce((sum, t) => sum + t.slopScore, 0) / totalTranslations
        )
      : 0;

  // Best (lowest) slop score
  const bestScore =
    totalTranslations > 0
      ? Math.min(...translations.map((t) => t.slopScore))
      : 0;

  // Build clarity trend — group by day, average slop score per day
  const trendMap = new Map<string, { total: number; count: number }>();
  for (const t of translations) {
    const day = new Date(t.createdAt).toISOString().slice(0, 10);
    const entry = trendMap.get(day) || { total: 0, count: 0 };
    entry.total += t.slopScore;
    entry.count += 1;
    trendMap.set(day, entry);
  }

  const clarityTrend = Array.from(trendMap.entries())
    .map(([date, { total, count }]) => ({
      date,
      avgScore: Math.round(total / count),
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days with data

  // Level distribution
  const levelCounts: Record<number, number> = {};
  for (const t of translations) {
    levelCounts[t.level] = (levelCounts[t.level] || 0) + 1;
  }

  // Recent 10 translations for the list
  const recent = translations.slice(0, 10).map((t) => ({
    id: t.id,
    inputText: t.inputText.slice(0, 120),
    level: t.level,
    slopScore: t.slopScore,
    createdAt: t.createdAt,
  }));

  // Shared reports count
  const sharedCount = await prisma.shareableReport.count({
    where: { userId },
  });

  return NextResponse.json({
    stats: {
      totalTranslations,
      avgSlopScore,
      bestScore,
      sharedCount,
    },
    clarityTrend,
    levelCounts,
    recent,
  });
}
