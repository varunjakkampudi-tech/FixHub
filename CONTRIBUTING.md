# Contributing

This repository currently contains planning and governance documentation, not application code.

## Before proposing a change

- Read [AGENTS.md](AGENTS.md) and the relevant documents in [docs](docs/README.md).
- Preserve stable requirement, decision, risk, role, permission, and definition-of-done identifiers.
- Label proposals, assumptions, owner decisions, and verified evidence distinctly. Do not imply Phase 00 approval, product readiness, or implementation evidence without records.
- Do not add product source, dependencies, generated branding, or external integrations without explicit authorization.

## Changes and review

- Keep `main` as the default branch. Once repository rules are active, submit changes through a pull request and obtain the required independent approval and passing `docs-validation` check.
- Keep changes scoped, run `node scripts/validate-docs.mjs` and `node scripts/test-validate-docs.mjs`, and describe any checks not run.
- Do not include secrets, personal data, confidential content, or local machine paths. The repository is public.

No license has been selected. See [DEC-017](docs/governance/decision-register.md); contribution guidance does not grant additional rights to reuse repository content.
