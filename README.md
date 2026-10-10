# ArchImpact — Codebase & System Architecture Impact Analyst

> **Enterprise RAG-Powered Blast-Radius Evaluator for Distributed Systems, Legacy Codebases, and Breaking API Changes.**

---

## 📌 Problem Statement

Engineering teams onboarding onto legacy codebases or evaluating feature requests waste countless hours trying to figure out **what breaks where**. 
- A subtle change in an API endpoint response contract crashes downstream microservices or mobile apps.
- Adding a `NOT NULL` column on an 18-million-row SQL table acquires an `ACCESS EXCLUSIVE` table lock, locking out concurrent checkouts and taking down production.
- Deprecating legacy endpoints violates contracts relied upon by mobile clients, third-party webhook receivers, and event bus consumers.

**ArchImpact** solves this by indexing technical documentation, OpenAPI specifications, Architecture Decision Records (ADRs), SQL database schemas, and codebase repositories into a hybrid **Retrieval-Augmented Generation (RAG)** pipeline. Given any proposed change or bug report, it maps out dependencies, extracts affected contracts, and generates an impact analysis report grounded strictly in the company's verified documentation.

---

## 🧠 How the RAG Model Works

```
                                      +------------------------------+
                                      |   Technical Documentation    |
                                      | - OpenAPI 3.1 YAML / JSON    |
                                      | - Architecture Decisions ADR |
                                      | - PostgreSQL Relational DDL  |
                                      | - Microservice Source Code   |
                                      +--------------+---------------+
                                                     |
                                                     v
                                      +------------------------------+
                                      |   Boundary-Aware Chunking    |
                                      |  - Endpoints (/v1/...)       |
                                      |  - Tables (CREATE TABLE...)  |
                                      |  - ADR Decisions & Context   |
                                      +--------------+---------------+
                                                     |
                                                     v
+-----------------------------+       +------------------------------+
| Proposed Change / Bugfix    |       |   Gemini Vector Embeddings   |
| "Deprecate /v1/charge in    |       | 'gemini-embedding-2-preview' |
| favor of /v2/intents"       |       |  + BM25 Inverted Token Index |
+--------------+--------------+       +--------------+---------------+
               |                                     |
               +----------------------+--------------+
                                      |
                                      v
                      +-------------------------------+
                      |     Hybrid RAG Retrieval      |
                      | Score = 0.7*Vector + 0.3*BM25 |
                      +---------------+---------------+
                                      |
                                      v
                      +-------------------------------+
                      |   Strict Grounding Context    |
                      | Top-K Chunks with Line Ranges |
                      +---------------+---------------+
                                      |
                                      v
                      +-------------------------------+
                      |  Gemini 3.8 Flash Generation  |
                      |  - Blast-Radius Heatmap Nodes |
                      |  - OpenAPI Contract Diffs     |
                      |  - DB Migration Lock Analysis |
                      |  - Phased Rollout & Rollback  |
                      |  - Backward-Compat Code Shim  |
                      +-------------------------------+
```

### 1. Boundary-Aware Semantic Chunking
Unlike standard naive character splitters, ArchImpact uses structural chunking:
- **OpenAPI specs**: Chunked by endpoints and path operations (`/v1/payments/charge`, `/v2/payment_intents`) with request/response schemas.
- **SQL DDL**: Chunked by individual `CREATE TABLE` and constraint statements with index definitions.
- **ADRs & Markdown**: Chunked by decision headers (`Context`, `Decision`, `Consequences`).
- **Source Code**: Chunked by exported functions and service integration boundaries.

### 2. Multi-Vector Embedding & BM25 Inverted Index
- **Semantic Representation**: Uses `@google/genai` with model `gemini-embedding-2-preview` to generate 768-dimensional vector representations.
- **Lexical Index**: Builds a BM25 inverted index extracting identifiers, table names, HTTP verbs, and parameter symbols.
- **Hybrid Scoring**: Combines cosine similarity with term frequency and symbol overlap:
  $$\text{Score} = \alpha \cdot \text{CosineSimilarity} + (1 - \alpha) \cdot \text{BM25Score}$$

### 3. Strict Grounding with Gemini 3.8 Flash
The assembled context is dispatched to `gemini-3.8-flash` with low temperature ($0.2$) and explicit architectural grounding constraints:
- Cites exact files, line ranges, and ADR numbers.
- Identifies callers from code files (e.g. `order-fulfillment/src/checkout.ts:31`).
- Evaluates PostgreSQL lock modes (`ACCESS EXCLUSIVE` vs `SHARE UPDATE EXCLUSIVE`).
- Produces copyable, backward-compatible TypeScript adapter shims.

