import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
  isModified?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, label, isModified = false }) => {
  return (
    <div className={`rounded-lg overflow-hidden border ${isModified ? 'border-emerald-500/50' : 'border-slate-700'} bg-slate-900 shadow-xl`}>
      {label && (
        <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${isModified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'} flex justify-between items-center`}>
          <span>{label}</span>
          {isModified && <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">Optimized</span>}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};