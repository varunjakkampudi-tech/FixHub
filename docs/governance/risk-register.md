# Assumptions and Risks

## Document control

- Document ID: P00-RISK
- Status: Working draft for owner review
- Evidence rule: absence of evidence is recorded as unverified, not as approval.

| ID | Assumption or risk | Type | Impact | Mitigation / evidence | Owner | Status |
|---|---|---|---|---|---|---|
| RISK-001 | Historical planning identifiers may be mistaken for the current product name. | Governance | Public confusion, rework, legal risk. | Use Fix Hub for current product references; label “A–Z Services” and `viswatra-marketplace` as historical identifiers and retain them only in migration evidence/backups. | Product owner | Open |
| RISK-002 | A permanent logo or brand system may be created before approval. | Governance | Brand rework and unauthorized commitment. | No logo, palette, typography, tagline, domain, or visual identity in Phase 00. | Product owner | Open |
| RISK-003 | Lovable may not import or synchronize the existing repository. | Tooling | Source divergence, lost work, integration cost. | Treat standalone project/export/Codex integration as the only current plan; verify capability before initiation. | Engineering owner | Open |
| RISK-004 | Lovable project may be started before design and requirements approval. | Governance | Premature implementation and scope lock-in. | DEC-007 gate; require approval record and screen specification first. | Product owner | Open |
| RISK-005 | Historical Master Execution Roadmap V4.0 is unavailable; reconstructed V4.1 is a proposal and is not yet owner-confirmed as its replacement. | Provenance / governance | Historical sequencing cannot be compared or checksum-verified; proposed sequencing cannot govern later phases until owner confirmation. | V4.1 was reconstructed from the complete owner-supplied inline specification and its local SHA-256 is recorded in the roadmap and migration ledger. Preserve historical V4 as unverified/unavailable; obtain it only if historical comparison is required. Owner must confirm V4.1 supersession before it governs sequencing. | Product owner | Open |
| RISK-006 | ₹50,000 validation allowance may not fund complete multi-channel engineering. | Financial | Scope, quality, or launch feasibility failure. | Separate validation budget from build budget; produce cost model before commitment. | Product owner | Open |
| RISK-007 | WhatsApp Cloud API policies/templates/limits may constrain flows. | External | Messaging failure or compliance breach. | Verify official terms, consent, templates, opt-out, delivery, and fallback. | Product + legal | Open |
| RISK-008 | App Store and Play Store approval is not guaranteed. | External | Mobile launch timing and channel scope risk. | Validate account, policy, privacy, permissions, testing, and review requirements. | Product owner | Open |
| RISK-009 | Legal/privacy obligations for location, photos, identity, communications, and reviews are not yet verified. | Compliance | Regulatory, trust, and operational exposure. | Legal review, data map, retention and incident process. | Product owner | Open |
| RISK-010 | “Real-time” status may be interpreted as guaranteed timing or availability. | Product | Customer harm and trust loss. | Define states, freshness, uncertainty language, and fallback behavior. | Product owner | Open |
| RISK-011 | Merchant verification quality and capacity data may be insufficient. | Operations | Bad dispatch, cancellations, safety issues. | Define evidence, re-verification, capacity rules, and exception handling. | Operations owner | Open |
| RISK-012 | Concurrent acceptance may produce double assignment if not transactionally enforced. | Technical | Direct business-rule violation. | Prove atomic first-valid acceptance with race and retry tests. | Engineering owner | Open |
| RISK-013 | Multi-channel identity and notification delivery may diverge. | Technical | Duplicate requests, missed offers, privacy leakage. | Canonical IDs, idempotency, correlation, delivery logs, and fallback design. | Engineering owner | Open |
| RISK-014 | Initial city expansion may occur before local supply/demand and operations evidence. | Product | Poor service quality and cost. | Evidence-gated expansion decision. | Product owner | Open |
| RISK-015 | Support, incident response, dispute, and fraud operations are under-specified. | Operations | Unsafe or unresolved customer/merchant outcomes. | Define support model, hours, escalation, audit, and runbooks. | Operations owner | Open |
| RISK-016 | Public repository content may be reused under unclear expectations because no license is selected; prior commits may retain local path or personal email metadata. | Legal / privacy / repository governance | Rights ambiguity and historical disclosure that cannot be removed without rewriting public history. | Keep the repository public per current owner-provided URL; do not invent a license. Current files should omit private paths and use the GitHub noreply address for future commits. Owner to choose a license and decide whether historical metadata risk is accepted; no history rewrite is authorized. | Product owner | Open |

## Assumption ledger

- ASM-001: Tanuku is the first target market because the supplied prompt states it; no market validation was provided.
- ASM-002: English and Telugu are required launch languages because the supplied prompt states it; translation quality is unverified.
- ASM-003: The proposed technology baseline is a recommendation, not an approved architecture.
- ASM-004: The owner will confirm or revise proposed roadmap V4.1 as the sequencing baseline before any roadmap-dependent phase begins; this does not establish historical V4 provenance.
- ASM-005: External vendors and app stores may change terms, pricing, quotas, and approval criteria; current verification is pending.
