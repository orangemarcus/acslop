import Anthropic from '@anthropic-ai/sdk';
import { ClaudeAnalysis } from '@/types';
import { TRANSLATION_SYSTEM_PROMPT, buildTranslationPrompt, buildImagePrompt } from './prompts';

const anthropic = new Anthropic();

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export async function translateText(text: string): Promise<ClaudeAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildTranslationPrompt(text),
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    return JSON.parse(content.text) as ClaudeAnalysis;
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }
}

export async function translateImage(
  base64Image: string,
  mediaType: ImageMediaType = 'image/png'
): Promise<{ extractedText: string; analysis: ClaudeAnalysis }> {
  // First, extract text from image and translate in one call
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: buildImagePrompt(true),
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
            text: `Extract all text from this image and then translate it into plain English.

Provide your response as JSON with this exact structure:
{
  "extractedText": "The original text extracted from the image",
  "translated": "The plain English translation",
  "coreClaim": "One sentence: what is this actually saying?",
  "slopAnalysis": {
    "passiveVoiceExamples": ["list of passive constructions found"],
    "nominalizationsFound": ["list of -tion/-ism/-ity words that could be verbs"],
    "hedgeWordsFound": ["perhaps", "it could be argued", etc],
    "unnecessaryJargon": [{"jargon": "jargon word", "plain": "plain equivalent"}]
  },
  "mappings": [
    {
      "original": "original jargon phrase",
      "translated": "plain version",
      "explanation": "why this is slop"
    }
  ]
}`,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    const parsed = JSON.parse(content.text);
    const { extractedText, ...analysis } = parsed;
    return {
      extractedText: extractedText || '',
      analysis: analysis as ClaudeAnalysis,
    };
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }
}
