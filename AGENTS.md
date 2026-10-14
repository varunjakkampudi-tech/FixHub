# Workspace guidance

This repository currently holds product and governance documentation only. Its canonical GitHub repository is `varunjakkampudi-tech/FixHub`, with `main` as the default branch. Read relevant documents and this file before changing project material.

## Product and brand constraints

- Viswatra is the confirmed parent brand.
- Fix Hub is the owner-selected product name under Viswatra.
- “A–Z Services” and `viswatra-marketplace` are historical planning identifiers, not current product names.
- Logo, visual identity, colors, typography, domain, and tagline remain OPEN.
- `fixhub-platform` remains a recommended identifier only; the owner-selected repository currently uses `FixHub`. Do not rename this workspace or repository absent a separate owner decision.
- Do not generate, select, approve, or implement a permanent logo or identity without owner approval.

## Tooling and implementation boundaries

- Do not assume Lovable can access or import this workspace or a GitHub repository.
- A standalone Lovable project followed by source export and Codex integration is only a proposed workflow; verify it separately and obtain authorization before use.
- Keep any existing Lovable project untouched.
- The `apps/`, `services/`, `packages/`, `infrastructure/`, and `tests/` trees in architecture material are specifications, not authorization to scaffold code.
- Do not install dependencies, create infrastructure, spend credits, or deploy/publish the product without explicit task authorization. Repository documentation changes may be pushed to `main` when explicitly requested; keep the `main` branch protected and use pull requests after repository protections are active.

## Documentation practice

- Preserve stable requirement, decision, risk, and other traceability IDs.
- Mark facts, proposals, assumptions, and unresolved external dependencies distinctly.
- Do not claim owner approval, roadmap completion, implementation, testing, or release evidence that is not present.
- Historical roadmap V4 remains unavailable/unverified. Reconstructed V4.1 is approved as governing future planning through explicit owner delegation recorded 2026-10-15 in `docs/reviews/phase-00-owner-approval.md`; the provenance limitation is accepted without claiming recovery. Conceptual blueprints do not approve detailed architecture/UX or authorize Phase 01. Repository closure publication remains subject to legitimate delivery and independent review.
- The repository is public. Do not put secrets, private filesystem paths, personal data, or confidential material in tracked content. Historical commits may retain previously committed content even after current files are corrected.
- Repository security settings, CI results, and local documentation checks are separate evidence; never infer application security or production readiness from documentation validation.
