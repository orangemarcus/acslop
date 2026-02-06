import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TranslateResponse } from '@/types';
import { getSlopLabel } from '@/lib/slopCalculator';

// GET /api/og/[id] — Generate OG metadata for shared reports
// Returns JSON with structured data that can be used by the report page's metadata
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const report = await prisma.shareableReport.findUnique({
    where: { shareId: id },
    select: {
      title: true,
      translation: {
        select: { result: true, slopScore: true, inputText: true },
      },
    },
  });

  if (!report?.translation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let parsed: TranslateResponse | null = null;
  try {
    parsed = JSON.parse(report.translation.result) as TranslateResponse;
  } catch { /* ignore */ }

  const score = report.translation.slopScore;
  const label = getSlopLabel(score);
  const coreClaim = parsed?.coreClaim || report.title || 'Academic Translation';
  const preview = report.translation.inputText.slice(0, 160);

  return NextResponse.json({
    title: `Slop Score: ${score}/100 (${label}) — ACSLOP`,
    description: coreClaim,
    preview,
    score,
    label,
  });
}
