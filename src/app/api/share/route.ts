import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function generateShareId(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// POST /api/share — create a shareable report link
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { translationId, title } = body;

  if (!translationId) {
    return NextResponse.json({ error: 'Missing translationId' }, { status: 400 });
  }

  // Verify the translation belongs to this user
  const translation = await prisma.translation.findFirst({
    where: { id: translationId, userId },
  });

  if (!translation) {
    return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
  }

  // Check if already shared
  const existing = await prisma.shareableReport.findFirst({
    where: { translationId, userId },
  });

  if (existing) {
    return NextResponse.json({ shareId: existing.shareId, id: existing.id });
  }

  // Create new share
  const shareId = generateShareId();
  const report = await prisma.shareableReport.create({
    data: {
      shareId,
      translationId,
      userId,
      title: title || null,
    },
  });

  return NextResponse.json({ shareId: report.shareId, id: report.id }, { status: 201 });
}

// GET /api/share?id=xxx — get a shared report by shareId (public)
export async function GET(request: NextRequest) {
  const shareId = request.nextUrl.searchParams.get('id');

  if (!shareId) {
    return NextResponse.json({ error: 'Missing share id' }, { status: 400 });
  }

  const report = await prisma.shareableReport.findUnique({
    where: { shareId },
    include: {
      translation: {
        select: {
          inputText: true,
          level: true,
          result: true,
          slopScore: true,
          createdAt: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Increment view count
  await prisma.shareableReport.update({
    where: { shareId },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json({
    shareId: report.shareId,
    title: report.title,
    views: report.views + 1,
    createdAt: report.createdAt,
    author: report.user.name || 'Anonymous',
    translation: {
      inputText: report.translation.inputText,
      level: report.translation.level,
      slopScore: report.translation.slopScore,
      result: JSON.parse(report.translation.result),
      createdAt: report.translation.createdAt,
    },
  });
}

// DELETE /api/share?id=xxx — delete a shared report
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shareId = request.nextUrl.searchParams.get('id');
  if (!shareId) {
    return NextResponse.json({ error: 'Missing share id' }, { status: 400 });
  }

  await prisma.shareableReport.deleteMany({
    where: { shareId, userId },
  });

  return NextResponse.json({ ok: true });
}