---

## 🏢 Pre-Loaded Enterprise Architectures

ArchImpact includes three production-grade distributed architectures out of the box:

### 1. Global Payments & Checkout Platform (`payments-platform`)
- **Services**:
  - `customer-checkout-app`: React web and mobile checkout frontend.
  - `api-gateway`: Envoy proxy managing auth, routing, and rate limits.
  - `auth-service`: JWT session validation and API key issuer.
  - `payment-gateway`: Core charge processor, 3DS2 intent engine, and Stripe webhook handler.
  - `order-fulfillment`: Order lifecycle state machine calling `/v1/payments/charge`.
  - `ledger-audit`: Double-entry accounting service listening on Kafka topic `payment.events`.
  - `orders-db`: 18M-row PostgreSQL primary database.
  - `payments-db`: Vault-encrypted transaction ledger.
- **Pre-Loaded Specs & ADRs**:
  - `specs/openapi-payments.yaml`: Complete OpenAPI 3.1 specification for `/v1/payments/charge` and `/v2/payment_intents`.
  - `adr/ADR-004-idempotency-keys.md`: Strict UUID v4 Idempotency-Key enforcement policy.
  - `adr/ADR-011-payments-v2-intent-migration.md`: PSD2 Strong Customer Authentication (SCA) intent migration strategy.
  - `db/migrations/20250810_orders_schema.sql`: Orders and order items schema with table lock warnings.
  - `services/order-service/src/checkout.ts`: Real checkout integration code.
  - `services/ledger-audit/src/kafka-consumer.ts`: Kafka consumer code.

### 2. FinTech Multi-Tenant Banking & FX Core (`fintech-core`)
- High-frequency cross-border FX quotation engine, tenant schema isolation (`SET search_path = tenant_<id>`), and synchronous OFAC/PEP sanctions screening.
- Includes `specs/openapi-fx-engine.yaml`, `adr/ADR-023-tenant-isolation-schema.md`, and `db/schema-bank-accounts.sql`.

### 3. Healthcare EHR & FHIR Compliance Platform (`health-fhir-hub`)
- HIPAA-compliant electronic health records with HL7 FHIR v4 REST contracts (`/fhir/r4/Patient`), WebRTC telehealth session coordination, and immutable access audit ledgers.

---

## ⚡ Key Features

| Feature | Description |
|---|---|
| **Dependency Knowledge Graph** | Interactive canvas displaying services, databases, gateways, and queues with real-time protocol annotations (REST, gRPC, Kafka, SQL). |
| **Dynamic Blast-Radius Heatmap** | Color-coded status overlay: Red for critical breaking nodes, Amber for affected callers, Emerald for safe nodes, and Violet for the proposal target. |
| **Proposal Studio & Presets** | 1-click test scenarios covering breaking API changes, schema migrations, token expiry rotations, and SLA timeout reductions. |
| **API Contract Diff Viewer** | Side-by-side OpenAPI unified diff showing breaking contract modifications and affected callers. |
| **Database Stability Analyzer** | Identifies table lock hazards, connection pool exhaustion risks, and zero-downtime 3-phase migration steps. |
| **Backward-Compatible Shims** | Copy-pasteable adapter code snippets wrapping new contract versions in legacy-compatible responses. |
| **Grounded Citations** | Inspectable source cards with direct line numbers, document paths, and vector relevance scores. |
| **RAG Retrieval Inspector** | Live interactive search debugger showing cosine similarity, BM25 scores, query embeddings, and token counts. |
| **Custom Spec & Doc Ingester** | Ingest any custom OpenAPI spec, ADR, SQL DDL, or code file with instant chunking and vector indexing. |

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/systems` | Lists available architecture ecosystems |
| `GET` | `/api/systems/:id` | Returns full system topology, nodes, edges, and documents |
| `GET` | `/api/rag/status` | Returns vector store status, chunk count, and Gemini models |
| `POST` | `/api/rag/search` | Performs hybrid vector + BM25 search across indexed chunks |
| `POST` | `/api/rag/analyze` | Executes complete RAG impact analysis on a proposed change |
| `POST` | `/api/documents/add` | Ingests a new document/spec, chunks it, and updates the vector index |
| `GET` | `/api/rag/chunks` | Returns all indexed chunks for the RAG debugger |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- `GEMINI_API_KEY` (configured in environment or AI Studio Secrets)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd arch-impact-analyst

# Install dependencies
npm install

# Start development server
npm run dev
```

The application runs on `http://localhost:3000`.

---

## 📜 License
Apache-2.0
