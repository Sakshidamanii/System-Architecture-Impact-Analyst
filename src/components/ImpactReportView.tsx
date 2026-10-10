import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode, 
  Layers, 
  Database, 
  Clock, 
  GitPullRequest, 
  Copy, 
  Check, 
  ChevronRight, 
  ExternalLink,
  BookOpen,
  Terminal,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { ImpactAnalysisReport, Citation } from '../types';

interface ImpactReportViewProps {
  report: ImpactAnalysisReport;
  onOpenCitation: (citation: Citation) => void;
  onOpenRagInspector: () => void;
}

export const ImpactReportView: React.FC<ImpactReportViewProps> = ({
  report,
  onOpenCitation,
  onOpenRagInspector,
}) => {
  const [activeTab, setActiveTab] = useState<
    'contracts' | 'dependencies' | 'database' | 'rollout' | 'shims' | 'citations'
  >('contracts');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);

  const { executiveSummary, blastRadius, affectedApiContracts, databaseRisks, safeRolloutRoadmap, rollbackPlan, codePatches, groundedCitations, ragInspection } = report;

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleExportMarkdown = () => {
    const md = `# [ArchImpact Report] Architectural Blast-Radius & Impact Analysis
**Proposal:** ${report.proposal.title}
**Target Service:** ${report.proposal.targetService} (${report.proposal.type})
**Generated At:** ${new Date(report.generatedAt).toLocaleString()}

## 🚨 Executive Verdict
- **Risk Score:** ${executiveSummary.riskScore}/100 (${executiveSummary.riskLevel})
- **Breaking Changes:** ${executiveSummary.breakingChangesCount}
- **Affected Services:** ${executiveSummary.affectedServicesCount}
- **Estimated Dev Effort:** ~${executiveSummary.estimatedDevHours} hours
- **Rollback Feasibility:** ${rollbackPlan.feasibility}

${executiveSummary.verdict}

## 💥 Blast Radius
- **Critical Nodes:** ${blastRadius.criticalNodes.join(', ')}
- **Warning Nodes:** ${blastRadius.warningNodes.join(', ')}
- **Safe Nodes:** ${blastRadius.safeNodes.join(', ')}

## 📡 Affected API Contracts
${affectedApiContracts
  .map(
    (c) => `### ${c.method} ${c.endpoint} (${c.changeType.toUpperCase()})
- **Service:** ${c.service}
- **Callers Impacted:** ${c.callers.join(', ')}
- **Explanation:** ${c.explanation}
\`\`\`diff
${c.contractDiff}
\`\`\`
`
  )
  .join('\n')}

## 🗄️ Database Stability Risks
${databaseRisks
  .map(
    (db) => `### Table: ${db.tableName} (${db.riskLevel.toUpperCase()})
- **Lock Risk:** ${db.lockRisk}
- **Downtime Hazard:** ${db.migrationDowntime}
- **Recommendation:** ${db.recommendation}
`
  )
  .join('\n')}

## 🛡️ Grounded Citations & Sources
${groundedCitations
  .map((cite) => `- **${cite.path}** (${cite.lineRange}, ${cite.relevanceScore}% match): "${cite.title}"`)
  .join('\n')}
