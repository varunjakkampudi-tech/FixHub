# FLOW 01 — Customer discovery

Status: CONCEPTUAL PHASE 00 BLUEPRINT, 2026-10-15. No runtime or policy approval is implied.

## Objective, trigger and actors

Business objective: Customer needs eligible local help. Trigger: Customer chooses location and category/search. Actors: Customer, catalog, geography, verification, availability.

## Preconditions

Configured city/category; consented location or manual address. Every command checks current actor/resource scope. Phase 03 validates exact transaction/API contracts; Phase 04 validates the detailed interaction.

## Happy path

1. Resolve location.
2. Validate category and query.
3. Filter verified providers by zone, hours and availability.
4. Return truthful eligible results.
5. Open selected merchant detail.

## Editable flow diagram

```mermaid
flowchart LR
  F0["Resolve location"]
  F1["Validate category and query"]
  F2["Filter verified providers by zone, hours and availability"]
  F3["Return truthful eligible results"]
  F4["Open selected merchant detail"]
  F0 --> F1
  F1 --> F2
  F2 --> F3
  F3 --> F4
```

The path shows public discovery and eligibility reads, not a reserved provider or future availability promise. The diagram is conceptual, not an exhaustive trust-boundary or implementation proof.

## State and authority

No assignment is created; backend owns eligibility snapshot, not a future capacity promise. Authoritative state must be read after reconnect and before acting on a stale notification.

## Notifications

No delivery required; present freshness and unavailable information. Redact private data and respect consent; an unavailable channel must not create a second business command.

## Failure and recovery

Unknown location asks clarification; empty supply returns no-match; offline keeps last result visibly stale; selection revalidates. Audit actor, reason, version and correlation. Recovery tests must cover duplicates, out-of-order updates and revoked authorization, with real execution evidence in the owning phase.

## Traceability, decisions and phase ownership

Requirements: FR-C-001, FR-C-002, FR-C-006, FR-X-003, NFR-PERF-001. Open policy/technical decisions: Launch categories, ranking explanation and location precision. Owning implementation phase: 11; later-phase execution, provider approvals and acceptance tests are PENDING. Related: [state machines](state-machines.md), [channel continuity](cross-channel-continuity.md), [blueprint index](../blueprint/README.md).
