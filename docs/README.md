# Documentation index

This tree contains product foundation and governance documents for Fix Hub, the owner-selected product name under parent company Viswatra. `A–Z Services` and `viswatra-marketplace` are historical planning identifiers. `fixhub-platform` is a recommended identifier; the current public repository is `varunjakkampudi-tech/FixHub`, default branch `main`. Logo, visual identity, colors, typography, domain, and tagline remain OPEN.

## Product

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
- [Document migration record](governance/document-migration.md)
- [Roadmap checksum provenance](governance/roadmap-provenance.json)
- [Access control and roles](security/access-control.md)
- [Definition of done](quality/definition-of-done.md)
- [Foundation review](reviews/foundation-review.md)
- [Phase review policy](governance/phase-review-policy.md)
- [Phase review template](reviews/phase-review-template.md)
- [Repository audit remediation findings](reviews/foundation-review.md#current-repository-audit-remediation)

## Roadmap and design

- [Fix Hub Master Execution Roadmap V4.1](roadmap/master-roadmap.md) (PROPOSED; reconstructed from the complete owner-supplied inline specification; awaiting owner confirmation as superseding roadmap)
- Historical V4 source and SHA-256 remain unavailable and unverified; see the [provenance ledger](governance/document-migration.md).
- `design/` and `engineering/` are reserved documentation domains. No design system, UI, or implementation blueprint was present in the supplied files.

No application source, infrastructure, or test directories are created by this documentation migration.

Repository-level guidance: [contributing](../CONTRIBUTING.md), [security reporting](../SECURITY.md), automated [documentation validation](../scripts/validate-docs.mjs), and its [regression checks](../scripts/test-validate-docs.mjs). These do not represent application security or product tests.
