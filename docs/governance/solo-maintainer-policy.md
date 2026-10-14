# Solo-maintainer governance and delegated technical ownership

## Authority, scope and effective date

Policy amendment date: **2026-10-15 (Asia/Calcutta)**. The human owner authorized preparation/adoption through “FIXHUB — PERMANENT TECHNICAL OWNERSHIP, SOLO-MAINTAINER GOVERNANCE & PHASE 00 CLOSURE”, supplied attachment SHA-256 `317E6B8FC5B4B2DA5DB1A13CAACEB5B3222AE57DB945DC6144B1776DC3044129`. The repository has one observed maintainer, `varunjakkampudi-tech`, who is also PR #2's author; no separate eligible collaborator or submitted review is evidenced. This amendment replaces the project's blanket independent-human approval requirement for qualifying low-risk changes. Its repository publication is pending PR #2's owner review and normal merge.

ChatGPT is the delegated technical product owner, chief architect and engineering/governance quality lead; Codex executes and verifies authorized repository work. Internal product, architecture, documentation, technical-security, UX and prioritization decisions can be resolved within the approved phase/scope without repeated routine confirmation. The human owner retains legal, financial, account, vendor/external commitments and final merge accountability. No delegation grants credentials, spending, production access or an unapproved phase. Existing name/branding, licensing, Lovable and release constraints remain in force.

## Risk classification and delivery controls

| Class | Qualifying work | Required assurance |
|---|---|---|
| Routine / low risk | Planning, explanatory documentation, traceability and limited repository documentation validation; no changed runtime security, live data, IAM, payment or production behavior | Feature branch and PR targeting protected main; exact-head passing CI; recorded adversarial AI technical audit; final human OWNER SELF-REVIEW and explicit merge responsibility |
| Sensitive | Authentication/authorization, personal/customer data, payments, irreversible operations, sensitive vendor integrations, privileged/security-control changes | Approved scope and reproducible risk-specific tests; additional competent independent assurance before release; AI agreement alone cannot clear the gate |
| Production launch | Actual public release, production data/identity/payment exposure and coordinated Phase 19 launch | All roadmap gates, actual security/privacy/reliability and operational evidence, risk-based independent assurance and explicit owner GO |

Classify by effects, not filenames. A document that changes access/release policy or provides unsafe operational commands must be evaluated for those effects; it is not automatically low risk because it is Markdown. This amendment only records the owner-authorized review workflow and does not alter GitHub settings or authorize security/production operations. Phase 00 concepts remain plans. Uncertain high-impact classification requires the safer assurance path.

Every qualifying PR must state base/head, scope, risk class, test/CI evidence, audit method/findings/limitations, owner disposition and accepted residual risks. No direct-main delivery, alternate-account evasion, invented status checks, self-submitted approving GitHub review or force push is part of this policy. Any pushed revision invalidates earlier head-specific CI and owner self-review disposition; reassess the actual changes, run current CI and require renewed owner acceptance.

## AI audit and evidence standard

Codex may perform an adversarial AI-assisted review, explicitly identified as AI and not independent human assurance. Record the exact compared revisions, assumptions challenged, detected defects, fixes and remaining limits. Challenge premature closure, authority expansion, secret/privacy exposure, changed identifiers/provenance, weakening tests, and accidental later-phase execution. Review implemented behavior and negative cases where code exists; do not certify unimplemented systems from diagrams or docs CI.

