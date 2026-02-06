import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndUnlockAchievements, ACHIEVEMENTS, getAchievementDef } from '@/lib/achievements';

// GET /api/achievements — get user's achievements + check for new ones
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for any new achievements first
  const newlyUnlocked = await checkAndUnlockAchievements(userId);

  // Get all user achievements
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
    orderBy: { unlockedAt: 'desc' },
  });

  const unlockedSet = new Set(userAchievements.map((a) => a.achievementId));

  const achievements = ACHIEVEMENTS.map((def) => {
    const unlocked = userAchievements.find((a) => a.achievementId === def.id);
    return {
      ...def,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt || null,
    };
  });

  const newlyUnlockedDefs = newlyUnlocked
    .map((id) => getAchievementDef(id))
    .filter(Boolean);

  return NextResponse.json({
    achievements,
    total: ACHIEVEMENTS.length,
    unlocked: unlockedSet.size,
    newlyUnlocked: newlyUnlockedDefs,
  });
}

// POST /api/achievements/check — trigger achievement check (called after key actions)
export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newlyUnlocked = await checkAndUnlockAchievements(userId);
  const defs = newlyUnlocked.map((id) => getAchievementDef(id)).filter(Boolean);

  return NextResponse.json({ newlyUnlocked: defs });
}
