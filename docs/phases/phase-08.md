# Phase 08 — Frontend Portability & Mobile Compatibility

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

Frontend Portability & Mobile Compatibility

## Business purpose

Prove exported clients can support intended delivery channels.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 08; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 07](phase-07.md), [governing roadmap](../roadmap/master-roadmap.md), initial requirement baseline and approved decisions. Export license, platform entitlements and device access.

## Scope

Role-isolated builds, source integration, mobile/native capability strategy.

## Detailed workstreams

1. Inspect export.
2. separate customer/merchant/admin builds.
3. test Capacitor feasibility on real devices.
4. evaluate React Native fallback if warranted.

## Required product decisions

Channel scope and fallback trade-offs.

## Required technical decisions

Framework/SEO choice, shared package boundaries, native permissions and build reproducibility.

## Required documentation

Compatibility report, mobile decision and integration plan; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../blueprint/traceability-matrix.md) and [phase review policy](../governance/phase-review-policy.md).

## Architecture and design responsibilities

Use approved Phase 03 contracts and Phase 04–06 interactions; record deviations as reviewed changes before implementing affected behavior. Maintain tenant isolation and a single authoritative backend.

## Features or capabilities targeted

Role-isolated builds, source integration, mobile/native capability strategy; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Export license, platform entitlements and device access; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Role isolation, deep links, camera/location/push and real-device lifecycle proof.

## Security and privacy requirements

Execute relevant tenant/subject/job/case denial, secure-session, sensitive-upload, audit-redaction and consent tests against actual implemented components. Never expose credentials in evidence.

## Performance and reliability requirements

Measure against Phase 02/03 approved workloads and targets; verify retries/recovery without duplicate requests or conflicting assignment/capacity. Report limits and failures with exact test scope.

## Deliverables and artifacts

Compatibility report, mobile decision and integration plan.

## Acceptance criteria

Actual export and mobile proof supports approved strategy.

## Evidence required

Executed builds/device logs, source revision and reviewed trade-offs. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

UI source mistaken for complete secure product; also assess [open decisions](../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G2 completion; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
