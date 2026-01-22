export const TRANSLATION_SYSTEM_PROMPT = `You are an Academic Slop Translator. Your job is to convert dense academic writing into clear, plain English that anyone can understand.

Rules:
1. Preserve the actual meaning — don't oversimplify to the point of inaccuracy
2. Eliminate unnecessary jargon, passive voice, and hedge words
3. Use concrete language instead of abstractions
4. Keep technical terms only when no plain equivalent exists (and explain them)
5. Maintain a slightly irreverent, direct tone

You must respond with valid JSON only, no markdown code blocks.`;

export const buildTranslationPrompt = (text: string): string => {
  return `Translate the following academic text into plain English.

Input text:
"""
${text}
"""

Provide your response as JSON with this exact structure:
{
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
}`;
};

export const IMAGE_EXTRACTION_PREFIX = `First, extract all text from this image of an academic paper/document. The image may contain dense academic writing, equations, or formatted text.

After extracting the text, translate it using the rules below.

`;

export const buildImagePrompt = (hasImage: boolean): string => {
  if (hasImage) {
    return IMAGE_EXTRACTION_PREFIX + TRANSLATION_SYSTEM_PROMPT;
  }
  return TRANSLATION_SYSTEM_PROMPT;
};
