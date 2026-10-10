import React from 'react';
import { X, BookOpen, ExternalLink, CheckCircle2, FileCode, Layers } from 'lucide-react';
import { Citation } from '../types';

interface CitationDrawerProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">Grounded Codebase Source</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  {citation.relevanceScore}% Vector Match
                </span>
              </div>
              <p className="text-xs text-slate-400">{citation.path} ({citation.lineRange})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">{citation.title}</span>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                {citation.kind}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Microservice: <span className="text-slate-200">{citation.service}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1.5">Excerpt Grounding Context:</div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {citation.excerpt}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-900/50 text-xs text-cyan-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              This citation was matched via the RAG hybrid retrieval pipeline to guarantee the impact report is strictly grounded in company architecture decisions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
