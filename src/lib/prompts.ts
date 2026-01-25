import { ComplexityLevel } from '@/types';

const LEVEL_INSTRUCTIONS: Record<ComplexityLevel, string> = {
  1: `LEVEL 1 - ULTRA SIMPLE:
- Write 2-3 sentences max
- Use only everyday words a 10-year-old would know
- Skip all nuance and caveats
- Just give the core point in the simplest possible way
- No jargon whatsoever`,

  2: `LEVEL 2 - SIMPLE:
- Write a short paragraph (3-5 sentences)
- Use simple language suitable for a high schooler
- Include only the main claim and one key supporting point
- Minimal technical terms (explain any you must use)`,

  3: `LEVEL 3 - BALANCED:
- Write 1-2 paragraphs
- Suitable for an educated non-specialist
- Keep the main argument and key supporting evidence
- Brief explanations of technical concepts
- Skip minor details and qualifications`,

  4: `LEVEL 4 - DETAILED (DEFAULT):
- Preserve ~80% of the original meaning and context
- Suitable for a first-year university student
- Explain all technical terms
- Keep important caveats and qualifications
- Maintain the logical structure of the argument`,

  5: `LEVEL 5 - COMPREHENSIVE:
- Preserve nearly all meaning, context, and nuance
- Suitable for someone who wants to deeply understand the paper
- Full explanations of all concepts
- Keep all caveats, limitations, and qualifications
- Maintain complete logical structure with examples where helpful`,
};

export function getSystemPrompt(level: ComplexityLevel): string {
  return `You are an Academic Paper Translator. Your job is to make dense academic writing understandable.

${LEVEL_INSTRUCTIONS[level]}

Additionally, check for potential hallucination indicators:
- Citations with placeholder IDs (e.g., arXiv:XXXX.XXXX, arXiv:2305.XXXX)
- References to papers/authors that seem fabricated or have incomplete bibliographic info
- Suspiciously round or convenient data points
- Incomplete citations missing year, title, or publication venue

Respond with valid JSON only, no markdown code blocks.`;
}

export function buildTranslationPrompt(text: string, level: ComplexityLevel): string {
  return `Translate the following academic text at complexity level ${level}.

Input text:
"""
${text}
"""

Respond with JSON:
{
  "translated": "Your translation following the level ${level} guidelines",
  "coreClaim": "One clear sentence: the main point",
  "slopAnalysis": {
    "passiveVoiceExamples": [],
    "nominalizationsFound": [],
    "hedgeWordsFound": [],
    "unnecessaryJargon": [{"jargon": "term", "plain": "simple version"}]
  },
  "mappings": [{"original": "jargon phrase", "translated": "plain version", "explanation": "why it obscures meaning"}],
  "hallucinations": [{"type": "fake_source|incomplete_citation|suspicious_arxiv|fabricated_data|unverifiable_claim", "severity": "high|medium|low", "text": "problematic text", "explanation": "why suspicious", "suggestion": "how to verify"}]
}

Empty arrays are fine if nothing found.`;
}

export function buildImagePrompt(level: ComplexityLevel): string {
  return `First extract all text from this image, then translate it at complexity level ${level}.

${LEVEL_INSTRUCTIONS[level]}

Respond with JSON:
{
  "extractedText": "The text from the image",
  "translated": "Your translation",
  "coreClaim": "One sentence main point",
  "slopAnalysis": {"passiveVoiceExamples": [], "nominalizationsFound": [], "hedgeWordsFound": [], "unnecessaryJargon": []},
  "mappings": [],
  "hallucinations": []
}`;
}
