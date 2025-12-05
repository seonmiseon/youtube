import React, { useState, useEffect, useRef } from 'react';
import { StepCard } from './components/StepCard';
import { Button } from './components/Button';
import { AppState } from './types';
import {
  analyzeTargetThumbnailAndTitle,
  recommendThumbnailsAndTitles,
  analyzeScriptViral,
  recommendTopics,
  generateOpening,
  generateFinalScript
} from './services/geminiService';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('yadamScriptState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      step: 1,
      targetThumbnailImage: null,
      targetTitle: '',
      targetAnalysis: null,
      recommendedContents: [],
      selectedRecommendedIndex: null,
      targetScript: '',
      scriptViralAnalysis: null,
      recommendedTopics: [],
      selectedTopicIndex: null,
      opening30sec: '',
      opening2min: '',
      userApproved: false,
      videoLengthMinutes: 40,
      characters: {
        femaleProtagonist: '',
        maleProtagonist: ''
      },
      finalScript: '',
      isLoading: false,
      error: null
    };
  });

  useEffect(() => {
    localStorage.setItem('yadamScriptState', JSON.stringify(state));
  }, [state]);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (key) {
      setApiKey(key);
      setHasApiKey(true);
    }
  }, []);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setHasApiKey(true);
      alert('API 키가 저장되었습니다.');
    }
  };

  // Step 1: 타깃 썸네일 업로드 + 제목 입력 + 분석
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateState({ targetThumbnailImage: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeTarget = async () => {
    if (!state.targetThumbnailImage || !state.targetTitle.trim()) {
      alert('썸네일 이미지와 제목을 모두 입력해주세요.');
      return;
    }
    if (!hasApiKey) {
      alert('API 키를 먼저 입력하고 저장해주세요.');
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const analysis = await analyzeTargetThumbnailAndTitle(
        state.targetThumbnailImage,
        state.targetTitle
      );
      const recommendations = await recommendThumbnailsAndTitles(analysis);
      
      updateState({
        targetAnalysis: analysis,
        recommendedContents: recommendations,
        isLoading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '분석 실패',
        isLoading: false
      });
    }
  };

  // Step 2: 타깃 대본 분석
  const handleAnalyzeScript = async () => {
    if (!state.targetScript.trim()) {
      alert('타깃 대본을 입력해주세요.');
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const viralAnalysis = await analyzeScriptViral(state.targetScript);
      updateState({
        scriptViralAnalysis: viralAnalysis,
        isLoading: false,
        step: 3
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '분석 실패',
        isLoading: false
      });
    }
  };

  // Step 3: 주제 추천
  const handleRecommendTopics = async () => {
    if (!state.scriptViralAnalysis) return;

    updateState({ isLoading: true, error: null });

    try {
      const topics = await recommendTopics(state.scriptViralAnalysis);
      updateState({
        recommendedTopics: topics,
        isLoading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '추천 실패',
        isLoading: false
      });
    }
  };

  // Step 4: 초반 대본 생성
  const handleGenerateOpening = async () => {
    if (state.selectedRecommendedIndex === null || state.selectedTopicIndex === null) {
      alert('썸네일/제목과 주제를 선택해주세요.');
      return;
    }

    updateState({ isLoading: true, error: null });

    const selectedContent = state.recommendedContents[state.selectedRecommendedIndex];
    const selectedTopic = state.recommendedTopics[state.selectedTopicIndex];

    try {
      const { opening30sec, opening2min } = await generateOpening(
        selectedContent.thumbnailDescription,
        selectedContent.title,
        selectedTopic.topic,
        state.targetScript
      );
      
      updateState({
        opening30sec,
        opening2min,
        isLoading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '생성 실패',
        isLoading: false
      });
    }
  };

  // Step 5: 최종 대본 생성
  const handleGenerateFinal = async () => {
    if (!state.opening2min || !state.characters.femaleProtagonist || !state.characters.maleProtagonist) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      // 메타프롬프트 로드
      const metaPromptResponse = await fetch('/대본지침서_메타프롬프트_야담그날밤_v2.0_(클로드버전).md');
      const metaPrompt = await metaPromptResponse.text();

      const selectedTopic = state.recommendedTopics[state.selectedTopicIndex!];
      
      const finalScript = await generateFinalScript(
        selectedTopic.topic,
        state.opening2min,
        state.videoLengthMinutes,
        state.characters,
        metaPrompt
      );
      
      updateState({
        finalScript,
        isLoading: false,
        step: 6
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '생성 실패',
        isLoading: false
      });
    }
  };

  // 헤더
  const renderHeader = () => (
    <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-8 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm opacity-90 mb-2">제작자: 클로이</p>
        <h1 className="text-4xl font-bold mb-4">자생's 30초룰 대본생성기 (야담채널)</h1>
        <p className="text-lg opacity-90">유튜브 야담 대본 자동 생성 시스템</p>
        
        <div className="mt-6 bg-white/10 rounded-xl p-4">
          <label className="block text-sm font-semibold mb-2">🔑 Gemini API Key 설정</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API 키를 입력하세요"
              className="flex-1 px-4 py-2 rounded-lg text-gray-900"
            />
            <button
              onClick={saveApiKey}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
            >
              저장
            </button>
          </div>
          {hasApiKey && <p className="text-sm mt-2 text-green-300">✓ API 키가 설정되었습니다</p>}
        </div>
      </div>
    </div>
  );

  // Step 1: 타깃 썸네일 + 제목 분석
  const renderStep1 = () => (
    <StepCard title="Step 1: 타깃 썸네일 & 제목 분석" step={1}>
      <div className="space-y-6">
        {/* 썸네일 업로드 */}
        <div>
          <label className="block text-lg font-semibold mb-2">📸 타깃 썸네일 이미지 업로드</label>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            className="hidden"
          />
          <Button onClick={() => thumbnailInputRef.current?.click()}>
            이미지 업로드
          </Button>
          {state.targetThumbnailImage && (
            <img src={state.targetThumbnailImage} alt="썸네일" className="mt-4 max-w-md rounded-lg shadow" />
          )}
        </div>

        {/* 제목 입력 */}
        <div>
          <label className="block text-lg font-semibold mb-2">📝 타깃 제목 입력</label>
          <input
            type="text"
            value={state.targetTitle}
            onChange={(e) => updateState({ targetTitle: e.target.value })}
            placeholder="예: 300냥에 팔린 무당처녀, 3년 뒤 어부에게 일어난 기적"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
          />
        </div>

        <Button onClick={handleAnalyzeTarget} variant="primary">
          분석하기
        </Button>

        {/* 분석 결과 */}
        {state.targetAnalysis && (
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">🔍 분석 결과</h3>
            <div className="space-y-3">
              <div>
                <strong>SEO 키워드:</strong> {state.targetAnalysis.seoKeywords.join(', ')}
              </div>
              <div>
                <strong>후킹 요소:</strong> {state.targetAnalysis.hookingElements.join(', ')}
              </div>
              <div>
                <strong>바이럴 요소:</strong> {state.targetAnalysis.viralFactors.join(', ')}
              </div>
              <div>
                <strong>감정 톤:</strong> {state.targetAnalysis.emotionalTone}
              </div>
            </div>
          </div>
        )}

        {/* 추천 썸네일 + 제목 */}
        {state.recommendedContents.length > 0 && (
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">💡 추천 썸네일 & 제목 (우선순위순)</h3>
            <div className="space-y-4">
              {state.recommendedContents.map((content, index) => (
                <div
                  key={index}
                  onClick={() => updateState({ selectedRecommendedIndex: index })}
                  className={`p-4 border-2 rounded-lg cursor-pointer ${
                    state.selectedRecommendedIndex === index
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="font-bold text-lg mb-2">
                    {content.rank}순위: {content.title}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>썸네일:</strong> {content.thumbnailDescription}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>이유:</strong> {content.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => updateState({ step: 2 })}
            variant="primary"
            disabled={state.selectedRecommendedIndex === null}
          >
            다음
          </Button>
        </div>
      </div>
    </StepCard>
  );

  // Step 2: 타깃 대본 분석
  const renderStep2 = () => (
    <StepCard title="Step 2: 타깃 대본 바이럴 분석" step={2}>
      <div className="space-y-6">
        <div>
          <label className="block text-lg font-semibold mb-2">📄 타깃 대본 스크립트 입력</label>
          <textarea
            value={state.targetScript}
            onChange={(e) => updateState({ targetScript: e.target.value })}
            placeholder="타깃 영상의 대본을 붙여넣으세요..."
            className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg"
          />
        </div>

        <Button onClick={handleAnalyzeScript} variant="primary">
          바이럴 요소 분석하기
        </Button>

        <div className="flex gap-4">
          <Button onClick={() => updateState({ step: 1 })}>이전</Button>
          <Button
            onClick={() => {
              handleRecommendTopics();
              updateState({ step: 3 });
            }}
            variant="primary"
            disabled={!state.scriptViralAnalysis}
          >
            다음
          </Button>
        </div>
      </div>
    </StepCard>
  );

  // Step 3: 주제 추천
  const renderStep3 = () => (
    <StepCard title="Step 3: 주제 추천" step={3}>
      <div className="space-y-6">
        {state.scriptViralAnalysis && (
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">📊 바이럴 분석 결과</h3>
            <div className="space-y-3 text-sm">
              <div><strong>후킹 전략:</strong> {state.scriptViralAnalysis.hookingStrategy}</div>
              <div><strong>문장 구조:</strong> {state.scriptViralAnalysis.sentenceStructure}</div>
              <div><strong>감정 흐름:</strong> {state.scriptViralAnalysis.emotionalFlow}</div>
              <div><strong>바이럴 요소:</strong> {state.scriptViralAnalysis.viralElements.join(', ')}</div>
            </div>
          </div>
        )}

        {state.recommendedTopics.length > 0 && (
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">🎯 추천 주제 (우선순위순)</h3>
            <div className="space-y-4">
              {state.recommendedTopics.map((topic, index) => (
                <div
                  key={index}
                  onClick={() => updateState({ selectedTopicIndex: index })}
                  className={`p-4 border-2 rounded-lg cursor-pointer ${
                    state.selectedTopicIndex === index
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="font-bold text-lg mb-2">
                    {topic.rank}순위: {topic.topic}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>이유:</strong> {topic.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={() => updateState({ step: 2 })}>이전</Button>
          <Button
            onClick={() => {
              handleGenerateOpening();
              updateState({ step: 4 });
            }}
            variant="primary"
            disabled={state.selectedTopicIndex === null}
          >
            다음
          </Button>
        </div>
      </div>
    </StepCard>
  );

  // Step 4: 초반 대본 생성
  const renderStep4 = () => (
    <StepCard title="Step 4: 초반 0~30초 & 0~2분 대본 생성" step={4}>
      <div className="space-y-6">
        {state.opening30sec && (
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">⚡ 초반 0~30초</h3>
            <p className="whitespace-pre-wrap">{state.opening30sec}</p>
          </div>
        )}

        {state.opening2min && (
          <div className="bg-pink-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">🎬 초반 0~2분 전체</h3>
            <textarea
              value={state.opening2min}
              onChange={(e) => updateState({ opening2min: e.target.value })}
              className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">※ 직접 수정 가능합니다</p>
          </div>
        )}

        <div>
          <p className="text-lg font-semibold mb-2">이 대본이 마음에 드시나요?</p>
          <div className="flex gap-4">
            <Button onClick={() => updateState({ userApproved: true, step: 5 })} variant="primary">
              마음에 듭니다
            </Button>
            <Button onClick={() => updateState({ userApproved: false })}>
              직접 수정하겠습니다
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => updateState({ step: 3 })}>이전</Button>
          <Button
            onClick={() => updateState({ step: 5 })}
            variant="primary"
            disabled={!state.opening2min}
          >
            다음
          </Button>
        </div>
      </div>
    </StepCard>
  );

  // Step 5: 영상 길이 + 인물 설정
  const renderStep5 = () => (
    <StepCard title="Step 5: 영상 길이 & 인물 설정" step={5}>
      <div className="space-y-6">
        <div>
          <label className="block text-lg font-semibold mb-2">⏱️ 영상 길이 (분)</label>
          <input
            type="number"
            value={state.videoLengthMinutes}
            onChange={(e) => updateState({ videoLengthMinutes: parseInt(e.target.value) || 40 })}
            className="w-32 px-4 py-2 border-2 border-gray-300 rounded-lg"
            min="10"
            max="60"
          />
          <span className="ml-2 text-gray-600">분</span>
        </div>

        <div className="bg-indigo-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">👥 인물 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">여자 주인공 (필수)</label>
              <input
                type="text"
                value={state.characters.femaleProtagonist}
                onChange={(e) =>
                  updateState({
                    characters: { ...state.characters, femaleProtagonist: e.target.value }
                  })
                }
                placeholder="예: 윤아"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">남자 주인공 (필수)</label>
              <input
                type="text"
                value={state.characters.maleProtagonist}
                onChange={(e) =>
                  updateState({
                    characters: { ...state.characters, maleProtagonist: e.target.value }
                  })
                }
                placeholder="예: 탁신"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">조연 1 (선택)</label>
              <input
                type="text"
                value={state.characters.supporting1 || ''}
                onChange={(e) =>
                  updateState({
                    characters: { ...state.characters, supporting1: e.target.value }
                  })
                }
                placeholder="예: 김판서"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">조연 2 (선택)</label>
              <input
                type="text"
                value={state.characters.supporting2 || ''}
                onChange={(e) =>
                  updateState({
                    characters: { ...state.characters, supporting2: e.target.value }
                  })
                }
                placeholder="예: 최참봉"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">조연 3 (선택)</label>
              <input
                type="text"
                value={state.characters.supporting3 || ''}
                onChange={(e) =>
                  updateState({
                    characters: { ...state.characters, supporting3: e.target.value }
                  })
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">조연 4 (선택)</label>
              <input
                type="text"
                value={state.characters.supporting4 || ''}
                onChange={(e) =>
                  updateState({
                    characters: { ...state.characters, supporting4: e.target.value }
                  })
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => updateState({ step: 4 })}>이전</Button>
          <Button onClick={handleGenerateFinal} variant="primary">
            최종 대본 생성하기
          </Button>
        </div>
      </div>
    </StepCard>
  );

  // Step 6: 최종 대본
  const renderStep6 = () => (
    <StepCard title="Step 6: 최종 대본 (7막 구조)" step={6}>
      <div className="space-y-6">
        {state.finalScript && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">📜 완성된 대본</h3>
            <textarea
              value={state.finalScript}
              onChange={(e) => updateState({ finalScript: e.target.value })}
              className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>
        )}

        <Button
          onClick={() => {
            navigator.clipboard.writeText(state.finalScript);
            alert('대본이 클립보드에 복사되었습니다!');
          }}
          variant="primary"
        >
          📋 대본 복사하기
        </Button>

        <div className="flex gap-4">
          <Button onClick={() => updateState({ step: 5 })}>이전</Button>
        </div>
      </div>
    </StepCard>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {renderHeader()}
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        {state.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-center font-semibold">처리 중...</p>
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        {state.step === 1 && renderStep1()}
        {state.step === 2 && renderStep2()}
        {state.step === 3 && renderStep3()}
        {state.step === 4 && renderStep4()}
        {state.step === 5 && renderStep5()}
        {state.step === 6 && renderStep6()}
      </div>
    </div>
  );
}
