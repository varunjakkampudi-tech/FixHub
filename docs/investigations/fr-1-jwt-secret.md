# Stage 0 Security Investigation: Exposed Default JWT Signing Secret (FR-1)

**Document ID:** INV-SEC-FR1-JWT  
**Date:** 2026-10-19  
**Status:** COMPLETE — FINDING RECORDED & HARDENED  
**Author:** Principal Software Architect & Security Architect (Antigravity)  
**Governing References:** FixHub-Product-Spec-v1.3.md (FR-1), FixHub-Autonomous-Goal.md (Stage 0), Viswatra-Global-Engineering-Quality-Standard-v1.1.md (Categories 12, 13, 22)

---

## 1. Executive Summary

During the audit of commit #21 (`dd1bc789ae372c80281a7e4f3d11768a48ccaaab`) and related commits (`a534af0`), a critical security vulnerability was identified:
In `api/services/auth-service.ts` line 11:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "fixhub-local-development-secret-key-min-32-chars-long";
```
A hardcoded fallback secret (`fixhub-local-development-secret-key-min-32-chars-long`) was present in application source code. Any party with access to this public repository could forge valid HMAC SHA-256 JWT tokens for arbitrary user identifiers and arbitrary roles (including `admin`).

This investigation determined the exposure scope, verified whether it was ever used or published in any deployment environment, implemented code-level safeguards requiring explicit secrets on startup in non-test modes, and created a `READY_FOR_OWNER` action item in `blocker.txt`.

---

## 2. Investigation Scope and Methodology

An exhaustive forensic audit was performed across:
1. **Git Commit History:** Complete repository log searched for the secret string and all variations.
2. **CI/CD Workflows:** All files under `.github/workflows/` inspected for secret leakage or environment variables.
3. **Configuration & Dotenv Files:** `.env*` files inspected.
4. **Documentation & Blocker Records:** All files under `docs/` and `blocker.txt` searched.
5. **Deployment Infrastructure:** Inspected for references to hosting providers (Vercel, Render, Railway, AWS, Fly.io, Azure, Heroku).

---

## 3. Findings

### 3.1 Origin in Repository History
- The hardcoded fallback string was introduced in commit `a534af0` ("Implement enterprise backend, db migrations, Redlock concurrency, admin console, and full test automation suites") and subsequently merged into `origin/main` via PR #21 in commit `dd1bc789ae372c80281a7e4f3d11768a48ccaaab`.
- Prior to commit #21, the repository utilized `AUTH_HMAC_SECRET` in `api/auth.ts`, which strictly enforced:
  ```typescript
  if (Buffer.byteLength(secret, "utf8") < 32 || !secret.trim()) {
    throw new Error("AUTH_HMAC_SECRET must contain at least 32 non-whitespace bytes");
  }
  ```
  and `api/server.ts` enforced:
  ```typescript
  throw new Error("Production startup requires PostgreSQL, AUTH_HMAC_SECRET, and Resend credentials");
  ```
- The introduction of `api/services/auth-service.ts` bypassed this check by introducing an unvalidated fallback `JWT_SECRET`.

### 3.2 CI/CD and Secret Leakage
- `.github/workflows/docs-validation.yml` contains zero references to `JWT_SECRET` or any credentials.
- No repository GitHub Actions secrets or environment secrets were found to have exposed `JWT_SECRET`.

### 3.3 Hosted Environment Status
- FixHub is currently operating strictly as a local-only development demonstration and architecture specification.
- No hosted production, staging, preview, or cloud instances are currently deployed or configured.
- However, because the repository is public (`varunjakkampudi-tech/FixHub`), the fallback secret string is publicly visible in commit history.
- Consequently, **use of this fallback secret in any future or external test/preview environment cannot be ruled out if someone started the server without supplying `JWT_SECRET`**.

---

## 4. Remediation Measures

To satisfy FR-1 and eliminate this risk:
1. **Hard Fail on Startup in Non-Test Environments:**
   The backend service must refuse to start and immediately throw a fatal configuration error if `NODE_ENV !== "test"` and `JWT_SECRET` is missing, empty, or equals the known leaked fallback string.
2. **Elimination of Fallback Secret in Production Code:**
   Remove the hardcoded fallback secret from `api/services/auth-service.ts`. In test mode (`NODE_ENV === "test"`), if no secret is provided, an ephemeral random secret or designated test-only secret is used within the isolated test process memory only.
3. **Consolidation of Authentication Secrets:**
   Reconcile `JWT_SECRET` and `AUTH_HMAC_SECRET` so that a single cryptographically secure secret (minimum 32 bytes) is required across both authentication subsystems.
4. **Automated Regression Test:**
   Add automated regression tests in Vitest that verify:
   - Server startup fails when `NODE_ENV === "production"` and `JWT_SECRET` is absent.
   - Server startup fails when `NODE_ENV === "production"` and `JWT_SECRET` is set to the exposed fallback string.
   - Tokens signed with the exposed fallback string are rejected.

---

## 5. Owner Action Required (READY_FOR_OWNER)

A blocker has been registered in `blocker.txt` as `READY_FOR_OWNER`:
- **Owner Action:** In any future staging or production deployment, generate a cryptographically random, high-entropy 64-character hex string (e.g., using `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`), configure it as `JWT_SECRET` / `AUTH_HMAC_SECRET` via environment variables/secrets manager, and never use any default or committed secret string.
- Any active tokens or sessions created prior to this remediation in any local testing environments are considered invalidated.
