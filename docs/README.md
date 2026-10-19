# Documentation index

This tree contains product foundation and governance documents for Fix Hub, the owner-selected product name under parent company Viswatra. `A–Z Services` and `viswatra-marketplace` are historical planning identifiers. `fixhub-platform` is a recommended identifier; the current public repository is `varunjakkampudi-tech/FixHub`, default branch `main`. Logo, visual identity, colors, typography, domain, and tagline remain OPEN.

## Product

Latest [product foundation quality checkpoint](reviews/foundation-quality-review.md) separates verified cleanup, review limitations, local tests and remaining approval gates.

Current preparatory artifact: [Phase 02 requirements draft](product/requirements/product-requirements-draft.md), explicitly unapproved while Phase 01 exit remains open.

Phase 03 preparation: [architecture and integration candidates](architecture/architecture-contracts-draft.md), [candidate API inventory](engineering/contracts/service-api-candidates.json), [bounded PostgreSQL proof with limitations](reviews/dispatch-proof-review.md), and the [local Express API foundation](engineering/api-foundation.md). The API foundation is a demo-only implementation, not an approved/deployed Phase 03 API; these artifacts do not approve Phase 03 entry or detailed architecture.

Phase 04 preparation: [behaviour and channel contracts](product/behaviour/behaviour-specification.md), [interaction references](product/behaviour/interaction-catalogue.json), [state candidates](product/behaviour/state-catalogue.json) and [notification candidates](product/behaviour/notification-catalogue.json). Proposed additions and bilingual text require review; product behavior is not implemented or approved.

Phase 05 preparation: [design-system proposal](design/design-system-proposal.md), [candidate tokens](design/design-tokens.json) and [visual concept board](design/concept-board.png). The proposal is ready for owner direction; permanent logo, identity, domain and tagline remain OPEN. No phase closure or G1 approval is implied.

Current status: Phase 00 planning publication verified at main `ff6425ac1a4436bbe36aa119df1f95fed9e26592` with successful post-merge CI. Phase 01 feasibility research/documentation is IN PROGRESS; see [execution index](product/feasibility/README.md), [initial authorization](product/feasibility/research-authority.md), [revised ten-item scoped assessment](product/feasibility/exit-criteria.md) and [dated scope amendment](reviews/phase-01-scope-amendment-2026-10-16.md). Its 10/10 score is scoped assessment coverage only: P01-DOD-008 is deferred/unresolved, P01-DOD-014 remains a separate owner exit gate, and Phase 01 is not closed. Phase 02 remains NOT AUTHORIZED. The [current Phase 01–05 work authorization](governance/product-foundation-work-authority.md) permits later-phase draft preparation but does not pass sequential entry/exit gates. Existing [solo-maintainer policy](governance/solo-maintainer-policy.md) and GitHub safeguards remain binding; the owner-requested direct-main procedure is a conditional proposal, not a bypass. Start with the [conceptual blueprint](blueprint/README.md), [all 20 phase plans](roadmap/workstreams/README.md) and [approval/evidence record](reviews/foundation-approval.md). Historical reviews retain their original results.

- [Product charter](product/charter.md)
- [Product scope](product/scope.md)
- [Functional requirements](product/requirements/functional.md)
- [Non-functional requirements](product/requirements/non-functional.md)
- [Requirement ID inventory and validation baseline](product/requirements/id-inventory.json)

### Requirement traceability

- Functional requirements: `FR-C-001`, `FR-C-002`, `FR-C-003`, `FR-C-004`, `FR-C-005`, `FR-C-006`, `FR-C-007`, `FR-C-008`; `FR-M-001`, `FR-M-002`, `FR-M-003`, `FR-M-004`, `FR-M-005`, `FR-M-006`, `FR-M-007`, `FR-M-008`; `FR-A-001`, `FR-A-002`, `FR-A-003`, `FR-A-004`, `FR-A-005`, `FR-A-006`; `FR-X-001`, `FR-X-002`, `FR-X-003`, `FR-X-004`, `FR-X-005`.
- Non-functional requirements: `NFR-SEC-001`, `NFR-SEC-002`, `NFR-SEC-003`; `NFR-REL-001`, `NFR-REL-002`; `NFR-PERF-001`; `NFR-SCALE-001`; `NFR-UX-001`, `NFR-UX-002`; `NFR-OBS-001`; `NFR-BCP-001`; `NFR-EXT-001`; `NFR-OPS-001`; `NFR-COST-001`.
- The machine-readable [ID inventory](product/requirements/id-inventory.json) is the reviewed baseline used by CI. Intentional additions, removals, or renames must update the inventory, validator policy (including expected counts and accepted ID forms), requirements, index, and regression tests together in a reviewed change.

## Governance and assurance

- [Decision register](governance/decision-register.md)
- [Risk register and assumptions](governance/risk-register.md)
- [Document provenance and retained source evidence](governance/document-provenance.md)
- [Document locations and hash lineage](governance/document-lineage.json)
- [Roadmap checksum provenance](governance/roadmap-provenance.json)
- [Access control and roles](security/access-control.md)
- [Definition of done](quality/foundation-exit-criteria.md)
- [Foundation review](reviews/foundation-review.md)
- [Phase review policy](governance/stage-gate-policy.md)
- [Solo-maintainer governance and owner review checklist](governance/solo-maintainer-policy.md)
- [Phase review template](reviews/stage-review-template.md)
- [Repository audit remediation findings](reviews/foundation-review.md#current-repository-audit-remediation)
- [Post-merge governance audit and prepared owner sign-off](reviews/foundation-review.md#post-merge-governance-audit-and-owner-sign-off-preparation)
- [Owner-delegated approval and current 21-criterion evidence](reviews/foundation-approval.md)
- [Required blueprint structure](governance/blueprint-inventory.json)
- [Exact approval revision/hash scope](governance/foundation-approval-scope.json)

## Roadmap and design

- [Fix Hub Master Execution Roadmap V4.1](roadmap/master-roadmap.md) (APPROVED governing planning roadmap through explicit owner delegation, 2026-10-15; future execution separately gated)
- Historical V4 source and SHA-256 remain unavailable and unverified; see the [provenance ledger](governance/document-provenance.md).
- `design/` contains a proposed design system and visual concepts; permanent brand identity remains OPEN. `engineering/` contains candidate contracts and bounded proofs. `src/` contains a local-only demo; `api/` contains a limited, non-production API foundation. Neither is production implementation or evidence of phase exit.

No production infrastructure or production readiness is claimed. The local demonstration and API tests are distinct from hosted validation and live service operation.

Repository-level guidance: [contributing](../CONTRIBUTING.md), [security reporting](../SECURITY.md), automated [documentation validation](../scripts/validate-documentation.mjs), and its [regression checks](../scripts/documentation-validator.test.mjs). These do not represent application security or product tests.
