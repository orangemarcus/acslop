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
    const parsed = JSON.parse(content.text) as ClaudeAnalysis;
    // Ensure hallucinations array exists
    if (!parsed.hallucinations) {
      parsed.hallucinations = [];
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }
}

export async function translateImage(
  base64Image: string,
  mediaType: ImageMediaType = 'image/png'
): Promise<{ extractedText: string; analysis: ClaudeAnalysis }> {
  const response = await anthropic.messages.create({
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

Provide your response as JSON with this exact structure:
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
  "mappings": [
    {
      "original": "original phrase",
      "translated": "plain version",
      "explanation": "why it obscures meaning"
    }
  ],
  "hallucinations": [
    {
      "type": "fake_source|incomplete_citation|suspicious_arxiv|fabricated_data|unverifiable_claim",
      "severity": "high|medium|low",
      "text": "problematic text",
      "explanation": "why suspicious",
      "suggestion": "how to verify"
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
    if (!analysis.hallucinations) {
      analysis.hallucinations = [];
    }
    return {
      extractedText: extractedText || '',
      analysis: analysis as ClaudeAnalysis,
    };
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }
}
