import React from 'react';

interface StepCardProps {
  title: string;
  stepNumber: number;
  description?: string;
  children: React.ReactNode;
}

export const StepCard: React.FC<StepCardProps> = ({ title, stepNumber, description, children }) => {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
          {stepNumber}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          {description && <p className="text-slate-500 text-sm mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6 md:p-8">
        {children}
      </div>
    </div>
  );
};