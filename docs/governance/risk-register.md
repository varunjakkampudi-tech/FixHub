# Assumptions and Risks

## Document control

- Document ID: P00-RISK
- Status: Owner-delegated planning baseline approved 2026-10-15; see [approval record](../reviews/foundation-approval.md). Detailed implementation decisions remain separately gated.
- Evidence rule: absence of evidence is recorded as unverified, not as approval.

| ID | Assumption or risk | Type | Impact | Mitigation / evidence | Owner | Status |
|---|---|---|---|---|---|---|
| RISK-001 | Historical planning identifiers may be mistaken for the current product name. | Governance | Public confusion, rework, legal risk. | Use Fix Hub for current product references; label “A–Z Services” and `viswatra-marketplace` as historical identifiers and retain them only in migration evidence/backups. | Product owner | Open |
| RISK-002 | A permanent logo or brand system may be created before approval. | Governance | Brand rework and unauthorized commitment. | No logo, palette, typography, tagline, domain, or visual identity in Phase 00. | Product owner | Open |
| RISK-003 | Lovable may not import or synchronize the existing repository. | Tooling | Source divergence, lost work, integration cost. | Treat standalone project/export/Codex integration as the only current plan; verify capability before initiation. | Engineering owner | Open |
| RISK-004 | Lovable project may be started before design and requirements approval. | Governance | Premature implementation and scope lock-in. | DEC-007 gate; require approval record and screen specification first. | Product owner | Open |
| RISK-005 | Historical V4 and nine original migration source documents remain unavailable. Approved reconstructed V4.1 governs planning. | Provenance / governance | Historical comparison/authentication and original-byte recovery remain unproven. | Explicit owner-delegated acceptance 2026-10-15 under Approvals A/D; retain original hash records and accept candidates only on matching hashes. Git bundles are repository snapshots, not historical originals. [Approval scope](../reviews/foundation-approval.md) records the limit. | Product owner through explicit delegation | Accepted residual limitation; recovery NOT achieved |
| RISK-006 | ₹50,000 validation allowance may not fund complete multi-channel engineering. | Financial | Scope, quality, or launch feasibility failure. | Separate validation budget from build budget; produce cost model before commitment. | Product owner | Open |
| RISK-007 | WhatsApp Cloud API policies/templates/limits, account eligibility and effective costs may constrain flows. | External | Messaging failure, unexpected cost or compliance breach. | P01-DOD-008 is deferred from the Phase 01 score, not resolved. Verify effective terms, account eligibility, consent, templates, opt-out, delivery, and fallback before provider selection/activation and Phase 14 exit. | Product + legal | Open |
| RISK-008 | App Store and Play Store approval is not guaranteed. | External | Mobile launch timing and channel scope risk. | Validate account, policy, privacy, permissions, testing, and review requirements. | Product owner | Open |
| RISK-009 | Legal/privacy obligations for location, photos, identity, communications, and reviews are not yet verified. | Compliance | Regulatory, trust, and operational exposure. | Legal review, data map, retention and incident process. | Product owner | Open |
| RISK-010 | “Real-time” status may be interpreted as guaranteed timing or availability. | Product | Customer harm and trust loss. | Define states, freshness, uncertainty language, and fallback behavior. | Product owner | Open |
| RISK-011 | Merchant verification quality and capacity data may be insufficient. | Operations | Bad dispatch, cancellations, safety issues. | Define evidence, re-verification, capacity rules, and exception handling. | Operations owner | Open |
| RISK-012 | Concurrent acceptance may produce double assignment if not transactionally enforced. | Technical | Direct business-rule violation. | Prove atomic first-valid acceptance with race and retry tests. | Engineering owner | Open |
| RISK-013 | Multi-channel identity and notification delivery may diverge. | Technical | Duplicate requests, missed offers, privacy leakage. | Canonical IDs, idempotency, correlation, delivery logs, and fallback design. | Engineering owner | Open |
| RISK-014 | Initial city expansion may occur before local supply/demand and operations evidence. | Product | Poor service quality and cost. | Evidence-gated expansion decision. | Product owner | Open |
| RISK-015 | Support, incident response, dispute, and fraud operations are under-specified. | Operations | Unsafe or unresolved customer/merchant outcomes. | Define support model, hours, escalation, audit, and runbooks. | Operations owner | Open |
| RISK-016 | Public no-license planning material and known limited historical local-path/commit-email exposure. | Legal / privacy / repository governance | Public readability, residual rights ambiguity and already disclosed metadata remain. | Explicit owner-delegated acceptance 2026-10-15 under Approvals E/F. Retain temporary no-license posture; no history rewrite. Continue noreply future commits. Actual secrets, sensitive customer records or materially different exposures require separate escalation. | Product owner through explicit delegation | Known limited exposure accepted; new/material exposure not accepted |

## Assumption ledger

- ASM-001: Tanuku is the first target market because the supplied prompt states it; no market validation was provided.
- ASM-002: English and Telugu are required launch languages because the supplied prompt states it; translation quality is unverified.
- ASM-003: The proposed technology baseline is a recommendation, not an approved architecture.
- ASM-004: V4.1 supersession is approved through explicit owner delegation on 2026-10-15; this establishes governing planning scope, not historical V4 provenance or next-phase authorization.

## Risk-disposition history — 2026-10-15

RISK-005 was OPEN for unavailable historical provenance and pending supersession; the owner now accepts the historical limitation and approves supersession. Missing originals remain 0/9 recoverable/revalidated. RISK-016 was OPEN for licensing and known public metadata; temporary no-license posture and known limited exposure are now accepted, without rewriting history. The PR #1 review-evidence gap is accepted as a historical exception under Approval G, with root cause unverified and retrospective independent review recommended. Existing verified same-device bundles are accepted as limited snapshots under Approval H; encryption, off-device access control, retention and tested restoration remain future requirements. No current mandatory GitHub approval is supplied by these acceptances. See [delegated approval](../reviews/foundation-approval.md).
- ASM-005: External vendors and app stores may change terms, pricing, quotas, and approval criteria; current verification is pending.
