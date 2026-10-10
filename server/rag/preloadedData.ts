import { ArchitectureSystem } from './types.js';

export const PRELOADED_SYSTEMS: ArchitectureSystem[] = [
  {
    id: 'payments-platform',
    name: 'Global Payments & Checkout Platform',
    description: 'Mission-critical distributed payment processing, order fulfillment, and ledgering system with high transaction volumes and strict SLA.',
    repoName: 'acme-corp/payments-ecosystem',
    nodes: [
      {
        id: 'customer-checkout-app',
        name: 'Checkout Web & Mobile App',
        type: 'client-app',
        description: 'React Web & React Native client apps handling user cart checkout and payment tokenization.',
        techStack: 'React, TypeScript, Tailwind, Mobile SDK',
        endpoints: ['client-side UI'],
        repo: 'acme-corp/checkout-frontend',
      },
      {
        id: 'api-gateway',
        name: 'API Gateway & Edge Router',
        type: 'api-gateway',
        description: 'Kong/Envoy edge proxy managing rate limiting, JWT verification, and routing to backend microservices.',
        techStack: 'Envoy, Lua, Redis',
        endpoints: ['/api/v1/*', '/api/v2/*'],
        repo: 'acme-corp/infra-gateway',
      },
      {
        id: 'auth-service',
        name: 'Auth & Identity Service',
        type: 'service',
        description: 'Issues session tokens, validates API keys, and manages merchant scopes.',
        techStack: 'Go, Redis, PostgreSQL',
        endpoints: ['POST /auth/token', 'GET /auth/verify', 'POST /auth/revoke'],
        repo: 'acme-corp/auth-service',
      },
      {
        id: 'payment-gateway',
        name: 'Payment Gateway Core',
        type: 'service',
        description: 'Executes card authorizations, 3DS challenges, Stripe integrations, and idempotency guarantees.',
        techStack: 'Node.js, TypeScript, Fastify, Stripe SDK',
        endpoints: ['POST /v1/payments/charge', 'POST /v2/payment_intents', 'POST /webhooks/stripe'],
        repo: 'acme-corp/payment-gateway',
      },
      {
        id: 'order-fulfillment',
        name: 'Order Fulfillment Service',
        type: 'service',
        description: 'Coordinates inventory holds, order status state machine, and shipping label generation.',
        techStack: 'TypeScript, Express, Prisma ORM',
        endpoints: ['POST /v1/orders', 'GET /v1/orders/:id', 'POST /v1/orders/:id/fulfill'],
        repo: 'acme-corp/order-service',
      },
      {
        id: 'ledger-audit',
        name: 'Double-Entry Financial Ledger',
        type: 'service',
        description: 'Records immutable debit/credit entries for reconciliation and PCI/SOX audit trails.',
        techStack: 'Rust, Tokio, PostgreSQL',
        endpoints: ['POST /ledger/entries', 'GET /ledger/accounts/:id/balance'],
        repo: 'acme-corp/ledger-audit',
      },
      {
        id: 'kafka-event-bus',
        name: 'Event Bus (Apache Kafka)',
        type: 'queue',
        description: 'Central event streaming bus for asynchronous business events (payment.succeeded, order.created).',
        techStack: 'Apache Kafka, Strimzi Operator',
        endpoints: ['topic: payment.events', 'topic: order.events'],
        repo: 'acme-corp/kafka-infra',
      },
      {
        id: 'orders-db',
        name: 'Orders Relational Database',
        type: 'database',
        description: 'PostgreSQL primary cluster storing orders, line items, and fulfillment history.',
        techStack: 'PostgreSQL 16, pgBouncer',
        tables: ['orders', 'order_items', 'fulfillment_shipments'],
        repo: 'acme-corp/db-orders',
      },
      {
        id: 'payments-db',
        name: 'Payments Ledger Database',
        type: 'database',
        description: 'Encrypted PostgreSQL database storing payment transactions, tokenized vaults, and idempotency keys.',
        techStack: 'PostgreSQL 16, AWS RDS Aurora',
        tables: ['payment_transactions', 'idempotency_keys', 'refund_requests'],
        repo: 'acme-corp/db-payments',
      },
    ],
    edges: [
      {
        id: 'e1',
        source: 'customer-checkout-app',
        target: 'api-gateway',
        protocol: 'REST',
        contract: 'HTTPS /api/v1/checkout & /api/v1/payments',
        description: 'Frontend initiates checkout sequence and sends payment request with client token.',
      },
      {
        id: 'e2',
        source: 'api-gateway',
        target: 'auth-service',
        protocol: 'gRPC',
        contract: 'rpc ValidateSession(SessionToken) returns (UserClaims)',
        description: 'Gateway verifies bearer token before forwarding downstream.',
      },
      {
        id: 'e3',
        source: 'api-gateway',
        target: 'order-fulfillment',
        protocol: 'REST',
        contract: 'POST /v1/orders',
        description: 'Gateway routes order submission to Order Fulfillment service.',
      },
      {
        id: 'e4',
        source: 'order-fulfillment',
        target: 'payment-gateway',
        protocol: 'REST',
        contract: 'POST /v1/payments/charge (Idempotency-Key header mandatory)',
        description: 'Order fulfillment synchronously charges payment card before finalizing cart hold.',
      },
      {
        id: 'e5',
        source: 'order-fulfillment',
        target: 'orders-db',
        protocol: 'SQL',
        contract: 'SELECT/INSERT/UPDATE on orders & order_items',
        description: 'Order persistence with pessimistic lock during checkout transition.',
      },
      {
        id: 'e6',
        source: 'payment-gateway',
        target: 'payments-db',
        protocol: 'SQL',
        contract: 'INSERT into payment_transactions & idempotency_keys',
        description: 'Idempotency lookup and card transaction ledger persistence.',
      },
      {
        id: 'e7',
        source: 'payment-gateway',
        target: 'kafka-event-bus',
        protocol: 'Kafka',
        contract: 'Topic: payment.events (Schema: PaymentSucceededV1)',
        description: 'Emits payment.succeeded and payment.failed events after processing.',
      },
      {
        id: 'e8',
        source: 'kafka-event-bus',
        target: 'ledger-audit',
        protocol: 'Kafka',
        contract: 'Consumer group: ledger-reconciler listening to payment.events',
        description: 'Ledger consumes payment events and creates balanced double-entry accounting records.',
      },
    ],
    documents: [
      {
        id: 'doc-openapi-payments',
        repo: 'acme-corp/payment-gateway',
        service: 'payment-gateway',
        path: 'specs/openapi-payments.yaml',
        title: 'OpenAPI 3.1 - Payment Gateway Core Specification',
        kind: 'openapi',
        metadata: {
          version: '3.1.0',
          endpoints: ['/v1/payments/charge', '/v2/payment_intents', '/webhooks/stripe'],
          dependencies: ['Stripe API', 'PostgreSQL db-payments'],
        },
        content: `openapi: 3.1.0
info:
  title: Payment Gateway API
  version: 2.4.0
  description: Handles financial card transactions, tokenized charges, and 3D Secure workflows.

paths:
  /v1/payments/charge:
    post:
      summary: Process Direct Credit Card Charge (DEPRECATED for SCA compliance)
      description: |
        Synchronously attempts a one-step card capture.
        WARNING: This endpoint does NOT support 3D Secure 2.0 mandated by European PSD2 regulations.
        Clients must migrate to /v2/payment_intents by Q3.
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema:
            type: string
            format: uuid
          description: Unique UUID v4 key to guarantee single execution. Cached for 24h.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount_cents, currency, source_token, customer_id]
              properties:
                amount_cents:
                  type: integer
                  minimum: 50
                  description: Charge amount in smallest currency unit (e.g., USD cents).
                currency:
                  type: string
                  enum: [usd, eur, gbp, cad, aud]
                source_token:
                  type: string
                  description: Single-use tokenized card representation from Stripe Elements (tok_xxx).
                customer_id:
                  type: string
                  description: Internal customer account ID (e.g. cust_88192).
                metadata:
                  type: object
                  additionalProperties: true
      responses:
        '200':
          description: Charge processed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    example: "ch_3MtwBwLkdIwHu7ix28a3tqPa"
                  status:
                    type: string
                    enum: [succeeded, failed, pending]
                  amount_cents:
                    type: integer
                  receipt_url:
                    type: string
        '400':
          description: Invalid request parameters or missing Idempotency-Key header.
        '409':
          description: Idempotency conflict - another transaction with same key is currently inflight.
        '422':
          description: Card declined by bank issuer or fraud scoring algorithm.

  /v2/payment_intents:
    post:
      summary: Create or Confirm Payment Intent (SCA / 3DS2 Ready)
      description: Multi-phase payment lifecycle supporting next_action customer authentication redirects.
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount_cents, currency]
              properties:
                amount_cents:
                  type: integer
                currency:
                  type: string
                payment_method:
                  type: string
                capture_method:
                  type: string
                  enum: [automatic, manual]
                  default: automatic
                tenant_id:
                  type: string
                  description: Optional multi-tenant organizational partition identifier.
      responses:
        '200':
          description: Payment intent created
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  client_secret:
                    type: string
                  status:
                    type: string
                    enum: [requires_payment_method, requires_action, processing, succeeded, canceled]

  /webhooks/stripe:
    post:
      summary: Inbound webhook listener for asynchronous PSP event notifications
      description: Validates Stripe-Signature HMAC-SHA256 signature and publishes to payment.events Kafka topic.`,
      },
      {
        id: 'doc-adr-004-idempotency',
        repo: 'acme-corp/payment-gateway',
        service: 'payment-gateway',
        path: 'adr/ADR-004-idempotency-keys.md',
        title: 'ADR-004: Strict Idempotency Key Enforcement for Financial Mutating Endpoints',
        kind: 'adr',
        metadata: {
          author: 'Architecture Board / Lead SRE',
          lastUpdated: '2025-04-12',
          dependencies: ['payments-db', 'order-fulfillment'],
        },
        content: `# ADR-004: Strict Idempotency Key Enforcement for Financial Endpoints

## Status
ACCEPTED & ENFORCED

## Context
During high-traffic flash sales, network packet timeouts caused mobile clients and the Order Fulfillment Service to issue automatic retries for cart checkout. Because the initial \`/v1/payments/charge\` endpoint was not strictly checking idempotency before calling the Stripe Gateway, 1,420 customers were double-charged, triggering manual reconciliation overhead and chargeback fines.

## Decision
1. All HTTP POST mutating endpoints under \`/v1/payments/*\` and \`/v2/payment_intents\` MUST require an \`Idempotency-Key\` header (UUID v4 format).
2. The Payment Gateway intercepts requests and atomically checks the \`idempotency_keys\` table:
   - If the key exists and status is \`COMPLETED\`, return the cached JSON response payload with HTTP 200 and header \`X-Cache-Lookup: HIT\`.
   - If the key exists and status is \`IN_PROGRESS\`, reject with HTTP 409 Conflict.
   - If the key does not exist, insert with status \`IN_PROGRESS\`, process charge, and update to \`COMPLETED\` within a single distributed transaction.
3. Keys expire after 86,400 seconds (24 hours).

## Consequences & Blast Radius
- Any downstream caller (including Order Fulfillment, Refund workers, and Mobile Apps) that omits the \`Idempotency-Key\` header will be rejected immediately with HTTP 400 Bad Request.
- Downstream services MUST generate an \`Idempotency-Key\` locally and persist it before attempting the network call.`,
      },
      {
        id: 'doc-adr-011-payments-v2-migration',
        repo: 'acme-corp/payment-gateway',
        service: 'payment-gateway',
        path: 'adr/ADR-011-payments-v2-intent-migration.md',
        title: 'ADR-011: Migration from Direct Charges (/v1) to Intent Lifecycle (/v2)',
        kind: 'adr',
        metadata: {
          author: 'Principal Payments Architect',
          lastUpdated: '2025-11-04',
          dependencies: ['order-fulfillment', 'customer-checkout-app'],
        },
        content: `# ADR-011: Phased Deprecation of Synchronous Charges in favor of Payment Intents

## Status
PROPOSED & MIGRATION IN PROGRESS

## Problem
The synchronous \`/v1/payments/charge\` API expects the credit card CVV and expiration date to immediately result in capture. Under European PSD2 Strong Customer Authentication (SCA) rules, banks reject over 32% of direct charges requiring 3DS challenge dialogs.
Furthermore, synchronous charges block the Order Fulfillment thread for up to 6.2 seconds when Stripe experiences downstream latency spikes.

## Proposed Architecture
1. Introduce \`/v2/payment_intents\` which splits payments into:
   - Creation (returns client_secret)
   - Client authentication (3DS challenge popover handled in frontend)
   - Capture (webhook or synchronous confirmation)
2. Phase 1: Keep \`/v1/payments/charge\` active, but internally wrap it using an intent adapter.
3. Phase 2: Update \`order-fulfillment\` to create intent and delegate confirmation to frontend.
4. Phase 3: Hard deprecate and remove \`/v1/payments/charge\`.

## Critical Warning: Breaking Downstream Contract
Removing or altering the parameters of \`/v1/payments/charge\` without providing a backward-compatible adapter will immediately break:
- \`order-fulfillment/src/checkout.ts\` (Line 142)
- \`customer-checkout-app/src/legacyPaymentBridge.ts\`
- Mobile iOS App v3.2.0 (which still hardcodes direct charge requests).`,
      },
      {
        id: 'doc-db-orders-schema',
        repo: 'acme-corp/order-service',
        service: 'order-fulfillment',
        path: 'db/migrations/20250810_orders_schema.sql',
        title: 'PostgreSQL Relational Schema - Orders & Line Items',
        kind: 'schema',
        metadata: {
          tables: ['orders', 'order_items', 'fulfillment_shipments'],
          dependencies: ['orders-db'],
        },
        content: `-- PostgreSQL Schema for Order Fulfillment Service
-- WARNING: orders table contains 18+ million rows in production.
-- DDL operations that acquire exclusive table locks (ACCESS EXCLUSIVE) will cause connection pool exhaustion!

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT', -- PENDING_PAYMENT, PAID, FULFILLING, SHIPPED, CANCELLED
    total_amount_cents BIGINT NOT NULL CHECK (total_amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    idempotency_key UUID UNIQUE,
    payment_reference_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Migration Safety Policy:
-- 1. Never execute ALTER TABLE orders ADD COLUMN ... NOT NULL without DEFAULT and NULLABLE intermediate phase.
-- 2. Adding an unindexed foreign key or non-concurrent index blocks writes on orders table.
-- 3. Any schema migration affecting 'status' or 'payment_reference_id' must coordinate with OrderStateWorker.`,
      },
      {
        id: 'doc-code-order-checkout',
        repo: 'acme-corp/order-service',
        service: 'order-fulfillment',
        path: 'services/order-service/src/checkout.ts',
        title: 'Source Code: Order Checkout & Payment Gateway Integration',
        kind: 'code',
        metadata: {
          dependencies: ['payment-gateway', 'orders-db'],
        },
        content: `import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface CheckoutPayload {
  customerId: string;
  items: Array<{ sku: string; quantity: number; priceCents: number }>;
  sourceToken: string;
  currency: string;
}

export async function processOrderCheckout(payload: CheckoutPayload) {
  const totalCents = payload.items.reduce((acc, it) => acc + it.quantity * it.priceCents, 0);
  const idempotencyKey = uuidv4();

  // 1. Insert order with PENDING_PAYMENT
  const order = await db.query(
    'INSERT INTO orders (customer_id, total_amount_cents, currency, status, idempotency_key) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [payload.customerId, totalCents, payload.currency, 'PENDING_PAYMENT', idempotencyKey]
  );

  try {
    // 2. Synchronous call to Payment Gateway Core
    // CRITICAL DEPENDENCY: calls /v1/payments/charge expecting amount_cents, currency, source_token, customer_id
    const chargeResponse = await axios.post(
      'http://payment-gateway:4000/v1/payments/charge',
      {
        amount_cents: totalCents,
        currency: payload.currency.toLowerCase(),
        source_token: payload.sourceToken,
        customer_id: payload.customerId,
        metadata: { orderId: order.rows[0].id }
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5-second timeout
      }
    );

    if (chargeResponse.data.status === 'succeeded') {
      await db.query(
        'UPDATE orders SET status = $1, payment_reference_id = $2, updated_at = NOW() WHERE id = $3',
        ['PAID', chargeResponse.data.id, order.rows[0].id]
      );
      return { success: true, orderId: order.rows[0].id, chargeId: chargeResponse.data.id };
    } else {
      throw new Error('Payment charge failed');
    }
  } catch (err: any) {
    await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['PAYMENT_FAILED', order.rows[0].id]
    );
    throw new Error(\`Checkout failed: \${err.response?.data?.message || err.message}\`);
  }
}`,
      },
      {
        id: 'doc-code-ledger-kafka',
        repo: 'acme-corp/ledger-audit',
        service: 'ledger-audit',
        path: 'services/ledger-audit/src/kafka-consumer.ts',
        title: 'Source Code: Kafka Event Reconciler for Payment Events',
        kind: 'code',
        metadata: {
          dependencies: ['kafka-event-bus', 'payment-gateway'],
        },
        content: `import { KafkaConsumer } from 'node-rdkafka';
import { recordDoubleEntryJournal } from './journal';

interface PaymentSucceededEventV1 {
  eventId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  customerId: string;
  merchantId: string;
  timestamp: string;
}

export function startLedgerConsumer() {
  const consumer = new KafkaConsumer({
    'group.id': 'ledger-reconciler',
    'metadata.broker.list': 'kafka-broker:9092',
    'enable.auto.commit': false
  }, {});

  consumer.connect();

  consumer.on('ready', () => {
    consumer.subscribe(['payment.events']);
    consumer.consume();
  });

  consumer.on('data', async (data) => {
    try {
      const event: PaymentSucceededEventV1 = JSON.parse(data.value.toString());
      
      // Strict contract validation: requires chargeId, amountCents, currency
      if (!event.chargeId || typeof event.amountCents !== 'number') {
        console.error('FATAL CONTRACT VIOLATION: Malformed payment.events message payload', event);
        // Do not acknowledge to avoid lost audit records
        return;
      }

      await recordDoubleEntryJournal({
        debitAccount: \`merchant_\${event.merchantId || 'platform'}\`,
        creditAccount: 'clearing_gateway_stripe',
        amountCents: event.amountCents,
        currency: event.currency,
        reference: event.chargeId
      });

      consumer.commitMessage(data);
    } catch (err) {
      console.error('Ledger entry record failed:', err);
    }
  });
}`,
      },
    ],
    sampleProposals: [
      {
        id: 'prop-1',
        title: 'Deprecate & Remove /v1/payments/charge in favor of /v2/payment_intents',
        type: 'breaking-refactor',
        targetService: 'payment-gateway',
        description:
          'Remove legacy synchronous endpoint POST /v1/payments/charge and enforce all callers to use the 3DS2-compliant /v2/payment_intents endpoint with client-side intent confirmation.',
        proposedDiffOrContract: `--- a/payment-gateway/src/routes.ts
+++ b/payment-gateway/src/routes.ts
@@ -14,12 +14,3 @@
- router.post('/v1/payments/charge', chargeHandler);
+ // DEPRECATED: /v1/payments/charge removed per PSD2 SCA enforcement.
+ // All clients must call /v2/payment_intents instead.`,
      },
      {
        id: 'prop-2',
        title: 'Add Mandatory tenant_id column with NOT NULL constraint to orders table',
        type: 'schema-migration',
        targetService: 'order-fulfillment',
        description:
          'Prepare for enterprise B2B multi-tenancy by executing ALTER TABLE orders ADD COLUMN tenant_id UUID NOT NULL without default value or backfill step.',
        proposedDiffOrContract: `--- a/db/migrations/20261010_add_tenant_id.sql
+++ b/db/migrations/20261010_add_tenant_id.sql
@@ -0,0 +3 @@
+ALTER TABLE orders ADD COLUMN tenant_id UUID NOT NULL;
+CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);`,
      },
      {
        id: 'prop-3',
        title: 'Add idempotency_key requirement and reduce JWT expiration from 24h to 15m',
        type: 'feature',
        targetService: 'auth-service',
        description:
          'Security hardening: rotate JWT access tokens every 15 minutes, require refresh token rotation, and enforce strict client nonce checks.',
        proposedDiffOrContract: `--- a/auth-service/config.ts
+++ b/auth-service/config.ts
@@ -8,3 +8,3 @@
- export const ACCESS_TOKEN_EXPIRY = '24h';
+ export const ACCESS_TOKEN_EXPIRY = '15m';
+ export const ENFORCE_REFRESH_ROTATION = true;`,
      },
    ],
  },
  {
    id: 'fintech-core',
    name: 'FinTech Multi-Tenant Banking & FX Core',
    description: 'High-frequency cross-border currency conversion, tenant ledger isolation, and strict AML/KYC sanctions verification.',
    repoName: 'apex-bank/core-banking',
    nodes: [
      {
        id: 'tenant-router',
        name: 'Tenant Isolation Router',
        type: 'api-gateway',
        description: 'Multi-tenant HTTP/gRPC ingress dispatcher inspecting X-Tenant-ID headers and establishing isolated DB search_path.',
        techStack: 'Rust, Axum, Redis Cluster',
        endpoints: ['/api/v1/tenant/*', '/api/v2/*'],
        repo: 'apex-bank/tenant-router',
      },
      {
        id: 'fx-engine',
        name: 'Real-Time FX Quotation Engine',
        type: 'service',
        description: 'Provides sub-millisecond currency spot quotes, bid/ask spreads, and guaranteed 60-second execution locks.',
        techStack: 'C++, Go, gRPC, Bloomberg Feed',
        endpoints: ['GET /api/v2/fx/quote', 'POST /api/v2/fx/lock', 'POST /api/v2/fx/execute'],
        repo: 'apex-bank/fx-engine',
      },
      {
        id: 'compliance-kyc',
        name: 'Sanctions & KYC Enforcement Service',
        type: 'service',
        description: 'Synchronous screening gateway checking OFAC, PEP, and EU high-risk jurisdiction blacklists before fund movements.',
        techStack: 'Python, FastAPI, Redis, DowJones Watchlist',
        endpoints: ['POST /compliance/screen', 'GET /compliance/status/:applicantId'],
        repo: 'apex-bank/compliance-service',
      },
      {
        id: 'account-ledger',
        name: 'Core Account & Balance Ledger',
        type: 'service',
        description: 'Zero-sum transactional bank account balances with optimistic locking and ledger auditing.',
        techStack: 'Java 21, Spring Boot, PostgreSQL',
        endpoints: ['POST /accounts/transfer', 'GET /accounts/:id/balance'],
        repo: 'apex-bank/ledger-core',
      },
      {
        id: 'banking-db',
        name: 'PostgreSQL Banking Ledger Cluster',
        type: 'database',
        description: 'ACID compliant relational database with row-level security and schema-per-tenant partitioning.',
        techStack: 'PostgreSQL 16 Enterprise, PgBouncer',
        tables: ['bank_accounts', 'journal_transactions', 'tenant_metadata'],
        repo: 'apex-bank/db-banking',
      },
    ],
    edges: [
      {
        id: 'fe1',
        source: 'tenant-router',
        target: 'fx-engine',
        protocol: 'gRPC',
        contract: 'rpc RequestFxQuote(QuoteRequest) returns (QuoteResponse)',
        description: 'Ingress forwards FX quote requests with authenticated tenant security context.',
      },
      {
        id: 'fe2',
        source: 'fx-engine',
        target: 'compliance-kyc',
        protocol: 'REST',
        contract: 'POST /compliance/screen (Synchronous blocking timeout: 800ms)',
        description: 'FX execution must pass compliance screening before booking exchange rate.',
      },
      {
        id: 'fe3',
        source: 'fx-engine',
        target: 'account-ledger',
        protocol: 'gRPC',
        contract: 'rpc DebitCreditTransfer(TransferBatch) returns (TransferReceipt)',
        description: 'FX engine instructs account ledger to debit source currency and credit target currency.',
      },
      {
        id: 'fe4',
        source: 'account-ledger',
        target: 'banking-db',
        protocol: 'SQL',
        contract: 'Optimistic lock UPDATE bank_accounts SET balance = balance - :amount WHERE version = :version',
        description: 'Zero-sum transactional balance update with version conflict check.',
      },
    ],
    documents: [
      {
        id: 'doc-openapi-fx',
        repo: 'apex-bank/fx-engine',
        service: 'fx-engine',
        path: 'specs/openapi-fx-engine.yaml',
        title: 'OpenAPI 3.0 - Foreign Exchange (FX) Engine Specifications',
        kind: 'openapi',
        metadata: {
          version: '2.1.0',
          endpoints: ['/api/v2/fx/quote', '/api/v2/fx/lock', '/api/v2/fx/execute'],
        },
        content: `openapi: 3.0.3
info:
  title: Apex Foreign Exchange Engine
  version: 2.1.0
paths:
  /api/v2/fx/quote:
    get:
      summary: Get live FX indicative rate
      parameters:
        - name: base_currency
          in: query
          required: true
          schema:
            type: string
        - name: quote_currency
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  rate:
                    type: number
                  timestamp:
                    type: string
  /api/v2/fx/lock:
    post:
      summary: Lock rate for 60 seconds
      description: Returns quote_token guaranteeing conversion rate for 60 seconds.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [pair, amount, tenant_id]
              properties:
                pair:
                  type: string
                  example: USD/EUR
                amount:
                  type: number
                tenant_id:
                  type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  quote_token:
                    type: string
                  expires_in_seconds:
                    type: integer
                    default: 60`,
      },
      {
        id: 'doc-adr-023-tenant-isolation',
        repo: 'apex-bank/tenant-router',
        service: 'tenant-router',
        path: 'adr/ADR-023-tenant-isolation-schema.md',
        title: 'ADR-023: Tenant Schema Isolation & Search Path Guarantees',
        kind: 'adr',
        metadata: {
          author: 'FinTech Security Architect',
        },
        content: `# ADR-023: Tenant Schema Isolation

## Context
Regulated banking clients in Switzerland and Singapore require strict physical or schema-level separation to satisfy cross-border data sovereignty laws.

## Decision
1. Every incoming HTTP or gRPC request must contain a signed JWT with \`tenant_id\` claim or an \`X-Tenant-ID\` header.
2. The database connection pool sets \`SET search_path = tenant_<tenant_id>, public;\` prior to issuing transactions.
3. Cross-tenant queries are blocked at the PostgreSQL permission layer.

## Failure Modes
- If any service strips the \`tenant_id\` or performs asynchronous worker processing without propagating the context, the query defaults to \`public\` schema and errors with 403 Access Denied.`,
      },
    ],
    sampleProposals: [
      {
        id: 'prop-fx-1',
        title: 'Enforce synchronous sanctions check timeout reduction from 800ms to 200ms',
        type: 'feature',
        targetService: 'compliance-kyc',
        description: 'Drop FX quotation SLA to sub-300ms by aggressively terminating third-party watchlist queries after 200ms.',
      },
    ],
  },
  {
    id: 'health-fhir-hub',
    name: 'Healthcare EHR & FHIR Compliance Platform',
    description: 'HIPAA-compliant Electronic Health Record system with HL7 FHIR interoperability and encrypted audit trail.',
    repoName: 'med-core/fhir-platform',
    nodes: [
      {
        id: 'fhir-gateway',
        name: 'HL7 FHIR REST Gateway',
        type: 'api-gateway',
        description: 'Exposes standard FHIR v4 endpoints (/Patient, /Observation) with SMART-on-FHIR OAuth token validation.',
        techStack: 'Node.js, Hapi FHIR, TypeScript',
        endpoints: ['GET /fhir/r4/Patient', 'POST /fhir/r4/Observation'],
        repo: 'med-core/fhir-gateway',
      },
      {
        id: 'telehealth-webrtc',
        name: 'Telehealth Session Coordinator',
        type: 'service',
        description: 'Manages encrypted patient-doctor WebRTC signaling and clinical observation attachments.',
        techStack: 'Go, WebSockets, WebRTC SFU',
        endpoints: ['/ws/telehealth', 'POST /telehealth/session/start'],
        repo: 'med-core/telehealth-svc',
      },
      {
        id: 'patient-registry',
        name: 'Master Patient Index (MPI)',
        type: 'service',
        description: 'Deterministic patient deduplication matching demographic records across clinical facilities.',
        techStack: 'Python, FastAPI, PostgreSQL',
        endpoints: ['POST /mpi/match', 'GET /mpi/patient/:mrn'],
        repo: 'med-core/mpi-registry',
      },
      {
        id: 'audit-ledger',
        name: 'HIPAA Immutable Audit Ledger',
        type: 'database',
        description: 'WORM (Write Once Read Many) cryptographic audit database recording every PHI read/write.',
        techStack: 'Amazon QLDB / Immutable PostgreSQL',
        tables: ['phi_access_audit', 'consent_records'],
        repo: 'med-core/audit-ledger',
      },
    ],
    edges: [
      {
        id: 'he1',
        source: 'fhir-gateway',
        target: 'patient-registry',
        protocol: 'REST',
        contract: 'GET /mpi/patient/:mrn (Requires Consent-Signature header)',
        description: 'FHIR Gateway resolves internal patient record via Master Patient Index.',
      },
      {
        id: 'he2',
        source: 'fhir-gateway',
        target: 'audit-ledger',
        protocol: 'SQL',
        contract: 'INSERT into phi_access_audit (Synchronous before response)',
        description: 'HIPAA requirement: Every access to Protected Health Information must be logged synchronously.',
      },
    ],
    documents: [
      {
        id: 'doc-fhir-spec',
        repo: 'med-core/fhir-gateway',
        service: 'fhir-gateway',
        path: 'specs/openapi-fhir-core.yaml',
        title: 'FHIR v4 Core Patient & Observation Specification',
        kind: 'openapi',
        metadata: {
          version: '4.0.1',
          endpoints: ['/fhir/r4/Patient', '/fhir/r4/Observation'],
        },
        content: `openapi: 3.0.1
info:
  title: FHIR v4 Gateway
  version: 4.0.1
paths:
  /fhir/r4/Patient/{id}:
    get:
      summary: Retrieve FHIR Patient Resource
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
        - name: X-HIPAA-Reason
          in: header
          required: true
          schema:
            type: string
            enum: [treatment, payment, operations, emergency]`,
      },
    ],
    sampleProposals: [
      {
        id: 'prop-fhir-1',
        title: 'Make X-HIPAA-Reason header optional for background analytics service',
        type: 'breaking-refactor',
        targetService: 'fhir-gateway',
        description: 'Allow internal telemetry cron jobs to query /fhir/r4/Patient without passing X-HIPAA-Reason header.',
      },
    ],
  },
];
