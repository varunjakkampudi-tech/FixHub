# FixHub Archival Manifest and Asset Inventory

**Date of record:** 2026-10-20 (updated by the cleanup checkpoint recorded in `PROGRESS.md`)
**Repository:** this repository (remote default branch `main`)
**Parent brand:** Viswatra
**Launch market target:** Tanuku, Andhra Pradesh (State Code 37)
**Governing policy:** [AGENTS.md](../../AGENTS.md) and [product-foundation-work-authority.md](../governance/product-foundation-work-authority.md)

> **Correction note (2026-10-20).** An earlier version of this manifest (a duplicate at the repository root, now removed) contained private local filesystem paths, a stale baseline SHA, two links to files that do not exist in this tree, and a statement that `database/migrations/` is the canonical migration chain. Those points are corrected below. External backup locations are withheld from the public repository; the owner keeps the bundles and their checksums.

---

## 1. External Git bundles (locations withheld)

Backups are stored outside this repository. Each entry records the checksum given at creation time. Verify a bundle with `git bundle verify <bundle>` and compare its SHA-256 with the value recorded in the owner's backup log.

| Bundle file name | Source commit SHA | SHA-256 (creation record) | Verification at creation | Storage | Retention rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fixhub-baseline-b34ea99a30665ec0de010d98d4e2bf0047eb01c9.bundle` | `b34ea99a30665ec0de010d98d4e2bf0047eb01c9` | `CB0EB1BB3AF40E38FAC466D804E327B9146902096DD20C18B570CE25CB3EC31B` | `git fsck` passed (0 errors) | External, outside repository | Clean pre-migration baseline preservation |
| `fixhub-integrated-3f058fa07c568494aa594284aa7bc40ff4802585.bundle` | `3f058fa07c568494aa594284aa7bc40ff4802585` | `D0BED5F57819AE2BF1D7EDDA5889E3E3C8F3BD5C1F20E53536EB5D13A4E6ED54` | `git fsck` passed (0 errors) | External, outside repository | Integration baseline with test suites and matrices |
| `fixhub-all-branches-backup-4994368.bundle` | `49943686c5941aa54a9efd6b0ed495f6e569169e` | `9114F88BB1333FEE834A9CE4279D6B01168F03D63A80F92C209E05C8C9D23BC7` | `git fsck` passed (0 errors) | External, outside repository | Archive of all 41 historical refs before branch pruning |
| `fixhub-baseline-2383a109c35a1259a490db050929690db32c4bc7.bundle` | `2383a109c35a1259a490db050929690db32c4bc7` | `be21b1216ca151eb7cf6e54c100978e445ae65c5b0eee7b7d5cd32aa10ca1fd0` | `git bundle verify`, restore clone and `git fsck --strict` passed | External, outside repository | Pre-cleanup baseline for the 2026-10-20 checkpoint |

---

## 2. Canonical specification documents tracked in the repository

The five authoritative specifications live under `docs/specs/`. Checksums below were recomputed on 2026-10-20 and match the creation records.

| Canonical document | Repository path | SHA-256 | Status |
| :--- | :--- | :--- | :---: |
| `FixHub-Autonomous-Goal.md` | `docs/specs/FixHub-Autonomous-Goal.md` | `514380767025A1A18D12338225AF331A420AAC11E1AD840A19514F38C990E298` | Checksum matches |
| `FixHub-Engineering-Standards.md` | `docs/specs/FixHub-Engineering-Standards.md` | `FCC1760BC72D38221EBB153538CEB35DB9040D0E8DBB952985000C9D4666ED55` | Checksum matches |
| `FixHub-Product-Spec-v1.3.md` | `docs/specs/FixHub-Product-Spec-v1.3.md` | `F549D93B52E1EB8A08CC1426F6B4244DA4C9A4EE569DE9D7031316923DEBC52D` | Checksum matches |
| `Viswatra-Global-Engineering-Completion-Program-v1.1.md` | `docs/specs/Viswatra-Global-Engineering-Completion-Program-v1.1.md` | `9421280DAC8D38DACCD26378D378A862751F7DCC9BB0D8392A408CB50A1F90EC` | Checksum matches |
| `Viswatra-Global-Engineering-Quality-Standard-v1.1.md` | `docs/specs/Viswatra-Global-Engineering-Quality-Standard-v1.1.md` | `429B54C2003D8E5BF4A2949507F5A8A2C5284820F6588C4B1E3266FE18112066` | Checksum matches |

---

## 3. Planning, governance, and decision registers

Historical planning and decision records are preserved in Git history and in the active governance tree. Paths below were checked on 2026-10-20.

| Asset | Path | Role or disposition |
| :--- | :--- | :--- |
| Roadmap V4.1 (master roadmap) | `docs/roadmap/master-roadmap.md` | Governing future planning per DEC-016; the historical V4 is unavailable (see `docs/governance/document-provenance.md`) |
| Foundation approval record | `docs/reviews/foundation-approval.md` | Owner-delegated foundation approval; does not approve later phases |
| Phase 00 closure | Recorded in `AGENTS.md` (closed at commit `ff6425a`) | No separate closure file exists in this tree; not re-verified in this checkpoint |
| Solo-maintainer policy | `docs/governance/solo-maintainer-policy.md` | Merge accountability for a single maintainer |
| Work authority | `docs/governance/product-foundation-work-authority.md` | Authority for Phase 01 to 05 preparation |
| Phase 01 feasibility exit criteria | `docs/product/feasibility/exit-criteria.md` | Finite Phase 01 criteria and evidence gaps |
| Decision register | `docs/governance/decision-register.md` | Stable decision IDs (DEC-nnn) |
| Risk register | `RISK_REGISTER.md` | Stable risk IDs |
| Blocker register | `blocker.txt` | Owner-actionable blockers |

---

## 4. Git branch disposition and current verified state

Per the owner instruction recorded on 2026-10-20, historical non-main branches were archived in the external bundle listed in section 1 and pruned from the local repository and from the remote.

**Verified at this checkpoint (`git ls-remote --heads`):** the remote has one branch, `main`, at `2383a109c35a1259a490db050929690db32c4bc7`. Local `main` and `origin/main` match that SHA. No branches other than `main` exist on the remote.

| Branch category | Scope | Disposition |
| :--- | :--- | :--- |
| Canonical protected `main` | `main` | Sole remote branch. Protected by required `docs-validation` and administrator enforcement. |
| Historical feature, fix, docs, and phase branches | `docs/*`, `feat/*`, `feature/*`, `fix/*`, `phase-01/*`, `ready-for-main` | Archived in the external bundle and deleted from the remote. |

---

## 5. Database schema and migration lineage (corrected)

The canonical migration chain for this repository is `api/migrations/` (`001_identity.sql` through `008_support_requests.sql`), applied by `api/migrations.ts`. This matches the Engineering Standards section 1.1 and Product Specification FR-3.

`database/migrations/001_initial_schema.sql` is an **unapplied draft** that includes PostGIS and a broader launch schema. It is not part of the canonical chain. Whether to merge, replace, or retire it, and what to do with the commit #21 code it relates to, is owner decision **D18** (see `blocker.txt`, BLOCKER-010). Until D18 is decided, neither stream is deleted.

The in-memory `Repository` class in `api/db/repository.ts` still backs several mounted routes. That conflicts with FR-3 and is tracked in `blocker.txt` (BLOCKER-010) rather than changed in this checkpoint.

---

## 6. Verification commands

Run these from a clone of this repository. Replace `<backup-dir>` with the owner's external backup directory.

```bash
# Verify a baseline bundle
git bundle verify <backup-dir>/fixhub-baseline-2383a109c35a1259a490db050929690db32c4bc7.bundle

# Verify the canonical specification checksums (run in the repository root)
sha256sum docs/specs/*.md
```
