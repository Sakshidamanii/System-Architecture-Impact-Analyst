import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Search, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  Hash, 
  FileCode, 
  Activity,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';
import { RagStatus, DocumentChunk } from '../types';

interface RagInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ragStatus: RagStatus | null;
  activeSystemId: string;
}

interface SearchResultItem {
  chunk: DocumentChunk;
  score: number;
  vectorScore: number;
  lexicalScore: number;
  matchedSymbols: string[];
}

export const RagInspectorModal: React.FC<RagInspectorModalProps> = ({
  isOpen,
  onClose,
  ragStatus,
  activeSystemId,
}) => {
  const [activeTab, setActiveTab] = useState<'tester' | 'chunks'>('tester');
  const [query, setQuery] = useState<string>('Idempotency-Key payment charge');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [allChunks, setAllChunks] = useState<DocumentChunk[]>([]);
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      handleSearch(query);
      fetchAllChunks();
    }
  }, [isOpen, activeSystemId]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, systemId: activeSystemId, topK: 6 }),
      });
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('RAG Search test failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchAllChunks = async () => {
    try {
      const res = await fetch(`/api/rag/chunks?systemId=${activeSystemId}`);
      const data = await res.json();
      if (data.chunks) {
        setAllChunks(data.chunks);
      }
    } catch (err) {
      console.error('Failed to fetch chunks:', err);
    }
  };

  if (!isOpen) return null;

  const filteredChunks = allChunks.filter(
    (c) =>
      c.title.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      c.path.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      c.service.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      c.kind.toLowerCase().includes(filterKeyword.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">
                  RAG Model Architecture & Retrieval Inspector
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  gemini-embedding-2-preview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect vector cosine similarities, BM25 token frequencies, and indexed technical chunks.
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

        {/* Status Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-slate-800 bg-slate-950/40 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Vector Index Status</span>
            <div className="font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{ragStatus?.status === 'ready' ? 'Ready & Calibrated' : 'Indexing...'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Indexed Chunks</span>
            <div className="font-bold text-cyan-400 mt-0.5 font-mono">
              {ragStatus?.totalChunks || 0} Chunks
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Vector Embedding Model</span>
            <div className="font-mono text-indigo-300 mt-0.5 truncate text-[11px]">
              {ragStatus?.modelEmbedding || 'gemini-embedding-2-preview'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Reasoning / Flash Model</span>
            <div className="font-mono text-purple-300 mt-0.5 truncate text-[11px]">
              {ragStatus?.modelGeneration || 'gemini-3.8-flash'}
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'tester'
                ? 'border-cyan-400 text-cyan-400 bg-slate-850'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Hybrid Search & Cosine Scoring
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'chunks'
                ? 'border-cyan-400 text-cyan-400 bg-slate-850'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Indexed Chunks ({allChunks.length})
          </button>
        </div>

        {/* Tab 1: Tester */}
        {activeTab === 'tester' && (
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
            {/* Search query input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  placeholder="Enter codebase symbols, endpoints, error codes (e.g. /v1/payments/charge, orders table lock)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>
              <button
                onClick={() => handleSearch(query)}
                disabled={isSearching}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSearching ? 'Embedding & Scoring...' : 'Run Query'}
              </button>
            </div>

            {/* Quick search suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-slate-400">
              <span>Try queries:</span>
              {[
                'Idempotency-Key',
                'orders table schema lock',
                'payment.events Kafka topic',
                '3DS PSD2 /v2/payment_intents',
                'SET search_path tenant',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuery(q);
                    handleSearch(q);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="flex flex-col gap-3 mt-1">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                  No retrieved chunks match this query.
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                          {item.chunk.kind}
                        </span>
                        <span className="font-semibold text-xs text-slate-100 truncate">{item.chunk.title}</span>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                          Hybrid: {(item.score * 100).toFixed(1)}%
                        </span>
                        <span className="text-cyan-400">Vector: {(item.vectorScore * 100).toFixed(1)}%</span>
                        <span className="text-purple-400">BM25: {(item.lexicalScore * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-3">
                      <span>Path: {item.chunk.path} (L{item.chunk.startLine}-L{item.chunk.endLine})</span>
                      <span>Service: {item.chunk.service}</span>
                    </div>

                    {/* Matched symbols */}
                    {item.matchedSymbols && item.matchedSymbols.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500">Symbols:</span>
                        {item.matchedSymbols.map((sym, sidx) => (
                          <span key={sidx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                            {sym}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {item.chunk.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: All Chunks */}
        {activeTab === 'chunks' && (
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
            <input
              type="text"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              placeholder="Filter chunks by title, path, kind, or service..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />

            <div className="flex flex-col gap-2 mt-1">
              {filteredChunks.map((chunk) => (
                <div key={chunk.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-200">{chunk.title}</div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 uppercase">
                      {chunk.kind}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {chunk.path} (L{chunk.startLine}-L{chunk.endLine}) &bull; {chunk.tokensEstimate} tokens
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 font-mono line-clamp-2">
                    {chunk.preview || chunk.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
