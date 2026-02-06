import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateImage } from '@/lib/claude';
import { calculateSlopIndex } from '@/lib/slopCalculator';
import { TranslateResponse, PhraseMapping, HallucinationFlag, ComplexityLevel } from '@/types';

// --- Rate limiting ---
const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_TEXT_LENGTH = 5000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const requestLog: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;

  while (requestLog.length > 0 && requestLog[0] < oneMinuteAgo) {
    requestLog.shift();
  }

  if (requestLog.length >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }

  requestLog.push(now);
  return false;
}

const VALID_HALLUCINATION_TYPES = new Set([
  'fake_source', 'incomplete_citation', 'suspicious_arxiv', 'fabricated_data', 'unverifiable_claim'
]);
const VALID_SEVERITIES = new Set(['high', 'medium', 'low']);

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited()) {
      return NextResponse.json(
        { error: `Rate limited. Max ${MAX_REQUESTS_PER_MINUTE} requests per minute.` },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Type validation
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const image = typeof body.image === 'string' ? body.image : '';
    const VALID_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    const imageMediaType = typeof body.imageMediaType === 'string' && VALID_IMAGE_TYPES.has(body.imageMediaType)
      ? body.imageMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      : 'image/png';
    const rawLevel = typeof body.level === 'number' ? body.level : 4;
    const level = Math.min(5, Math.max(1, Math.round(rawLevel))) as ComplexityLevel;

    if (!text && !image) {
      return NextResponse.json(
        { error: 'Either text or image is required' },
        { status: 400 }
      );
    }

    if (text && text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters (you sent ${text.length}).` },
        { status: 400 }
      );
    }

    if (image && image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large. Maximum 5MB.' },
        { status: 400 }
      );
    }

    let originalText: string;
    let analysis;

    if (image) {
      const result = await translateImage(image, level, imageMediaType);
      originalText = result.extractedText;
      analysis = result.analysis;
    } else {
      originalText = text;
      analysis = await translateText(originalText, level);
    }

    // Guard against empty extracted text from images
    if (!originalText) {
      return NextResponse.json(
        { error: 'Could not extract text from the image. Try a clearer image or paste the text directly.' },
        { status: 422 }
      );
    }

    const slopIndex = calculateSlopIndex(originalText, analysis);

    // Build mappings with correct indices, handling duplicate phrases
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

    // Validate hallucination types/severities from Claude's response
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
    const message = error instanceof Error ? error.message : 'Translation failed';
    const status = message.includes('timed out') ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
