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
- Historical roadmap V4 remains unavailable/unverified. Reconstructed V4.1 is approved as governing future planning through explicit owner delegation recorded 2026-10-15 in `docs/reviews/phase-00-owner-approval.md`; the provenance limitation is accepted without claiming recovery. Conceptual blueprints do not approve detailed architecture/UX. Phase 00 is published and closed as planning at main ff6425a; the human owner's 2026-10-15 Phase 01 prompt separately authorizes feasibility research/documentation only. Read `docs/phases/phase-01-execution/kickoff.md` and its finite DoD. No outreach, private participant data, spending, account registration, app/prototype implementation, Lovable, infrastructure or Phase 02 is authorized. Repository closure publication follows `docs/governance/solo-maintainer-policy.md`: qualifying low-risk work requires exact-head CI, recorded AI audit and actual human OWNER SELF-REVIEW; sensitive work requires additional independent assurance before release.
- The repository is public. Do not put secrets, private filesystem paths, personal data, or confidential material in tracked content. Historical commits may retain previously committed content even after current files are corrected.
- Repository security settings, CI results, and local documentation checks are separate evidence; never infer application security or production readiness from documentation validation.

## Delegated ownership and review workflow

ChatGPT acts as delegated technical product owner/chief architect/quality lead; Codex implements and verifies approved tasks. Resolve routine internal decisions within authorized scope without repeated confirmation. The human owner retains legal, financial, account and external authority and final merge accountability. Read the solo-maintainer policy before delivery. Do not simulate independent approval, change protections without separate authorization, merge automatically under the current owner-review instruction or start an unapproved phase.
