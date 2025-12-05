// 타깃 썸네일 + 제목 분석 결과
export interface TargetAnalysis {
  seoKeywords: string[];
  hookingElements: string[];
  viralFactors: string[];
  emotionalTone: string;
}

// 추천 썸네일 + 제목
export interface RecommendedContent {
  rank: number;
  thumbnailDescription: string;
  title: string;
  reason: string;
}

// 타깃 대본 바이럴 분석
export interface ScriptViralAnalysis {
  hookingStrategy: string;
  sentenceStructure: string;
  emotionalFlow: string;
  viralElements: string[];
}

// 추천 주제
export interface RecommendedTopic {
  rank: number;
  topic: string;
  reason: string;
}

// 인물 설정
export interface Character {
  femaleProtagonist: string;
  maleProtagonist: string;
  supporting1?: string;
  supporting2?: string;
  supporting3?: string;
  supporting4?: string;
}

// 앱 전체 상태
export interface AppState {
  step: number;
  
  // Step 1: 타깃 썸네일 + 제목
  targetThumbnailImage: string | null;
  targetTitle: string;
  targetAnalysis: TargetAnalysis | null;
  recommendedContents: RecommendedContent[];
  selectedRecommendedIndex: number | null;
  
  // Step 2: 타깃 대본 분석
  targetScript: string;
  scriptViralAnalysis: ScriptViralAnalysis | null;
  
  // Step 3: 주제 추천
  recommendedTopics: RecommendedTopic[];
  selectedTopicIndex: number | null;
  
  // Step 4: 초반 0~30초, 0~2분 대본
  opening30sec: string;
  opening2min: string;
  userApproved: boolean;
  
  // Step 5: 영상 길이 + 인물 설정
  videoLengthMinutes: number;
  characters: Character;
  
  // Step 6: 최종 대본
  finalScript: string;
  
  isLoading: boolean;
  error: string | null;
}

export interface ScriptAnalysis {
  hookAnalysis: string;
  structureSummary: string;
  toneStyle?: string;
  ctaPattern?: string;
  suggestedTitles: string[];
  suggestedTopics: string[];
  thumbnailKeywords?: string;
  seoKeywords?: {
    large: string;
    medium: string;
    small: string;
  };
  thumbnailAnalysis?: {
    colorScheme: string;
    textLayout: string;
    visualElements: string;
    recommendations: string;
  };
  coherenceCheck?: {
    titleThumbnailMatch: string;
    thumbnailHookMatch: string;
    overallSynergy: string;
  };
}

export enum ToneOption {
  BENCHMARK = "타깃 말투 유지 (벤치마킹)",
  LOGICAL = "논리적/정보성 강조",
  CUSTOM = "직접 입력"
}

export const PRESET_PERSONAS = [
  "국사 교수님 말투",
  "유행어 금지",
  "역사 고증 철저",
  "명언 2회 포함"
];