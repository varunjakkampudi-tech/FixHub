# Phase 14 — WhatsApp, Push & Real-Time Integration

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

WhatsApp, Push & Real-Time Integration

## Business purpose

Deliver consistent cross-channel status despite vendor failures.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 14; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 13](phase-13.md), [governing roadmap](../roadmap/master-roadmap.md), initial requirement baseline and approved decisions. Official account approvals, templates, push entitlements, quotas and costs.

## Scope

Official WhatsApp, FCM/APNs/Web Push, SSE/reconnect/replay and outbox routing.

## Detailed workstreams

1. Implement authorized templates/callbacks.
2. verify consent/opt-out.
3. deduplicate delivery.
4. bound retries and reconcile stale notifications.

## Required product decisions

Channel precedence, TTL, fallback and consent language.

## Required technical decisions

Callback signatures/replay, cursor retention, delivery logging and quota behavior.

## Required documentation

Integration adapters and real provider/failure evidence; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../blueprint/traceability-matrix.md) and [phase review policy](../governance/phase-review-policy.md).

## Architecture and design responsibilities

Use approved Phase 03 contracts and Phase 04–06 interactions; record deviations as reviewed changes before implementing affected behavior. Maintain tenant isolation and a single authoritative backend.

## Features or capabilities targeted

Official WhatsApp, FCM/APNs/Web Push, SSE/reconnect/replay and outbox routing; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Official account approvals, templates, push entitlements, quotas and costs; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Real provider callbacks, opt-out, expired token, duplicate/reordered event and outage recovery.

## Security and privacy requirements

Execute relevant tenant/subject/job/case denial, secure-session, sensitive-upload, audit-redaction and consent tests against actual implemented components. Never expose credentials in evidence.

## Performance and reliability requirements

Measure against Phase 02/03 approved workloads and targets; verify retries/recovery without duplicate requests or conflicting assignment/capacity. Report limits and failures with exact test scope.

## Deliverables and artifacts

Integration adapters and real provider/failure evidence.

## Acceptance criteria

Canonical state preserved through late/duplicate/missing messages and reconnect.

## Evidence required

Authorized provider execution logs without secret leakage. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

Delivery ACK mistaken for assignment or consent bypass; also assess [open decisions](../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G3 contribution; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
