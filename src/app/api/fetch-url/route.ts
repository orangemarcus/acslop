import { NextRequest, NextResponse } from 'next/server';

const MAX_CONTENT_LENGTH = 50_000; // 50KB of text content max
const FETCH_TIMEOUT = 10_000; // 10 seconds

function extractTextFromHTML(html: string): string {
  // Remove script, style, nav, header, footer tags and their contents
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  // Replace block-level tags with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|br|tr|blockquote|section|article)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));

  // Collapse whitespace
  text = text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n');

  return text.trim();
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ACSlopBot/1.0; Academic text extractor)',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (HTTP ${response.status})` },
        { status: 422 }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
      return NextResponse.json(
        { error: 'URL does not point to a readable text page' },
        { status: 422 }
      );
    }

    const rawText = await response.text();

    let extracted: string;
    if (contentType.includes('text/plain')) {
      extracted = rawText.slice(0, MAX_CONTENT_LENGTH);
    } else {
      extracted = extractTextFromHTML(rawText);
    }

    // Trim to reasonable size
    if (extracted.length > MAX_CONTENT_LENGTH) {
      extracted = extracted.slice(0, MAX_CONTENT_LENGTH);
    }

    if (extracted.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from this URL' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: extracted,
      title: extractTitle(rawText),
      charCount: extracted.length,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'URL fetch timed out' }, { status: 408 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch URL content' },
      { status: 500 }
    );
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (match) {
    return match[1].replace(/<[^>]+>/g, '').trim().slice(0, 200);
  }
  return '';
}
