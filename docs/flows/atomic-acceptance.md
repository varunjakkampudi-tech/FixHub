# FLOW 04 — Atomic merchant acceptance

Status: CONCEPTUAL PHASE 00 BLUEPRINT, 2026-10-15. No runtime or policy approval is implied.

## Objective, trigger and actors

Business objective: Assign exactly one valid merchant without overbooking. Trigger: Several merchants attempt acceptance concurrently. Actors: Customer, merchants A/B, API, transactional database, outbox worker.

## Preconditions

Live request/generation; actor/tenant authorized; offer not expired; verification and capacity valid. Every command checks current actor/resource scope. Phase 03 validates exact transaction/API contracts; Phase 04 validates the detailed interaction.

## Happy path

1. Bind actor and idempotency payload.
2. Lock or conditionally update request and capacity within one transaction.
3. Recheck offer generation, expiry and eligibility.
4. Reserve capacity and commit one assignment plus outbox event.
5. Return winner receipt after commit.
6. Return deterministic already-assigned or invalid result to other attempts.

## Editable flow diagram

```mermaid
sequenceDiagram
  participant A as Merchant A
  participant B as Merchant B
  participant API as Backend
  participant DB as Transactional state
  participant W as Outbox worker
  par Concurrent acceptance
    A->>API: Accept request, offer, generation and key A
  and Concurrent acceptance
    B->>API: Accept same request with key B
  end
  API->>DB: Validate actor and lock request plus capacity
  DB-->>API: Live offer and eligible reservable capacity
  API->>DB: Commit assignment, reservation, key result and outbox
  DB-->>API: Exactly one committed winner
  API-->>A: Winner if A committed first
  API->>DB: Recheck B under same serialization rule
  DB-->>API: Existing winner or expired/invalid offer
  API-->>B: Deterministic losing outcome
  A->>API: Duplicate retry after lost response
  API->>DB: Read saved actor/key result
  API-->>A: Same committed result
  DB-->>W: Committed outbox event
  W->>W: Deduplicate and retry authorized delivery
  Note over API,DB: Crash before commit rolls back; crash after commit reconciles
  Note over A,W: UI click or provider ACK never decides assignment
```

The diagram follows the numbered path above. Each step crosses an explicit responsibility boundary rather than trusting the client. The backend response communicates committed state; notification arrows represent attempted delivery. For atomic acceptance the illustrated A-first result is an example only: whichever valid transaction commits first wins, regardless of network arrival order. A losing result never reserves capacity.

## State and authority

Backend commit is the sole winner decision; offer ACK, push receipt and UI click never assign. Authoritative state must be read after reconnect and before acting on a stale notification.

## Notifications

Only committed assignment generates notifications; provider retries cannot select another winner. Redact private data and respect consent; an unavailable channel must not create a second business command.

## Failure and recovery

Rollback reserves nothing; crash before commit retries safely; crash after commit returns saved result using key; duplicates replay result; expired/revoked/over-capacity offers reject; cancellation/reassignment serializes with acceptance. Audit actor, reason, version and correlation. Recovery tests must cover duplicates, out-of-order updates and revoked authorization, with real execution evidence in the owning phase.

## Traceability, decisions and phase ownership

Requirements: FR-M-005, FR-M-006, FR-X-002, NFR-SEC-003, NFR-REL-001. Open policy/technical decisions: Exact lock order, conflict response, reservation window and expiry clock in Phase 03. Owning implementation phase: 12; later-phase execution, provider approvals and acceptance tests are PENDING. Related: [state machines](state-machines.md), [channel continuity](cross-channel-continuity.md), [blueprint index](../blueprint/README.md).
