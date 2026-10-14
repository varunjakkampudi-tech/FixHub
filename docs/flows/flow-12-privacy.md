# FLOW 12 — Data and privacy lifecycle

Status: CONCEPTUAL PHASE 00 BLUEPRINT, 2026-10-15. No runtime or policy approval is implied.

## Objective, trigger and actors

Business objective: Use personal data only under an approved purpose and rights process. Trigger: Collection or export/deletion/retention request. Actors: Customer/merchant, Identity, privacy handler, storage, Audit.

## Preconditions

Verified subject; approved policy/legal basis before implementation. Every command checks current actor/resource scope. Phase 03 validates exact transaction/API contracts; Phase 04 validates the detailed interaction.

## Happy path

1. Explain purpose and applicable consent.
2. Collect minimum data.
3. Store with scoped access.
4. Apply approved retention.
5. Verify rights request identity.
6. Assess lawful retention/hold.
7. Export securely or delete/redact as permitted.
8. Record minimized audit evidence.

## Editable flow diagram

```mermaid
flowchart LR
  F0["Explain purpose and applicable consent"]
  F1["Collect minimum data"]
  F2["Store with scoped access"]
  F3["Apply approved retention"]
  F4["Verify rights request identity"]
  F5["Assess lawful retention/hold"]
  F6["Export securely or delete/redact as permitted"]
  F7["Record minimized audit evidence"]
  F0 --> F1
  F1 --> F2
  F2 --> F3
  F3 --> F4
  F4 --> F5
  F5 --> F6
  F6 --> F7
```

The diagram follows the numbered path above. Each step crosses an explicit responsibility boundary rather than trusting the client. The backend response communicates committed state; notification arrows represent attempted delivery. For atomic acceptance the illustrated A-first result is an example only: whichever valid transaction commits first wins, regardless of network arrival order. A losing result never reserves capacity.

## State and authority

Rights request Received to Verified to Assessed to Fulfilled/Restricted; policy version and backend audit are authoritative. Authoritative state must be read after reconnect and before acting on a stale notification.

## Notifications

Confirm request and actual disposition, not fictitious deletion or legal deadlines. Redact private data and respect consent; an unavailable channel must not create a second business command.

## Failure and recovery

Unknown retention stays OPEN; revoked consent prevents future prohibited delivery; backup deletion/export handling needs legal/technical design; identity mismatch rejects safely. Audit actor, reason, version and correlation. Recovery tests must cover duplicates, out-of-order updates and revoked authorization, with real execution evidence in the owning phase.

## Traceability, decisions and phase ownership

Requirements: NFR-SEC-002, NFR-OBS-001, NFR-BCP-001, FR-A-004. Open policy/technical decisions: Legal basis, consent language, retention/hold periods, backup rights handling and response deadlines. Owning implementation phase: 01–03, 10, 17; later-phase execution, provider approvals and acceptance tests are PENDING. Related: [state machines](state-machines.md), [channel continuity](cross-channel-continuity.md), [blueprint index](../blueprint/README.md).
