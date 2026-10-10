import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Plus, 
  FileCode, 
  Database, 
  FileText, 
  Check, 
  Sparkles, 
  ChevronRight,
  UploadCloud,
  Code2
} from 'lucide-react';
import { CodebaseDocument, ArchitectureNode } from '../types';

interface KnowledgeBaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: CodebaseDocument[];
  nodes: ArchitectureNode[];
  systemId: string;
  onDocumentAdded: (newDoc: CodebaseDocument, chunkCount: number) => void;
}

export const KnowledgeBaseDrawer: React.FC<KnowledgeBaseDrawerProps> = ({
  isOpen,
  onClose,
  documents,
  nodes,
  systemId,
  onDocumentAdded,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<CodebaseDocument | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Doc Form
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');
  const [service, setService] = useState(nodes[0]?.id || '');
  const [kind, setKind] = useState<CodebaseDocument['kind']>('openapi');
  const [content, setContent] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/documents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId,
          document: {
            title,
            path: path || `specs/${title.toLowerCase().replace(/\s+/g, '-')}.yaml`,
            service,
            kind,
            content,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.document) {
        onDocumentAdded(data.document, data.newChunksCount);
        setSuccessMessage(`Successfully chunked and embedded ${data.newChunksCount} chunks into RAG store!`);
        setIsAdding(false);
        setTitle('');
        setPath('');
        setContent('');
        setSelectedDoc(data.document);
      }
    } catch (err) {
      console.error('Failed to ingest document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Codebase Technical Documentation & Specifications
              </h3>
              <p className="text-xs text-slate-400">
                Indexed OpenAPI specs, Architecture Decision Records (ADRs), schemas, and contracts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAdding ? 'View Docs' : 'Ingest Spec'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="m-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {isAdding ? (
            /* Add Spec Form */
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. OpenAPI 3.1 - Webhook Events Contract"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Document Type</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="openapi">OpenAPI / Swagger Spec</option>
                    <option value="adr">Architecture Decision Record (ADR)</option>
                    <option value="schema">SQL Database Schema</option>
                    <option value="code">Source Code File</option>
                    <option value="architecture">System Architecture Doc</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Target Microservice</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Repository File Path</label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="specs/openapi-webhooks.yaml or adr/005-webhooks.md"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Specification Content (YAML, Markdown, SQL, TypeScript)
                </label>
                <textarea
                  rows={10}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste OpenAPI spec, ADR decisions, CREATE TABLE statements, or code..."
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" />
                <span>{isSubmitting ? 'Embedding into RAG Store...' : 'Chunk & Embed Document into Vector Store'}</span>
              </button>
            </form>
          ) : selectedDoc ? (
            /* Selected Document View */
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer w-fit"
              >
                &larr; Back to all documents
              </button>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-100">{selectedDoc.title}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                    {selectedDoc.kind}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {selectedDoc.path} &bull; Service: {selectedDoc.service}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 overflow-x-auto">
                <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
                  {selectedDoc.content}
                </pre>
              </div>
            </div>
          ) : (
            /* Document List */
            <div className="flex flex-col gap-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 text-indigo-400 border border-slate-800">
                      {doc.kind === 'openapi' && <Code2 className="h-4 w-4 text-cyan-400" />}
                      {doc.kind === 'adr' && <FileText className="h-4 w-4 text-indigo-400" />}
                      {doc.kind === 'schema' && <Database className="h-4 w-4 text-emerald-400" />}
                      {doc.kind === 'code' && <FileCode className="h-4 w-4 text-amber-400" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {doc.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {doc.path} &bull; {doc.service}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
