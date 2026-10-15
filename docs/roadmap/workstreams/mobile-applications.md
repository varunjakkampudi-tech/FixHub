# Phase 16 — Android & iOS Applications

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

Android & iOS Applications

## Business purpose

Deliver verified customer and merchant apps on real devices.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 16; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 15](customer-merchant-clients.md), [governing roadmap](../master-roadmap.md), initial requirement baseline and approved decisions. Developer accounts, signing keys, SDK terms and push/store access.

## Scope

Signed builds, push, links, permissions, camera/location/upload and lifecycle.

## Detailed workstreams

1. Integrate approved APIs.
2. handle OS interruptions.
3. secure credentials.
4. test four app-role/platform combinations.

## Required product decisions

Platform capability and permission wording, supported OS/device policy.

## Required technical decisions

Signing/distribution, native bridge/SDK choices and offline retries.

## Required documentation

Signed app artifacts and device validation records; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../../blueprint/traceability-matrix.md) and [phase review policy](../../governance/stage-gate-policy.md).

## Architecture and design responsibilities

Use approved Phase 03 contracts and Phase 04–06 interactions; record deviations as reviewed changes before implementing affected behavior. Maintain tenant isolation and a single authoritative backend.

## Features or capabilities targeted

Signed builds, push, links, permissions, camera/location/upload and lifecycle; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Developer accounts, signing keys, SDK terms and push/store access; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Real-device background/reconnect, token revocation, denied permissions and job acceptance races.

## Security and privacy requirements

Execute relevant tenant/subject/job/case denial, secure-session, sensitive-upload, audit-redaction and consent tests against actual implemented components. Never expose credentials in evidence.

## Performance and reliability requirements

Measure against Phase 02/03 approved workloads and targets; verify retries/recovery without duplicate requests or conflicting assignment/capacity. Report limits and failures with exact test scope.

## Deliverables and artifacts

Signed app artifacts and device validation records.

## Acceptance criteria

Customer/merchant Android/iOS approved journeys work on supported devices.

## Evidence required

Build signatures/revisions, device matrix and real execution logs. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

Wrapper demo mistaken for app readiness; also assess [open decisions](../../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G3 completion; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
