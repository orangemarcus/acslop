import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TranslateResponse } from '@/types';

// GET /api/community — public aggregate community statistics
export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get('section') || 'overview';

  if (section === 'overview') {
    // Total translations across all users
    const totalTranslations = await prisma.translation.count();
    const totalUsers = await prisma.user.count();
    const totalShares = await prisma.shareableReport.count();

    // Aggregate slop stats
    const agg = await prisma.translation.aggregate({
      _avg: { slopScore: true },
      _min: { slopScore: true },
      _max: { slopScore: true },
    });

    // Score distribution (buckets of 20)
    const allScores = await prisma.translation.findMany({
      select: { slopScore: true },
    });

    const distribution = [0, 0, 0, 0, 0]; // 0-19, 20-39, 40-59, 60-79, 80-100
    for (const t of allScores) {
      const bucket = Math.min(4, Math.floor(t.slopScore / 20));
      distribution[bucket]++;
    }

    // Translations per day (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentTranslations = await prisma.translation.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true },
    });

    const activityMap = new Map<string, number>();
    for (const t of recentTranslations) {
      const day = t.createdAt.toISOString().slice(0, 10);
      activityMap.set(day, (activityMap.get(day) || 0) + 1);
    }

    const activity = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      stats: {
        totalTranslations,
        totalUsers,
        totalShares,
        avgSlopScore: Math.round(agg._avg.slopScore || 0),
        bestScore: agg._min.slopScore || 0,
        worstScore: agg._max.slopScore || 0,
      },
      distribution,
      activity,
    });
  }

  if (section === 'hallOfFame') {
    // Clearest papers (lowest slop scores) — anonymized
    const clearest = await prisma.translation.findMany({
      where: { slopScore: { gt: 0 } },
      orderBy: { slopScore: 'asc' },
      take: 10,
      select: {
        id: true,
        slopScore: true,
        inputText: true,
        result: true,
        createdAt: true,
      },
    });

    // Most sloppy (highest slop scores) — anonymized
    const sloppiest = await prisma.translation.findMany({
      orderBy: { slopScore: 'desc' },
      take: 10,
      select: {
        id: true,
        slopScore: true,
        inputText: true,
        result: true,
        createdAt: true,
      },
    });

    const anonymize = (items: typeof clearest) =>
      items.map((t) => {
        let coreClaim = '';
        try {
          const parsed = JSON.parse(t.result) as TranslateResponse;
          coreClaim = parsed.coreClaim || '';
        } catch { /* ignore */ }

        return {
          id: t.id,
          slopScore: t.slopScore,
          preview: t.inputText.slice(0, 120) + (t.inputText.length > 120 ? '...' : ''),
          coreClaim: coreClaim.slice(0, 150),
          createdAt: t.createdAt,
        };
      });

    return NextResponse.json({
      clearest: anonymize(clearest),
      sloppiest: anonymize(sloppiest),
    });
  }

  if (section === 'jargon') {
    // Extract trending jargon from all translations
    const recentTranslations = await prisma.translation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { result: true },
    });

    const jargonCounts = new Map<string, { count: number; plain: string }>();

    for (const t of recentTranslations) {
      try {
        const parsed = JSON.parse(t.result) as TranslateResponse;
        for (const mapping of parsed.mappings) {
          if (mapping.originalPhrase && mapping.translatedPhrase) {
            const key = mapping.originalPhrase.toLowerCase().trim();
            const existing = jargonCounts.get(key);
            if (existing) {
              existing.count++;
            } else {
              jargonCounts.set(key, {
                count: 1,
                plain: mapping.translatedPhrase,
              });
            }
          }
        }
      } catch { /* ignore malformed */ }
    }

    // Sort by frequency and take top 30
    const trending = Array.from(jargonCounts.entries())
      .map(([jargon, { count, plain }]) => ({ jargon, plain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return NextResponse.json({ trending });
  }

  if (section === 'percentile') {
    // Given a score, return what percentile it falls in
    const score = Number(request.nextUrl.searchParams.get('score')) || 50;

    const total = await prisma.translation.count();
    if (total === 0) {
      return NextResponse.json({ percentile: 50, total: 0 });
    }

    // Count how many translations have a HIGHER slop score (worse)
    const worseCount = await prisma.translation.count({
      where: { slopScore: { gt: score } },
    });

    // Percentile = % of translations this score is better than
    const percentile = Math.round((worseCount / total) * 100);

    return NextResponse.json({ percentile, total });
  }

  return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
}
