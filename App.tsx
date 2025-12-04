
import React, { useState, useEffect, useRef } from 'react';
import { StepCard } from './components/StepCard';
import { Button } from './components/Button';
import { ApiKeyModal } from './components/ApiKeyModal';
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
      analysis: null,
      selectedTone: '1',
      targetLength: 5,
      selectedTitle: '',
      selectedTopic: '',
      persona: '',
      generatedScript: '',
      isLoading: false,
      error: null
    };
  });

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('scriptMatchState', JSON.stringify(state));
  }, [state]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check API key on mount and modal close
  useEffect(() => {
    const checkApiKey = () => {
      const key = localStorage.getItem('gemini_api_key');
      setHasApiKey(!!key);
    };
    checkApiKey();
    
    // Recheck when modal might have closed
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, [isApiKeyModalOpen]);

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

  const handleAnalyze = async () => {
    if (!state.inputScript.trim()) return;
    
    // Check API key before analysis
    if (!hasApiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    
    updateState({ isLoading: true, error: null });
    
    try {
      const result = await analyzeScript(state.inputScript);
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
      setIsApiKeyModalOpen(true);
      return;
    }
    
    updateState({ isLoading: true, step: 5, error: null });
    try {
      const tonePrompt = state.selectedTone === '1' ? ToneOption.BENCHMARK : 
                         state.selectedTone === '2' ? ToneOption.LOGICAL : 
                         ToneOption.CUSTOM;
                         
      const script = await generateBenchmarkedScript(
        state.inputScript,
        state.selectedTitle,
        state.selectedTopic,
        tonePrompt,
        state.targetLength,
        state.persona
      );
      updateState({ generatedScript: script, isLoading: false });
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
      <div className="space-y-4">
        <textarea
          className="w-full h-64 p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all placeholder:text-slate-400"
          placeholder="여기에 대본 내용을 붙여넣으세요..."
          value={state.inputScript}
          onChange={(e) => updateState({ inputScript: e.target.value })}
        />
        <div className="flex gap-4">
           <input 
            type="file" 
            accept=".txt" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1">
            📂 파일 불러오기 (.txt)
          </Button>
          <Button 
            fullWidth 
            className="flex-1"
            variant="danger"
            disabled={state.inputScript.length < 10 || state.isLoading}
            onClick={handleAnalyze}
          >
            {state.isLoading ? '분석 중...' : '🔍 대본구조분석하기'}
          </Button>
        </div>
        {state.error && <p className="text-red-500 font-bold text-center">{state.error}</p>}
      </div>
    </StepCard>
  );

  const renderStep2 = () => (
    <StepCard title="분석 결과 및 설정" stepNumber={2} description="AI가 분석한 특징을 확인하고 설정을 맞춰주세요.">
      <div className="space-y-8">
        {/* Analysis Result */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-blue-800 font-bold text-lg mb-2">💡 AI 분석 리포트</h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700 text-lg">
            <li><strong>초반 특징:</strong> {state.analysis?.hookAnalysis}</li>
            <li><strong>구조 특징:</strong> {state.analysis?.structureSummary}</li>
          </ul>
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

        <Button fullWidth onClick={() => updateState({ step: 3 })}>다음 단계로 이동 👉</Button>
      </div>
    </StepCard>
  );

  const renderStep3 = () => (
    <StepCard title="추천 선택" stepNumber={3} description="새로운 대본에 사용할 제목과 주제를 골라주세요.">
      <div className="space-y-8">
        {/* Title Selection */}
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
          <div className="bg-slate-900 text-white p-6 rounded-xl h-96 overflow-y-auto font-mono text-base leading-relaxed whitespace-pre-wrap shadow-inner">
            {state.generatedScript}
          </div>
          
          <div className="flex flex-col gap-3">
             <Button fullWidth onClick={handleDownload} className="bg-green-600 hover:bg-green-700 shadow-green-200">
               📥 텍스트 파일(.txt) 다운로드
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
        
        {/* Main Title - Centered block */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">
            자생's 30초룰 <span className="text-blue-600">대본 생성기</span>
          </h1>
          <p className="text-red-600 text-xl md:text-2xl font-bold mt-2">
            유튜브 떡상 대본, 구조만 가져와서 내 주제로 다시 쓰기
          </p>
        </div>

        {/* API Key Settings Button - Large and Prominent */}
        <button
          onClick={() => setIsApiKeyModalOpen(true)}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg ${
            hasApiKey 
              ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300' 
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-2 border-amber-400 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🔑</span>
            <span>{hasApiKey ? 'Gemini API 키 설정됨' : 'Gemini API 키 설정'}</span>
          </div>
          {!hasApiKey && (
            <p className="text-sm mt-1 text-amber-700">API 키가 저장되지 않았습니다</p>
          )}
        </button>
      </header>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
      />

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
