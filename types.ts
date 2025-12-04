export interface ScriptAnalysis {
  hookAnalysis: string;
  structureSummary: string;
  suggestedTitles: string[];
  suggestedTopics: string[];
}

export interface AppState {
  step: number;
  inputScript: string;
  analysis: ScriptAnalysis | null;
  selectedTone: string;
  targetLength: number;
  selectedTitle: string;
  selectedTopic: string;
  persona: string;
  generatedScript: string;
  isLoading: boolean;
  error: string | null;
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