# Phase 18 — Complete Private Pilot, QA & Store Approvals

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

Complete Private Pilot, QA & Store Approvals

## Business purpose

Validate real fulfilment and obtain required channel approvals.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 18; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 17](phase-17.md), [governing roadmap](../roadmap/master-roadmap.md), initial requirement baseline and approved decisions. Merchants/customers, platform approvals and staffed support.

## Scope

Consenting Tanuku pilot, full E2E QA, TestFlight/Google testing and store review.

## Detailed workstreams

1. Recruit verified supply.
2. run consenting operational scenarios.
3. resolve defects.
4. submit approved app disclosures/builds and confirm store results.

## Required product decisions

Pilot safety/consent, launch scope and defect acceptance.

## Required technical decisions

Release candidate reproducibility and telemetry/rollback strategy.

## Required documentation

Pilot report, final QA ledger and actual store approvals; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../blueprint/traceability-matrix.md) and [phase review policy](../governance/phase-review-policy.md).

## Architecture and design responsibilities

Use approved Phase 03 contracts and Phase 04–06 interactions; record deviations as reviewed changes before implementing affected behavior. Maintain tenant isolation and a single authoritative backend.

## Features or capabilities targeted

Consenting Tanuku pilot, full E2E QA, TestFlight/Google testing and store review; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Merchants/customers, platform approvals and staffed support; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Actual end-to-end fulfilment, disputes, multilingual/device QA and regression.

## Security and privacy requirements

Execute relevant tenant/subject/job/case denial, secure-session, sensitive-upload, audit-redaction and consent tests against actual implemented components. Never expose credentials in evidence.

## Performance and reliability requirements

Measure against Phase 02/03 approved workloads and targets; verify retries/recovery without duplicate requests or conflicting assignment/capacity. Report limits and failures with exact test scope.

## Deliverables and artifacts

Pilot report, final QA ledger and actual store approvals.

## Acceptance criteria

Real service operations, supply capacity and mandatory store readiness evidenced.

## Evidence required

Consented pilot evidence, store decisions, revision-bound QA and readiness sign-off. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

Pilot consent/fulfilment failure or store rejection; also assess [open decisions](../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G4 completion; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
