import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  FileDiff, 
  AlertOctagon, 
  Database, 
  ShieldAlert, 
  RefreshCw,
  Code2,
  Terminal,
  Zap
} from 'lucide-react';
import { ChangeProposal, ArchitectureNode } from '../types';

interface ProposalStudioProps {
  nodes: ArchitectureNode[];
  sampleProposals: ChangeProposal[];
  onAnalyze: (proposal: ChangeProposal) => void;
  isLoading: boolean;
  currentProposal: ChangeProposal;
  onChangeProposal: (proposal: ChangeProposal) => void;
}

export const ProposalStudio: React.FC<ProposalStudioProps> = ({
  nodes,
  sampleProposals,
  onAnalyze,
  isLoading,
  currentProposal,
  onChangeProposal,
}) => {
  const [analysisStep, setAnalysisStep] = useState<string>('');

  const handleSelectSample = (sample: ChangeProposal) => {
    onChangeProposal(sample);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProposal.title || !currentProposal.targetService) return;
    onAnalyze(currentProposal);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header & Quick Scenarios */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              Feature Change & Bug Impact Studio
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Propose a code refactor, breaking contract, or schema migration to evaluate system blast radius.
          </p>
        </div>

        {/* 1-Click Realistic Scenarios */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Load Preset:</span>
          </span>
          {sampleProposals.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => handleSelectSample(s)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors cursor-pointer"
              title={s.description}
            >
              Preset {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Proposal Title */}
          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Proposed Change / Ticket Title</label>
            <input
              type="text"
              required
              value={currentProposal.title}
              onChange={(e) => onChangeProposal({ ...currentProposal, title: e.target.value })}
              placeholder="e.g. Deprecate /v1/payments/charge in favor of /v2/payment_intents"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
            />
          </div>

          {/* Change Type */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Change Classification</label>
            <select
              value={currentProposal.type}
              onChange={(e) =>
                onChangeProposal({
                  ...currentProposal,
                  type: e.target.value as ChangeProposal['type'],
                })
              }
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-medium cursor-pointer"
            >
              <option value="breaking-refactor">⚠️ Breaking API Refactor</option>
              <option value="schema-migration">🗄️ Database Schema Migration</option>
              <option value="feature">✨ Feature / Contract Extension</option>
              <option value="bugfix">🐛 Bugfix / Security Patch</option>
            </select>
          </div>

          {/* Target Service */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Target Microservice</label>
            <select
              value={currentProposal.targetService}
              onChange={(e) => onChangeProposal({ ...currentProposal, targetService: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-medium cursor-pointer"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Change Description & Behavioral Specification
          </label>
          <textarea
            rows={2}
            required
            value={currentProposal.description}
            onChange={(e) => onChangeProposal({ ...currentProposal, description: e.target.value })}
            placeholder="Describe what is being modified, new parameters, removed endpoints, or database alterations..."
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-normal resize-y"
          />
        </div>

        {/* Proposed Code Diff / OpenAPI snippet */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Proposed Code Diff / Schema Migration / OpenAPI Patch (Optional)</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">Unified diff or YAML</span>
          </div>
          <textarea
            rows={3}
            value={currentProposal.proposedDiffOrContract || ''}
            onChange={(e) => onChangeProposal({ ...currentProposal, proposedDiffOrContract: e.target.value })}
            placeholder={`--- a/routes.ts\n+++ b/routes.ts\n- router.post('/v1/charge', ...)\n+ router.post('/v2/payment_intents', ...)`}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Action Button & Live Pipeline Steps */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>RAG Grounding: OpenAPI 3.1 Specs, ADRs & SQL Schemas</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Running RAG Hybrid Retrieval & Impact Evaluation...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-cyan-200" />
                <span>Run Architecture Impact Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
