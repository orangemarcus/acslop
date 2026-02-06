import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { streamTranslateText } from '@/lib/claude';
import { calculateSlopIndex } from '@/lib/slopCalculator';
import { checkQuota, logUsage } from '@/lib/quota';
import { getPlan } from '@/lib/plans';
import { TranslateResponse, PhraseMapping, HallucinationFlag, ComplexityLevel } from '@/types';
import { getCachedTranslation, cacheTranslation } from '@/lib/cache';
import crypto from 'crypto';

const VALID_HALLUCINATION_TYPES = new Set([
  'fake_source', 'incomplete_citation', 'suspicious_arxiv', 'fabricated_data', 'unverifiable_claim'
]);
const VALID_SEVERITIES = new Set(['high', 'medium', 'low']);

// Verify API key and return userId
async function authenticateApiKey(key: string): Promise<{ userId: string; keyId: string } | null> {
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    select: { id: true, userId: true, active: true },
  });

  if (!apiKey || !apiKey.active) return null;

  // Update last used and request count
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date(), requests: { increment: 1 } },
  });

  return { userId: apiKey.userId, keyId: apiKey.id };
}

// POST /api/v1/translate — public REST API for developers
export async function POST(request: NextRequest) {
  // Extract API key from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header. Use: Bearer acslop_...' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const auth = await authenticateApiKey(apiKey);
  if (!auth) {
    return NextResponse.json(
      { error: 'Invalid or revoked API key' },
      { status: 401 }
    );
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'api';

  // Check quota
  const quota = await checkQuota(auth.userId, ipAddress);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. ${quota.used}/${quota.limit} used. Resets in ${quota.resetsIn}.` },
      { status: 429, headers: { 'X-RateLimit-Limit': String(quota.limit), 'X-RateLimit-Remaining': String(Math.max(0, quota.limit - quota.used)), 'X-RateLimit-Reset': quota.resetsIn } }
    );
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const rawLevel = typeof body.level === 'number' ? body.level : 4;
  const level = Math.min(5, Math.max(1, Math.round(rawLevel))) as ComplexityLevel;

  if (!text) {
    return NextResponse.json({ error: 'text field is required' }, { status: 400 });
  }

  // Determine plan limits
  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { plan: true } });
  const plan = getPlan(user?.plan || 'free');

  if (text.length > plan.maxTextLength) {
    return NextResponse.json(
      { error: `Text exceeds maximum length of ${plan.maxTextLength.toLocaleString()} characters for your plan.` },
      { status: 400 }
    );
  }

  // Check cache first
  const cached = await getCachedTranslation(text, level);
  if (cached) {
    return NextResponse.json({
      ...cached,
      _cached: true,
      _quota: { used: quota.used + 1, limit: quota.limit },
    }, {
      headers: {
        'X-RateLimit-Limit': String(quota.limit),
        'X-RateLimit-Remaining': String(Math.max(0, quota.limit - quota.used - 1)),
        'X-Cache': 'HIT',
      },
    });
  }

  const startTime = Date.now();

  try {
    const analysis = await streamTranslateText(text, level, () => {}, new AbortController().signal);
    const slopIndex = calculateSlopIndex(text, analysis);

    const mappings: PhraseMapping[] = [];
    let searchFrom = 0;
    for (const m of analysis.mappings) {
      if (!m.translated || !m.original) continue;
      const startIndex = analysis.translated.indexOf(m.translated, searchFrom);
      if (startIndex >= 0) {
        mappings.push({
          originalPhrase: m.original,
          translatedPhrase: m.translated,
          startIndex,
          endIndex: startIndex + m.translated.length,
          explanation: m.explanation,
        });
        searchFrom = startIndex + m.translated.length;
      }
    }

    const hallucinations: HallucinationFlag[] = (analysis.hallucinations || [])
      .filter((h) => h.text && h.explanation)
      .map((h) => ({
        type: (VALID_HALLUCINATION_TYPES.has(h.type) ? h.type : 'unverifiable_claim') as HallucinationFlag['type'],
        severity: (VALID_SEVERITIES.has(h.severity) ? h.severity : 'medium') as HallucinationFlag['severity'],
        text: h.text,
        explanation: h.explanation,
        suggestion: h.suggestion,
      }));

    const response: TranslateResponse = {
      original: text,
      translated: analysis.translated,
      slopIndex,
      coreClaim: analysis.coreClaim,
      mappings,
      hallucinations,
    };

    // Cache the result
    await cacheTranslation(text, level, response).catch(() => {});

    // Log usage
    await logUsage({
      userId: auth.userId,
      ipAddress,
      endpoint: '/api/v1/translate',
      inputChars: text.length,
      hasImage: false,
      level,
      durationMs: Date.now() - startTime,
      success: true,
    });

    return NextResponse.json({
      ...response,
      _cached: false,
      _quota: { used: quota.used + 1, limit: quota.limit },
    }, {
      headers: {
        'X-RateLimit-Limit': String(quota.limit),
        'X-RateLimit-Remaining': String(Math.max(0, quota.limit - quota.used - 1)),
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    await logUsage({
      userId: auth.userId,
      ipAddress,
      endpoint: '/api/v1/translate',
      inputChars: text.length,
      hasImage: false,
      level,
      durationMs: Date.now() - startTime,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }).catch(() => {});

    return NextResponse.json(
      { error: 'Translation failed. Please try again.' },
      { status: 500 }
    );
  }
}
