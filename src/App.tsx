/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ArchitectureGraph } from './components/ArchitectureGraph';
import { ProposalStudio } from './components/ProposalStudio';
import { ImpactReportView } from './components/ImpactReportView';
import { RagInspectorModal } from './components/RagInspectorModal';
import { KnowledgeBaseDrawer } from './components/KnowledgeBaseDrawer';
import { CitationDrawer } from './components/CitationDrawer';
import {
  ArchitectureSystem,
  SystemSummary,
  ChangeProposal,
  ImpactAnalysisReport,
  RagStatus,
  Citation,
  CodebaseDocument,
} from './types';
import { Layers, ShieldAlert, Cpu, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [systems, setSystems] = useState<SystemSummary[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('payments-platform');
  const [activeSystem, setActiveSystem] = useState<ArchitectureSystem | null>(null);
  const [ragStatus, setRagStatus] = useState<RagStatus | null>(null);

  const [currentProposal, setCurrentProposal] = useState<ChangeProposal>({
    title: 'Deprecate & Remove /v1/payments/charge in favor of /v2/payment_intents',
    type: 'breaking-refactor',
    targetService: 'payment-gateway',
    description:
      'Remove legacy synchronous endpoint POST /v1/payments/charge and enforce all callers to use the 3DS2-compliant /v2/payment_intents endpoint with client-side intent confirmation.',
    proposedDiffOrContract: `--- a/payment-gateway/src/routes.ts\n+++ b/payment-gateway/src/routes.ts\n@@ -14,12 +14,3 @@\n- router.post('/v1/payments/charge', chargeHandler);\n+ // DEPRECATED: /v1/payments/charge removed per PSD2 SCA enforcement.\n+ // All clients must call /v2/payment_intents instead.`,
  });

  const [report, setReport] = useState<ImpactAnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Modals & Drawers
  const [isRagInspectorOpen, setIsRagInspectorOpen] = useState<boolean>(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState<boolean>(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Fetch initial systems and RAG status
  useEffect(() => {
    fetchSystems();
    fetchRagStatus();
  }, []);

  // When selectedSystemId changes, fetch system details
  useEffect(() => {
    if (selectedSystemId) {
      fetchSystemDetails(selectedSystemId);
    }
  }, [selectedSystemId]);

  const fetchSystems = async () => {
    try {
      const res = await fetch('/api/systems');
      const data = await res.json();
      if (data.systems) {
        setSystems(data.systems);
      }
    } catch (err) {
      console.error('Failed to fetch systems:', err);
    }
  };

  const fetchRagStatus = async () => {
    try {
      const res = await fetch('/api/rag/status');
      const data = await res.json();
      setRagStatus(data);
    } catch (err) {
      console.error('Failed to fetch rag status:', err);
    }
  };

  const fetchSystemDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/systems/${id}`);
      const data = await res.json();
      if (data.system) {
        setActiveSystem(data.system);
        // Default proposal if system has samples
        if (data.system.sampleProposals && data.system.sampleProposals.length > 0) {
          setCurrentProposal(data.system.sampleProposals[0]);
        } else {
          setCurrentProposal({
            title: `Refactor ${data.system.nodes[0]?.name || 'service'} API contract`,
            type: 'feature',
            targetService: data.system.nodes[0]?.id || 'general',
            description: 'Evaluate architectural blast radius of modifying core microservice interface.',
          });
        }
        // Automatically run initial analysis for instant gratification
        executeAnalysis(data.system, data.system.sampleProposals?.[0] || currentProposal);
      }
    } catch (err) {
      console.error('Failed to fetch system details:', err);
    }
  };

  const executeAnalysis = async (system: ArchitectureSystem, proposal: ChangeProposal) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/rag/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemId: system.id, proposal }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to analyze impact:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAnalysis = (proposalToRun: ChangeProposal) => {
    if (!activeSystem) return;
    executeAnalysis(activeSystem, proposalToRun);
  };

  const handleDocumentAdded = (newDoc: CodebaseDocument, newChunks: number) => {
    if (activeSystem) {
      setActiveSystem({
        ...activeSystem,
        documents: [...activeSystem.documents, newDoc],
      });
    }
    fetchRagStatus();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        systems={systems}
        selectedSystemId={selectedSystemId}
        onSelectSystem={setSelectedSystemId}
        ragStatus={ragStatus}
        onOpenRagInspector={() => setIsRagInspectorOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        activeRepoName={activeSystem?.repoName || 'acme-corp/ecosystem'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-6">
        {/* Architecture & Dependency Knowledge Graph */}
        {activeSystem && (
          <ArchitectureGraph
            nodes={activeSystem.nodes}
            edges={activeSystem.edges}
            report={report}
            targetServiceId={currentProposal.targetService}
          />
        )}

        {/* Proposal Studio (Simulate feature change or bug report) */}
        {activeSystem && (
          <ProposalStudio
            nodes={activeSystem.nodes}
            sampleProposals={activeSystem.sampleProposals || []}
            onAnalyze={handleRunAnalysis}
            isLoading={isAnalyzing}
            currentProposal={currentProposal}
            onChangeProposal={setCurrentProposal}
          />
        )}

        {/* Grounded Impact Analysis Report */}
        {report && (
          <ImpactReportView
            report={report}
            onOpenCitation={(cite) => setActiveCitation(cite)}
            onOpenRagInspector={() => setIsRagInspectorOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ArchImpact &bull; System Architecture & Codebase Blast Radius Analyst</span>
          <span className="font-mono text-[11px] text-slate-400">
            Powered by RAG Hybrid Retrieval & Google Gemini
          </span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <RagInspectorModal
        isOpen={isRagInspectorOpen}
        onClose={() => setIsRagInspectorOpen(false)}
        ragStatus={ragStatus}
        activeSystemId={selectedSystemId}
      />

      {activeSystem && (
        <KnowledgeBaseDrawer
          isOpen={isKnowledgeBaseOpen}
          onClose={() => setIsKnowledgeBaseOpen(false)}
          documents={activeSystem.documents}
          nodes={activeSystem.nodes}
          systemId={selectedSystemId}
          onDocumentAdded={handleDocumentAdded}
        />
      )}

      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
