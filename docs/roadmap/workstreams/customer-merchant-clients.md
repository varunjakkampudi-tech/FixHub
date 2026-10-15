# Phase 15 — Customer, Merchant & Admin Web Integration

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

Customer, Merchant & Admin Web Integration

## Business purpose

Connect approved web journeys to actual authorized backend behavior.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 15; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 14](messaging-notifications.md), [governing roadmap](../master-roadmap.md), initial requirement baseline and approved decisions. Approved staging and content/localization inputs.

## Scope

Customer/PWA, merchant and private staff web; responsive and bilingual states.

## Detailed workstreams

1. Replace previews.
2. wire real APIs.
3. enforce role navigation.
4. validate accessibility, SEO where applicable and stale/offline handling.

## Required product decisions

Copy, role-specific navigation and privacy-visible messages.

## Required technical decisions

Client versioning, error/retry semantics and secure session integration.

## Required documentation

Integrated staging web clients and end-to-end evidence; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../../blueprint/traceability-matrix.md) and [phase review policy](../../governance/stage-gate-policy.md).

## Architecture and design responsibilities

Use approved Phase 03 contracts and Phase 04–06 interactions; record deviations as reviewed changes before implementing affected behavior. Maintain tenant isolation and a single authoritative backend.

## Features or capabilities targeted

Customer/PWA, merchant and private staff web; responsive and bilingual states; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Approved staging and content/localization inputs; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Cross-role denial, booking/disputes, keyboard/screen reader, bilingual and poor-network E2E.

## Security and privacy requirements

Execute relevant tenant/subject/job/case denial, secure-session, sensitive-upload, audit-redaction and consent tests against actual implemented components. Never expose credentials in evidence.

## Performance and reliability requirements

Measure against Phase 02/03 approved workloads and targets; verify retries/recovery without duplicate requests or conflicting assignment/capacity. Report limits and failures with exact test scope.

## Deliverables and artifacts

Integrated staging web clients and end-to-end evidence.

## Acceptance criteria

Every approved web scenario works against real staging contracts.

## Evidence required

Browser/runtime logs, exact frontend/backend revisions and accessibility findings. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

Preview-only success or client-side-only authorization; also assess [open decisions](../../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G3 contribution; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
