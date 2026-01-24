import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateImage } from '@/lib/claude';
import { calculateSlopIndex } from '@/lib/slopCalculator';
import { TranslateRequest, TranslateResponse, PhraseMapping, HallucinationFlag } from '@/types';

// --- Rate limiting ---
const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_TEXT_LENGTH = 5000; // characters
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in base64 chars (roughly)
const requestLog: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;

  // Remove entries older than 1 minute
  while (requestLog.length > 0 && requestLog[0] < oneMinuteAgo) {
    requestLog.shift();
  }

  if (requestLog.length >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }

  requestLog.push(now);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    if (isRateLimited()) {
      return NextResponse.json(
        { error: `Rate limited. Max ${MAX_REQUESTS_PER_MINUTE} requests per minute.` },
        { status: 429 }
      );
    }

    const body: TranslateRequest = await request.json();

    if (!body.text && !body.image) {
      return NextResponse.json(
        { error: 'Either text or image is required' },
        { status: 400 }
      );
    }

    // Input size limits
    if (body.text && body.text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters (you sent ${body.text.length}).` },
        { status: 400 }
      );
    }

    if (body.image && body.image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large. Maximum 5MB.' },
        { status: 400 }
      );
    }

    let originalText: string;
    let analysis;

    if (body.image) {
      const result = await translateImage(body.image);
      originalText = result.extractedText;
      analysis = result.analysis;
    } else {
      originalText = body.text!;
      analysis = await translateText(originalText);
    }

    const slopIndex = calculateSlopIndex(originalText, analysis);

    const mappings: PhraseMapping[] = analysis.mappings.map((m) => {
      const startIndex = analysis.translated.indexOf(m.translated);
      return {
        originalPhrase: m.original,
        translatedPhrase: m.translated,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: startIndex >= 0 ? startIndex + m.translated.length : 0,
        explanation: m.explanation,
      };
    });

    const hallucinations: HallucinationFlag[] = (analysis.hallucinations || []).map((h) => ({
      type: h.type as HallucinationFlag['type'],
      severity: h.severity as HallucinationFlag['severity'],
      text: h.text,
      explanation: h.explanation,
      suggestion: h.suggestion,
    }));

    const response: TranslateResponse = {
      original: originalText,
      translated: analysis.translated,
      slopIndex,
      coreClaim: analysis.coreClaim,
      mappings,
      hallucinations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}
