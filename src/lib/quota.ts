import { prisma } from './prisma';

// Free tier: 5 translations/day for anonymous, 25/month for signed-in
const ANON_DAILY_LIMIT = 5;
const FREE_MONTHLY_LIMIT = 25;

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetsIn: string; // human-readable
}

export async function checkQuota(
  userId: string | null,
  ipAddress: string | null
): Promise<QuotaResult> {
  if (userId) {
    // Authenticated: 25 translations per calendar month
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
      allowed: used < FREE_MONTHLY_LIMIT,
      used,
      limit: FREE_MONTHLY_LIMIT,
      resetsIn: `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    };
  }

  // Anonymous: 5 translations per day by IP
  if (!ipAddress) {
    return { allowed: false, used: 0, limit: ANON_DAILY_LIMIT, resetsIn: 'unknown' };
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
  };
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
