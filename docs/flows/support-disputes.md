# FLOW 10 — Support, complaints and disputes

Status: CONCEPTUAL PHASE 00 BLUEPRINT, 2026-10-15. No runtime or policy approval is implied.

## Objective, trigger and actors

Business objective: Resolve customer safety and service exceptions with accountable handling. Trigger: Customer or merchant reports a problem. Actors: Reporter, case-scoped operations, reviewer, admin.

## Preconditions

Linked request/booking where available; approved evidence visibility. Every command checks current actor/resource scope. Phase 03 validates exact transaction/API contracts; Phase 04 validates the detailed interaction.

## Happy path

1. Create correlated case.
2. Classify safety, service or fraud concern.
3. Assign authorized handler.
4. Collect minimized evidence.
5. Investigate and record facts.
6. Resolve or escalate with reason.
7. Notify permitted parties.
8. Close without erasing history.

## Editable flow diagram

```mermaid
flowchart LR
  F0["Create correlated case"]
  F1["Classify safety, service or fraud concern"]
  F2["Assign authorized handler"]
  F3["Collect minimized evidence"]
  F4["Investigate and record facts"]
  F5["Resolve or escalate with reason"]
  F6["Notify permitted parties"]
  F7["Close without erasing history"]
  F0 --> F1
  F1 --> F2
  F2 --> F3
  F3 --> F4
  F4 --> F5
  F5 --> F6
  F6 --> F7
```

The path shows linked case intake and scoped investigation. A complaint does not itself prove liability, refund entitlement or resolution. The diagram is conceptual, not an exhaustive trust-boundary or implementation proof.

## State and authority

Open to Triaged to Investigating to Resolved/Closed or Escalated; Support owns case status. Authoritative state must be read after reconnect and before acting on a stale notification.

## Notifications

Report receipt, next action and closure; no unapproved response-time guarantee. Redact private data and respect consent; an unavailable channel must not create a second business command.

## Failure and recovery

Offline report remains unsent until receipt; critical safety route needs approved operational instructions; conflict-of-interest reassignment; disputed outcome may reopen under policy. Audit actor, reason, version and correlation. Recovery tests must cover duplicates, out-of-order updates and revoked authorization, with real execution evidence in the owning phase.

## Traceability, decisions and phase ownership

Requirements: FR-C-007, FR-A-004, FR-M-007, NFR-OPS-001, NFR-SEC-002. Open policy/technical decisions: Support hours, escalation, refund/compensation and appeal policy. Owning implementation phase: 13–17; later-phase execution, provider approvals and acceptance tests are PENDING. Related: [state machines](state-machines.md), [channel continuity](cross-channel-continuity.md), [blueprint index](../blueprint/README.md).
