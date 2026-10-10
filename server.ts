import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { PRELOADED_SYSTEMS } from './server/rag/preloadedData.js';
import { VectorStore, chunkDocument } from './server/rag/vectorStore.js';
import { runImpactAnalysis } from './server/rag/impactAnalyzer.js';
import { getEmbedding, isGeminiAvailable } from './server/rag/geminiService.js';
import { ArchitectureSystem, CodebaseDocument, ChangeProposal } from './server/rag/types.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// In-memory application state
const systems: ArchitectureSystem[] = JSON.parse(JSON.stringify(PRELOADED_SYSTEMS));
const vectorStore = new VectorStore();
let isIndexed = false;

// Initialize vector store on server start
async function initializeIndex() {
  console.log('Indexing codebase documents into RAG vector store...');
  vectorStore.clear();

  for (const system of systems) {
    for (const doc of system.documents) {
      const chunks = chunkDocument(doc);
      // Pre-compute embeddings for chunks
      for (const chunk of chunks) {
        chunk.embedding = await getEmbedding(`${chunk.title}\n${chunk.content}`);
      }
      vectorStore.addChunks(chunks);
    }
  }

  isIndexed = true;
  console.log(`RAG Indexing complete: ${vectorStore.getChunkCount()} chunks indexed across ${systems.length} systems.`);
}

initializeIndex().catch((err) => console.error('Failed to initialize RAG index:', err));

// ================= API ROUTES =================

// GET /api/systems - list all systems
app.get('/api/systems', (req, res) => {
  const summaries = systems.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    repoName: s.repoName,
    nodeCount: s.nodes.length,
    edgeCount: s.edges.length,
    documentCount: s.documents.length,
  }));
  res.json({ systems: summaries });
});

// GET /api/systems/:id - get full system details
app.get('/api/systems/:id', (req, res) => {
  const system = systems.find((s) => s.id === req.params.id);
  if (!system) {
    return res.status(404).json({ error: 'System not found' });
  }
  res.json({ system });
});

// GET /api/rag/status - index & Gemini status
app.get('/api/rag/status', (req, res) => {
  res.json({
    status: isIndexed ? 'ready' : 'indexing',
    totalChunks: vectorStore.getChunkCount(),
    geminiAvailable: isGeminiAvailable(),
    modelEmbedding: 'gemini-embedding-2-preview',
    modelGeneration: 'gemini-3.8-flash',
  });
});

// POST /api/rag/search - direct hybrid search
app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, systemId, topK = 6 } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryEmbedding = await getEmbedding(query);
    const results = vectorStore.search(queryEmbedding, query, topK * 2, 0.7);

    // Optionally filter by system
    let filtered = results;
    if (systemId) {
      const system = systems.find((s) => s.id === systemId);
      if (system) {
        filtered = results.filter((r) => system.documents.some((d) => d.id === r.chunk.documentId));
      }
    }

    res.json({
      results: filtered.slice(0, topK),
      query,
      geminiUsed: isGeminiAvailable(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rag/analyze - impact analysis
app.post('/api/rag/analyze', async (req, res) => {
  try {
    const { systemId, proposal }: { systemId: string; proposal: ChangeProposal } = req.body;
    if (!systemId || !proposal) {
      return res.status(400).json({ error: 'systemId and proposal are required' });
    }

    const system = systems.find((s) => s.id === systemId);
    if (!system) {
      return res.status(404).json({ error: 'Architecture system not found' });
    }

    const report = await runImpactAnalysis(system, proposal, vectorStore);
    res.json({ report });
  } catch (err: any) {
    console.error('Impact analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/add - ingest new document or spec into active architecture
app.post('/api/documents/add', async (req, res) => {
  try {
    const { systemId, document }: { systemId: string; document: Partial<CodebaseDocument> } = req.body;
    const system = systems.find((s) => s.id === systemId);
    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }

    const newDoc: CodebaseDocument = {
      id: `doc-custom-${Date.now()}`,
      repo: document.repo || system.repoName,
      service: document.service || system.nodes[0]?.id || 'general',
      path: document.path || 'custom/specification.yaml',
      title: document.title || 'Custom Ingested Document',
      kind: document.kind || 'openapi',
      content: document.content || '',
      metadata: document.metadata || {},
    };

    system.documents.push(newDoc);

    // Chunk and index immediately
    const chunks = chunkDocument(newDoc);
    for (const chunk of chunks) {
      chunk.embedding = await getEmbedding(`${chunk.title}\n${chunk.content}`);
    }
    vectorStore.addChunks(chunks);

    res.json({
      success: true,
      document: newDoc,
      newChunksCount: chunks.length,
      totalChunksIndexed: vectorStore.getChunkCount(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rag/chunks - inspect all chunks for RAG debugger
app.get('/api/rag/chunks', (req, res) => {
  const { systemId } = req.query;
  let all = vectorStore.getAllChunks();
  if (systemId && typeof systemId === 'string') {
    const system = systems.find((s) => s.id === systemId);
    if (system) {
      all = all.filter((c) => system.documents.some((d) => d.id === c.documentId));
    }
  }
  res.json({
    chunks: all.map((c) => ({
      id: c.id,
      title: c.title,
      service: c.service,
      path: c.path,
      kind: c.kind,
      startLine: c.startLine,
      endLine: c.endLine,
      tokensEstimate: c.tokensEstimate,
      symbols: c.symbols,
      hasEmbedding: !!c.embedding,
      preview: c.content.slice(0, 180),
    })),
  });
});

// ================= VITE DEV / PROD MIDDLEWARE =================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ArchImpact Analyst Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
