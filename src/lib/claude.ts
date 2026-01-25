import Anthropic from '@anthropic-ai/sdk';
import { ClaudeAnalysis, ComplexityLevel } from '@/types';
import { getSystemPrompt, buildTranslationPrompt, buildImagePrompt } from './prompts';

const anthropic = new Anthropic();

const API_TIMEOUT_MS = 90_000; // 90 seconds (Haiku is faster)

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

// Use Haiku 4.5 for speed and quality
const MODEL = 'claude-haiku-4-5-20251022';

function extractJSON(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return text.trim();
}

function parseAnalysis(raw: Record<string, unknown>): ClaudeAnalysis {
  const slopAnalysis = (raw.slopAnalysis as Record<string, unknown>) || {};

  return {
    translated: typeof raw.translated === 'string' ? raw.translated : '',
    coreClaim: typeof raw.coreClaim === 'string' ? raw.coreClaim : '',
    slopAnalysis: {
      passiveVoiceExamples: Array.isArray(slopAnalysis.passiveVoiceExamples)
        ? slopAnalysis.passiveVoiceExamples
        : [],
      nominalizationsFound: Array.isArray(slopAnalysis.nominalizationsFound)
        ? slopAnalysis.nominalizationsFound
        : [],
      hedgeWordsFound: Array.isArray(slopAnalysis.hedgeWordsFound)
        ? slopAnalysis.hedgeWordsFound
        : [],
      unnecessaryJargon: Array.isArray(slopAnalysis.unnecessaryJargon)
        ? slopAnalysis.unnecessaryJargon
        : [],
    },
    mappings: Array.isArray(raw.mappings) ? raw.mappings : [],
    hallucinations: Array.isArray(raw.hallucinations) ? raw.hallucinations : [],
  };
}

export async function translateText(
  text: string,
  level: ComplexityLevel = 4
): Promise<ClaudeAnalysis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: 4096,
        system: getSystemPrompt(level),
        messages: [
          {
            role: 'user',
            content: buildTranslationPrompt(text, level),
          },
        ],
      },
      { signal: controller.signal }
    );

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Empty or non-text response from Claude');
    }

    const jsonStr = extractJSON(content.text);
    const parsed = JSON.parse(jsonStr);
    return parseAnalysis(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Claude API request timed out');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse Claude response as JSON');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function translateImage(
  base64Image: string,
  level: ComplexityLevel = 4,
  mediaType: ImageMediaType = 'image/png'
): Promise<{ extractedText: string; analysis: ClaudeAnalysis }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: 4096,
        system: getSystemPrompt(level),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: buildImagePrompt(level),
              },
            ],
          },
        ],
      },
      { signal: controller.signal }
    );

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Empty or non-text response from Claude');
    }

    const jsonStr = extractJSON(content.text);
    const parsed = JSON.parse(jsonStr);
    const extractedText = typeof parsed.extractedText === 'string' ? parsed.extractedText : '';

    return {
      extractedText,
      analysis: parseAnalysis(parsed),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Claude API request timed out');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse Claude response as JSON');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
