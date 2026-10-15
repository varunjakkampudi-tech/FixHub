# Phase 04 — User Journeys, State Machines & Notification Flows

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

User Journeys, State Machines & Notification Flows

## Business purpose

Resolve what every role sees and does through exceptions.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 04; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 03](system-architecture.md), [governing roadmap](../master-roadmap.md), initial requirement baseline and approved decisions. Provider message/template/permission limits verified before final contract.

## Scope

Final approved journeys and state/notification contracts across channels.

## Detailed workstreams

1. Refine conceptual stages.
2. define legal/forbidden transitions.
3. reconcile expiry/cancellation races.
4. specify consent-aware notification and reconnect behavior.

## Required product decisions

Handoff, no-show, completion confirmation, support escalation and stale-state wording.

## Required technical decisions

Generation/version checks, notification TTL, cursor/replay and idempotency contracts.

## Required documentation

Approved journeys, state table, notification catalogue and interaction registry; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../../blueprint/traceability-matrix.md) and [phase review policy](../../governance/stage-gate-policy.md).

## Architecture and design responsibilities

Refine conceptual architecture/journeys only within this phase's scope. Phase 03 approves exact contracts; Phase 04 approves final journeys; Phase 05/06 approve identity/screens. No application implementation is authorized by this dossier.

## Features or capabilities targeted

Final approved journeys and state/notification contracts across channels; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Provider message/template/permission limits verified before final contract; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Walk through state edges, concurrency exceptions and identity correlation.

## Security and privacy requirements

Document sensitive data, denied access, consent, scope and audit needs; obtain privacy/legal input when applicable. Planning review does not prove implemented security.

## Performance and reliability requirements

Define applicable workloads, service targets and recovery assumptions; missing numeric targets remain OPEN and require later approval. No performance result is asserted.

## Deliverables and artifacts

Approved journeys, state table, notification catalogue and interaction registry.

## Acceptance criteria

Each role/channel has clear success, denial, outage and recovery behavior.

## Evidence required

Owner UX/product approval and traceable scenario review records. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

Silent permission expansion or contradictory channel outcomes; also assess [open decisions](../../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G1 input; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
