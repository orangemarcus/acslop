import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/follow — follow a user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const followerId = (session?.user as { id?: string })?.id;
  if (!followerId) {
    return NextResponse.json({ error: 'Sign in to follow users' }, { status: 401 });
  }

  const body = await request.json();
  const followingId = typeof body.userId === 'string' ? body.userId : '';

  if (!followingId || followingId === followerId) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
  }

  // Check user exists
  const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    update: {},
    create: { followerId, followingId },
  });

  return NextResponse.json({ following: true });
}

// DELETE /api/follow?userId=xxx — unfollow a user
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const followerId = (session?.user as { id?: string })?.id;
  if (!followerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const followingId = request.nextUrl.searchParams.get('userId');
  if (!followingId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });

  return NextResponse.json({ following: false });
}

// GET /api/follow/feed — activity feed from followed users
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const section = request.nextUrl.searchParams.get('section') || 'feed';

  if (section === 'feed') {
    // Get IDs of users we follow
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({ feed: [], following: [] });
    }

    // Get recent shared reports from followed users
    const feed = await prisma.shareableReport.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        shareId: true,
        title: true,
        views: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true, profileSlug: true } },
        translation: { select: { slopScore: true, inputText: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({
      feed: feed.map((item) => ({
        shareId: item.shareId,
        title: item.title,
        views: item.views,
        commentCount: item._count.comments,
        slopScore: item.translation.slopScore,
        preview: item.translation.inputText.slice(0, 120),
        createdAt: item.createdAt,
        author: {
          id: item.user.id,
          name: item.user.name,
          image: item.user.image,
          slug: item.user.profileSlug,
        },
      })),
    });
  }

  if (section === 'following') {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        following: {
          select: { id: true, name: true, image: true, profileSlug: true, plan: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      following: following.map((f) => ({ ...f.following, followedAt: f.createdAt })),
    });
  }

  return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
}
