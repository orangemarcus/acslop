import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndUnlockAchievements } from '@/lib/achievements';

// GET /api/feedback?translationId=xxx — get user's feedback for a translation
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ feedback: null });
  }

  const translationId = request.nextUrl.searchParams.get('translationId');
  if (!translationId) {
    return NextResponse.json({ error: 'translationId required' }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { userId_translationId: { userId, translationId } },
    select: { rating: true, comment: true },
  });

  return NextResponse.json({ feedback });
}

// POST /api/feedback — submit or update feedback
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to leave feedback' }, { status: 401 });
  }

  const body = await request.json();
  const translationId = typeof body.translationId === 'string' ? body.translationId : '';
  const rating = typeof body.rating === 'number' && [1, 2].includes(body.rating) ? body.rating : null;
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 500) : null;

  if (!translationId || !rating) {
    return NextResponse.json({ error: 'translationId and rating (1 or 2) required' }, { status: 400 });
  }

  // Verify translation exists
  const translation = await prisma.translation.findUnique({
    where: { id: translationId },
    select: { id: true },
  });
  if (!translation) {
    return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
  }

  const feedback = await prisma.feedback.upsert({
    where: { userId_translationId: { userId, translationId } },
    update: { rating, comment },
    create: { userId, translationId, rating, comment },
  });

  // Check for feedback-related achievements
  await checkAndUnlockAchievements(userId).catch(() => {});

  return NextResponse.json({ feedback: { rating: feedback.rating, comment: feedback.comment } });
}
