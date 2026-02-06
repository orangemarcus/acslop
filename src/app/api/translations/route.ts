import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/translations — fetch user's cloud history
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const limit = Math.min(50, Number(request.nextUrl.searchParams.get('limit')) || 20);
  const cursor = request.nextUrl.searchParams.get('cursor');

  const translations = await prisma.translation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      inputText: true,
      level: true,
      result: true,
      slopScore: true,
      createdAt: true,
    },
  });

  const hasMore = translations.length > limit;
  const items = hasMore ? translations.slice(0, limit) : translations;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    translations: items.map((t) => ({
      ...t,
      result: JSON.parse(t.result),
    })),
    nextCursor,
  });
}

// POST /api/translations — save a translation to cloud history
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { inputText, level, result } = body;
  if (!inputText || !result) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const translation = await prisma.translation.create({
    data: {
      userId,
      inputText: String(inputText).slice(0, 10000),
      level: Number(level) || 4,
      result: JSON.stringify(result),
      slopScore: result?.slopIndex?.score || 0,
    },
  });

  return NextResponse.json({ id: translation.id }, { status: 201 });
}

// DELETE /api/translations?id=xxx — delete a single translation
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // Only delete if it belongs to the user
  await prisma.translation.deleteMany({
    where: { id, userId },
  });

  return NextResponse.json({ ok: true });
}
