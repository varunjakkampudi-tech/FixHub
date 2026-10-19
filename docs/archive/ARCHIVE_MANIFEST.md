# FixHub Comprehensive Archival Manifest & Asset Inventory

**Date of Record**: 2026-10-20  
**Repository**: `varunjakkampudi-tech/FixHub`  
**Current Main Commit Baseline**: `1ded0fbe89c6a43fb03c6d61371a6570b38d62b1`  
**Parent Brand**: Viswatra  
**Launch Market Target**: Tanuku, Andhra Pradesh (State Code 37)  
**Governing Policy**: [AGENTS.md](../../AGENTS.md) & [product-foundation-work-authority.md](../governance/product-foundation-work-authority.md)

---

## 1. External Immutable Git Bundles

All full-history backups are verified with `git fsck` and stored in external immutable storage.

| Bundle File Name | Source Commit SHA | Checksum (SHA-256) | Verification Status | Storage Location | Retention Rationale |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `fixhub-baseline-b34ea99a30665ec0de010d98d4e2bf0047eb01c9.bundle` | `b34ea99a30665ec0de010d98d4e2bf0047eb01c9` | `CB0EB1BB3AF40E38FAC466D804E327B9146902096DD20C18B570CE25CB3EC31B` | `git fsck` VERIFIED (0 errors) | `C:\Users\Admin\Desktop\fixhub-backups\` | Clean pre-migration baseline preservation |
| `fixhub-integrated-3f058fa07c568494aa594284aa7bc40ff4802585.bundle` | `3f058fa07c568494aa594284aa7bc40ff4802585` | `D0BED5F57819AE2BF1D7EDDA5889E3E3C8F3BD5C1F20E53536EB5D13A4E6ED54` | `git fsck` VERIFIED (0 errors) | `C:\Users\Admin\Desktop\fixhub-backups\` | Integration baseline with full test suites and matrices |

---

## 2. Canonical Specification Documents Tracked in Repository

The 5 authoritative specifications are tracked directly under `docs/specs/` to guarantee permanent repository-relative availability, immutability, and checksum verification.

| Canonical Document Name | Relative Repository Path | Checksum (SHA-256) | Retention Policy | Status |
| :--- | :--- | :--- | :--- | :---: |
| `FixHub-Autonomous-Goal.md` | `docs/specs/FixHub-Autonomous-Goal.md` | `514380767025A1A18D12338225AF331A420AAC11E1AD840A19514F38C990E298` | Permanent Canonical Reference | Tracked & Verified |
| `FixHub-Engineering-Standards.md` | `docs/specs/FixHub-Engineering-Standards.md` | `FCC1760BC72D38221EBB153538CEB35DB9040D0E8DBB952985000C9D4666ED55` | Permanent Canonical Reference | Tracked & Verified |
| `FixHub-Product-Spec-v1.3.md` | `docs/specs/FixHub-Product-Spec-v1.3.md` | `F549D93B52E1EB8A08CC1426F6B4244DA4C9A4EE569DE9D7031316923DEBC52D` | Permanent Canonical Reference | Tracked & Verified |
| `Viswatra-Global-Engineering-Completion-Program-v1.1.md` | `docs/specs/Viswatra-Global-Engineering-Completion-Program-v1.1.md` | `9421280DAC8D38DACCD26378D378A862751F7DCC9BB0D8392A408CB50A1F90EC` | Permanent Canonical Reference | Tracked & Verified |
| `Viswatra-Global-Engineering-Quality-Standard-v1.1.md` | `docs/specs/Viswatra-Global-Engineering-Quality-Standard-v1.1.md` | `429B54C2003D8E5BF4A2949507F5A8A2C5284820F6588C4B1E3266FE18112066` | Permanent Canonical Reference | Tracked & Verified |

---

## 3. Historical Planning, Governance, and Decision Registers

Historical planning documents and decision records remain preserved in Git history and active governance trees without modification or historical deletion.

| Asset | Path | Role / Disposition |
| :--- | :--- | :--- |
| **Reconstructed Roadmap V4.1** | `docs/product/roadmap/reconstructed-v4.1.md` | Governing future planning; approved 2026-10-15 |
| **Phase 00 Final Closure** | `docs/reviews/phase-00-final-closure.md` | Published & closed planning at commit `ff6425a` |
| **Solo-Maintainer Policy** | `docs/governance/solo-maintainer-policy.md` | Enforces single-maintainer merge accountability |
| **Work Authority Scope** | `docs/governance/product-foundation-work-authority.md` | Explicit authority for Phases 01-05 preparation |
| **Phase 01 Feasibility Exit** | `docs/product/feasibility/exit-criteria.md` | Finite Phase 01 criteria & evidence gaps |
| **Decisions Register (D01-D20)** | `docs/architecture/decisions/` | Stable ADR IDs (D01-D20) preserved |
| **Risk Register** | `RISK_REGISTER.md` | Stable risk IDs (RSK-01 through RSK-12) |
| **Blocker Register** | `blocker.txt` | Single authoritative register for owner-actionable blockers |

---

## 4. Git Branch Disposition Policy

Per Viswatra engineering standards and the 20 October 2026 Codebase Review, historical branches must **not** be deleted merely to create an illusion of cleanliness. All historical branches represent immutable commit provenance and development history.

| Branch Category | Examples | Disposition |
| :--- | :--- | :--- |
| **Protected Production Baseline** | `main`, `ready-for-main` | Synchronized at commit `1ded0fb`; gated by CI and PR review |
| **Historical Feature Branches** | `feature/fixhub-local-demo`, `feature/fixhub-api-foundation`, `feature/fixhub-marketplace-integration` | Preserved in remote tracking (`remotes/origin/*`) for historical commit lineage |
| **Historical Fix Branches** | `fix/demo-cod-payment-disclosure`, `fix/demo-gps-storage-consent`, `fix/demo-pricing-and-eligible-offers` | Preserved as merged feature lineage |
| **Phase Research Branches** | `phase-01/feasibility-research`, `phase-01/remove-interview-exit-criteria` | Preserved as Phase 01 research evidence |
| **Documentation Branches** | `docs/api-runtime-resend-feasibility`, `docs/audit-settings-evidence`, `docs/phase-00-final-closure` | Preserved as documentation review records |

---

## 5. Database Schema & Migration Lineage

The database evolution contains two historical streams that are reconciled in Decision D18:

1. **`database/migrations/001_initial_schema.sql`**: Canonical comprehensive PostgreSQL 16 + PostGIS schema designed for the Tanuku production launch, including:
   - `users` (phone-first identity, role check constraint)
   - `merchants` (spatial point location, categories, coverage zones)
   - `technicians` (merchant-linked, skills)
   - `bookings` (canonical lifecycle, atomic first-wins state machine)
   - `service_categories` & `service_catalog`
   - `tracking_pings` (GPS audit trail)
   - `reviews` & `disputes`
   - `transactions` (COD Cash-on-Completion records)
   - `audit_logs` (tamper-evident audit trail)

2. **`api/migrations/001_identity.sql` through `008_support_requests.sql`**: Incremental migration stream developed during earlier local prototyping.
3. **Reconciliation (ADR D18)**: Unified canonical migrations residing in `database/migrations/` governing both local testing, staging, and production. Volatile in-memory maps in authentication are replaced with the durable schema.

---

## 6. Verification Commands & Evidence

To re-verify bundle and file integrity at any time:

```bash
# Verify baseline bundle integrity
git bundle verify C:\Users\Admin\Desktop\fixhub-backups\fixhub-baseline-b34ea99a30665ec0de010d98d4e2bf0047eb01c9.bundle

# Verify integrated bundle integrity
git bundle verify C:\Users\Admin\Desktop\fixhub-backups\fixhub-integrated-3f058fa07c568494aa594284aa7bc40ff4802585.bundle

# Verify SHA-256 checksums of canonical specifications
Get-FileHash docs/specs/* -Algorithm SHA256
```
