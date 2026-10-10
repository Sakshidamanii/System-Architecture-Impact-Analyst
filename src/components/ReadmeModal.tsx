import React from 'react';
import { 
  X, 
  BookOpen, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  GitBranch, 
  Database, 
  Terminal,
  CheckCircle2,
  ExternalLink,
  Code2
} from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">
                  ArchImpact &bull; System Architecture & RAG Documentation
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  README.md
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Architectural blueprint, RAG hybrid retrieval pipeline, and blast radius methodology.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Executive Overview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>What is ArchImpact?</span>
            </h4>
            <p className="text-slate-300 mt-1">
              ArchImpact is an enterprise-grade <strong>Codebase & System Architecture Impact Analyst</strong> designed to solve the age-old engineering headache: <em className="text-cyan-300">"What breaks where when we change this code?"</em>
            </p>
            <p className="text-slate-400 mt-2">
              By indexing OpenAPI 3.1 specifications, Architecture Decision Records (ADRs), relational SQL schemas, and microservice code into a multi-vector RAG pipeline, ArchImpact evaluates blast radiuses, surfaces breaking API contracts, checks database table locks, and generates safe rollout and rollback playbooks.
            </p>
          </div>

          {/* RAG Pipeline Diagram */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>RAG Model Architecture & Retrieval Engine</span>
            </h4>
            <div className="p-4 rounded-lg bg-slate-900/90 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-850">
{`1. INGESTION & BOUNDARY-AWARE CHUNKING:
   - OpenAPI Specs  -> Endpoint path blocks (/v1/charge, /v2/payment_intents)
   - PostgreSQL DDL -> Table definitions & lock constraints (CREATE TABLE orders...)
   - Technical ADRs -> Context, Decisions, and Consequence blocks

2. HYBRID VECTOR RETRIEVAL:
   - Vector Embedding : Google Gemini ('gemini-embedding-2-preview', 768 dims)
   - Lexical Search   : BM25 Inverted Token Index with code symbol frequencies
   - Scoring Formula  : Score = 0.70 * CosineSimilarity + 0.30 * LexicalScore

3. GROUNDED SYNTHESIS (GEMINI 3.8 FLASH):
   - Strict Grounding : Cites exact files, lines, and ADR decision numbers
   - Output Schema    : Executive risk score, blast radius nodes, contract diffs, 
                        database locks, rollout roadmap, and TypeScript shims`}
            </div>
          </div>

          {/* Three Preloaded Systems */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span>Three Enterprise Architecture Ecosystems Included</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-1.5">
                <span className="font-bold text-xs text-slate-100">1. Global Payments & Checkout</span>
                <span className="text-[10px] font-mono text-cyan-400">payments-platform</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Features <code>payment-gateway</code>, <code>order-fulfillment</code>, Stripe webhooks, Kafka double-entry ledger, and 18M-row <code>orders</code> table.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-1.5">
                <span className="font-bold text-xs text-slate-100">2. FinTech FX & Core Banking</span>
                <span className="text-[10px] font-mono text-indigo-400">fintech-core</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  High-frequency currency quotation engine, tenant schema isolation (<code>SET search_path</code>), and sanctions/KYC screening.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-1.5">
                <span className="font-bold text-xs text-slate-100">3. Healthcare EHR & FHIR Hub</span>
                <span className="text-[10px] font-mono text-emerald-400">health-fhir-hub</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  HL7 FHIR v4 REST gateway (<code>/Patient</code>), WebRTC telehealth session coordination, and immutable HIPAA audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Impact Report Sections */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>What Each Impact Report Delivers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Executive Blast Risk Score: </span>
                  <span className="text-slate-400">Calculates 0–100 risk score, breaking changes count, and developer effort estimate.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">OpenAPI Contract Diff: </span>
                  <span className="text-slate-400">Side-by-side unified diffs with exact downstream caller files and line numbers.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Database Lock Hazard: </span>
                  <span className="text-slate-400">Detects ACCESS EXCLUSIVE locks and recommends zero-downtime 3-phase migrations.</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Backward-Compatible Shims: </span>
                  <span className="text-slate-400">Copyable TypeScript code shims that protect mobile apps and unmigrated callers.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">ArchImpact v2.4.0 &bull; README Documentation</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
