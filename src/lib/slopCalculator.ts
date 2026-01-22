import { ClaudeAnalysis, SlopIndex, SlopBreakdown } from '@/types';

// Count sentences in text
function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return Math.max(sentences.length, 1);
}

// Count words in text
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Calculate average sentence length
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

  // Calculate breakdown metrics
  const passiveVoice = Math.round(
    (analysis.slopAnalysis.passiveVoiceExamples.length / sentenceCount) * 100
  );

  const nominalizations = analysis.slopAnalysis.nominalizationsFound.length;
  const hedgeWords = analysis.slopAnalysis.hedgeWordsFound.length;
  const jargonCount = analysis.slopAnalysis.unnecessaryJargon.length;
  const jargonDensity = Math.round((jargonCount / sentenceCount) * 10) / 10;
  const sentenceLength = avgSentenceLength(originalText);

  const breakdown: SlopBreakdown = {
    passiveVoice: Math.min(passiveVoice, 100),
    nominalizations,
    hedgeWords,
    jargonDensity,
    sentenceLength,
  };

  // Calculate overall score (0-100)
  // Weighted formula:
  // - Passive voice: up to 25 points (1 point per 4% passive)
  // - Nominalizations: up to 20 points (2 points each, max 10)
  // - Hedge words: up to 15 points (3 points each, max 5)
  // - Jargon density: up to 25 points (5 points per jargon/sentence)
  // - Sentence length: up to 15 points (1 point per word over 15)

  const passiveScore = Math.min(passiveVoice / 4, 25);
  const nominalizationScore = Math.min(nominalizations * 2, 20);
  const hedgeScore = Math.min(hedgeWords * 3, 15);
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
  if (score < 20) return '#22c55e'; // green
  if (score < 40) return '#84cc16'; // lime
  if (score < 60) return '#eab308'; // yellow
  if (score < 80) return '#f97316'; // orange
  return '#ef4444'; // red
}
