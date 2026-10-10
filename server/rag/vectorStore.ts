import { CodebaseDocument, DocumentChunk, RetrievalResult } from './types.js';

export class VectorStore {
  private chunks: DocumentChunk[] = [];
  private invertedIndex: Map<string, Set<string>> = new Map(); // token -> Set of chunk ids

  public clear(): void {
    this.chunks = [];
    this.invertedIndex.clear();
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  public getAllChunks(): DocumentChunk[] {
    return this.chunks;
  }

  public addChunks(newChunks: DocumentChunk[]): void {
    for (const chunk of newChunks) {
      this.chunks.push(chunk);
      this.indexChunkTokens(chunk);
    }
  }

  private indexChunkTokens(chunk: DocumentChunk): void {
    const tokens = this.tokenize(`${chunk.title} ${chunk.content} ${chunk.symbols.join(' ')} ${chunk.path}`);
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(chunk.id);
    }
  }

  public tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_/.-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  public search(
    queryEmbedding: number[] | null,
    queryText: string,
    topK: number = 8,
    alpha: number = 0.75 // 0.75 vector, 0.25 lexical
  ): RetrievalResult[] {
    if (this.chunks.length === 0) return [];

    const queryTokens = this.tokenize(queryText);
    const results: RetrievalResult[] = [];

    // Calculate lexical frequencies
    const lexicalScores = new Map<string, { score: number; matched: string[] }>();
    const totalDocs = this.chunks.length;

    for (const token of queryTokens) {
      const matchingDocIds = this.invertedIndex.get(token);
      if (matchingDocIds) {
        // BM25-like IDF weight
        const idf = Math.log(1 + (totalDocs - matchingDocIds.size + 0.5) / (matchingDocIds.size + 0.5));
        for (const docId of matchingDocIds) {
          const current = lexicalScores.get(docId) || { score: 0, matched: [] };
          current.score += idf;
          if (!current.matched.includes(token)) {
            current.matched.push(token);
          }
          lexicalScores.set(docId, current);
        }
      }
    }

    // Normalize lexical scores to [0, 1]
    let maxLex = 0.0001;
    for (const [, val] of lexicalScores) {
      if (val.score > maxLex) maxLex = val.score;
    }

    for (const chunk of this.chunks) {
      let vecScore = 0;
      if (queryEmbedding && chunk.embedding && chunk.embedding.length > 0) {
        vecScore = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        // Fallback semantic similarity based on token overlap & symbol containment
        const textToSearch = (chunk.title + ' ' + chunk.content + ' ' + chunk.path).toLowerCase();
        let overlap = 0;
        for (const t of queryTokens) {
          if (textToSearch.includes(t)) overlap++;
        }
        vecScore = queryTokens.length > 0 ? overlap / queryTokens.length : 0;
      }

      const lexEntry = lexicalScores.get(chunk.id);
      const lexScore = lexEntry ? lexEntry.score / maxLex : 0;
      const matchedSyms = lexEntry ? lexEntry.matched : [];

      // Check if any explicit symbol in chunk is in query
      for (const sym of chunk.symbols) {
        if (queryText.toLowerCase().includes(sym.toLowerCase()) && !matchedSyms.includes(sym)) {
          matchedSyms.push(sym);
        }
      }

      const combinedScore = queryEmbedding ? alpha * vecScore + (1 - alpha) * lexScore : lexScore * 0.7 + vecScore * 0.3;

      results.push({
        chunk,
        score: Math.max(0, Math.min(1, combinedScore)),
        vectorScore: Math.max(0, Math.min(1, vecScore)),
        lexicalScore: Math.max(0, Math.min(1, lexScore)),
        matchedSymbols: matchedSyms,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      const minLen = Math.min(a.length, b.length);
      a = a.slice(0, minLen);
      b = b.slice(0, minLen);
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Intelligent chunking engine for Code, OpenAPI, ADRs, and Schemas
 */
export function chunkDocument(doc: CodebaseDocument): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const lines = doc.content.split('\n');

  if (doc.kind === 'openapi') {
    // Chunk by paths / endpoints
    const endpointBlocks = splitOpenApiPaths(doc.content);
    if (endpointBlocks.length > 0) {
      for (const block of endpointBlocks) {
        chunks.push({
          id: `${doc.id}-chunk-${chunks.length}`,
          documentId: doc.id,
          repo: doc.repo,
          service: doc.service,
          path: doc.path,
          title: `${doc.title} - ${block.heading}`,
          kind: doc.kind,
          content: block.text,
          heading: block.heading,
          startLine: block.startLine,
          endLine: block.endLine,
          tokensEstimate: Math.round(block.text.length / 4),
          symbols: extractSymbols(block.text, doc.kind),
        });
      }
      return chunks;
    }
  }

  if (doc.kind === 'schema') {
    // Chunk by CREATE TABLE or schema statement
    const tableBlocks = splitSqlTables(doc.content);
    if (tableBlocks.length > 0) {
      for (const block of tableBlocks) {
        chunks.push({
          id: `${doc.id}-chunk-${chunks.length}`,
          documentId: doc.id,
          repo: doc.repo,
          service: doc.service,
          path: doc.path,
          title: `${doc.title} - ${block.heading}`,
          kind: doc.kind,
          content: block.text,
          heading: block.heading,
          startLine: block.startLine,
          endLine: block.endLine,
          tokensEstimate: Math.round(block.text.length / 4),
          symbols: extractSymbols(block.text, doc.kind),
        });
      }
      return chunks;
    }
  }

  // Markdown (ADR, Architecture docs) or Code fallback
  const sections = splitByMarkdownHeadersOrParagraphs(doc.content);
  for (const s of sections) {
    chunks.push({
      id: `${doc.id}-chunk-${chunks.length}`,
      documentId: doc.id,
      repo: doc.repo,
      service: doc.service,
      path: doc.path,
      title: s.heading ? `${doc.title} > ${s.heading}` : doc.title,
      kind: doc.kind,
      content: s.text,
      heading: s.heading,
      startLine: s.startLine,
      endLine: s.endLine,
      tokensEstimate: Math.round(s.text.length / 4),
      symbols: extractSymbols(s.text, doc.kind),
    });
  }

  return chunks;
}

function splitOpenApiPaths(content: string): { heading: string; text: string; startLine: number; endLine: number }[] {
  const lines = content.split('\n');
  const blocks: { heading: string; text: string; startLine: number; endLine: number }[] = [];
  let currentHeader = 'API Specification Root';
  let currentLines: string[] = [];
  let start = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for YAML path like "  /v1/payments/charge:" or "/v1/..."
    const pathMatch = line.match(/^\s*(['"]?\/[a-zA-Z0-9_{}/-]+['"]?):\s*$/);
    if (pathMatch) {
      if (currentLines.length > 0) {
        blocks.push({
          heading: currentHeader,
          text: currentLines.join('\n'),
          startLine: start,
          endLine: i,
        });
      }
      currentHeader = pathMatch[1].replace(/['"]/g, '');
      currentLines = [line];
      start = i + 1;
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    blocks.push({
      heading: currentHeader,
      text: currentLines.join('\n'),
      startLine: start,
      endLine: lines.length,
    });
  }
  return blocks;
}

function splitSqlTables(content: string): { heading: string; text: string; startLine: number; endLine: number }[] {
  const lines = content.split('\n');
  const blocks: { heading: string; text: string; startLine: number; endLine: number }[] = [];
  let currentHeader = 'Schema Metadata';
  let currentLines: string[] = [];
  let start = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
    if (match) {
      if (currentLines.length > 0) {
        blocks.push({
          heading: currentHeader,
          text: currentLines.join('\n'),
          startLine: start,
          endLine: i,
        });
      }
      currentHeader = `Table: ${match[1]}`;
      currentLines = [line];
      start = i + 1;
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    blocks.push({
      heading: currentHeader,
      text: currentLines.join('\n'),
      startLine: start,
      endLine: lines.length,
    });
  }
  return blocks;
}

function splitByMarkdownHeadersOrParagraphs(content: string): { heading: string; text: string; startLine: number; endLine: number }[] {
  const lines = content.split('\n');
  const blocks: { heading: string; text: string; startLine: number; endLine: number }[] = [];
  let currentHeader = 'Introduction / Context';
  let currentLines: string[] = [];
  let start = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^#{1,3}\s+(.+)$/);
    if (match && currentLines.length > 8) {
      blocks.push({
        heading: currentHeader,
        text: currentLines.join('\n'),
        startLine: start,
        endLine: i,
      });
      currentHeader = match[1].trim();
      currentLines = [line];
      start = i + 1;
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    blocks.push({
      heading: currentHeader,
      text: currentLines.join('\n'),
      startLine: start,
      endLine: lines.length,
    });
  }
  return blocks;
}

function extractSymbols(text: string, kind: string): string[] {
  const symbols = new Set<string>();

  // Extract endpoints: /v1/...
  const endpoints = text.match(/\/(?:v[0-9]+\/)?[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_{}-]+)*/g);
  if (endpoints) {
    for (const ep of endpoints) {
      if (ep.length > 2 && !ep.endsWith('/')) symbols.add(ep);
    }
  }

  // Extract table names
  const tables = text.match(/(?:table|from|into|update)\s+([a-zA-Z0-9_]+)/gi);
  if (tables) {
    for (const t of tables) {
      const parts = t.split(/\s+/);
      if (parts[1]) symbols.add(parts[1].toLowerCase());
    }
  }

  // Extract function or class identifiers
  const codeSymbols = text.match(/(?:function|class|interface|type|const|export)\s+([a-zA-Z0-9_]+)/g);
  if (codeSymbols) {
    for (const cs of codeSymbols) {
      const parts = cs.split(/\s+/);
      if (parts[1]) symbols.add(parts[1]);
    }
  }

  return Array.from(symbols).slice(0, 15);
}

// Deterministic fast pseudo-embedding projection for query/chunk comparison when offline or warming up
export function generateDeterministicEmbedding(text: string, dimensions: number = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  const clean = text.toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const pos = (code * 31 + i * 17) % dimensions;
    vector[pos] += Math.sin(code + i);
    const pos2 = (code * 19 + i * 37) % dimensions;
    vector[pos2] += Math.cos(code * 2 + i);
  }
  // Normalize
  let norm = 0;
  for (let i = 0; i < dimensions; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dimensions; i++) vector[i] /= norm;
  return vector;
}
