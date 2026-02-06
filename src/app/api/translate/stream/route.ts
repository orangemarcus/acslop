import { NextRequest } from 'next/server';
import { streamTranslateText, streamTranslateImage } from '@/lib/claude';
import { calculateSlopIndex } from '@/lib/slopCalculator';
import { TranslateResponse, PhraseMapping, HallucinationFlag, ComplexityLevel } from '@/types';

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
  if (requestLog.length >= MAX_REQUESTS_PER_MINUTE) return true;
  requestLog.push(now);
  return false;
}

const VALID_HALLUCINATION_TYPES = new Set([
  'fake_source', 'incomplete_citation', 'suspicious_arxiv', 'fabricated_data', 'unverifiable_claim'
]);
const VALID_SEVERITIES = new Set(['high', 'medium', 'low']);

export async function POST(request: NextRequest) {
  if (isRateLimited()) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: `Rate limited. Max ${MAX_REQUESTS_PER_MINUTE} requests per minute.` })}\n\n`,
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
        send('status', { message: 'Connecting to Claude...' });

        let originalText: string;
        let analysis;
        let chunkCount = 0;

        const onDelta = (chunk: string) => {
          chunkCount++;
          // Send delta events (throttled to every 3rd chunk to reduce overhead)
          if (chunkCount % 3 === 0 || chunk.includes('"translated"')) {
            send('delta', { text: chunk });
          }
          // Send status updates at milestones
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
      } catch (err) {
        if (abortController.signal.aborted) {
          send('error', { error: 'Request cancelled' });
        } else {
          console.error('Streaming translation error:', err);
          const message = err instanceof Error ? err.message : 'Translation failed';
          send('error', { error: message });
        }
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
