# Phase 11 — Merchant Marketplace, Catalog & Search

Status: PHASE 00 PLANNING DOSSIER. Future execution evidence is PENDING unless explicitly identified.

## Phase name

Merchant Marketplace, Catalog & Search

## Business purpose

Build trustworthy supply and local discovery.

## Current status

PENDING — planning dossier only. No execution, design, tests, integration approval or phase sign-off is claimed.

## Preconditions

Explicit execution authorization for Phase 11; prior phase exit reviewed and recorded. Relevant unresolved decisions must be resolved before affected work. Documentation existence is not permission to execute.

## Dependencies

[Phase 10](identity-access-security.md), [governing roadmap](../master-roadmap.md), initial requirement baseline and approved decisions. Approved mapping data and verification operations.

## Scope

Free registration, evidence review, categories, zones, hours, capacity and fair search.

## Detailed workstreams

1. Implement verification/moderation.
2. validate geographic matching.
3. manage catalog/versioned availability.
4. test truthful pricing and search output.

## Required product decisions

Verification evidence, ranking explanation and expansion authority.

## Required technical decisions

Geo query correctness, resource isolation and capacity representation.

## Required documentation

Merchant/search modules, review tools and eligibility evidence; link each result to changed requirements, policy versions and exact revisions. Use [traceability](../../blueprint/traceability-matrix.md) and [phase review policy](../../governance/stage-gate-policy.md).

## Architecture and design responsibilities

Use approved Phase 03 contracts and Phase 04–06 interactions; record deviations as reviewed changes before implementing affected behavior. Maintain tenant isolation and a single authoritative backend.

## Features or capabilities targeted

Free registration, evidence review, categories, zones, hours, capacity and fair search; initial capabilities trace to the approved FR/NFR baseline. No paid ranking or unapproved payment/guarantee policy is introduced.

## External services and feasibility dependencies

Approved mapping data and verification operations; retain actual access/terms/cost evidence before commitments.

## Roles and responsible owners

Product owner delegates planning authority as recorded; engineering owner owns technical evidence; security/privacy owner reviews data and access; QA owns reproducible tests; operations owns fulfilment/support readiness. Named assignees and staffing remain to be appointed before execution.

## Testing requirements

Tenant and geographic boundaries, stale availability, suspended merchants and missing price.

## Security and privacy requirements

Execute relevant tenant/subject/job/case denial, secure-session, sensitive-upload, audit-redaction and consent tests against actual implemented components. Never expose credentials in evidence.

## Performance and reliability requirements

Measure against Phase 02/03 approved workloads and targets; verify retries/recovery without duplicate requests or conflicting assignment/capacity. Report limits and failures with exact test scope.

## Deliverables and artifacts

Merchant/search modules, review tools and eligibility evidence.

## Acceptance criteria

Unverified/out-of-zone/unavailable merchants are excluded correctly; registration is free.

## Evidence required

Executed search/verification cases and approved category/zone fixtures. Every result records date, revision, method, failure/skip count and reviewer. Future evidence is PENDING.

## Known risks

False verified status or supply/capacity misrepresentation; also assess [open decisions](../../blueprint/open-decisions.md) before affected commitments.

## Exit review requirements

Use the phase review template. Count applicable criteria once; identify failed/conditional gates and residual owners. Require independent assessment where governance/security rules apply; no arbitrary excellence score.

## Stage gate mapping

G3 contribution; see [20-phase dependency diagram](README.md#dependency-and-gate-diagram). A stage gate has its own evidence and cannot pass because this dossier exists.

## Owner sign-off requirements

PENDING. Record explicit owner identity/authority, date, exact scope/revisions, accepted residual risks and phase outcome. This Phase 00 planning dossier grants no future phase approval.

## Next-phase transition policy

The next phase requires a separate owner authorization after this phase's evidence review. No automatic transition, spending, vendor use, Lovable or deployment is permitted.
