import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/comments?reportId=xxx — list comments on a shared report
export async function GET(request: NextRequest) {
  const reportId = request.nextUrl.searchParams.get('reportId');
  if (!reportId) {
    return NextResponse.json({ error: 'reportId required' }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { reportId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      text: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, image: true, profileSlug: true },
      },
    },
  });

  return NextResponse.json({ comments });
}

// POST /api/comments — add a comment to a shared report
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 });
  }

  const body = await request.json();
  const reportId = typeof body.reportId === 'string' ? body.reportId : '';
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : '';

  if (!reportId || !text) {
    return NextResponse.json({ error: 'reportId and text required' }, { status: 400 });
  }

  // Verify report exists
  const report = await prisma.shareableReport.findUnique({ where: { id: reportId } });
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Limit to 50 comments per report
  const count = await prisma.comment.count({ where: { reportId } });
  if (count >= 50) {
    return NextResponse.json({ error: 'Comment limit reached for this report' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { userId, reportId, text },
    select: {
      id: true,
      text: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true, profileSlug: true } },
    },
  });

  return NextResponse.json({ comment });
}

// DELETE /api/comments?id=xxx — delete own comment
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
  }

  const comment = await prisma.comment.findFirst({ where: { id, userId } });
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
