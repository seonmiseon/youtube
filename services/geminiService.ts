import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScriptAnalysis, TargetAnalysis, RecommendedContent, ScriptViralAnalysis, RecommendedTopic } from "../types";

const getApiKey = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('gemini_api_key') || '';
  }
  return '';
};

// Step 1: ?€ê¹??¸ë„¤??+ ?œëª© ë¶„ì„
export const analyzeTargetThumbnailAndTitle = async (
  thumbnailImage: string,
  title: string
): Promise<TargetAnalysis> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API ?¤ê? ?„ìš”?©ë‹ˆ??);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const base64Data = thumbnailImage.split(',')[1];
    const mimeType = thumbnailImage.split(':')[1].split(';')[0];
    
    const result = await model.generateContent([
      {
        text: `?¤ìŒ ? íŠœë¸??¸ë„¤???´ë?ì§€?€ ?œëª©??ë¶„ì„?˜ì—¬ SEO, ?„í‚¹, ë°”ì´???”ì†Œë¥?ì¶”ì¶œ?˜ì„¸??

?œëª©: "${title}"

**ë¶„ì„ ??ª©:**
1. seoKeywords: SEO ìµœì ???¤ì›Œ??5~7ê°?(ë°°ì—´)
2. hookingElements: ?„í‚¹ ?”ì†Œ 3~5ê°?(ê°ì • ?¤ì›Œ?? ?«ì, ë°˜ì „ ?”ì‹œ ??
3. viralFactors: ë°”ì´???”ì†Œ 3~5ê°?(?œê°???€ë¹? ê¸´ê¸‰?? ?¸ê¸°????
4. emotionalTone: ?„ì²´ ê°ì • ??(1ë¬¸ì¥?¼ë¡œ)

JSON ?•ì‹?¼ë¡œ ë°˜í™˜:
{
  "seoKeywords": ["?¤ì›Œ??", "?¤ì›Œ??", ...],
  "hookingElements": ["?”ì†Œ1", "?”ì†Œ2", ...],
  "viralFactors": ["?”ì†Œ1", "?”ì†Œ2", ...],
  "emotionalTone": "ê°ì • ?¤ëª…"
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
    console.error("?€ê¹?ë¶„ì„ ?¤íŒ¨:", error);
    throw new Error("ë¶„ì„ ?¤íŒ¨: " + (error instanceof Error ? error.message : "?????†ëŠ” ?¤ë¥˜"));
  }
};

// Step 1-2: ???¸ë„¤??+ ?œëª© 5ê°€ì§€ ì¶”ì²œ
export const recommendThumbnailsAndTitles = async (
  targetAnalysis: TargetAnalysis
): Promise<RecommendedContent[]> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API ?¤ê? ?„ìš”?©ë‹ˆ??);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent(`?¤ìŒ ë¶„ì„ ê²°ê³¼ë¥?ë°”íƒ•?¼ë¡œ ?¼ë‹´ ì±„ë„???¸ë„¤?¼ê³¼ ?œëª©??5ê°?ì¶”ì²œ?˜ì„¸??

?€ê¹?ë¶„ì„:
- SEO ?¤ì›Œ?? ${targetAnalysis.seoKeywords.join(', ')}
- ?„í‚¹ ?”ì†Œ: ${targetAnalysis.hookingElements.join(', ')}
- ë°”ì´???”ì†Œ: ${targetAnalysis.viralFactors.join(', ')}
- ê°ì • ?? ${targetAnalysis.emotionalTone}

**ì¶”ì²œ ê·œì¹™:**
- ì¡°ì„ ?œë? ?¼ë‹´ ?¤í???
- ?¸ë„¤?? ?¸ë‘ ë°°ê²½, ê²€??ë¹¨ê°• ê¸€?? 4~6?¨ì–´, 2ì¤?êµ¬ì„±, ?¸ë¬¼ ?œì • ê°•ì¡°
- ?œëª©: ê°ì • ?¤ì›Œ??+ ? ë¶„ + ë°˜ì „ + ?«ì ?¬í•¨
- 1?œìœ„ë¶€???°ì„ ?œìœ„ ëª…í™•??

JSON ?•ì‹?¼ë¡œ ë°˜í™˜:
[
  {
    "rank": 1,
    "thumbnailDescription": "?¸ë„¤???œê°??ë¬˜ì‚¬",
    "title": "?œëª©",
    "reason": "ì¶”ì²œ ?´ìœ "
  },
  ...
]`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("ì¶”ì²œ ?¤íŒ¨:", error);
    throw new Error("ì¶”ì²œ ?¤íŒ¨: " + (error instanceof Error ? error.message : "?????†ëŠ” ?¤ë¥˜"));
  }
};

// Step 2: ?€ê¹??€ë³?ë°”ì´??ë¶„ì„
export const analyzeScriptViral = async (script: string): Promise<ScriptViralAnalysis> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API ?¤ê? ?„ìš”?©ë‹ˆ??);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent(`?¤ìŒ ? íŠœë¸??€ë³¸ì˜ ë°”ì´???”ì†Œë¥?ë¶„ì„?˜ì„¸??

?€ë³?
${script.substring(0, 5000)}

**ë¶„ì„ ??ª©:**
1. hookingStrategy: ì´ˆë°˜ 0~2ë¶??„í‚¹ ?„ëµ (êµ¬ì²´?ìœ¼ë¡?
2. sentenceStructure: ë¬¸ì¥ êµ¬ì¡° ?¹ì§• (?¨ë¬¸/?¥ë¬¸ ë¹„ìœ¨, ë¦¬ë“¬ê°???
3. emotionalFlow: ê°ì •???ë¦„ (?ˆí?ê¹Œì??’í¬ë§â†’ë°°ì‹ ?’í†µì¾Œí•¨ ??
4. viralElements: ë°”ì´???”ì†Œ 5ê°?(ë°°ì—´)

JSON ?•ì‹?¼ë¡œ ë°˜í™˜:
{
  "hookingStrategy": "...",
  "sentenceStructure": "...",
  "emotionalFlow": "...",
  "viralElements": ["?”ì†Œ1", "?”ì†Œ2", ...]
}`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("?€ë³?ë¶„ì„ ?¤íŒ¨:", error);
    throw new Error("ë¶„ì„ ?¤íŒ¨: " + (error instanceof Error ? error.message : "?????†ëŠ” ?¤ë¥˜"));
  }
};

// Step 3: ì£¼ì œ 5ê°€ì§€ ì¶”ì²œ
export const recommendTopics = async (
  viralAnalysis: ScriptViralAnalysis
): Promise<RecommendedTopic[]> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API ?¤ê? ?„ìš”?©ë‹ˆ??);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent(`?¤ìŒ ë°”ì´??ë¶„ì„??ë°”íƒ•?¼ë¡œ ì¡°ì„ ?œë? ?¼ë‹´ ì£¼ì œë¥?5ê°?ì¶”ì²œ?˜ì„¸??

ë°”ì´??ë¶„ì„:
- ?„í‚¹ ?„ëµ: ${viralAnalysis.hookingStrategy}
- ë¬¸ì¥ êµ¬ì¡°: ${viralAnalysis.sentenceStructure}
- ê°ì • ?ë¦„: ${viralAnalysis.emotionalFlow}
- ë°”ì´???”ì†Œ: ${viralAnalysis.viralElements.join(', ')}

**ì¶”ì²œ ê·œì¹™:**
- ì¡°ì„ ?œë? ? ë¶„ ?? „ ?¤í† ë¦?
- ?¬íšŒ???½ì(?¬ì¢…, ë¨¸ìŠ´, ê±°ì?, ë°±ì •) ì¤‘ì‹¬
- 1?œìœ„ë¶€???°ì„ ?œìœ„ ëª…í™•??

JSON ?•ì‹?¼ë¡œ ë°˜í™˜:
[
  {
    "rank": 1,
    "topic": "ì£¼ì œ (1ë¬¸ì¥)",
    "reason": "ì¶”ì²œ ?´ìœ "
  },
  ...
]`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("ì£¼ì œ ì¶”ì²œ ?¤íŒ¨:", error);
    throw new Error("ì¶”ì²œ ?¤íŒ¨: " + (error instanceof Error ? error.message : "?????†ëŠ” ?¤ë¥˜"));
  }
};

// Step 4: ì´ˆë°˜ 0~30ì´?+ 0~2ë¶??€ë³??ì„±
export const generateOpening = async (
  thumbnailDescription: string,
  title: string,
  topic: string,
  targetScript: string
): Promise<{ opening30sec: string; opening2min: string }> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API ?¤ê? ?„ìš”?©ë‹ˆ??);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent(`?¼ë‹´ ì±„ë„ ?€ë³¸ì˜ ì´ˆë°˜ë¶€ë¥??‘ì„±?˜ì„¸??

?¸ë„¤?? ${thumbnailDescription}
?œëª©: ${title}
ì£¼ì œ: ${topic}

**ì¤‘ìš”: ?¸ë„¤???œëª©-0~30ì´ˆëŠ” ?˜ë‚˜??ê°ì • ?Œë™?¼ë¡œ ?°ê²°**

?€ê¹??€ë³?(ë¬¸ì¥ êµ¬ì¡° ì°¸ê³ ):
${targetScript.substring(0, 2000)}

**?‘ì„± ê·œì¹™:**
- 0~30ì´? ?œëª©???µì‹¬ ?¬ê±´ ì¦‰ì‹œ ?œì‹œ (ì¶©ê²© ?¥ë©´)
- 0~2ë¶? 4?¨ê³„ ?„í‚¹ (00:00 ì¶©ê²© ??00:20 ì£¼ë? ë°˜ì‘ ??01:00 ì£¼ì¸ê³?? í•¨ ??02:00 ê¶ê¸ˆì¦???°œ)
- ?¼ë‹´ ë§íˆ¬: "~?ˆìŠµ?ˆë‹¤", "~?ˆì??? ?„ìˆ˜

JSON ?•ì‹?¼ë¡œ ë°˜í™˜:
{
  "opening30sec": "0~30ì´??€ë³?,
  "opening2min": "0~2ë¶??„ì²´ ?€ë³?
}`);

    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("?¤í”„???ì„± ?¤íŒ¨:", error);
    throw new Error("?ì„± ?¤íŒ¨: " + (error instanceof Error ? error.message : "?????†ëŠ” ?¤ë¥˜"));
  }
};

// Step 5: ìµœì¢… ?€ë³??ì„± (7ë§?êµ¬ì¡°)
export const generateFinalScript = async (
  topic: string,
  opening2min: string,
  videoLengthMinutes: number,
  characters: any,
  metaPrompt: string
): Promise<string> => {
  const apiKey = getApiKey();
  
  try {
    if (!apiKey) throw new Error("API ?¤ê? ?„ìš”?©ë‹ˆ??);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent(`${metaPrompt}

???ˆí¼ ë©”í??„ë¡¬?„íŠ¸???°ë¼ ?¼ë‹´ ?€ë³¸ì„ ?‘ì„±?˜ì„¸??

ì£¼ì œ: ${topic}
?¸ë¬¼:
- ?¬ì ì£¼ì¸ê³? ${characters.femaleProtagonist}
- ?¨ì ì£¼ì¸ê³? ${characters.maleProtagonist}
${characters.supporting1 ? `- ì¡°ì—°1: ${characters.supporting1}` : ''}
${characters.supporting2 ? `- ì¡°ì—°2: ${characters.supporting2}` : ''}
${characters.supporting3 ? `- ì¡°ì—°3: ${characters.supporting3}` : ''}
${characters.supporting4 ? `- ì¡°ì—°4: ${characters.supporting4}` : ''}

ëª©í‘œ ê¸¸ì´: ${videoLengthMinutes}ë¶?
?´ë? ?‘ì„±???„ì…ë¶€ (0~2ë¶?:
${opening2min}

**?„ìˆ˜:**
- ?œë“œ?„ë“œ 7ë§?êµ¬ì¡° (??ë§???ë§?ëª…í™•??êµ¬ë¶„)
- ì§€?œì˜ ë§?2??(16~18ë¶? 40~42ë¶?
- ?¼ë‹´ ë§íˆ¬ 100% ?„ìˆ˜
- ì´?${videoLengthMinutes * 250}???´ì™¸

?„ì²´ ?€ë³¸ì„ ?‘ì„±?˜ì„¸??`);

    const response = result.response;
    return response.text();

  } catch (error) {
    console.error("ìµœì¢… ?€ë³??ì„± ?¤íŒ¨:", error);
    throw new Error("?ì„± ?¤íŒ¨: " + (error instanceof Error ? error.message : "?????†ëŠ” ?¤ë¥˜"));
  }
};
