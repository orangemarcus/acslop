import { ClaudeAnalysis, SlopIndex, SlopBreakdown } from '@/types';

/**
 * Count sentences, handling common abbreviations in academic text.
 * Avoids splitting on "e.g.", "i.e.", "Dr.", "et al.", decimal numbers, etc.
 */
function countSentences(text: string): number {
  // Replace common abbreviations with placeholders to avoid false splits
  const cleaned = text
    .replace(/\b(e\.g|i\.e|et al|vs|Dr|Mr|Mrs|Ms|Prof|Fig|Eq|No|Vol)\./gi, '$1\u0000')
    .replace(/\d+\.\d+/g, 'NUM'); // decimals like 3.14

  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 5);
  return Math.max(sentences.length, 1);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function avgSentenceLength(text: string): number {
  const sentences = countSentences(text);
  const words = countWords(text);
  return Math.round(words / sentences);
}

export function calculateSlopIndex(
  originalText: string,
  analysis: ClaudeAnalysis
): SlopIndex {
  const sentenceCount = countSentences(originalText);

  const passiveExamples = analysis.slopAnalysis?.passiveVoiceExamples || [];
  const nominalizations = analysis.slopAnalysis?.nominalizationsFound || [];
  const hedgeWordsList = analysis.slopAnalysis?.hedgeWordsFound || [];
  const jargonList = analysis.slopAnalysis?.unnecessaryJargon || [];

  const passiveVoice = Math.round(
    (passiveExamples.length / sentenceCount) * 100
  );

  const jargonDensity = Math.round((jargonList.length / sentenceCount) * 10) / 10;
  const sentenceLength = avgSentenceLength(originalText);

  const breakdown: SlopBreakdown = {
    passiveVoice: Math.min(passiveVoice, 100),
    nominalizations: nominalizations.length,
    hedgeWords: hedgeWordsList.length,
    jargonDensity,
    sentenceLength,
  };

  // Weighted scoring (0-100):
  const passiveScore = Math.min(passiveVoice / 4, 25);
  const nominalizationScore = Math.min(nominalizations.length * 2, 20);
  const hedgeScore = Math.min(hedgeWordsList.length * 3, 15);
  const jargonScore = Math.min(jargonDensity * 5, 25);
  const lengthScore = Math.min(Math.max(sentenceLength - 15, 0), 15);

  const score = Math.round(
    passiveScore + nominalizationScore + hedgeScore + jargonScore + lengthScore
  );

  return {
    score: Math.min(score, 100),
    breakdown,
  };
}

export function getSlopLabel(score: number): string {
  if (score < 20) return 'Remarkably Clear';
  if (score < 40) return 'Fairly Readable';
  if (score < 60) return 'Academic Normal';
  if (score < 80) return 'Dense & Pretentious';
  return 'Maximum Slop';
}

export function getSlopColor(score: number): string {
  if (score < 20) return '#22c55e';
  if (score < 40) return '#84cc16';
  if (score < 60) return '#eab308';
  if (score < 80) return '#f97316';
  return '#ef4444';
}
