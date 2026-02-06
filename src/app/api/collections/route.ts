import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndUnlockAchievements } from '@/lib/achievements';

// GET /api/collections — list user's collections with bookmark counts
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { bookmarks: true } },
    },
  });

  return NextResponse.json({
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      bookmarkCount: c._count.bookmarks,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

// POST /api/collections — create a new collection
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const name = (typeof body.name === 'string' ? body.name.trim() : '').slice(0, 60);
  const color = typeof body.color === 'string' ? body.color : '#C96442';

  if (!name) {
    return NextResponse.json({ error: 'Collection name required' }, { status: 400 });
  }

  // Limit to 20 collections per user
  const count = await prisma.collection.count({ where: { userId } });
  if (count >= 20) {
    return NextResponse.json({ error: 'Maximum 20 collections' }, { status: 400 });
  }

  const collection = await prisma.collection.create({
    data: { userId, name, color },
  });

  // Check for 'collector' achievement
  await checkAndUnlockAchievements(userId).catch(() => {});

  return NextResponse.json({ collection });
}

// DELETE /api/collections?id=xxx — delete a collection
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Collection ID required' }, { status: 400 });
  }

  const collection = await prisma.collection.findFirst({ where: { id, userId } });
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  await prisma.collection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
