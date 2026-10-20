# FixHub — Autonomous Execution and Progress Register

**Project:** Fix Hub (Viswatra)
**Governing documents (tracked copies, checksum-verified on 2026-10-20):**
- `docs/specs/FixHub-Product-Spec-v1.3.md` — `F549D93B52E1EB8A08CC1426F6B4244DA4C9A4EE569DE9D7031316923DEBC52D`
- `docs/specs/FixHub-Engineering-Standards.md` — `FCC1760BC72D38221EBB153538CEB35DB9040D0E8DBB952985000C9D4666ED55`
- `docs/specs/FixHub-Autonomous-Goal.md` — `514380767025A1A18D12338225AF331A420AAC11E1AD840A19514F38C990E298`
- `docs/specs/Viswatra-Global-Engineering-Quality-Standard-v1.1.md` — `429B54C2003D8E5BF4A2949507F5A8A2C5284820F6588C4B1E3266FE18112066`
- `docs/specs/Viswatra-Global-Engineering-Completion-Program-v1.1.md` — `9421280DAC8D38DACCD26378D378A862751F7DCC9BB0D8392A408CB50A1F90EC`

Owner-side copies of these documents changed on 2026-10-20 during this checkpoint. They are not the tracked versions. See `blocker.txt` BLOCKER-012.

---

## 1. Governance and activation status

- **Autonomous implementation status:** `AWAITING_OWNER_APPROVAL` (Goal section 0.1; Quality Standard section 2.4).
- **Owner approval entry on main:** none (verified: `blocker.txt` contains no `OWNER-APPROVAL` entry on 2026-10-20).
- **Permitted pre-activation work** (Goal section 0.1; `docs/governance/product-foundation-work-authority.md`): read-only assessment, the verified backup, documentation, and the Stage 0 security investigation.
- **Correction to earlier text:** the earlier version of this section listed "draft matrices" and "Playwright suite" as pre-activation authority. The Playwright suite exists and passes (section 5). The matrices exist but contain unsupported claims that this checkpoint corrects (section 7).

---

## 2. Verified baseline and backup (Goal section 4.1)

