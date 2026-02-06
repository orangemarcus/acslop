export type ComplexityLevel = 1 | 2 | 3 | 4 | 5;

export interface TranslateRequest {
  text?: string;
  image?: string;
  level?: ComplexityLevel; // 1 = very simple, 5 = detailed (default: 4)
}

export interface SlopBreakdown {
  passiveVoice: number;
  nominalizations: number;
  hedgeWords: number;
  jargonDensity: number;
  sentenceLength: number;
}

export interface SlopIndex {
  score: number;
  breakdown: SlopBreakdown;
}

export interface PhraseMapping {
  originalPhrase: string;
  translatedPhrase: string;
  startIndex: number;
  endIndex: number;
  explanation?: string;
}

export interface HallucinationFlag {
  type: 'fake_source' | 'incomplete_citation' | 'suspicious_arxiv' | 'fabricated_data' | 'unverifiable_claim';
  severity: 'high' | 'medium' | 'low';
  text: string;
  explanation: string;
  suggestion?: string;
}

export interface TranslateResponse {
  original: string;
  translated: string;
  slopIndex: SlopIndex;
  coreClaim: string;
  mappings: PhraseMapping[];
  hallucinations: HallucinationFlag[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputText: string;
  level: ComplexityLevel;
  result: TranslateResponse;
}

export interface ClaudeAnalysis {
  translated: string;
  coreClaim: string;
  slopAnalysis: {
    passiveVoiceExamples: string[];
    nominalizationsFound: string[];
    hedgeWordsFound: string[];
    unnecessaryJargon: Array<{ jargon: string; plain: string }>;
  };
  mappings: Array<{
    original: string;
    translated: string;
    explanation: string;
  }>;
  hallucinations: Array<{
    type: string;
    severity: string;
    text: string;
    explanation: string;
    suggestion?: string;
  }>;
}
