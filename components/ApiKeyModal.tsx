import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      setApiKey(stored);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span className="text-3xl">🔑</span>
          <span>Gemini API Key 설정</span>
        </h2>

        <div className="space-y-6">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Gemini API v3 키를 입력하세요"
            className="w-full px-5 py-4 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
          
          <p className="text-slate-500 text-base">
            API 키가 저장되지 않았습니다.
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>💾</span>
              <span>저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
