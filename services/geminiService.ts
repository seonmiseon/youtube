import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis } from "../types";

// Get API key from localStorage
const getApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || '';
};

export const analyzeScript = async (script: string): Promise<ScriptAnalysis> => {
  if (!script || script.length < 10) {
    throw new Error("분석할 텍스트가 너무 짧습니다.");
  }

  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following YouTube script structure. Return JSON with these fields:
      - hookAnalysis: A brief observation about the first 30 seconds (Korean).
      - structureSummary: A summary of the pacing and sentence structure (Korean).
      - suggestedTitles: 3 SEO-friendly titles for *new* videos based on this style (Korean).
      - suggestedTopics: 3 new topics that would fit this structure (Korean).
      
      Script:
      ${script.substring(0, 2000)}`, // Limit context window for efficiency
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hookAnalysis: { type: Type.STRING },
            structureSummary: { type: Type.STRING },
            suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ScriptAnalysis;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.warn("Gemini API call failed (likely due to missing key in this demo env), falling back to simulation.", error);
    
    // Fallback Mock Data as requested by user
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          hookAnalysis: "초반 5초에 강렬한 의문문을 던져 시청자의 호기심을 자극하고 있습니다.",
          structureSummary: "단문 위주의 빠른 호흡으로 전개되며, '결론-예시-반전'의 3단 구조를 반복합니다.",
          suggestedTitles: [
            "당신이 몰랐던 그 사건의 진실 (충격 주의)",
            "지금 당장 이 습관을 버려야 하는 이유",
            "10년 뒤 후회하지 않으려면 꼭 봐야 할 영상"
          ],
          suggestedTopics: [
            "조선시대 왕들의 건강 비법",
            "현대인의 잘못된 수면 습관",
            "잊혀진 독립운동가의 마지막 하루"
          ]
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
): Promise<string> => {
  
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a YouTube script.
      Topic: ${topic}
      Title: ${title}
      Target Length: ${lengthMin} minutes.
      Tone/Style: ${tone}.
      Persona/Rules: ${persona}.
      
      CRITICAL INSTRUCTION: Benchmark the sentence structure, pacing, and hook style of the following REFERENCE SCRIPT, but write about the NEW TOPIC.
      
      Reference Script (for structure only):
      ${referenceScript.substring(0, 1000)}...
      
      Output Rules:
      1. [0-30s]: Strong hook matching the reference's emotion.
      2. High visual imagery.
      3. Use Markdown formatting.`,
    });

    return response.text || "생성 실패";

  } catch (error) {
    console.warn("Gemini API call failed, falling back to simulation.", error);

    // Fallback Mock Logic as requested
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockScript = `
# 제목: ${title}

**(00:00 ~ 00:30) 오프닝 / 훅**
(검은 화면에서 핀 조명이 하나 켜지듯)
여러분, 혹시 그런 생각 해보신 적 없으십니까?
우리가 당연하다고 믿었던 ${topic}에 대한 사실이, 사실은 완전히 거짓말이었다면 말이죠.
오늘 이야기는 여기서부터 시작합니다. 

**(00:30 ~ 01:30) 전개 - ${tone}**
${referenceScript.substring(0, 50)}... 
(위와 같은 타깃 대본의 호흡을 빌려와서...)
마치 톱니바퀴가 맞물리듯, 역사는 언제나 예상을 빗나갑니다.
${persona.includes("국사") ? "실록에 따르면," : "자료를 살펴보면,"} 이 사건은 단순한 우연이 아니었습니다.
눈 앞에 펼쳐지는 광경을 상상해보세요. 거친 모래바람, 그리고 들려오는 함성 소리.

**(01:30 ~ 02:30) 심화**
그렇다면 우리는 무엇을 놓치고 있었을까요?
핵심은 바로 '관점'의 차이였습니다.

**(마무리)**
결국 진실은 언제나 우리 곁에 숨쉬고 있었습니다.
다음 영상에서 더 깊이 파헤쳐보겠습니다. 구독, 잊지 마세요.
        `;
        resolve(mockScript);
      }, 2000);
    });
  }
};