`;

    navigator.clipboard.writeText(md);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  // Color code based on risk level
  const riskColor =
    executiveSummary.riskLevel === 'CRITICAL'
      ? 'text-rose-400 border-rose-500/50 bg-rose-950/40'
      : executiveSummary.riskLevel === 'HIGH'
      ? 'text-amber-400 border-amber-500/50 bg-amber-950/40'
      : executiveSummary.riskLevel === 'MEDIUM'
      ? 'text-yellow-400 border-yellow-500/50 bg-yellow-950/40'
      : 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <h2 className="font-bold text-base text-slate-100">
              Architectural Impact & Dependency Analysis Report
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Grounded strictly in OpenAPI contracts, Architecture Decision Records (ADRs), and database schemas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenRagInspector}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>RAG Query Trace ({ragInspection.durationMs}ms)</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {copiedExport ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied Markdown!</span>
              </>
            ) : (
              <>
                <GitPullRequest className="h-3.5 w-3.5" />
                <span>Export PR Comment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Risk Score */}
        <div className={`col-span-2 sm:col-span-1 rounded-xl border p-3 flex flex-col justify-between ${riskColor}`}>
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-80">
            Blast Radius Risk
          </span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight">{executiveSummary.riskScore}</span>
            <span className="text-xs opacity-75">/ 100</span>
          </div>
          <span className="text-[10px] font-bold font-mono uppercase">{executiveSummary.riskLevel} SEVERITY</span>
        </div>

        {/* Breaking API Changes */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Breaking Contracts
          </span>
          <div className="text-2xl font-bold text-slate-100 my-1">
            {executiveSummary.breakingChangesCount}
          </div>
          <span className="text-[10px] text-slate-400">Upstream API signatures</span>
        </div>

        {/* Affected Services */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Affected Services
          </span>
          <div className="text-2xl font-bold text-slate-100 my-1">
            {executiveSummary.affectedServicesCount}
          </div>
          <span className="text-[10px] text-slate-400">Microservices in radius</span>
        </div>

        {/* Estimated Dev Hours */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Dev Migration Time
          </span>
          <div className="text-2xl font-bold text-cyan-400 my-1 flex items-center gap-1">
            <Clock className="h-4 w-4 text-cyan-500" />
            <span>~{executiveSummary.estimatedDevHours}h</span>
          </div>
          <span className="text-[10px] text-slate-400">Adapter + QA effort</span>
        </div>

        {/* Rollback Feasibility */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Rollback Protocol
          </span>
          <div className="text-xs font-semibold text-slate-200 my-1 leading-tight">
            {rollbackPlan.feasibility}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{rollbackPlan.downtimeRisk}</span>
        </div>
      </div>

      {/* Executive Verdict Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 shrink-0 mt-0.5">
          <Terminal className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-slate-100">Executive Architectural Verdict: </span>
          <span className="text-slate-300">{executiveSummary.verdict}</span>
          <div className="mt-1.5 text-[11px] text-slate-400">
            {blastRadius.explanation}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === 'contracts'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          API Contracts ({affectedApiContracts.length})
        </button>
        <button
          onClick={() => setActiveTab('dependencies')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === 'dependencies'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Dependency Cascades
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === 'database'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Database Stability ({databaseRisks.length})
        </button>
        <button
          onClick={() => setActiveTab('rollout')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === 'rollout'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Rollout Roadmap & Rollback
        </button>
        <button
          onClick={() => setActiveTab('shims')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === 'shims'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Code Adapter Shims ({codePatches.length})
        </button>
        <button
          onClick={() => setActiveTab('citations')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === 'citations'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Grounded Sources ({groundedCitations.length})
        </button>
      </div>

      {/* Tab 1: API Contracts */}
      {activeTab === 'contracts' && (
        <div className="flex flex-col gap-4">
          {affectedApiContracts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              No direct external API contracts are broken by this change.
            </div>
          ) : (
            affectedApiContracts.map((contract, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                      {contract.method}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-100">
                      {contract.endpoint}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      Service: {contract.service}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      contract.changeType === 'breaking'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {contract.changeType}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{contract.explanation}</p>

                {/* Callers */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Callers Impacted:</span>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {contract.callers.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-1 rounded bg-slate-900 text-amber-300 border border-amber-900/40"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contract Diff */}
                <div className="rounded-lg bg-slate-950 border border-slate-900 p-3 overflow-x-auto">
                  <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>API Specification Diff (OpenAPI Contract)</span>
                    <span className="text-slate-400">unified diff</span>
                  </div>
                  <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre">
                    {contract.contractDiff}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Dependencies */}
      {activeTab === 'dependencies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Direct Dependencies */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Direct Callers (Depth 1)</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {report.directDependencies.map((dep, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between gap-2 font-semibold text-slate-200">
                    <span>{dep.service}</span>
                    <span className="text-[10px] font-mono text-amber-400">{dep.impactType}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{dep.reason}</p>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {dep.files.map((f, i) => (
                      <span key={i} className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transitive Cascades */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-purple-400" />
              <span>Transitive Downstream Cascades (Depth 2+)</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {report.transitiveDependencies.map((tdep, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between gap-2 font-semibold text-purple-300">
                    <span>{tdep.service}</span>
                    <span className="text-[10px] font-mono text-slate-400">Depth {tdep.depth}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Propagated via: <span className="text-slate-200">{tdep.propagatedVia}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1.5">{tdep.risk}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Database Stability */}
      {activeTab === 'database' && (
        <div className="flex flex-col gap-4">
          {databaseRisks.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              No schema lock or database migration risks detected for this proposal.
            </div>
          ) : (
            databaseRisks.map((db, idx) => (
              <div key={idx} className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 border-b border-rose-900/30 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-rose-400" />
                    <span className="font-mono text-xs font-bold text-slate-100">
                      Table: {db.tableName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({db.service})</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase font-bold">
                    {db.riskLevel} Lock Hazard
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Lock Type & Duration:</span>
                    <p className="text-slate-200 mt-1">{db.lockRisk}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Estimated Downtime Hazard:</span>
                    <p className="text-amber-300 mt-1">{db.migrationDowntime}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs">
                  <span className="text-cyan-400 font-semibold">Zero-Downtime Migration Policy: </span>
                  <span className="text-slate-300">{db.recommendation}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Rollout Roadmap */}
      {activeTab === 'rollout' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {safeRolloutRoadmap.map((step) => (
              <div key={step.phase} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    Phase {step.phase}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <h5 className="font-bold text-xs text-slate-100">{step.title}</h5>
                <p className="text-xs text-slate-300 flex-1 leading-relaxed">{step.action}</p>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                  Verification: <span className="text-emerald-400">{step.verification}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Rollback Playbook */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-2">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Emergency Rollback Protocol</span>
            </h4>
            <div className="flex flex-col gap-1.5 mt-1">
              {rollbackPlan.steps.map((st, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-amber-400 font-mono font-bold">{i + 1}.</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Code Adapter Shims */}
      {activeTab === 'shims' && (
        <div className="flex flex-col gap-4">
          {codePatches.map((patch, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-xs text-slate-200">{patch.title}</div>
                  <div className="text-[10px] font-mono text-slate-400">{patch.filename}</div>
                </div>
                <button
                  onClick={() => handleCopyCode(patch.code, idx)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCodeIndex === idx ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Shim</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-950/90 overflow-x-auto">
                <pre className="font-mono text-xs text-cyan-300 leading-relaxed whitespace-pre">
                  {patch.code}
                </pre>
              </div>

              <div className="p-2.5 border-t border-slate-900 bg-slate-950/60 text-[11px] text-slate-400">
                {patch.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Citations */}
      {activeTab === 'citations' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groundedCitations.map((cite, idx) => (
            <div
              key={idx}
              onClick={() => onOpenCitation(cite)}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between gap-2 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-bold">
                    {cite.kind}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {cite.relevanceScore}% Match
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-200 mt-1.5 group-hover:text-cyan-300 transition-colors truncate">
                  {cite.title}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {cite.path} ({cite.lineRange})
                </div>
                <p className="text-[11px] text-slate-400 italic mt-2 line-clamp-3 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                  "{cite.excerpt}"
                </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 pt-1 group-hover:translate-x-1 transition-transform">
                <span>Inspect Source Chunk</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
