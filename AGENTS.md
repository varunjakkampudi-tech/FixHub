# Workspace guidance

This repository holds product/governance documentation and a local-only Fix Hub demonstration UI/API. It is not a production service. Its canonical GitHub repository is `varunjakkampudi-tech/FixHub`, with `main` as the default branch. Read relevant documents and this file before changing project material.

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

### Domain-oriented structure

Use meaningful product/domain names for active files, folders and tests, not numbered phase or temporary import/migration names. Roadmap phase identifiers 00–19, their order, stable traceability IDs and approval gates remain intact inside the governing content. Keep retired locations only as explicit commit-relative provenance, not duplicate active files. Update links, scripts, inventories, hashes and regression fixtures together. Record reference-only changes without pretending they approve requirements, identity, implementation or phase exit. Temporary restructure tooling must be removed after replacements are verified. Historical originals and private recovery data must not be fabricated, exposed or deleted as a side effect of filename cleanup.

- Preserve stable requirement, decision, risk, and other traceability IDs.
- Mark facts, proposals, assumptions, and unresolved external dependencies distinctly.
- Do not claim owner approval, roadmap completion, implementation, testing, or release evidence that is not present.
- Historical roadmap V4 remains unavailable/unverified. Reconstructed V4.1 is approved as governing future planning through explicit owner delegation recorded 2026-10-15 in `docs/reviews/foundation-approval.md`; the provenance limitation is accepted without claiming recovery. Conceptual blueprints do not approve detailed architecture/UX. Phase 00 is published and closed as planning at main ff6425a. The owner's 2026-10-15 authorization permits research, requirements, architecture, interaction specifications, design-system preparation and safe bounded offline proofs toward Phases 01–05; it does not grant any later-phase exit or alter G0–G5. Phase 01 remains IN PROGRESS; formal Phase 02 execution awaits Phase 01 exit. Phases 02–05 remain draft preparation until their sequential entry/exit evidence and owner decisions are satisfied. Merchant/customer outreach, publication of private participant data, spending, account registration, Lovable activity, production backend/infrastructure and deployment remain unauthorized. A local-only UI demonstration has separate owner authorization; it is not production application approval or a later-phase exit. The work authority is `docs/governance/product-foundation-work-authority.md`; the finite Phase 01 assessment is `docs/product/feasibility/exit-criteria.md`. Protect `main`, follow its current required checks, and use a review PR for this separately authorized UI demonstration; never bypass protections.
- The repository is public. Do not put secrets, private filesystem paths, personal data, or confidential material in tracked content. Historical commits may retain previously committed content even after current files are corrected.
- Repository security settings, CI results, and local documentation checks are separate evidence; never infer application security or production readiness from documentation validation.

## Delegated ownership and review workflow

### Current work authorization — 2026-10-15

The latest owner instruction authorizes work toward Phases 01–05 and clearly labeled later-phase draft preparation while an earlier exit gate remains blocked. See [scope and proposed direct-main procedure](docs/governance/product-foundation-work-authority.md). It supersedes earlier work-scope statements, not phase approvals, roadmap gates or enforced GitHub safeguards. Do not create feature branches/PRs for this objective. Direct-main publication is conditional on a normal permitted push; stop publication on rejection, preserve local work and report the exact conflict. No protection weakening, fabricated checks, automatic phase acceptance, permanent brand approval, Phase 06, Lovable or production implementation is authorized.

ChatGPT acts as delegated technical product owner/chief architect/quality lead; Codex implements and verifies approved tasks. Resolve routine internal decisions within authorized scope without repeated confirmation. The human owner retains legal, financial, account and external authority and final merge accountability. Read the solo-maintainer policy before delivery. Do not simulate independent approval, change protections without separate authorization, merge automatically under the current owner-review instruction or start an unapproved phase.
