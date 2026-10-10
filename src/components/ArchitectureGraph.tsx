import React, { useState, useMemo } from 'react';
import { 
  Server, 
  Database, 
  Globe, 
  Radio, 
  Smartphone, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Info
} from 'lucide-react';
import { ArchitectureNode, ArchitectureEdge, ImpactAnalysisReport } from '../types';

interface ArchitectureGraphProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  report: ImpactAnalysisReport | null;
  targetServiceId?: string;
  onSelectNode?: (node: ArchitectureNode) => void;
}

export const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({
  nodes,
  edges,
  report,
  targetServiceId,
  onSelectNode,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);

  // Compute layout positions for nodes in a neat tiered architectural flow
  const nodeLayout = useMemo(() => {
    // Categorize nodes into columns
    const clients = nodes.filter((n) => n.type === 'client-app');
    const gateways = nodes.filter((n) => n.type === 'api-gateway');
    const services = nodes.filter((n) => n.type === 'service');
    const infra = nodes.filter((n) => n.type === 'database' || n.type === 'queue' || n.type === 'external');

    const layout = new Map<string, { x: number; y: number }>();
    const colWidth = 260;
    const startX = 60;

    // Col 0: Clients
    clients.forEach((n, i) => {
      layout.set(n.id, { x: startX, y: 120 + i * 160 });
    });

    // Col 1: Gateways
    gateways.forEach((n, i) => {
      layout.set(n.id, { x: startX + colWidth, y: 120 + i * 160 });
    });

    // Col 2: Core Services
    services.forEach((n, i) => {
      layout.set(n.id, { x: startX + colWidth * 2, y: 80 + i * 140 });
    });

    // Col 3: Databases & Queues
    infra.forEach((n, i) => {
      layout.set(n.id, { x: startX + colWidth * 3, y: 90 + i * 150 });
    });

    return layout;
  }, [nodes]);

  const activeSelectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Node blast status
  const getNodeStatus = (nodeId: string) => {
    if (!report) {
      if (nodeId === targetServiceId) return 'target';
      return 'neutral';
    }
    if (report.blastRadius.criticalNodes.includes(nodeId)) return 'critical';
    if (report.blastRadius.warningNodes.includes(nodeId)) return 'warning';
    if (report.blastRadius.safeNodes.includes(nodeId)) return 'safe';
    return 'neutral';
  };

  const filteredNodes = nodes.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'service') return n.type === 'service';
    if (filterType === 'database') return n.type === 'database';
    if (filterType === 'queue') return n.type === 'queue';
    return true;
  });

  return (
    <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* Top Bar with Controls & Legend */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            System Dependency & Blast-Radius Graph
          </span>
          {report && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse">
              Blast Radius Overlay Active
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30"></span>
            <span className="text-rose-300">Breaking Blast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30"></span>
            <span className="text-amber-300">Affected Caller</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-300">Safe Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-indigo-300">Proposal Target</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Workspace */}
      <div className="relative flex-1 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] p-4">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease-out',
            minWidth: '1050px',
            minHeight: '440px',
            position: 'relative',
          }}
        >
          {/* SVG Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '1050px', minHeight: '440px' }}>
            <defs>
              <marker id="arrow-neutral" markerWidth="6" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
              </marker>
              <marker id="arrow-critical" markerWidth="6" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f43f5e" />
              </marker>
              <marker id="arrow-warning" markerWidth="6" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const srcPos = nodeLayout.get(edge.source);
              const tgtPos = nodeLayout.get(edge.target);
              if (!srcPos || !tgtPos) return null;

              const isConnectedToTarget = edge.source === targetServiceId || edge.target === targetServiceId;
              const isCrit =
                report &&
                (report.blastRadius.criticalNodes.includes(edge.source) ||
                  report.blastRadius.criticalNodes.includes(edge.target));
              const isWarn =
                report &&
                (report.blastRadius.warningNodes.includes(edge.source) ||
                  report.blastRadius.warningNodes.includes(edge.target));

              let strokeColor = '#334155';
              let marker = 'url(#arrow-neutral)';
              let strokeWidth = 1.5;

              if (isCrit) {
                strokeColor = '#f43f5e';
                marker = 'url(#arrow-critical)';
                strokeWidth = 2.5;
              } else if (isWarn) {
                strokeColor = '#f59e0b';
                marker = 'url(#arrow-warning)';
                strokeWidth = 2;
              } else if (isConnectedToTarget) {
                strokeColor = '#818cf8';
                strokeWidth = 2;
              }

              // Bezier curve
              const startX = srcPos.x + 180;
              const startY = srcPos.y + 40;
              const endX = tgtPos.x;
              const endY = tgtPos.y + 40;
              const dx = (endX - startX) * 0.5;

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.protocol === 'Kafka' ? '4 3' : undefined}
                    markerEnd={marker}
                    className="transition-all duration-300"
                  />
                  {/* Protocol Badge at midpoint */}
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 6}
                    fill={isCrit ? '#fca5a5' : '#94a3b8'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none bg-slate-950"
                  >
                    {edge.protocol}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Render Nodes */}
          {filteredNodes.map((node) => {
            const pos = nodeLayout.get(node.id) || { x: 50, y: 50 };
            const status = getNodeStatus(node.id);
            const isSelected = selectedNodeId === node.id;

            // Colors based on blast radius status
            let borderClass = 'border-slate-800 bg-slate-950/90 hover:border-slate-700';
            let glowClass = '';
            let statusBadge = null;

            if (status === 'critical') {
              borderClass = 'border-rose-500 bg-rose-950/50 shadow-lg shadow-rose-900/30';
              glowClass = 'ring-2 ring-rose-500/40 animate-pulse';
              statusBadge = (
                <span className="flex items-center gap-1 text-[9px] font-mono text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800 font-bold">
                  <ShieldAlert className="h-2.5 w-2.5" /> CRITICAL BLAST
                </span>
              );
            } else if (status === 'warning') {
              borderClass = 'border-amber-500/80 bg-amber-950/40 shadow-lg shadow-amber-950/20';
              glowClass = 'ring-1 ring-amber-500/30';
              statusBadge = (
                <span className="flex items-center gap-1 text-[9px] font-mono text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                  <AlertTriangle className="h-2.5 w-2.5" /> AFFECTED
                </span>
              );
            } else if (status === 'target') {
              borderClass = 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-900/30';
              glowClass = 'ring-2 ring-indigo-500/50';
              statusBadge = (
                <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800">
                  PROPOSAL TARGET
                </span>
              );
            } else if (status === 'safe') {
              borderClass = 'border-emerald-800/60 bg-emerald-950/20';
              statusBadge = (
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded">
                  SAFE
                </span>
              );
            }

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectNode?.(node);
                }}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '185px',
                }}
                className={`cursor-pointer rounded-xl border p-3 transition-all duration-200 select-none ${borderClass} ${glowClass} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-900/90 text-cyan-400 border border-slate-800">
                    {node.type === 'service' && <Server className="h-3.5 w-3.5" />}
                    {node.type === 'database' && <Database className="h-3.5 w-3.5 text-emerald-400" />}
                    {node.type === 'api-gateway' && <Globe className="h-3.5 w-3.5 text-amber-400" />}
                    {node.type === 'queue' && <Radio className="h-3.5 w-3.5 text-purple-400" />}
                    {node.type === 'client-app' && <Smartphone className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  {statusBadge}
                </div>

                <div className="font-semibold text-xs text-slate-100 truncate" title={node.name}>
                  {node.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{node.id}</div>
                <div className="mt-2 text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {node.techStack}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {activeSelectedNode && (
        <div className="border-t border-slate-800 bg-slate-950/95 p-3.5 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
              {activeSelectedNode.type === 'service' ? <Server className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">{activeSelectedNode.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {activeSelectedNode.type}
                </span>
                <span className="font-mono text-[10px] text-indigo-400">{activeSelectedNode.repo}</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">{activeSelectedNode.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {activeSelectedNode.endpoints && activeSelectedNode.endpoints.length > 0 && (
              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-cyan-400">API:</span>
                <span>{activeSelectedNode.endpoints[0]}</span>
                {activeSelectedNode.endpoints.length > 1 && (
                  <span className="text-slate-500">+{activeSelectedNode.endpoints.length - 1}</span>
                )}
              </div>
            )}
            {activeSelectedNode.tables && (
              <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span>Tables:</span>
                <span>{activeSelectedNode.tables.join(', ')}</span>
              </div>
            )}
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-850"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
