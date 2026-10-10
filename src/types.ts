export type DocumentKind = 'openapi' | 'adr' | 'schema' | 'code' | 'architecture' | 'config';

export interface CodebaseDocument {
  id: string;
  repo: string;
  service: string;
  path: string;
  title: string;
  kind: DocumentKind;
  content: string;
  metadata: {
    version?: string;
    endpoints?: string[];
    tables?: string[];
    dependencies?: string[];
    author?: string;
    lastUpdated?: string;
  };
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  repo: string;
  service: string;
  path: string;
  title: string;
  kind: DocumentKind;
  content: string;
  heading?: string;
  startLine: number;
  endLine: number;
  tokensEstimate: number;
  symbols: string[];
  hasEmbedding?: boolean;
  preview?: string;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'api-gateway' | 'queue' | 'client-app' | 'external';
  description: string;
  techStack: string;
  endpoints?: string[];
  tables?: string[];
  repo: string;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  protocol: 'REST' | 'gRPC' | 'Kafka' | 'SQL' | 'GraphQL' | 'Webhook';
  contract: string;
  description: string;
}

export interface ChangeProposal {
  id?: string;
  title: string;
  type: 'feature' | 'breaking-refactor' | 'schema-migration' | 'bugfix';
  targetService: string;
  description: string;
  proposedDiffOrContract?: string;
}

export interface ArchitectureSystem {
  id: string;
  name: string;
  description: string;
  repoName: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  documents: CodebaseDocument[];
  sampleProposals: ChangeProposal[];
}

export interface SystemSummary {
  id: string;
  name: string;
  description: string;
  repoName: string;
  nodeCount: number;
  edgeCount: number;
  documentCount: number;
}

export interface AffectedApiContract {
  endpoint: string;
  method: string;
  service: string;
  changeType: 'breaking' | 'backward-compatible' | 'deprecated' | 'additive';
  contractDiff: string;
  callers: string[];
  explanation: string;
}

export interface DatabaseRisk {
  tableName: string;
  service: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  lockRisk: string;
  migrationDowntime: string;
  replicationLagNotice: string;
  recommendation: string;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  path: string;
  service: string;
  kind: DocumentKind;
  title: string;
  excerpt: string;
  relevanceScore: number;
  lineRange: string;
}

export interface CodePatchShim {
  service: string;
  filename: string;
  language: string;
  title: string;
  code: string;
  description: string;
}

export interface ImpactAnalysisReport {
  id: string;
  systemId: string;
  proposal: ChangeProposal;
  generatedAt: string;
  executiveSummary: {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    verdict: string;
    breakingChangesCount: number;
    affectedServicesCount: number;
    estimatedDevHours: number;
  };
  blastRadius: {
    criticalNodes: string[];
    warningNodes: string[];
    safeNodes: string[];
    explanation: string;
  };
  directDependencies: {
    service: string;
    impactType: string;
    reason: string;
    files: string[];
  }[];
  transitiveDependencies: {
    service: string;
    depth: number;
    propagatedVia: string;
    risk: string;
  }[];
  affectedApiContracts: AffectedApiContract[];
  databaseRisks: DatabaseRisk[];
  safeRolloutRoadmap: {
    phase: number;
    title: string;
    action: string;
    verification: string;
  }[];
  rollbackPlan: {
    feasibility: 'Instant' | 'Requires Forward-Fix' | 'Complex Data Migration Rollback';
    steps: string[];
    downtimeRisk: string;
  };
  codePatches: CodePatchShim[];
  groundedCitations: Citation[];
  ragInspection: {
    queryEmbeddingGenerated: boolean;
    totalChunksIndexed: number;
    retrievedChunksCount: number;
    topSimilarityScore: number;
    durationMs: number;
    modelUsed: string;
    groundingStrictness: string;
  };
}

export interface RagStatus {
  status: 'ready' | 'indexing';
  totalChunks: number;
  geminiAvailable: boolean;
  modelEmbedding: string;
  modelGeneration: string;
}
