import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [remember, setRemember] = useState(true);
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      setSavedKey(stored);
      setApiKey(stored);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      if (remember) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
      } else {
        localStorage.removeItem('gemini_api_key');
      }
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
      localStorage.removeItem('gemini_api_key');
      setApiKey('');
      setSavedKey('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">🔑 API 키 설정</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gemini API 키
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
            {savedKey && (
              <p className="text-xs text-green-600 mt-1">✓ API 키가 저장되어 있습니다</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">API 키 기억하기 (로컬 저장)</span>
          </label>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-slate-600">
            <p className="font-semibold text-blue-800 mb-1">💡 API 키 발급 방법</p>
            <p>1. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google AI Studio</a>에서 무료 발급</p>
            <p>2. 발급받은 키를 위 입력창에 붙여넣기</p>
            <p className="mt-2 text-amber-700">⚠️ 브라우저에만 저장되며 외부로 전송되지 않습니다</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {savedKey && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              className="flex-1"
            >
              삭제
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1"
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
};