Preserve reproducible tests and required hosted checks. Evidence distinguishes static inspection, local test, hosted CI, simulated execution, actual runtime and external approvals. Report only measured denominators; documentation counts do not prove commercial feasibility or production security. The current [21-criterion evidence](../reviews/phase-00-owner-approval.md#current-exit-criterion-evidence) is retained.

## Human owner self-review and merge accountability

Owner self-review is a human inspection/disposition, not an independent approving GitHub review. Do not fabricate a submitted review on an author's PR. Before the human performs a normal merge:

1. Open [PR #2](https://github.com/varunjakkampudi-tech/FixHub/pull/2), confirm the final head SHA and read the complete material diff, including this governance change.
2. Verify `docs-validation` succeeded on that exact SHA; inspect test counts, skipped cases and the hosted symlink result.
3. Inspect the [approval record](../reviews/phase-00-owner-approval.md), source authority, 21/21 count and pending publication boundary. Confirm 41 IDs, 20 dossiers and unchanged V4.1 phase/release sequence.
4. Inspect representative Mermaid diagrams using GitHub's rendered file view: [system context](https://github.com/varunjakkampudi-tech/FixHub/blob/docs/phase-00-final-closure/docs/architecture/system-context.md), [conceptual ERD](https://github.com/varunjakkampudi-tech/FixHub/blob/docs/phase-00-final-closure/docs/architecture/data-architecture.md), [atomic acceptance sequence](https://github.com/varunjakkampudi-tech/FixHub/blob/docs/phase-00-final-closure/docs/flows/flow-04-atomic-acceptance.md), [state machines](https://github.com/varunjakkampudi-tech/FixHub/blob/docs/phase-00-final-closure/docs/flows/state-machines.md), and [phase gates](https://github.com/varunjakkampudi-tech/FixHub/blob/docs/phase-00-final-closure/docs/phases/README.md). Check render errors, readable edges, one committed winner and policy boundaries. Record which diagrams were actually inspected; leave others visually unverified.
5. Accept or reject the documented historical V4/originals, metadata, PR #1 review gap and limited recovery risks without rewriting their history.
6. Record a PR comment or trusted owner message with **OWNER SELF-REVIEW**, exact head SHA, date, inspected scope/diagrams, disposition, accepted risks and explicit responsibility for a normal merge. Example fields: `Head: ...; Date: ...; Reviewed: ...; Diagrams inspected: ...; Disposition: accepted/revise; Risks: ...; I accept merge responsibility.` This is a template, not an already given acceptance.
7. The owner performs the normal merge only if GitHub permits it under accurately recorded controls. Codex does not merge automatically under the current instruction.
8. After merge, verify the merge SHA, main document/provenance integrity and required post-merge CI. Record APPROVED AND CLOSED only after those checks pass.

Current owner self-review disposition: **PENDING**. Requesting this policy amendment does not assert that the owner inspected the new final PR head. Mermaid visual rendering has not been inspected by Codex; local diagram checks are structural.

## GitHub safeguards and separately authorized settings

Keep strict required `docs-validation`, administrator applicability, conversation resolution, disabled force pushes and disabled deletions. Effective review enforcement is unverified: the aggregate protection endpoint omits review requirements while its dedicated endpoint reports one required approving review, with stale-review dismissal and latest-push approval disabled. Do not claim that the documented policy automatically changes GitHub.

The owner must inspect Settings > Branches and applicable Settings > Rules > Rulesets and verify the effective policy before merging. If GitHub rejects a solo-maintainer merge because one independent approving review is enforced, an explicit separate authorization to adjust that review setting is required before application. The narrow setting would be the enforced required approving-review count/PR-review rule for low-risk solo work; no other CI/non-review safeguard may be removed. No adjustment, bypass or merge attempt is authorized or performed by this amendment.

## Historical exception and restoration of stronger controls

PR #1 has no visible submitted approval; its exact merge-enabling mechanism remains unverified. The owner's accepted historical exception remains an exception, not retrospectively successful review. PR #2 likewise has no independent approval; owner self-review must be reported by its actual class.

When an eligible second maintainer joins, reinstate independent reviewer requirements through an explicitly recorded configuration change and require approval on the final revision. Reassess temporary solo exceptions and record the new effective rule. Sensitive work always retains additional risk-based assurance before release; lack of a reviewer is not proof of safety.

## Phase 00 amendment: adversarial AI audit record

Reviewer: Codex, AI-assisted static technical/governance audit; NOT independent human review. Review date: 2026-10-15. Comparison baseline: `a44bd3d9908f40bd311da0eb04032f37ea28984c`; the final candidate revision and head-specific CI are recorded in PR #2's updated evidence body. Scope: this policy, current governing/review references, two conceptual document governance references and their scope-manifest hash updates. Existing architecture/flow/journey source, requirement bodies, roadmap bytes, validator, tests and workflow are unchanged and retain the prior technical review.

| Adversarial challenge | Disposition and direct evidence |
|---|---|
| Could AI delegation authorize an unapproved phase, vendor spend or legal commitment? | No: authority is limited to approved scope; human external authority and Phase 01 NOT AUTHORIZED are explicit. |
| Could the policy amendment itself count as completed owner PR inspection? | No: actual exact-head owner self-review is PENDING; no review or signature is created. |
| Could solo review silently alter required checks or permit bypass? | No: no GitHub configuration mutation is included; actual enforced rules remain binding and changes separately authorized. |
| Could sensitive code be mislabeled low risk because it is in a doc file? | No: classify by effects; privacy/auth/payment/irreversible/sensitive/launch changes retain additional independent assurance before release. |
| Could a later push reuse old CI or owner acceptance? | No: each head change invalidates both dispositions; verify the final revision. |
| Could accepted historical risks become claims of recovery or independent approval? | No: retained PR #1/history disclosures and zero independent reviews remain explicit. |
| Could governance edits alter diagram or requirement intent? | No: edits only change review-gate references; all 41 IDs/intent and 34 diagram sources are retained. Changed artifact hashes are reconciled, not normalized away. |
| Could absent visual inspection be hidden by passing source checks? | No: Mermaid rendering remains unverified; owner checklist records the actually inspected diagrams and remaining limits. |

Audit decision: **PASS for the authorized documentary policy transition, conditional on final local/hosted checks and actual owner self-review before merge**. No reproducible material defect remains in the reviewed amendment. This is AI static assurance, not legal/privacy advice, product security certification, a personal owner attestation or independent GitHub approval. Exact test/CI execution is reported separately; this table does not fabricate results.

## Phase and closure boundaries

Owner-delegated Phase 00 planning approvals remain recorded; 21/21 documentary evidence is unchanged. Current published closed count remains 0/20 until PR #2 is normally merged and verified. Phase 01 execution remains NOT AUTHORIZED. Future dossiers, legal/provider validation, final architecture/UX, brand identity, Lovable, application implementation and production tests retain their separate gates.
