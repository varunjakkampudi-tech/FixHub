# Contributing

This repository currently contains planning and governance documentation, not application code.

## Before proposing a change

- Read [AGENTS.md](AGENTS.md) and the relevant documents in [docs](docs/README.md).
- Preserve stable requirement, decision, risk, role, permission, and definition-of-done identifiers.
- Label proposals, assumptions, owner decisions, and verified evidence distinctly. Do not imply Phase 00 approval, product readiness, or implementation evidence without records.
- Do not add product source, dependencies, generated branding, or external integrations without explicit authorization.

## Changes and review

- Keep `main` protected and submit feature-branch changes through a PR. Apply the [risk-based solo-maintainer policy](docs/governance/solo-maintainer-policy.md): exact-head CI, a recorded adversarial AI audit and explicit human OWNER SELF-REVIEW for qualifying low-risk work; additional independent assurance for sensitive work before release. Owner self-review is not an independent GitHub approval, and enforced rules cannot be bypassed.
- Keep changes scoped, run `node scripts/validate-docs.mjs` and `node scripts/test-validate-docs.mjs`, and describe any checks not run.
- Do not include secrets, personal data, confidential content, or local machine paths. The repository is public.

Temporary proprietary/no-license posture is approved under [DEC-017](docs/governance/decision-register.md); no reuse license or commercial terms have been added. Revisit before external contributions/redistribution/licensing commitments. This guidance grants no additional rights.
