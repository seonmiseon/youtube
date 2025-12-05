import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScriptAnalysis, TargetAnalysis, RecommendedContent, ScriptViralAnalysis, RecommendedTopic } from "../types";

const getApiKey = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('gemini_api_key') || '';
  }
  return '';
};

// Step 1: 타깃 썸네일 + 제목 분석
export const analyzeTargetThumbnailAndTitle = async (
  thumbnailImage: string,
  title: string
): Promise<TargetAnalysis> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API 키가 필요합니다");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const base64Data = thumbnailImage.split(',')[1];
    const mimeType = thumbnailImage.split(':')[1].split(';')[0];
    
    const result = await model.generateContent([
      {
        text: `다음 유튜브 썸네일 이미지와 제목을 분석하여 SEO, 후킹, 바이럴 요소를 추출하세요.

제목: "${title}"

**분석 항목:**
1. seoKeywords: SEO 최적화 키워드 5~7개 (배열)
2. hookingElements: 후킹 요소 3~5개 (감정 키워드, 숫자, 반전 암시 등)
3. viralFactors: 바이럴 요소 3~5개 (시각적 대비, 긴급성, 호기심 등)
4. emotionalTone: 전체 감정 톤 (1문장으로)

JSON 형식으로 반환:
{
  "seoKeywords": ["키워드1", "키워드2", ...],
  "hookingElements": ["요소1", "요소2", ...],
  "viralFactors": ["요소1", "요소2", ...],
  "emotionalTone": "감정 설명"
}` 
      },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("타깃 분석 실패:", error);
    throw new Error("분석 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};

// Step 1-2: 내 썸네일 + 제목 5가지 추천
export const recommendThumbnailsAndTitles = async (
  targetAnalysis: TargetAnalysis
): Promise<RecommendedContent[]> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API 키가 필요합니다");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent(`다음 분석 결과를 바탕으로 야담 채널용 썸네일과 제목을 5개 추천하세요.

타깃 분석:
- SEO 키워드: ${targetAnalysis.seoKeywords.join(', ')}
- 후킹 요소: ${targetAnalysis.hookingElements.join(', ')}
- 바이럴 요소: ${targetAnalysis.viralFactors.join(', ')}
- 감정 톤: ${targetAnalysis.emotionalTone}

**추천 규칙:**
- 조선시대 야담 스타일
- 썸네일: 노랑 배경, 검정/빨강 글씨, 4~6단어, 2줄 구성, 인물 표정 강조
- 제목: 감정 키워드 + 신분 + 반전 + 숫자 포함
- 1순위부터 우선순위 명확히

JSON 형식으로 반환:
[
  {
    "rank": 1,
    "thumbnailDescription": "썸네일 시각적 묘사",
    "title": "제목",
    "reason": "추천 이유"
  },
  ...
]`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("추천 실패:", error);
    throw new Error("추천 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};

// Step 2: 타깃 대본 바이럴 분석
export const analyzeScriptViral = async (script: string): Promise<ScriptViralAnalysis> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API 키가 필요합니다");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent(`다음 유튜브 대본의 바이럴 요소를 분석하세요.

대본:
${script.substring(0, 5000)}

**분석 항목:**
1. hookingStrategy: 초반 0~2분 후킹 전략 (구체적으로)
2. sentenceStructure: 문장 구조 특징 (단문/장문 비율, 리듬감 등)
3. emotionalFlow: 감정선 흐름 (안타까움→희망→배신→통쾌함 등)
4. viralElements: 바이럴 요소 5개 (배열)

JSON 형식으로 반환:
{
  "hookingStrategy": "...",
  "sentenceStructure": "...",
  "emotionalFlow": "...",
  "viralElements": ["요소1", "요소2", ...]
}`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("대본 분석 실패:", error);
    throw new Error("분석 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};

// Step 3: 주제 5가지 추천
export const recommendTopics = async (
  viralAnalysis: ScriptViralAnalysis
): Promise<RecommendedTopic[]> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API 키가 필요합니다");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent(`다음 바이럴 분석을 바탕으로 조선시대 야담 주제를 5개 추천하세요.

바이럴 분석:
- 후킹 전략: ${viralAnalysis.hookingStrategy}
- 문장 구조: ${viralAnalysis.sentenceStructure}
- 감정 흐름: ${viralAnalysis.emotionalFlow}
- 바이럴 요소: ${viralAnalysis.viralElements.join(', ')}

**추천 규칙:**
- 조선시대 신분 역전 스토리
- 사회적 약자(여종, 머슴, 거지, 백정) 중심
- 1순위부터 우선순위 명확히

JSON 형식으로 반환:
[
  {
    "rank": 1,
    "topic": "주제 (1문장)",
    "reason": "추천 이유"
  },
  ...
]`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("주제 추천 실패:", error);
    throw new Error("추천 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};

// Step 4: 초반 0~30초 + 0~2분 대본 생성
export const generateOpening = async (
  thumbnailDescription: string,
  title: string,
  topic: string,
  targetScript: string
): Promise<{ opening30sec: string; opening2min: string }> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API 키가 필요합니다");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent(`야담 채널 대본의 초반부를 작성하세요.

썸네일: ${thumbnailDescription}
제목: ${title}
주제: ${topic}

**중요: 썸네일-제목-0~30초는 하나의 감정 파동으로 연결**

타깃 대본 (문장 구조 참고):
${targetScript.substring(0, 2000)}

**작성 규칙:**
- 0~30초: 제목의 핵심 사건 즉시 제시 (충격 장면)
- 0~2분: 4단계 후킹 (00:00 충격 → 00:20 주변 반응 → 01:00 주인공 선함 → 02:00 궁금증 폭발)
- 야담 말투: "~했습니다", "~했지요" 엄수

JSON 형식으로 반환:
{
  "opening30sec": "0~30초 대본",
  "opening2min": "0~2분 전체 대본"
}`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("오프닝 생성 실패:", error);
    throw new Error("생성 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};

// Step 5: 최종 대본 생성 (7막 구조)
export const generateFinalScript = async (
  topic: string,
  opening2min: string,
  videoLengthMinutes: number,
  characters: any,
  metaPrompt: string
): Promise<string> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API 키가 필요합니다");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent(`${metaPrompt}

위 슈퍼 메타프롬프트에 따라 야담 대본을 작성하세요.

주제: ${topic}
인물:
- 여자 주인공: ${characters.femaleProtagonist}
- 남자 주인공: ${characters.maleProtagonist}
${characters.supporting1 ? `- 조연1: ${characters.supporting1}` : ''}
${characters.supporting2 ? `- 조연2: ${characters.supporting2}` : ''}
${characters.supporting3 ? `- 조연3: ${characters.supporting3}` : ''}
${characters.supporting4 ? `- 조연4: ${characters.supporting4}` : ''}

목표 길이: ${videoLengthMinutes}분
이미 작성된 도입부 (0~2분):
${opening2min}

**필수:**
- 시드필드 7막 구조 (제1막~제7막 명확히 구분)
- 지혜의 말 2회 (16~18분, 40~42분)
- 야담 말투 100% 엄수
- 총 ${videoLengthMinutes * 250}자 내외

전체 대본을 작성하세요.`);

    const response = result.response;
    return response.text();

  } catch (error) {
    console.error("최종 대본 생성 실패:", error);
    throw new Error("생성 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};
