'use client';

interface FieldDetectorProps {
  text: string;
}

interface FieldMatch {
  field: string;
  confidence: 'high' | 'medium';
  color: string;
  icon: string;
}

const FIELD_PATTERNS: Array<{
  field: string;
  keywords: RegExp;
  color: string;
  icon: string;
}> = [
  {
    field: 'Medicine & Health',
    keywords: /\b(clinical|patient|diagnosis|therapeutic|pathology|epidemiol|pharma|symptom|treatment|disease|medical|surgery|tumor|cancer|cardiac|neural|biomarker|randomized|placebo|dosage|morbidity|mortality)\b/i,
    color: '#ef4444',
    icon: 'medical',
  },
  {
    field: 'Computer Science',
    keywords: /\b(algorithm|neural network|machine learning|deep learning|computational|software|database|NLP|transformer|GPU|latency|throughput|optimization|heuristic|classifier|convolutional|recurrent|gradient|backpropagation|embedding)\b/i,
    color: '#3b82f6',
    icon: 'code',
  },
  {
    field: 'Physics',
    keywords: /\b(quantum|relativity|thermodynamic|entropy|boson|fermion|photon|wavelength|electromagnetic|gravitational|kinetic|particle|accelerator|dark matter|dark energy|superconducti|oscillat|spectroscop)\b/i,
    color: '#8b5cf6',
    icon: 'atom',
  },
  {
    field: 'Biology',
    keywords: /\b(gene|protein|cell|organism|species|evolution|ecology|genome|transcription|ribosom|mitochond|enzyme|metabol|phylogene|DNA|RNA|CRISPR|mutation|phenotype|genotype)\b/i,
    color: '#22c55e',
    icon: 'dna',
  },
  {
    field: 'Chemistry',
    keywords: /\b(molecule|reaction|catalyst|synthesis|polymer|compound|solution|acid|base|oxidat|reduct|spectro|crystallin|ionic|covalent|stoichiometr|reagent|titrat|molar)\b/i,
    color: '#f59e0b',
    icon: 'flask',
  },
  {
    field: 'Psychology',
    keywords: /\b(cognitive|behavioral|perception|consciousness|emotion|motivation|neuropsych|psychopath|attachment|developmental|stimulus|conditioning|heuristic|bias|self-efficacy|anxiety|depression|therapeutic|longitudinal)\b/i,
    color: '#ec4899',
    icon: 'brain',
  },
  {
    field: 'Economics',
    keywords: /\b(market|equilibrium|monetary|fiscal|inflation|GDP|macroeconomi|microeconomi|elasticit|utility|marginal|externality|capital|labor|supply|demand|arbitrage|portfolio|hedge)\b/i,
    color: '#14b8a6',
    icon: 'chart',
  },
  {
    field: 'Mathematics',
    keywords: /\b(theorem|proof|conjecture|topology|algebra|manifold|differential|integral|eigenvalue|matrix|vector|polynomial|convergence|isomorphism|homomorphism|Hilbert|Banach|stochastic)\b/i,
    color: '#6366f1',
    icon: 'math',
  },
  {
    field: 'Environmental Science',
    keywords: /\b(climate|carbon|emission|ecosystem|biodiversity|deforest|renewable|sustainab|pollution|ozone|greenhouse|habitat|conservation|watershed|atmospheric)\b/i,
    color: '#059669',
    icon: 'leaf',
  },
  {
    field: 'Social Sciences',
    keywords: /\b(sociological|ethnograph|demograph|inequalit|governance|institution|discourse|hegemony|intersectional|qualitative|quantitative|survey|cohort|stratif|cultural|migration)\b/i,
    color: '#d97706',
    icon: 'people',
  },
];

function detectField(text: string): FieldMatch | null {
  const scores: Array<{ field: typeof FIELD_PATTERNS[0]; count: number }> = [];

  for (const pattern of FIELD_PATTERNS) {
    const matches = text.match(new RegExp(pattern.keywords.source, 'gi'));
    if (matches) {
      scores.push({ field: pattern, count: matches.length });
    }
  }

  if (scores.length === 0) return null;

  scores.sort((a, b) => b.count - a.count);
  const best = scores[0];

  if (best.count < 2) return null;

  return {
    field: best.field.field,
    confidence: best.count >= 5 ? 'high' : 'medium',
    color: best.field.color,
    icon: best.field.icon,
  };
}

function FieldIcon({ icon, color }: { icon: string; color: string }) {
  const className = 'w-4 h-4';
  const style = { color };

  switch (icon) {
    case 'medical':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
    case 'code':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
    case 'atom':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2" strokeWidth={1.5} /><path strokeLinecap="round" strokeWidth={1.5} d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" /><path strokeLinecap="round" strokeWidth={1.5} d="M2 12h20" /></svg>;
    case 'dna':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    case 'flask':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    case 'brain':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>;
    case 'chart':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h4l3-9 4 18 3-9h4" /></svg>;
    case 'math':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.105.401l1.444-.889" /></svg>;
    case 'leaf':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
    case 'people':
      return <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
    default:
      return null;
  }
}

export default function FieldDetector({ text }: FieldDetectorProps) {
  const match = detectField(text);

  if (!match) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        borderColor: match.color + '40',
        backgroundColor: match.color + '10',
        color: match.color,
      }}
    >
      <FieldIcon icon={match.icon} color={match.color} />
      {match.field}
      {match.confidence === 'high' && (
        <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </div>
  );
}
