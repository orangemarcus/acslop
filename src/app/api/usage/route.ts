import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkQuota } from '@/lib/quota';
import { prisma } from '@/lib/prisma';

// GET /api/usage — get current user's usage stats and quota
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quota = await checkQuota(userId, null);

  // Get all-time stats
  const totalTranslations = await prisma.translation.count({ where: { userId } });

  const avgScore = await prisma.translation.aggregate({
    where: { userId },
    _avg: { slopScore: true },
  });

  return NextResponse.json({
    quota,
    stats: {
      totalTranslations,
      avgSlopScore: Math.round(avgScore._avg.slopScore || 0),
    },
  });
}
