
import React, { useState, useEffect, useRef } from 'react';
import { StepCard } from './components/StepCard';
import { Button } from './components/Button';
import { AppState, ScriptAnalysis, ToneOption, PRESET_PERSONAS } from './types';
import { analyzeScript, generateBenchmarkedScript } from './services/geminiService';

export default function App() {
  // State Initialization
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('scriptMatchState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      step: 1,
      inputScript: '',
      thumbnailImage: null,
      analysis: null,
      selectedTone: '1',
      targetLength: 5,
      selectedTitle: '',
      selectedTopic: '',
      persona: '',
      generatedScript: '',
      thumbnailImagePrompt: '',
      isLoading: false,
      error: null
    };
  });

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('scriptMatchState', JSON.stringify(state));
  }, [state]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check API key on mount
  useEffect(() => {
    const checkApiKey = () => {
      const key = localStorage.getItem('gemini_api_key');
      setHasApiKey(!!key);
    };
    checkApiKey();
    
    // Recheck periodically
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to update state
  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateState({ inputScript: ev.target?.result as string });
      };
      reader.readAsText(file);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateState({ thumbnailImage: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      alert('이미지 파일만 업로드 가능합니다.');
    }
  };

  const handleAnalyze = async () => {
    if (!state.inputScript.trim()) return;
    
    // Check API key before analysis
    if (!hasApiKey) {
      alert('Gemini API 키를 먼저 입력해주세요.');
      return;
    }
    
    updateState({ isLoading: true, error: null });
    
    try {
      const result = await analyzeScript(state.inputScript, state.thumbnailImage);
      updateState({ 
        analysis: result, 
        step: 2, 
        isLoading: false 
      });
    } catch (err) {
      updateState({ 
        error: "분석 중 오류가 발생했습니다. 다시 시도해주세요.", 
        isLoading: false 
      });
    }
  };

  const handleGenerate = async () => {
    // Check API key before generation
    if (!hasApiKey) {
      alert('Gemini API 키를 먼저 입력해주세요.');
      return;
    }
    
    updateState({ isLoading: true, step: 5, error: null });
    try {
      const tonePrompt = state.selectedTone === '1' ? ToneOption.BENCHMARK : 
                         state.selectedTone === '2' ? ToneOption.LOGICAL : 
                         ToneOption.CUSTOM;
                         
      const result = await generateBenchmarkedScript(
        state.inputScript,
        state.selectedTitle,
        state.selectedTopic,
        tonePrompt,
        state.targetLength,
        state.persona
      );
      updateState({ 
        generatedScript: result.script, 
        thumbnailImagePrompt: result.thumbnailPrompt,
        isLoading: false 
      });
    } catch (err) {
      updateState({ 
        error: "대본 생성에 실패했습니다.", 
        isLoading: false 
      });
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([state.generatedScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "generated_script.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleReset = () => {
    if(confirm("모든 내용을 초기화하고 처음으로 돌아가시겠습니까?")) {
      setState({
        step: 1,
        inputScript: '',
        analysis: null,
        selectedTone: '1',
        targetLength: 5,
        selectedTitle: '',
        selectedTopic: '',
        persona: '',
        generatedScript: '',
        isLoading: false,
        error: null
      });
    }
  };

  // Render Steps
  const renderStep1 = () => (
    <StepCard title="타깃 대본 입력" stepNumber={1} description="벤치마킹할 영상을 텍스트로 넣어주세요.">
      <div className="space-y-6">
        {/* Script Input */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">📝 대본 입력</h3>
          <textarea
            className="w-full h-64 p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all placeholder:text-slate-400"
            placeholder="여기에 대본 내용을 붙여넣으세요..."
            value={state.inputScript}
            onChange={(e) => updateState({ inputScript: e.target.value })}
          />
          <input 
            type="file" 
            accept=".txt" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} fullWidth>
            📂 파일 불러오기 (.txt)
          </Button>
        </div>

        {/* Thumbnail Upload */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">🖼️ 타깃 썸네일 이미지 (선택)</h3>
          <p className="text-sm text-slate-600">썸네일을 업로드하면 제목-썸네일-도입부(0~30초)의 연계성을 분석합니다.</p>
          
          {state.thumbnailImage && (
            <div className="relative">
              <img 
                src={state.thumbnailImage} 
                alt="Thumbnail preview" 
                className="w-full max-w-md rounded-lg border-2 border-blue-300 shadow-md"
              />
              <button
                onClick={() => updateState({ thumbnailImage: null })}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            ref={thumbnailInputRef} 
            onChange={handleThumbnailUpload} 
            className="hidden" 
          />
          <Button 
            variant="secondary" 
            onClick={() => thumbnailInputRef.current?.click()} 
            fullWidth
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 border-2 border-purple-300"
          >
            🎨 썸네일 이미지 업로드 (jpg, png)
          </Button>
        </div>

        {/* Analyze Button */}
        <Button 
          fullWidth 
          variant="danger"
          disabled={state.inputScript.length < 10 || state.isLoading}
          onClick={handleAnalyze}
          className="py-4 text-xl"
        >
          {state.isLoading ? '🔄 분석 중...' : '🔍 대본+썸네일 통합 분석하기'}
        </Button>
        {state.error && <p className="text-red-500 font-bold text-center">{state.error}</p>}
      </div>
    </StepCard>
  );

  const renderStep2 = () => (
    <StepCard title="분석 결과 및 설정" stepNumber={2} description="AI가 분석한 특징을 확인하고 설정을 맞춰주세요.">
      <div className="space-y-8">
        {/* Detailed Analysis Result */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-blue-900 font-bold text-xl mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>AI 상세 분석 리포트</span>
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-bold text-slate-800 mb-2">🎯 초반 후킹 전략 (0~30초)</p>
              <p className="text-slate-700">{state.analysis?.hookAnalysis}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <p className="font-bold text-slate-800 mb-2">🏗️ 전체 구조 분석</p>
              <p className="text-slate-700">{state.analysis?.structureSummary}</p>
            </div>
            
            {state.analysis?.toneStyle && (
              <div className="bg-white p-4 rounded-lg">
                <p className="font-bold text-slate-800 mb-2">🗣️ 말투 및 톤 특징</p>
                <p className="text-slate-700">{state.analysis.toneStyle}</p>
              </div>
            )}
            
            {state.analysis?.ctaPattern && (
              <div className="bg-white p-4 rounded-lg">
                <p className="font-bold text-slate-800 mb-2">📢 마무리 CTA 패턴</p>
                <p className="text-slate-700">{state.analysis.ctaPattern}</p>
              </div>
            )}

            {state.analysis?.thumbnailKeywords && (
              <div className="bg-white p-4 rounded-lg">
                <p className="font-bold text-slate-800 mb-2">🖼️ 썸네일 핵심 키워드</p>
                <p className="text-slate-700 whitespace-pre-line font-bold text-lg">{state.analysis.thumbnailKeywords}</p>
              </div>
            )}

            {/* Thumbnail Analysis - NEW */}
            {state.analysis?.thumbnailAnalysis && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-lg border-2 border-yellow-300">
                <p className="font-bold text-orange-900 mb-3 text-lg flex items-center gap-2">
                  <span>🎨</span>
                  <span>썸네일 이미지 분석</span>
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>색상 구성:</strong> {state.analysis.thumbnailAnalysis.colorScheme}</p>
                  <p><strong>텍스트 배치:</strong> {state.analysis.thumbnailAnalysis.textLayout}</p>
                  <p><strong>시각적 요소:</strong> {state.analysis.thumbnailAnalysis.visualElements}</p>
                  <p><strong>개선 권장사항:</strong> {state.analysis.thumbnailAnalysis.recommendations}</p>
                </div>
              </div>
            )}

            {/* Coherence Check - NEW */}
            {state.analysis?.coherenceCheck && (
              <div className="bg-gradient-to-br from-green-50 to-teal-50 p-5 rounded-lg border-2 border-green-300">
                <p className="font-bold text-green-900 mb-3 text-lg flex items-center gap-2">
                  <span>🎯</span>
                  <span>제목-썸네일-도입부 연계성 분석</span>
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>제목 ↔ 썸네일:</strong> {state.analysis.coherenceCheck.titleThumbnailMatch}</p>
                  <p><strong>썸네일 ↔ 도입부(0~30초):</strong> {state.analysis.coherenceCheck.thumbnailHookMatch}</p>
                  <p><strong>전체 시너지:</strong> {state.analysis.coherenceCheck.overallSynergy}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tone Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">톤앤매너 설정</h3>
          <div className="space-y-3">
            {[
              { id: '1', label: ToneOption.BENCHMARK },
              { id: '2', label: ToneOption.LOGICAL },
              { id: '3', label: ToneOption.CUSTOM }
            ].map((option) => (
              <label key={option.id} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${state.selectedTone === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input
                  type="radio"
                  name="tone"
                  value={option.id}
                  checked={state.selectedTone === option.id}
                  onChange={(e) => updateState({ selectedTone: e.target.value })}
                  className="w-6 h-6 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-lg font-medium text-slate-800">{option.label}</span>
              </label>
            ))}
          </div>
          
          {/* Custom Tone Input */}
          {state.selectedTone === '3' && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border-2 border-blue-300">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                커스텀 톤앤매너 입력
              </label>
              <textarea
                value={state.persona}
                onChange={(e) => updateState({ persona: e.target.value })}
                placeholder="예: 야담말투로 구어체를 사용해줘 (~했습니다 다음에 ~했지요, 현대어 금지)"
                className="w-full h-24 p-3 text-base border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Length Input */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">예상 영상 길이 (분)</h3>
          <input
            type="number"
            min={1}
            max={60}
            value={state.targetLength}
            onChange={(e) => updateState({ targetLength: parseInt(e.target.value) || 0 })}
            className="w-full p-4 text-xl font-bold text-center border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" onClick={() => updateState({ step: 1 })}>이전</Button>
          <Button fullWidth onClick={() => updateState({ step: 3 })}>다음 단계로 이동 👉</Button>
        </div>
      </div>
    </StepCard>
  );

  const renderStep3 = () => (
    <StepCard title="추천 선택" stepNumber={3} description="새로운 대본에 사용할 제목과 주제를 골라주세요.">
      <div className="space-y-8">
        {/* Custom Title Input */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">타깃 제목</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={state.selectedTitle}
              onChange={(e) => updateState({ selectedTitle: e.target.value })}
              placeholder="제목을 직접 입력하세요"
              className="flex-1 px-4 py-3 text-base border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={() => {
                if (state.selectedTitle) {
                  alert('제목이 저장되었습니다!');
                }
              }}
              disabled={!state.selectedTitle.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span>💾</span>
              <span>저장</span>
            </button>
          </div>
        </div>

        {/* SEO Keywords Analysis */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
            <span>🔍</span>
            <span>SEO 키워드 분석</span>
          </h3>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-semibold text-red-700 mb-1">🔴 대형 키워드</p>
              <p className="text-base text-slate-700">{state.analysis?.seoKeywords?.large || "삼성폰, 갤럭시, 스마트폰, 설정"}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-semibold text-orange-700 mb-1">🟠 중형 키워드</p>
              <p className="text-base text-slate-700">{state.analysis?.seoKeywords?.medium || "안전, 사기, 스미싱, 보안, AI 기능"}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-semibold text-green-700 mb-1">🟢 소형 키워드</p>
              <p className="text-base text-slate-700">{state.analysis?.seoKeywords?.small || "통역, 번역, 사진 공유, 파일 전송"}</p>
            </div>
          </div>
        </div>

        {/* Title Recommendations */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">추천 제목 (SEO 최적화)</h3>
          <div className="grid gap-3">
            {state.analysis?.suggestedTitles.map((title, idx) => (
              <button
                key={idx}
                onClick={() => updateState({ selectedTitle: title })}
                className={`p-4 rounded-xl text-left text-lg transition-all border-2 ${
                  state.selectedTitle === title 
                    ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-md' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <span className="font-bold text-blue-600 mr-2">{idx + 1}순위</span>
                {title}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">추천 주제</h3>
          <div className="grid gap-3">
            {state.analysis?.suggestedTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => updateState({ selectedTopic: topic })}
                className={`p-4 rounded-xl text-left text-lg transition-all border-2 ${
                  state.selectedTopic === topic 
                    ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-md' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" onClick={() => updateState({ step: 2 })}>이전</Button>
          <Button fullWidth disabled={!state.selectedTitle || !state.selectedTopic} onClick={() => updateState({ step: 4 })}>다음: 역할 부여 👉</Button>
        </div>
      </div>
    </StepCard>
  );

  const renderStep4 = () => (
    <StepCard title="역할(페르소나) 부여" stepNumber={4} description="대본의 맛을 살려줄 특별한 규칙이나 말투를 정해주세요.">
      <div className="space-y-6">
        <div>
           <h3 className="text-lg font-bold text-slate-900 mb-3">빠른 선택 (클릭 시 자동 입력)</h3>
           <div className="flex flex-wrap gap-2">
             {PRESET_PERSONAS.map((p) => (
               <button
                key={p}
                onClick={() => updateState({ persona: state.persona ? `${state.persona}, ${p}` : p })}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full text-base font-medium transition-colors"
               >
                 + {p}
               </button>
             ))}
           </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">상세 규칙 입력</h3>
          <textarea
            className="w-full h-32 p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none"
            placeholder="예: 초등학생도 이해하기 쉽게 설명해줘, 긍정적인 에너지를 줘..."
            value={state.persona}
            onChange={(e) => updateState({ persona: e.target.value })}
          />
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 text-sm">
          💡 <strong>Tip:</strong> 구체적으로 적을수록 퀄리티가 좋아집니다.
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" onClick={() => updateState({ step: 3 })}>이전</Button>
          <Button fullWidth onClick={handleGenerate}>✨ 대본 생성 시작</Button>
        </div>
      </div>
    </StepCard>
  );

  const renderStep5 = () => {
    if (state.isLoading) {
      return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center animate-pulse">
           <div className="text-6xl mb-6">🤖</div>
           <h2 className="text-2xl font-bold text-slate-800 mb-2">대본을 열심히 쓰고 있습니다...</h2>
           <p className="text-slate-500">타깃 대본의 구조를 분석하고,<br/>새로운 주제를 입히는 중입니다.</p>
        </div>
      );
    }

    return (
      <StepCard title="생성 완료!" stepNumber={5} description="완성된 대본을 확인하고 다운로드하세요.">
        <div className="space-y-6">
          {/* Generated Script */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">📝 생성된 대본</h3>
            <div className="bg-slate-900 text-white p-6 rounded-xl h-96 overflow-y-auto font-mono text-base leading-relaxed whitespace-pre-wrap shadow-inner">
              {state.generatedScript}
            </div>
          </div>

          {/* Thumbnail Image Prompt */}
          {state.thumbnailImagePrompt && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">🎨 썸네일 이미지 생성 프롬프트</h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-300">
                <p className="text-slate-800 text-base leading-relaxed mb-3">{state.thumbnailImagePrompt}</p>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>사용 방법:</strong> 이 프롬프트를 복사해서 DALL-E, Midjourney, Stable Diffusion 등 AI 이미지 생성 도구에 입력하세요. 
                    생성된 이미지에 미리캔버스에서 텍스트를 추가하면 완성!
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(state.thumbnailImagePrompt);
                    alert('프롬프트가 클립보드에 복사되었습니다!');
                  }}
                  className="mt-3 w-full py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📋 프롬프트 복사하기
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
             <Button fullWidth onClick={handleDownload} className="bg-green-600 hover:bg-green-700 shadow-green-200">
               📥 대본 텍스트 파일(.txt) 다운로드
             </Button>
             <Button variant="outline" onClick={handleReset} fullWidth>
               🔄 처음부터 다시 만들기
             </Button>
          </div>
        </div>
      </StepCard>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <header className="max-w-2xl mx-auto mb-10 flex flex-col gap-4">
        {/* Producer Badge */}
        <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-default">
          <div className="w-8 h-6 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1"></div>
          </div>
          <span className="font-black text-slate-800 text-lg tracking-tight">제작: 클로이</span>
        </div>
        
        {/* Main Title */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">
            자생's 30초룰 <span className="text-blue-600">대본 생성기</span>
          </h1>
          <p className="text-red-600 text-xl md:text-2xl font-bold mt-2">
            유튜브 떡상 대본, 구조만 가져와서 내 주제로 다시 쓰기
          </p>
        </div>

        {/* API Key Input - Always Visible */}
        <div className="bg-white rounded-xl shadow-md p-5 border-2 border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔑</span>
            <h3 className="text-lg font-bold text-slate-800">Gemini API Key 설정</h3>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={localStorage.getItem('gemini_api_key') || ''}
              onChange={(e) => {
                localStorage.setItem('gemini_api_key', e.target.value);
                setHasApiKey(!!e.target.value);
              }}
              placeholder="Gemini API v3 키를 입력하세요"
              className="flex-1 px-4 py-3 text-base border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={() => {
                const key = localStorage.getItem('gemini_api_key');
                if (key) {
                  alert('API 키가 저장되었습니다!');
                }
              }}
              disabled={!localStorage.getItem('gemini_api_key')}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span>💾</span>
              <span>저장</span>
            </button>
          </div>
          {!hasApiKey && (
            <p className="text-sm text-slate-500 mt-2">
              API 키가 저장되지 않았습니다.
            </p>
          )}
        </div>
      </header>

      <main className="pb-20">
        {state.step === 1 && renderStep1()}
        {state.step === 2 && renderStep2()}
        {state.step === 3 && renderStep3()}
        {state.step === 4 && renderStep4()}
        {state.step === 5 && renderStep5()}
      </main>
    </div>
  );
}
