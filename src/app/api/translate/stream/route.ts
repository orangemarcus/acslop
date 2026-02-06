import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { streamTranslateText, streamTranslateImage } from '@/lib/claude';
import { calculateSlopIndex } from '@/lib/slopCalculator';
import { checkQuota, logUsage } from '@/lib/quota';
import { TranslateResponse, PhraseMapping, HallucinationFlag, ComplexityLevel } from '@/types';

const MAX_TEXT_LENGTH = 5000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// In-memory burst protection (per-process, supplements DB quota)
const burstLog: number[] = [];
const MAX_BURST_PER_MINUTE = 15;

function isBurstLimited(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  while (burstLog.length > 0 && burstLog[0] < oneMinuteAgo) {
    burstLog.shift();
  }
  if (burstLog.length >= MAX_BURST_PER_MINUTE) return true;
  burstLog.push(now);
  return false;
}

function getIpAddress(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

const VALID_HALLUCINATION_TYPES = new Set([
  'fake_source', 'incomplete_citation', 'suspicious_arxiv', 'fabricated_data', 'unverifiable_claim'
]);
const VALID_SEVERITIES = new Set(['high', 'medium', 'low']);

export async function POST(request: NextRequest) {
  // Burst protection
  if (isBurstLimited()) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: 'Too many requests. Please wait a moment.' })}\n\n`,
      { status: 429, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  // Resolve user identity
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id || null;
  const ipAddress = getIpAddress(request);

  // Check quota (DB-backed, per-user or per-IP)
  const quota = await checkQuota(userId, ipAddress);
  if (!quota.allowed) {
    const msg = userId
      ? `Monthly limit reached (${quota.limit} translations). Resets in ${quota.resetsIn}.`
      : `Daily limit reached (${quota.limit} translations). Sign in for 25/month, or wait ${quota.resetsIn}.`;
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: msg, quota: true })}\n\n`,
      { status: 429, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: 'Invalid request body' })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const image = typeof body.image === 'string' ? body.image : '';
  const VALID_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  const imageMediaType = typeof body.imageMediaType === 'string' && VALID_IMAGE_TYPES.has(body.imageMediaType)
    ? body.imageMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    : 'image/png';
  const rawLevel = typeof body.level === 'number' ? body.level : 4;
  const level = Math.min(5, Math.max(1, Math.round(rawLevel))) as ComplexityLevel;

  if (!text && !image) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: 'Either text or image is required' })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  if (text && text.length > MAX_TEXT_LENGTH) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters.` })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  if (image && image.length > MAX_IMAGE_SIZE) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: 'Image too large. Maximum 5MB.' })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const startTime = Date.now();
  const encoder = new TextEncoder();
  const abortController = new AbortController();

  request.signal.addEventListener('abort', () => {
    abortController.abort();
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Send quota info so client can display it
        send('quota', { used: quota.used + 1, limit: quota.limit, resetsIn: quota.resetsIn });
        send('status', { message: 'Connecting to Claude...' });

        let originalText: string;
        let analysis;
        let chunkCount = 0;

        const onDelta = (chunk: string) => {
          chunkCount++;
          if (chunkCount % 3 === 0 || chunk.includes('"translated"')) {
            send('delta', { text: chunk });
          }
          if (chunkCount === 1) {
            send('status', { message: 'Translating...' });
          } else if (chunkCount === 30) {
            send('status', { message: 'Analyzing complexity...' });
          } else if (chunkCount === 60) {
            send('status', { message: 'Checking for hallucinations...' });
          }
        };

        if (image) {
          send('status', { message: 'Processing image...' });
          const result = await streamTranslateImage(
            image, level, imageMediaType, onDelta, abortController.signal
          );
          originalText = result.extractedText;
          analysis = result.analysis;
        } else {
          originalText = text;
          analysis = await streamTranslateText(
            originalText, level, onDelta, abortController.signal
          );
        }

        if (!originalText) {
          send('error', { error: 'Could not extract text from the image.' });

          await logUsage({
            userId, ipAddress, endpoint: '/api/translate/stream',
            inputChars: text.length, hasImage: !!image, level,
            durationMs: Date.now() - startTime, success: false,
            error: 'Empty image extraction',
          });

          controller.close();
          return;
        }

        send('status', { message: 'Computing slop index...' });

        const slopIndex = calculateSlopIndex(originalText, analysis);

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
          original: originalText,
          translated: analysis.translated,
          slopIndex,
          coreClaim: analysis.coreClaim,
          mappings,
          hallucinations,
        };

        send('done', response);

        // Log successful usage
        await logUsage({
          userId, ipAddress, endpoint: '/api/translate/stream',
          inputChars: originalText.length, hasImage: !!image, level,
          durationMs: Date.now() - startTime, success: true,
        });
      } catch (err) {
        const durationMs = Date.now() - startTime;

        if (abortController.signal.aborted) {
          send('error', { error: 'Request cancelled' });
        } else {
          console.error('Streaming translation error:', err);
          const message = err instanceof Error ? err.message : 'Translation failed';
          send('error', { error: message });
        }

        // Log failed usage
        await logUsage({
          userId, ipAddress, endpoint: '/api/translate/stream',
          inputChars: text.length, hasImage: !!image, level, durationMs,
          success: false, error: err instanceof Error ? err.message : 'Unknown error',
        }).catch(() => {}); // Don't fail the stream on logging errors
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
