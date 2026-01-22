export interface TranslateRequest {
  text?: string;
  image?: string; // Base64 encoded image
  options?: {
    extractClaim?: boolean;
    generateMappings?: boolean;
  };
}

export interface SlopBreakdown {
  passiveVoice: number;      // % of sentences
  nominalizations: number;   // Count of -tion, -ism, -ity words
  hedgeWords: number;        // Count of hedge words
  jargonDensity: number;     // Jargon words per sentence
  sentenceLength: number;    // Avg words per sentence
}

export interface SlopIndex {
  score: number;             // 0-100
  breakdown: SlopBreakdown;
}

export interface PhraseMapping {
  originalPhrase: string;
  translatedPhrase: string;
  startIndex: number;
  endIndex: number;
  explanation?: string;
}

export interface TranslateResponse {
  original: string;
  translated: string;
  slopIndex: SlopIndex;
  coreClaim: string;
  mappings: PhraseMapping[];
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
}
