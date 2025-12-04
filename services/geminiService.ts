import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis } from "../types";

// Get API key from localStorage
const getApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || '';
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hookAnalysis: { type: Type.STRING },
            structureSummary: { type: Type.STRING },
            toneStyle: { type: Type.STRING },
            ctaPattern: { type: Type.STRING },
            suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            thumbnailKeywords: { type: Type.STRING },
            seoKeywords: { 
              type: Type.OBJECT,
              properties: {
                large: { type: Type.STRING },
                medium: { type: Type.STRING },
                small: { type: Type.STRING }
              }
            },
            ...(thumbnailImage ? {
              thumbnailAnalysis: {
                type: Type.OBJECT,
                properties: {
                  colorScheme: { type: Type.STRING },
                  textLayout: { type: Type.STRING },
                  visualElements: { type: Type.STRING },
                  recommendations: { type: Type.STRING }
                }
              },
              coherenceCheck: {
                type: Type.OBJECT,
                properties: {
                  titleThumbnailMatch: { type: Type.STRING },
                  thumbnailHookMatch: { type: Type.STRING },
                  overallSynergy: { type: Type.STRING }
                }
              }
            } : {})
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ScriptAnalysis;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.warn("Gemini API call failed, falling back to simulation.", error);
    
    // Fallback Mock Data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          hookAnalysis: "초반 3초에 '이 설정 켜두면 계좌 털립니다'라는 강력한 위험 경고로 시작. 50세 이상 직접 호명하며 긴급성 강조. 즉시 해결 가능함을 약속.",
          structureSummary: "문제 제기(1분) → 단계별 해결(5분) → 보너스 팁(2분) 구조. 단문 위주로 빠른 전개. 각 기능마다 '왜 중요한지' 논리 제공.",
          toneStyle: "친근하지만 정보 중심. '당황하지 마세요' 반복으로 시니어 불안 해소. 전문 용어 최소화하고 화면 기준 설명.",
          ctaPattern: "영상 말미에 '도움 되셨다면 구독·좋아요', '막히는 부분 댓글 남겨주세요' 친근한 요청. 다음 영상 예고 포함.",
          suggestedTitles: [
            "이 설정 켜두면 계좌·카드·비번까지 털립니다! 지금 바로 끄세요",
            "갤럭시에만 있는 숨겨진 기능 7가지 (50세 이상 필수)",
            "1초 만에 외국어 실시간 통역하는 방법"
          ],
          suggestedTopics: [
            "스마트폰 위험 설정 5가지",
            "시니어를 위한 카톡 숨은 기능",
            "해외여행 필수 스마트폰 설정"
          ],
          thumbnailKeywords: "이것 켜두면\n계좌 털립니다",
          seoKeywords: {
            large: "삼성폰, 갤럭시, 스마트폰, 설정",
            medium: "안전, 사기, 스미싱, 보안, AI 기능",
            small: "통역, 번역, 사진 공유, 파일 전송, 잠금화면"
          }
        });
      }, 1500);
    });
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `YouTube 대본과 썸네일 이미지 프롬프트를 생성하세요.

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
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: { type: Type.STRING },
            thumbnailPrompt: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.warn("Gemini API call failed, falling back to simulation.", error);

    // Fallback Mock Logic
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockScript = `
# 제목: ${title}

**(00:00 ~ 00:30) 오프닝 / 훅**
여러분, 혹시 그런 생각 해보신 적 없으십니까?
우리가 당연하다고 믿었던 ${topic}에 대한 사실이, 사실은 완전히 거짓말이었다면 말이죠.
오늘 이야기는 여기서부터 시작합니다. 

**(00:30 ~ 01:30) 전개 - ${tone}**
${referenceScript.substring(0, 50)}... 
(위와 같은 타깃 대본의 호흡을 빌려와서...)
마치 톱니바퀴가 맞물리듯, 역사는 언제나 예상을 빗나갑니다.
${persona.includes("국사") ? "실록에 따르면," : "자료를 살펴보면,"} 이 사건은 단순한 우연이 아니었습니다.

**(마무리)**
결국 진실은 언제나 우리 곁에 숨쉬고 있었습니다.
다음 영상에서 더 깊이 파헤쳐보겠습니다. 구독, 잊지 마세요.
        `;

        const mockThumbnailPrompt = `노란색 배경, 중앙에 갤럭시 스마트폰 화면 클로즈업, 설정 톱니바퀴 아이콘이 크게 보임, 오른쪽에 빨간색 경고 표시 화살표, 왼쪽 하단에 손가락 터치 아이콘, 전체적으로 밝고 강렬한 색감, 시니어가 쉽게 알아볼 수 있는 UI 화면 강조`;

        resolve({
          script: mockScript,
          thumbnailPrompt: mockThumbnailPrompt
        });
      }, 2000);
    });
  }
};