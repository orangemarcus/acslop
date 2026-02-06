import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndUnlockAchievements } from '@/lib/achievements';

// POST /api/bookmarks — add a translation to a collection
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const collectionId = typeof body.collectionId === 'string' ? body.collectionId : '';
  const translationId = typeof body.translationId === 'string' ? body.translationId : '';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : null;

  if (!collectionId || !translationId) {
    return NextResponse.json({ error: 'collectionId and translationId required' }, { status: 400 });
  }

  // Verify ownership
  const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId } });
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  const bookmark = await prisma.bookmark.upsert({
    where: { collectionId_translationId: { collectionId, translationId } },
    update: { note },
    create: { collectionId, translationId, note },
  });

  // Update collection timestamp
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });

  // Check for bookmark achievements
  await checkAndUnlockAchievements(userId).catch(() => {});

  return NextResponse.json({ bookmark });
}

// DELETE /api/bookmarks?collectionId=xxx&translationId=yyy — remove a bookmark
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collectionId = request.nextUrl.searchParams.get('collectionId');
  const translationId = request.nextUrl.searchParams.get('translationId');

  if (!collectionId || !translationId) {
    return NextResponse.json({ error: 'collectionId and translationId required' }, { status: 400 });
  }

  // Verify ownership
  const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId } });
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  await prisma.bookmark.deleteMany({
    where: { collectionId, translationId },
  });

  return NextResponse.json({ success: true });
}

// GET /api/bookmarks?collectionId=xxx — list bookmarks in a collection
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collectionId = request.nextUrl.searchParams.get('collectionId');
  if (!collectionId) {
    return NextResponse.json({ error: 'collectionId required' }, { status: 400 });
  }

  // Verify ownership
  const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId } });
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { collectionId },
    orderBy: { createdAt: 'desc' },
    include: {
      translation: {
        select: { id: true, inputText: true, slopScore: true, level: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({
    collection: { id: collection.id, name: collection.name, color: collection.color },
    bookmarks: bookmarks.map((b) => ({
      id: b.id,
      note: b.note,
      createdAt: b.createdAt,
      translation: {
        id: b.translation.id,
        inputText: b.translation.inputText.slice(0, 120),
        slopScore: b.translation.slopScore,
        level: b.translation.level,
        createdAt: b.translation.createdAt,
      },
    })),
  });
}
