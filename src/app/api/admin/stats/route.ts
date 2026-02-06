import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Gather all stats in parallel
  const [
    totalUsers,
    usersThisMonth,
    proUsers,
    totalTranslations,
    translationsThisMonth,
    avgScore,
    totalCacheHits,
    totalApiKeys,
    activeApiKeys,
    apiRequests,
    recentLogs,
    topUserData,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { plan: 'pro' } }),
    prisma.translation.count(),
    prisma.translation.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.translation.aggregate({ _avg: { slopScore: true } }),
    prisma.translationCache.aggregate({ _sum: { hits: true } }),
    prisma.apiKey.count(),
    prisma.apiKey.count({ where: { active: true } }),
    prisma.apiKey.aggregate({ _sum: { requests: true } }),
    prisma.usageLog.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true, userId: true },
    }),
    prisma.user.findMany({
      take: 15,
      orderBy: { translations: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        _count: { select: { translations: true } },
      },
    }),
  ]);

  // Build daily activity
  const activityMap = new Map<string, { translations: number; users: Set<string> }>();
  for (const log of recentLogs) {
    const day = log.createdAt.toISOString().slice(0, 10);
    if (!activityMap.has(day)) {
      activityMap.set(day, { translations: 0, users: new Set() });
    }
    const entry = activityMap.get(day)!;
    entry.translations++;
    if (log.userId) entry.users.add(log.userId);
  }

  const recentActivity = Array.from(activityMap.entries())
    .map(([date, data]) => ({
      date,
      translations: data.translations,
      users: data.users.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    users: {
      total: totalUsers,
      thisMonth: usersThisMonth,
      proUsers,
    },
    translations: {
      total: totalTranslations,
      thisMonth: translationsThisMonth,
      avgScore: Math.round(avgScore._avg.slopScore || 0),
      cacheHits: totalCacheHits._sum.hits || 0,
    },
    api: {
      totalKeys: totalApiKeys,
      activeKeys: activeApiKeys,
      apiRequests: apiRequests._sum.requests || 0,
    },
    topUsers: topUserData.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      translations: u._count.translations,
    })),
    recentActivity,
  });
}
