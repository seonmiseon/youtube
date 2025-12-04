import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis } from "../types";

// Get API key from localStorage
const getApiKey = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('gemini_api_key') || '';
  }
  return '';
};

export const analyzeScript = async (script: string, thumbnailImage: string | null = null): Promise<ScriptAnalysis> => {
  if (!script || script.length < 10) {
    throw new Error("분석할 텍스트가 너무 짧습니다.");
  }

  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });
    
    let analysisPrompt = `다음 유튜브 대본을 분석하고, 시니어정보탐정 스타일에 맞춰 상세한 분석 결과를 JSON 형식으로 반환하세요.

분석 항목:
1. hookAnalysis: 초반 0~30초의 후킹 전략 분석 (어떤 위험/이득을 제시했는지, 시청자 호명 방식, 긴급성 표현 등 구체적으로)
2. structureSummary: 전체 구조 분석 (문제제기→해결→보너스 패턴인지, 단문/장문 비율, '결론-예시-반전' 구조 등)
3. toneStyle: 말투 특징 (친근도, 전문성, 시니어 배려 표현, 불안 해소 문구 등)
4. ctaPattern: 마무리 CTA 패턴 (구독 유도 방식, 댓글 유도, 다음 영상 예고 등)
5. suggestedTitles: SEO 최적화된 제목 3개 (위험경고형/즉시해결형/숨겨진기능형 등 다양한 공식 활용)
6. suggestedTopics: 이 스타일에 맞는 새 주제 3개
7. thumbnailKeywords: 썸네일에 들어갈 핵심 키워드 (4~6단어, 2줄 구성)
8. seoKeywords: 대형/중형/소형 SEO 키워드 리스트

대본:
${script.substring(0, 3000)}`;

    if (thumbnailImage) {
      analysisPrompt += `

**썸네일 이미지 분석 추가 요청:**
업로드된 썸네일 이미지를 분석하여 다음 정보를 추가로 제공하세요:
- thumbnailAnalysis: 색상 구성, 텍스트 배치, 시각적 요소, 개선 권장사항
- coherenceCheck: 제목-썸네일-도입부(0~30초) 간의 연계성 및 시너지 분석

썸네일 분석 시 시니어정보탐정 스타일(노랑 배경+검정 글씨, 빨강 포인트, 4~6단어, 2줄 구성)을 기준으로 평가하세요.`;
    }

    analysisPrompt += `

모든 답변은 한국어로 작성하고, 구체적이고 실용적으로 분석하세요.`;

    const parts: any[] = [{ text: analysisPrompt }];
    
    if (thumbnailImage) {
      // Base64 이미지를 Gemini에 전달
      const base64Data = thumbnailImage.split(',')[1];
      const mimeType = thumbnailImage.split(':')[1].split(';')[0];
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    const model = ai.models.get('gemini-2.0-flash-exp');
    const response = await model.generateContent({
      contents: [{ role: 'user', parts }]
    });

    if (response.text) {
      const cleanedText = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedText) as ScriptAnalysis;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("분석 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};

export const generateBenchmarkedScript = async (
  referenceScript: string,
  title: string,
  topic: string,
  tone: string,
  lengthMin: number,
  persona: string
): Promise<{ script: string; thumbnailPrompt: string }> => {
  
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.get('gemini-2.0-flash-exp');
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `YouTube 대본과 썸네일 이미지 프롬프트를 생성하세요.

주제: ${topic}
제목: ${title}
목표 길이: ${lengthMin}분
톤/스타일: ${tone}
페르소나/규칙: ${persona}

**대본 작성 규칙:**
- 타깃 대본의 문장 구조, 속도, 후킹 스타일을 벤치마킹하되, 새로운 주제로 작성
- [0-30초]: 강력한 후킹 (위험 경고 또는 즉시 해결 제시)
- 시니어정보탐정 스타일 준수 (친근하지만 정보 중심, 단문 위주, "당황하지 마세요" 같은 안심 문구)
- 문제 제기 → 단계별 해결 → 보너스 팁 구조

**썸네일 이미지 프롬프트 작성 규칙:**
- 텍스트는 제외 (미리캔버스에서 별도 추가 예정)
- 시각적 요소만 설명 (스마트폰 화면, UI, 손가락 아이콘, 화살표 등)
- 색상 배경 지정 (노랑, 빨강, 초록 등)
- 구체적인 이미지 요소 설명 (예: "갤럭시 스마트폰 설정 화면, 톱니바퀴 아이콘 확대, 빨간 경고 표시")

타깃 대본 (구조 참고용):
${referenceScript.substring(0, 1500)}

JSON 형식으로 반환:
{
  "script": "완성된 대본 전체",
  "thumbnailPrompt": "이미지 생성 프롬프트 (텍스트 제외, 시각적 요소만)"
}` }] }]
    });

    if (response.text) {
      const cleanedText = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedText);
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("대본 생성 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
  }
};

export const analyzeTitleForSEO = async (title: string): Promise<{
  large: string;
  medium: string;
  small: string;
}> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.get('gemini-2.0-flash-exp');
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `다음 유튜브 제목을 분석하여 SEO 키워드를 추출하세요.

제목: "${title}"

**키워드 분류 규칙:**
- 대형 키워드: 검색량이 가장 많은 일반적인 키워드 (예: 삼성폰, 갤럭시, 스마트폰, 설정)
- 중형 키워드: 특정 주제/카테고리 관련 키워드 (예: 안전, 사기, 보안, 통역, AI 기능)
- 소형 키워드: 롱테일 키워드, 구체적인 기능명 (예: 잠금화면, 파일 전송, 실시간 통역, 사진 공유)

각 키워드는 쉼표로 구분하여 4~6개씩 나열하세요.

JSON 형식으로 반환:
{
  "large": "키워드1, 키워드2, 키워드3, 키워드4",
  "medium": "키워드1, 키워드2, 키워드3, 키워드4",
  "small": "키워드1, 키워드2, 키워드3, 키워드4"
}` }] }]
    });

    if (response.text) {
      const cleanedText = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedText);
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("SEO analysis failed:", error);
    // Fallback
    return {
      large: "유튜브, 영상, 콘텐츠, 정보",
      medium: "제작, 편집, 기획, 마케팅",
      small: "썸네일, 대본, SEO, 조회수"
    };
  }
};