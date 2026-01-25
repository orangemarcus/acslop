import { ComplexityLevel } from '@/types';

// Levels correspond to context preservation: 10%, 30%, 50%, 70%, 90%
const LEVEL_INSTRUCTIONS: Record<ComplexityLevel, string> = {
  1: `LEVEL 1 - MINIMAL (10% context):
- Write 1-2 sentences only
- Absolute core point, nothing else
- Use words a child would understand
- Strip ALL nuance, caveats, and details
- Think: "What's the one thing they need to know?"`,

  2: `LEVEL 2 - SIMPLE (30% context):
- Write 3-5 sentences
- Main claim plus one key reason/evidence
- High school vocabulary
- Skip most technical details and qualifications
- Keep it digestible but informative`,

  3: `LEVEL 3 - BALANCED (50% context):
- Write 1-2 substantial paragraphs
- Main argument with key supporting points
- Explain technical terms when they appear
- Include the most important caveats
- Balance between simplicity and completeness`,

  4: `LEVEL 4 - DETAILED (70% context):
- Preserve most of the original meaning
- Multiple paragraphs as needed
- Explain all jargon and technical concepts
- Keep important qualifications and limitations
- Suitable for a university student who wants to understand the paper`,

  5: `LEVEL 5 - COMPREHENSIVE (90% context):
- Preserve nearly all meaning and nuance
- Full translation paragraph by paragraph if needed
- Deep explanations of all concepts
- Keep all caveats, limitations, methodology notes
- Reader should understand almost everything from the original`,
};

export function getSystemPrompt(level: ComplexityLevel): string {
  return `You are an Academic Paper Translator. Your job is to make dense academic writing understandable.

${LEVEL_INSTRUCTIONS[level]}

IMPORTANT: Match the translation length to the context percentage. Level 3 (50%) should be roughly half the detail of the original, not 2 sentences.

Additionally, check for potential hallucination indicators:
- Citations with placeholder IDs (e.g., arXiv:XXXX.XXXX, arXiv:2305.XXXX)
- References to papers/authors that seem fabricated or have incomplete bibliographic info
- Suspiciously round or convenient data points
- Incomplete citations missing year, title, or publication venue

Respond with valid JSON only, no markdown code blocks.`;
}

export function buildTranslationPrompt(text: string, level: ComplexityLevel): string {
  const contextPercent = [10, 30, 50, 70, 90][level - 1];

  return `Translate the following academic text at complexity level ${level} (${contextPercent}% context preservation).

Input text:
"""
${text}
"""

Respond with JSON:
{
  "translated": "Your translation - length should reflect ${contextPercent}% context preservation",
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
  const contextPercent = [10, 30, 50, 70, 90][level - 1];

  return `Analyze this academic image and explain what it means in plain English at complexity level ${level} (${contextPercent}% context preservation).

This could be:
- A FIGURE/CHART/GRAPH: Explain what it shows, what the axes mean, what trends or patterns are visible, and what conclusion the reader should draw
- An EQUATION/FORMULA: Explain what each symbol means, what the equation calculates, and why it matters
- A DIAGRAM/FLOWCHART: Explain the process or relationship being illustrated
- A TABLE: Summarize the key findings and what they mean
- TEXT from a paper: Translate the academic jargon into plain English

${LEVEL_INSTRUCTIONS[level]}

IMPORTANT:
- Don't just describe what you see - EXPLAIN what it MEANS
- If it's a graph, tell me what story the data tells
- If it's an equation, tell me what it calculates in plain words
- Match explanation length to ${contextPercent}% context preservation

Respond with JSON:
{
  "extractedText": "Any text/labels visible in the image, or description of visual elements",
  "translated": "Your explanation of what this image means and why it matters - not just a description, but an INTERPRETATION",
  "coreClaim": "One sentence: the key takeaway from this image",
  "slopAnalysis": {"passiveVoiceExamples": [], "nominalizationsFound": [], "hedgeWordsFound": [], "unnecessaryJargon": []},
  "mappings": [{"original": "technical term/symbol", "translated": "plain meaning", "explanation": "context"}],
  "hallucinations": []
}`;
}
