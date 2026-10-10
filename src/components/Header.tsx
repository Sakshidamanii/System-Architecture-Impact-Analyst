import React from 'react';
import { 
  GitBranch, 
  Cpu, 
  BookOpen, 
  Database, 
  Sparkles, 
  Layers, 
  FileCode, 
  CheckCircle2, 
  Search,
  ExternalLink,
  Code2
} from 'lucide-react';
import { SystemSummary, RagStatus } from '../types';

interface HeaderProps {
  systems: SystemSummary[];
  selectedSystemId: string;
  onSelectSystem: (id: string) => void;
  ragStatus: RagStatus | null;
  onOpenRagInspector: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenReadme: () => void;
  activeRepoName: string;
}

export const Header: React.FC<HeaderProps> = ({
  systems,
  selectedSystemId,
  onSelectSystem,
  ragStatus,
  onOpenRagInspector,
  onOpenKnowledgeBase,
  onOpenReadme,
  activeRepoName,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ArchImpact
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
                RAG Analyst
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Codebase & System Architecture Blast-Radius Evaluator
            </p>
          </div>
        </div>

        {/* System & Repo Selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <Layers className="h-4 w-4 text-cyan-400 ml-2 hidden sm:block" />
            <select
              value={selectedSystemId}
              onChange={(e) => onSelectSystem(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 outline-none pr-3 py-1 cursor-pointer hover:text-white"
            >
              {systems.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.name} ({s.nodeCount} services)
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 font-mono">
            <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
            <span>{activeRepoName}</span>
          </div>

          {/* RAG Status Badge */}
          <button
            onClick={onOpenRagInspector}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all text-xs font-mono text-slate-300 group cursor-pointer"
            title="Inspect RAG Embedding & Hybrid Search Store"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="group-hover:text-cyan-300 flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>RAG: {ragStatus?.totalChunks || 0} Chunks</span>
            </span>
          </button>

          {/* Knowledge Base Drawer Button */}
          <button
            onClick={onOpenKnowledgeBase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-300 font-medium cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>Specs & ADRs</span>
          </button>

          {/* Docs & README Modal Button */}
          <button
            onClick={onOpenReadme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/70 border border-indigo-800/60 hover:border-indigo-700 transition-all text-xs text-indigo-200 font-semibold cursor-pointer shadow-sm"
          >
            <Code2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Docs & README</span>
          </button>
        </div>
      </div>
    </header>
  );
};
