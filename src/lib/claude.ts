import Anthropic from '@anthropic-ai/sdk';
import { ClaudeAnalysis } from '@/types';
import { TRANSLATION_SYSTEM_PROMPT, buildTranslationPrompt, buildImagePrompt } from './prompts';

const anthropic = new Anthropic();

const API_TIMEOUT_MS = 60_000; // 60 seconds

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

/**
 * Extract JSON from Claude's response, handling cases where
 * the model wraps it in markdown code blocks despite instructions.
 */
function extractJSON(text: string): string {
  // Try to find JSON in a code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Otherwise assume the whole response is JSON
  return text.trim();
}

/**
 * Parse Claude's response with null-safety defaults for all expected fields.
 */
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

export async function translateText(text: string): Promise<ClaudeAnalysis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: TRANSLATION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildTranslationPrompt(text),
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
  mediaType: ImageMediaType = 'image/png'
): Promise<{ extractedText: string; analysis: ClaudeAnalysis }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: buildImagePrompt(),
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
                text: `Extract all text from this image, then translate it for a first-year university student and check for hallucinations.

Respond with JSON only (no code blocks):
{
  "extractedText": "The original text extracted from the image",
  "translated": "The clear, student-friendly translation",
  "coreClaim": "One clear sentence explaining the main argument or finding",
  "slopAnalysis": {
    "passiveVoiceExamples": [],
    "nominalizationsFound": [],
    "hedgeWordsFound": [],
    "unnecessaryJargon": []
  },
  "mappings": [],
  "hallucinations": []
}`,
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
