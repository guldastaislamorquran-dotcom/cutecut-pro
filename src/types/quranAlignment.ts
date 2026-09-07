export type AlignmentMode = 'full-ayah' | 'split-breaths' | 'cut-ayah' | 'hybrid';

export type AlignmentMethodLabel = 
  | 'DIRECT' 
  | 'REFINED' 
  | 'INFERRED' 
  | 'LOW-CONFIDENCE' 
  | 'HYBRID-REFERENCE'
  | 'ABSTAIN'
  | 'NEED_REALIGNMENT';

export interface QuranWordAlignment {
  wordIndex: number;
  rawText: string;
  normalizedQuranText: string;
  audioStart: number;
  audioEnd: number;
  acousticConfidence: number; // 0 - 100: Voice energy / onset sharpness at this word
  matchConfidence: number;    // 0 - 100: Phonetic / ASR text match confidence
  isObserved: boolean;
}

export interface QuranAlignmentDiagnostics {
  ayahNumber: number;
  predictedStart: number;
  predictedEnd: number;
  duration: number;
  startEvidence: string;
  endEvidence: string;
  acousticScore: number;
  boundaryScore: number;
  transitionScore: number;
  durationPriorScore: number;
  recognitionScore: number;
  globalScore: number;
  confidence: number;
  alignmentMethod: AlignmentMethodLabel;
  warnings: string[];

  // Real-audio forensics diagnostics
  speechOffsetScore?: number;
  speechOnsetScore?: number;
  silenceDuration?: number;
  silenceBoundaryBoost?: number;
  finalBoundaryScore?: number;
  selectedCandidateReason?: string;

  // Legacy/Internal mappings (kept for compatibility)
  verseKey: string;
  matchedAudioRange: { start: number; end: number; duration: number };
  audioMatchScore: number;
  phoneticTextScore: number;
  globalAlignmentScore: number;
  isDirectlyObserved: boolean;
  isRepetition?: boolean;
  isLowConfidence: boolean;
  
  // Phase 5B Hybrid diagnostics
  referenceEvidence?: number;
  referenceConfidence?: number;
  providerVsAcousticDeltaMs?: number;
  finalDecisionReason?: string;
  alignmentMode?: string;

  // Strict Real-Audio Governance & Forensic Metrics
  proportionalSplitUsed?: boolean;
  interpolationUsed?: boolean;
  legacyFallbackUsed?: boolean;
  providerOverrideUsed?: boolean;
  durationPriorUsed?: boolean;
  sustainedVoicingRisk?: number;
  boundaryStabilityMs?: number;
  candidateMarginMs?: number;
  validationStatus?: 'VALIDATED' | 'UNVALIDATED' | 'ABSTAIN';
  rawStart?: number;
  rawEnd?: number;
  finalStart?: number;
  finalEnd?: number;
  correctionApplied?: boolean;
  correctionReason?: string;
}

export interface QuranAlignmentSegment {
  ayahIndex: number;
  wordIndex: number;
  startTime: number;
  endTime: number;
  isWaqfPause: boolean;
  confidenceScore: number; // Strictly derived from evidence (0 - 100)
  verse_key?: string;
  text_arabic?: string;
  text_english?: string;
  pauseType?: 'ayah-boundary' | 'intra-ayah-waqf' | 'micro-pause' | 'none';
  isRepetition?: boolean;
  repetitionRewindWords?: number;
  isLowConfidence?: boolean;
  subPhraseIndex?: number;
  totalSubPhrases?: number;
  diagnostics?: QuranAlignmentDiagnostics;
  words?: QuranWordAlignment[];
}

export interface QuranVerseInput {
  verse_key: string;
  verse_number?: number;
  text_uthmani?: string;
  text_arabic?: string;
  translation?: string;
  text_english?: string;
  isTaawwuz?: boolean;
  isTasmiyah?: boolean;
}
