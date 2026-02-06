import crypto from 'crypto';
import { prisma } from './prisma';
import { TranslateResponse } from '@/types';

// Generate a deterministic hash for input text + level
function computeHash(text: string, level: number): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(`${level}:${normalized}`).digest('hex');
}

/** Look up a cached translation. Returns null on miss. */
export async function getCachedTranslation(
  text: string,
  level: number
): Promise<TranslateResponse | null> {
  const hash = computeHash(text, level);

  const cached = await prisma.translationCache.findUnique({
    where: { inputHash: hash },
  });

  if (!cached) return null;

  // Increment hit count (fire-and-forget)
  prisma.translationCache
    .update({ where: { id: cached.id }, data: { hits: { increment: 1 } } })
    .catch(() => {});

  try {
    return JSON.parse(cached.result) as TranslateResponse;
  } catch {
    return null;
  }
}

/** Store a translation in the cache. */
export async function cacheTranslation(
  text: string,
  level: number,
  result: TranslateResponse
): Promise<void> {
  const hash = computeHash(text, level);

  await prisma.translationCache.upsert({
    where: { inputHash: hash },
    update: {
      result: JSON.stringify(result),
      slopScore: result.slopIndex.score,
      updatedAt: new Date(),
    },
    create: {
      inputHash: hash,
      inputText: text.slice(0, 500), // Store truncated for reference
      level,
      result: JSON.stringify(result),
      slopScore: result.slopIndex.score,
    },
  });
}
