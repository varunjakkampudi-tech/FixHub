# Phase 12 — Smart Dispatch & Atomic First Acceptance

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

Smart Dispatch & Atomic First Acceptance

## Business purpose

Assign a single valid merchant and preserve capacity through races.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 12; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 11](phase-11.md), [governing roadmap](../roadmap/master-roadmap.md), initial requirement baseline and approved decisions. Approved transactional database semantics and notification handoff.

## Scope

Canonical request, eligibility offers, reservations, expiry, retries/outbox and recovery.

## Detailed workstreams

1. Implement transactional winner.
2. constrain generation/idempotency.
3. serialize cancellation and expiry.
4. reconcile crash/outbox recovery.

## Required product decisions

Offer TTL/fanout, reservation/schedule policy and fallback supply.

## Required technical decisions

Constraints/locks/isolation, deterministic errors and transaction-outbox atomicity.

## Required documentation

Dispatch engine, race/failure suite and audited invariant results; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../blueprint/traceability-matrix.md) and [phase review policy](../governance/phase-review-policy.md).

## Architecture and design responsibilities

Use approved Phase 03 contracts and Phase 04–06 interactions; record deviations as reviewed changes before implementing affected behavior. Maintain tenant isolation and a single authoritative backend.

## Features or capabilities targeted

Canonical request, eligibility offers, reservations, expiry, retries/outbox and recovery; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Approved transactional database semantics and notification handoff; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Concurrent contenders, duplicate keys, revoked merchant, crash before/after commit, timeout/cancel races.

## Security and privacy requirements

Execute relevant tenant/subject/job/case denial, secure-session, sensitive-upload, audit-redaction and consent tests against actual implemented components. Never expose credentials in evidence.

## Performance and reliability requirements

Measure against Phase 02/03 approved workloads and targets; verify retries/recovery without duplicate requests or conflicting assignment/capacity. Report limits and failures with exact test scope.

## Deliverables and artifacts

Dispatch engine, race/failure suite and audited invariant results.

## Acceptance criteria

Zero double assignments and overbooking under approved workload/failure tests.

## Evidence required

Real database concurrency/failure logs with invariant assertions. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

Notification receipt incorrectly treated as a winner; also assess [open decisions](../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G3 contribution; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
