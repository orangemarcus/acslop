import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile?slug=xxx — get public profile by slug
// GET /api/profile?userId=xxx — get profile by user id
// GET /api/profile (no params) — get current user's profile
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const targetUserId = request.nextUrl.searchParams.get('userId');

  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as { id?: string })?.id || null;

  let user;

  if (slug) {
    user = await prisma.user.findUnique({
      where: { profileSlug: slug },
      select: {
        id: true, name: true, image: true, bio: true, profileSlug: true, plan: true, createdAt: true,
        _count: { select: { translations: true, sharedReports: true, followers: true, following: true } },
      },
    });
  } else if (targetUserId) {
    user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true, name: true, image: true, bio: true, profileSlug: true, plan: true, createdAt: true,
        _count: { select: { translations: true, sharedReports: true, followers: true, following: true } },
      },
    });
  } else if (currentUserId) {
    user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true, name: true, image: true, bio: true, profileSlug: true, plan: true, email: true, createdAt: true,
        _count: { select: { translations: true, sharedReports: true, followers: true, following: true } },
      },
    });
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get achievements
  const achievements = await prisma.userAchievement.findMany({
    where: { userId: user.id },
    select: { achievementId: true, unlockedAt: true },
    orderBy: { unlockedAt: 'desc' },
  });

  // Get recent shared reports (public)
  const recentShares = await prisma.shareableReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      shareId: true,
      title: true,
      views: true,
      createdAt: true,
      translation: { select: { slopScore: true, inputText: true } },
    },
  });

  // Get avg slop score
  const agg = await prisma.translation.aggregate({
    where: { userId: user.id },
    _avg: { slopScore: true },
  });

  // Check if current user follows this user
  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      slug: user.profileSlug,
      plan: user.plan,
      createdAt: user.createdAt,
      isOwn: currentUserId === user.id,
    },
    stats: {
      translations: user._count.translations,
      shares: user._count.sharedReports,
      followers: user._count.followers,
      following: user._count.following,
      avgSlopScore: Math.round(agg._avg.slopScore || 0),
      achievements: achievements.length,
    },
    achievements: achievements.map((a) => ({ id: a.achievementId, unlockedAt: a.unlockedAt })),
    recentShares: recentShares.map((s) => ({
      shareId: s.shareId,
      title: s.title,
      views: s.views,
      slopScore: s.translation.slopScore,
      preview: s.translation.inputText.slice(0, 100),
      createdAt: s.createdAt,
    })),
    isFollowing,
  });
}

// PATCH /api/profile — update current user's profile
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, string> = {};

  if (typeof body.bio === 'string') {
    updates.bio = body.bio.trim().slice(0, 200);
  }

  if (typeof body.profileSlug === 'string') {
    const slug = body.profileSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
    if (slug.length < 3) {
      return NextResponse.json({ error: 'Slug must be at least 3 characters' }, { status: 400 });
    }
    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { profileSlug: slug } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: 'This profile URL is already taken' }, { status: 400 });
    }
    updates.profileSlug = slug;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: updates });

  return NextResponse.json({ success: true });
}
