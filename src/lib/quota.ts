import { prisma } from './prisma';
import { getPlan, ANON_DAILY_LIMIT } from './plans';

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetsIn: string; // human-readable
  plan: string;
}

export async function checkQuota(
  userId: string | null,
  ipAddress: string | null
): Promise<QuotaResult> {
  if (userId) {
    // Fetch user plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = getPlan(user?.plan || 'free');
    const limit = plan.translationsPerMonth;

    // Count usage this calendar month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const used = await prisma.usageLog.count({
      where: {
        userId,
        endpoint: '/api/translate/stream',
        success: true,
        createdAt: { gte: monthStart },
      },
    });

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysLeft = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      allowed: used < limit,
      used,
      limit,
      resetsIn: `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      plan: plan.slug,
    };
  }

  // Anonymous: 5 translations per day by IP
  if (!ipAddress) {
    return { allowed: false, used: 0, limit: ANON_DAILY_LIMIT, resetsIn: 'unknown', plan: 'anonymous' };
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const used = await prisma.usageLog.count({
    where: {
      ipAddress,
      userId: null,
      endpoint: '/api/translate/stream',
      success: true,
      createdAt: { gte: dayStart },
    },
  });

  const midnight = new Date(dayStart);
  midnight.setDate(midnight.getDate() + 1);
  const hoursLeft = Math.ceil((midnight.getTime() - Date.now()) / (1000 * 60 * 60));

  return {
    allowed: used < ANON_DAILY_LIMIT,
    used,
    limit: ANON_DAILY_LIMIT,
    resetsIn: `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`,
    plan: 'anonymous',
  };
}

/** Get the user's plan config for feature gating */
export async function getUserPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return getPlan(user?.plan || 'free');
}

export async function logUsage(params: {
  userId?: string | null;
  ipAddress?: string | null;
  endpoint: string;
  inputChars: number;
  hasImage: boolean;
  level: number;
  durationMs: number;
  success: boolean;
  error?: string;
}) {
  await prisma.usageLog.create({
    data: {
      userId: params.userId || null,
      ipAddress: params.ipAddress || null,
      endpoint: params.endpoint,
      inputChars: params.inputChars,
      hasImage: params.hasImage,
      level: params.level,
      durationMs: params.durationMs,
      success: params.success,
      error: params.error,
    },
  });
}
