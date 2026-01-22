import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateImage } from '@/lib/claude';
import { calculateSlopIndex } from '@/lib/slopCalculator';
import { TranslateRequest, TranslateResponse, PhraseMapping } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();

    if (!body.text && !body.image) {
      return NextResponse.json(
        { error: 'Either text or image is required' },
        { status: 400 }
      );
    }

    let originalText: string;
    let analysis;

    if (body.image) {
      // Handle image input
      const result = await translateImage(body.image);
      originalText = result.extractedText;
      analysis = result.analysis;
    } else {
      // Handle text input
      originalText = body.text!;
      analysis = await translateText(originalText);
    }

    // Calculate slop index from the analysis
    const slopIndex = calculateSlopIndex(originalText, analysis);

    // Build phrase mappings with positions in translated text
    const mappings: PhraseMapping[] = analysis.mappings.map((m) => {
      const startIndex = analysis.translated.indexOf(m.translated);
      return {
        originalPhrase: m.original,
        translatedPhrase: m.translated,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: startIndex >= 0 ? startIndex + m.translated.length : 0,
        explanation: m.explanation,
      };
    });

    const response: TranslateResponse = {
      original: originalText,
      translated: analysis.translated,
      slopIndex,
      coreClaim: analysis.coreClaim,
      mappings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}