- **Date:** 2026-10-20
- **Baseline commit:** `2383a109c35a1259a490db050929690db32c4bc7` (`main` = `origin/main`).
- **Working tree before this checkpoint:** clean (`git status --porcelain` was empty).
- **Branches before this checkpoint:** local `main`, local `claude/fixhub-code-review-cleanup-22b476` (this checkpoint's task branch, created by the harness), remote `main` only (verified with `git ls-remote --heads`).
- **Tags:** none.
- **Bundle:** `fixhub-baseline-2383a109c35a1259a490db050929690db32c4bc7.bundle`, stored outside the repository (location withheld).

| Step | Command | Exit | Result |
|---|---|---|---|
| Create | `git bundle create <dir>/fixhub-baseline-<SHA>.bundle --all` | 0 | Created |
| Verify | `git bundle verify <bundle>` | 0 | "The bundle records a complete history"; 8 refs |
| Checksum | `sha256sum <bundle>` | 0 | `be21b1216ca151eb7cf6e54c100978e445ae65c5b0eee7b7d5cd32aa10ca1fd0` |
| Restore clone | `git clone <bundle> <tmp>` | 0 | HEAD `2383a109…` restored; branches listed |
| Integrity | `git fsck --strict` (in the restore clone) | 0 | No errors |

The restore clone was deleted after the check. The bundle checksum is also in `docs/archive/ARCHIVE_MANIFEST.md`, section 1.

---

## 3. Stage 0 security quarantine (FR-1) — corrected status

The four commit #21 defects were remediated in code and tested. Status is **RESOLVED (unit-tested)**, not system-verified (`blocker.txt` BLOCKER-009).

1. **Role self-assignment.** The phone-OTP request schema no longer declares a `role` field (task branch). New registrations default to `customer` (`api/services/auth-service.ts`). Earlier text said roles were "authoritative database roles". The store is the in-memory `Repository`, not a database. This is corrected.
2. **Fixed code and returned code.** The constant code `123456` is used only when `NODE_ENV` is `test`. Outside test mode the code is random and is never returned in the response.
3. **Default signing secret.** `getAuthJwtSecret()` refuses to run outside test mode without a secret of at least 32 characters that is not the leaked value. See `blocker.txt` BLOCKER-002 for rotation.
4. **False delivery claim.** The message says the code was dispatched to the outbox, not that it was sent.
5. **Additional fixes on the task branch:**
   - Token signatures are compared with `crypto.timingSafeEqual` (`api/services/auth-service.ts`).
   - Fictional admin and merchant accounts are seeded only in test mode or when `FIXHUB_LOCAL_DEMO_SEED=true` (`api/db/repository.ts`). Before this change they were seeded in every environment, including `usr-admin-001` with a published phone number (`blocker.txt` BLOCKER-023).

**Not done:** the phone-OTP path, the in-memory routers and the two sign-in paths remain mounted on main (`blocker.txt` BLOCKER-010 and BLOCKER-011).

---

## 4. Audit findings from the 20 October 2026 review — corrected status

| Earlier claim | Status after verification on 2026-10-20 |
|---|---|
| P0 real Playwright browser automation | **True.** `npm run test:playwright` passes 12 of 12 tests (desktop Chromium and Pixel 5). The web server output shows API connection refusals (`blocker.txt` BLOCKER-019). |
| P0 "duplicate authentication and persistence reconciled" | **Not true.** Two sign-in paths remain mounted, and the in-memory repository is still used at runtime (`blocker.txt` BLOCKER-010 and BLOCKER-011). |
| P1 honest test naming and evidence levels | **Partly true.** Evidence labels were lowered in some documents. Other documents still overstate. Corrected in `TEST_MATRIX.md` and `GAP_MATRIX.md` (section 7). |
| P1 Prettier formatting check | **Not true.** `npm run format:check` fails (360 files on this Windows checkout). See `blocker.txt` BLOCKER-018. |
| Comprehensive archival manifest | **Partly true.** A duplicate at the repository root contained private local paths and broken links. The root copy is removed. The `docs/archive/` copy is corrected (section 7). |
| Spec checksum tracking | **True.** All five tracked specs match the checksums recorded in the manifest (recomputed 2026-10-20). |

---

## 5. Test and verification record

Measured on 2026-10-20 with Node v22.23.2 and npm 11.19.0. Exit code 0 means success.

| Check | Command | Main (`2383a10`, before this checkpoint) | Task-branch working tree (after cleanup and security changes) |
|---|---|---|---|
| Install | `npm ci` | exit 0 | exit 0 |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | exit 0 | exit 0 |
| Unused declarations | `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` | 17 findings | 0 findings |
| Lint | `npm run lint` (custom `scripts/lint.mjs`; **not ESLint**) | exit 0; 391 files | exit 0; 362 files |
| Format | `npm run format:check` (Prettier) | not run before this checkpoint | **exit 1**; 360 files flagged (formatting commit is planned; see section 7) |
| Documentation tests | `npm run test:docs` | exit 0; 1 test | exit 0; 1 test |
| Vitest | `npx vitest run` | exit 0; 43 files; **218 tests** | exit 0; 43 files; **220 tests** |
| Build | `npm run build` | not run before | exit 0 |
| Browser | `npm run test:playwright` | not run before | exit 0; **12 tests passed** (run before the seed-guard commit; to rerun before promotion) |
| Dependency audit | `npm audit` | pending | pending |

**Final verification on the formatted task branch (2026-10-20):** typecheck 0; lint 0; format:check 0 (after excluding the validator scripts that tests read as text, see .prettierignore); test:docs 0; Vitest 0 with 220 tests; build 0. Browser: `npm run test:playwright` exited 1 with "Timed out waiting 60000ms from config.webServer" on port 5173 in this environment; the same 12 tests passed (exit 0) against a preview server on port 5175 using a temporary config outside the repository. The port 5173 failure is unexplained and recorded in blocker.txt BLOCKER-019.

**Test-count notes.** The earlier documents said "53 documentation validator tests" and "6 Playwright tests". Both were wrong. `test:docs` runs one `node:test` test whose internal assertions were not counted. The browser suite has 6 tests per project, 12 in total. Earlier totals of "283 automated tests" combined counts that are not comparable and are withdrawn.

---

## 6. Checklist for promotion (Engineering Standards section 7.3)

Status for this checkpoint:

| # | Item | Status |
|---|---|---|
| 1 | Typecheck | PASS |
| 2 | ESLint and Prettier | **FAIL/NOT INSTALLED.** ESLint is not installed. Prettier fails (BLOCKER-018). |
| 3 | Vitest and coverage thresholds | Vitest PASS. **Coverage not measured** (no coverage tool installed). |
| 4 | Real PostgreSQL integration and concurrency suites | Not run in this checkpoint. Containers not configured (BLOCKER-018). |
| 5 | Critical Playwright journeys in English and Telugu | Chromium suite PASS (12 tests). Telugu journeys not covered by the browser suite. |
| 6 | Accessibility, responsive and localization checks on changed screens | Not run in this checkpoint. |
| 7 | `npm audit`, SBOM, secret scan | `npm audit` pending. SBOM and secret scan not configured. |
| 8 | Documentation validators | PASS (`npm run test:docs`) |
| 9 | Runtime gate and leakage tests | Playwright gate present; API connection messages not allowlisted (BLOCKER-019). |
| 10 | Build | PASS |
| 11 | Feature flags off outside test mode | Partly. Fictional accounts now off outside test mode (BLOCKER-023). WhatsApp notifications default off (`.env.example`). |
| 12 | `TEST_MATRIX.md` updated | Updated in section 7. Numbers in that file were corrected. |
| 13 | Telugu key completeness | Not run. No key-completeness script exists (BLOCKER-008). |
| 14 | Log-redaction tests | Not run in this checkpoint. |

---

## 7. Checkpoint 2026-10-20 (cleanup and correction)

### 7.1 Documentation and governance (committed to `main` if the push is accepted; see 7.4)

- Removed the duplicate root `ARCHIVE_MANIFEST.md`. It contained private local filesystem paths. The corrected copy is `docs/archive/ARCHIVE_MANIFEST.md`. Its links were fixed, the database lineage claim was corrected (the canonical chain is `api/migrations/`), a dated correction note was added, and the verification commands use a placeholder.
- Removed `PORTFOLIO_ADOPTION_MATRIX.md` from the repository. It showed other products' status columns, which the Completion Program (section 1) forbids in product repositories. A copy was moved to the owner's external backup folder. Its SHA-256 is recorded in `blocker.txt` BLOCKER-014. The file's VERIFIED claims are not supported and are listed there.
- Removed the repository name from `README.md` and `docs/README.md` (CR-02). Other occurrences are listed in `blocker.txt` BLOCKER-013; the agent did not edit owner-controlled or checksum-tracked files.
- Rewrote `blocker.txt`. Corrections include: `auth_sessions` and `audit_logs` do not exist (the session table is `identity_session`); `locale-context.tsx` does not exist; the Meta/WhatsApp environment names are not read by code (the code uses Twilio); AWS and an invented staging domain were removed; and the earlier "in-memory repositories pass 100%" statement was withdrawn. New register entries: BLOCKER-010 to BLOCKER-023.
- Corrected `TEST_MATRIX.md` and `GAP_MATRIX.md`. The FR-6 claim of "strict ESLint" is not supported (ESLint is not installed). Counts were corrected to the measured values in section 5.

### 7.2 Code cleanup and hardening (task branch only; not on `main`)

These changes are on the task branch `claude/fixhub-code-review-cleanup-22b476`. Owner review is required before promotion (`blocker.txt` BLOCKER-016 and BLOCKER-017).

- **Unused declarations removed** (TypeScript `noUnusedLocals`/`noUnusedParameters` findings, all resolved):
  - Dead `Legacy*` page components in `src/features/fixhub/account.tsx`, `booking.tsx`, `public.tsx`, `workspaces.tsx`.
  - Unused imports and variables in `src/routes/__root.tsx`, `src/features/fixhub/services.tsx`, `shared.tsx`, `registry-admin.tsx`, `booking.tsx`, and an unused `crypto` import in `api/db/repository.ts` and `api/redis/client.ts`.
  - An unused `existingKey` variable in `api/services/dispatch-service.ts`.
- **Unreferenced exports removed** (no file in `api/`, `src/`, `scripts/` or `e2e/` imports them): `optionalAuthenticate` in `api/middleware/auth-middleware.ts`; `disabledTwilioProvider` in `src/features/fixhub/communications-model.ts`; `liveMapsSetup` in `src/features/fixhub/map-adapter.ts`; `hindiEnabled`, `localeResources`, `localeMetadata`, `futureLanguageOverrides` and `resolveTranslation` in `src/features/fixhub/locales.ts`. The removed locale block contained Kannada strings, which are outside the English and Telugu scope (FR-9).
- **Duplicate API client removed:** `src/lib/api-client.ts` had no importers. The features use their own `./api-client`, which is kept.
- **Unused shadcn UI components removed:** 28 files under `src/components/ui/` had no importers (list in `git show 2383a10 --stat` or the branch diff).
- **Unused dependencies removed** (`npm uninstall`; no source file imports them): 16 `@radix-ui/*` packages, `cmdk`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `recharts`, `vaul`. `react-dom` is kept (runtime dependency of the framework; no direct import).
- **Temporary QA scripts removed:** `tools/qa/fixhub_e2e.py`, `fixhub_focused.py`, `fixhub_route_audit.py`. They were one-off Python scripts with hard-coded `/tmp` paths and no references from `package.json`, CI or documentation. They remain in Git history.
- **Constant-time token comparison** in `api/services/auth-service.ts` (`crypto.timingSafeEqual`). The change is behaviour-preserving for valid tokens. A regression test checks that an altered signature is rejected. The test would pass with or without the fix, so it does not prove the timing property.
- **Ignored `role` field removed** from the phone-OTP request schema (`api/routes/auth-router.ts`). The field was already ignored by the handler.
- **Fictional accounts gated** to test mode or `FIXHUB_LOCAL_DEMO_SEED=true` (`api/db/repository.ts`, `.env.example`), with a regression test ("Defect 5").

Restore any removed file from the baseline with `git show 2383a109c35a1259a490db050929690db32c4bc7:<path>`.

### 7.3 Verification of the cleanup

See the table in section 5. All checks listed there as exit 0 passed on the task-branch working tree. The check that failed (Prettier) is the next commit's subject.

### 7.4 Publication status

- Commit for `main`: documentation only (sections 7.1 and the matching files). Attempted with a normal push (no force).
- Result: recorded in the final summary of this checkpoint and in `blocker.txt` BLOCKER-015.
- Code commits (sections 7.2 and the formatting commit) remain on the task branch and are not pushed. Per `blocker.txt` BLOCKER-015 and BLOCKER-016, code and identity changes need owner review or a pull request.
- Remote branches: only `main` exists on the remote, so there was nothing to delete there. The local task branch is kept because it holds unmerged commits.

### 7.5 Not done in this checkpoint

- Stage A to K work (ESLint, coverage, real PostgreSQL integration tests, CI trigger matrix, nightly runs, migrations, localization completion, mobile) is not started. It requires activation (`blocker.txt` BLOCKER-001).
- Formatting of the 98 files Prettier flags is planned as a separate commit on the task branch (section 7.2 and `blocker.txt` BLOCKER-018).
- No full line-by-line review of all 597 tracked files was completed. Coverage is listed in section 8.

---

## 8. Review coverage (honest)

- **Automated and tool-based checks covered all tracked source files:** typecheck, unused-declaration analysis, unreferenced-export scan, orphan-module scan, dependency import analysis, secret and private-path scans, documentation validator.
- **Manually read in full in this checkpoint:** `api/services/auth-service.ts`, `api/routes/auth-router.ts`, `api/app.ts` (route mounts), `api/db/repository.ts` (seeding), `blocker.txt` (full), `docs/archive/ARCHIVE_MANIFEST.md` (full), `README.md` (full), `PROGRESS.md` (full), and the owner-side specification diffs.
- **Not manually read:** the remaining source and test files, the 148 documents under `docs/`, and the generated route tree. The planned full review is part of BLOCKER-018 and BLOCKER-021.
