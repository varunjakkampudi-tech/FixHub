# Phase Review and Evidence Policy

## Purpose and authority

This policy defines the minimum evidence required to report phase progress and recommend a phase exit. It applies to every phase in the approved governing V4.1 roadmap. It is a review method, not implementation authorization or a substitute for phase-specific acceptance criteria.

## Status vocabulary

- **PASS:** required evidence is present and directly supports the criterion.
- **CONDITIONAL:** partial evidence exists, but a non-closed blocker or owner decision remains.
- **FAIL:** a required criterion is contradicted, missing, or failed.
- **NOT ASSESSED:** no adequate evidence was examined or execution was not performed.
- **NOT APPLICABLE:** the criterion does not apply to the reviewed phase; give the reason.

Absence of evidence is never a PASS. Planning statements do not prove implementation, tests, security, production readiness, or external approval.

## Percentage rules

1. Phase progress may be reported as `passed applicable exit criteria / total applicable exit criteria × 100` only when the phase checklist is explicit, each criterion is counted once, and the status of each is evidenced. The percentage is an evidence-coverage ratio, not a quality score or probability of success.
2. Report the numerator, denominator, statuses, and evidence references alongside every percentage. Exclude only criteria explicitly marked NOT APPLICABLE with rationale. A CONDITIONAL, FAIL, or NOT ASSESSED criterion is not counted as passed.
3. If there is no agreed finite checklist or measurable denominator, report **NOT MEASURABLE** rather than inventing a percentage.
4. Cumulative approved-phase progress may be stated as `owner-approved phases / 20`; this is a phase-approval ratio only. Do not present it as overall product or engineering completion.
5. Do not average dimensions or phases into one score unless the owner has approved the rubric and weights in advance. A high average cannot offset a critical security, data-integrity, legal, or mandatory-launch failure.

## Required review dimensions

Every review uses the [phase review template](../reviews/phase-review-template.md) and addresses, with PASS / CONDITIONAL / FAIL / NOT ASSESSED / NOT APPLICABLE as appropriate:

- phase-specific completion and cumulative owner-approved phases;
- technical and business feasibility;
- requirements and traceability;
- architecture and integration contracts;
- security and privacy;
- senior UI/UX review when design is in scope;
- code quality when code exists;
- test coverage and actual execution results;
- performance, scalability, reliability, and operational readiness;
- documentation integrity and repository cleanliness;
- legal and compliance readiness;
- outstanding risks, blockers, mitigations, and independent review findings.

For every assessment, distinguish documented intent, static inspection, local test execution, hosted CI, runtime evidence, and production evidence. Never imply a stronger evidence class than was actually collected. Mark implementation categories NOT ASSESSED when no implementation exists.

## Exit and approval

A phase can be recommended for owner approval only when every applicable mandatory exit criterion passes and no unresolved critical blocker remains. The phase becomes **APPROVED/CLOSED** only after explicit owner sign-off is recorded with date, scope, evidence reviewed, and any accepted residual risks. Otherwise it remains open, conditional, or failed. The next phase does not start automatically.

For Phase 00, delegated foundation/requirements approval and V4.1 supersession are already recorded in the [owner approval](../reviews/phase-00-owner-approval.md). Repository closure still requires proper publication and post-merge verification.

## Risk-based reviewer model — 2026-10-15

The [solo-maintainer policy](solo-maintainer-policy.md) supersedes a blanket independent-human review gate for qualifying low-risk planning/documentation changes. Require exact-head CI, a recorded adversarial AI audit and human OWNER SELF-REVIEW with merge responsibility. This is not independent approval or certification. Sensitive authentication/authorization, privacy, payment, irreversible/sensitive integration and launch work requires additional competent independent assurance before release. Enforced GitHub rules remain binding; settings changes require separate authorization. Reinstate stronger independent-review controls when another eligible maintainer joins.
