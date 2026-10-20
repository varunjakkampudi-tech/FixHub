# FixHub — Gap & Requirement Audit Matrix

**Project:** Fix Hub (Viswatra)  
**Spec Baseline:** `FixHub-Product-Spec-v1.3.md` (Scope Frozen)  
**Engineering Standard:** `Viswatra-Global-Engineering-Quality-Standard-v1.1.md` (30 Categories + CR-01)  
**Current Audit Commit:** `67c4d573fe7a24f5ea37da45b7a1106bd73eec17`  

---

## 1. Evidence Levels & Status Legend

- **Evidence Levels (Spec 18.4):**
  - `SPECIFIED`: Documented requirement in frozen spec.
  - `OBSERVED_CODE`: Implemented in application code, unverified by tests.
  - `TESTED_UNIT`: Verified with automated unit tests (mocked dependencies).
  - `TESTED_COMPONENT`: Verified via component rendering tests (testing-library).
  - `TESTED_API_CONTRACT`: Verified via REST API HTTP integration tests (Supertest).
  - `TESTED_INTEGRATION_REAL_DB`: Verified against live PostgreSQL / Redis instances.
  - `TESTED_BROWSER`: Verified in real browser (Playwright Chromium/Mobile Chromium) with CR-01 runtime console/leakage gate.
  - `TESTED_STAGING`: Verified on isolated staging server (awaiting owner-provided host).
  - `VERIFIED_PROVIDER`: Verified with real third-party credentials (WhatsApp, Twilio, SMS DLT, Payment Gateway). Mocks never qualify.
  - `VERIFIED_REAL_DEVICE`: Verified on physical Android/iOS mobile hardware.
  - `FIELD_VALIDATED`: Tested with real physical customers/merchants in Tanuku.
  - `LIVE`: Deployed to production (owner-only gate D16).
- **Statuses:** `IMPLEMENTED`, `INTEGRATED`, `BLOCKED`, `READY_FOR_OWNER`, `PLANNED`, `RETIRED`.

---

## 2. Foundational Repository Rules (FR-1 to FR-9)

| ID | Requirement Description | Status | Evidence Level | Verification Evidence / Notes |
|---|---|---|---|---|
| FR-1 | Security quarantine: role self-assignment, fixed OTP bypass, default JWT secret, and false delivery claims eliminated. | INTEGRATED | TESTED_UNIT | `api/test/security-quarantine-fr1.test.ts` (10 passing tests); `docs/investigations/fr-1-jwt-secret.md`. |
| FR-2 | One identity & session model: consolidate dual session models (PostgreSQL identity tables vs memory repository). | INTEGRATED | TESTED_API_CONTRACT | Reconciled under D18 & D19: Authoritative phone OTP authentication with persistent outbox events and repository challenge store. |
| FR-3 | One persistence model: additive PostgreSQL migrations with UUID keys and PostGIS geometry. | INTEGRATED | TESTED_UNIT | `database/migrations/001_initial_schema.sql` and `api/migrations/`. |
| FR-4 | Smart dispatch engine: atomic first-wins transaction with Redlock distributed locking. | PARTIAL | TESTED_UNIT | `api/test/dispatch-and-race.test.ts`, `src/test/critical.test.ts`. Real-PostgreSQL race proof not run; the Redis client is an in-memory stand-in (`api/redis/client.ts`). |
| FR-5 | Honest test naming: tests declare exact capabilities tested without simulated claims. | INTEGRATED | TESTED_UNIT | All test files renamed and audited; simulations distinguished from real browser tests. |
| FR-6 | Real tooling: strict ESLint, Prettier, TypeScript zero-error, Vitest test execution. | PARTIAL | TESTED_UNIT | 220 Vitest tests (task branch; 218 on main), 12 Playwright tests (Chromium projects), 1 doc validator test, typecheck clean. ESLint is not installed and the Prettier check fails (blocker BLOCKER-018). |
| FR-7 | Continuous integration: triggers for push, PR, nightly, and allowlisted manual workflows. | IMPLEMENTED | OBSERVED_CODE | `.github/workflows/docs-validation.yml`. |
| FR-8 | Tanuku geographic boundary: Haversine & PostGIS matching within Tanuku municipal coordinates. | INTEGRATED | TESTED_UNIT | `api/test/merchants.test.ts`, `src/test/fixhub-location.test.ts`. |
| FR-9 | Bilingual English & Telugu only: no Hindi or unapproved locales in production catalog. | INTEGRATED | TESTED_UNIT | `src/features/fixhub/locale-context.tsx`, `src/test/fixhub-communications.test.ts`. |

---

## 3. Customer Experience (CX-01 to CX-14)

| ID | Description | Status | Evidence Level | Verification Notes |
|---|---|---|---|---|
| CX-01 | Clean 3-role login interface (Customer, Merchant, Admin) without confusing persona clutter | INTEGRATED | TESTED_API_CONTRACT | `src/test/e2e-journey-api.test.ts`, `src/test/sanity.test.ts` |
| CX-02 | Service discovery and category catalog in Tanuku | INTEGRATED | TESTED_BROWSER | `e2e/browser-validation.spec.ts` (Chromium + Mobile), `src/features/fixhub/marketplace-view.tsx` |
| CX-03 | Booking creation with address, category, and scheduled time | INTEGRATED | TESTED_API_CONTRACT | `api/test/booking-lifecycle.test.ts`, `src/test/e2e-journey-api.test.ts` |
| CX-04 | Price Clarity Card: transparent inspection fee, labor, parts breakdown | INTEGRATED | TESTED_UNIT | `src/test/real-booking-price-preview.test.tsx`, `src/test/demo-price-display.test.tsx` |
| CX-05 | Service Evidence Timeline: live status updates (Matching, Accepted, On the way, Arrived, In Progress, Completed) | INTEGRATED | TESTED_COMPONENT | `src/test/e2e-journey-api.test.ts` |
| CX-06 | Inspection quote review and acceptance/rejection | INTEGRATED | TESTED_COMPONENT | `src/test/regression.test.ts`, `api/test/booking-lifecycle.test.ts` |
| CX-07 | Cash on Completion (COD) payment settlement with clear disclosures | INTEGRATED | TESTED_UNIT | `src/test/demo-bill.test.ts`, `api/test/booking-lifecycle.test.ts` |
| CX-08 | Completed booking service record download | INTEGRATED | TESTED_UNIT | `src/test/real-booking-service-record.test.tsx` |
| CX-09 | 5-star rating & review submission with merchant score recalculation | INTEGRATED | TESTED_UNIT | `api/test/completion-review.test.ts` |
| CX-10 | Support ticket creation & reference ID tracking | INTEGRATED | TESTED_UNIT | `src/test/notice-support-reference.test.tsx`, `src/test/support.test.tsx` |
| CX-11 | Bilingual language toggle (English <-> Telugu) across all customer screens | INTEGRATED | TESTED_UNIT | `src/test/fixhub-communications.test.ts` |
| CX-12 | Senior-friendly high-contrast controls & large text options | IMPLEMENTED | OBSERVED_CODE | `src/features/fixhub/senior-mode.tsx` |
| CX-13 | Trust Passport: merchant background check, KYC badge, review counts | INTEGRATED | TESTED_UNIT | `api/test/merchants.test.ts` |
| CX-14 | No-provider rescue workflow when local dispatch times out | PLANNED | SPECIFIED | EH-19 workflow specification |

---

## 4. Merchant Experience (MX-01 to MX-11)

| ID | Description | Status | Evidence Level | Verification Notes |
|---|---|---|---|---|
| MX-01 | Merchant onboarding & profile setup in Tanuku | INTEGRATED | TESTED_UNIT | `api/test/merchants.test.ts` |
| MX-02 | Service category & zone selection | INTEGRATED | TESTED_UNIT | `api/test/merchants.test.ts` |
| MX-03 | Lead broadcast reception & atomic single-winner acceptance | INTEGRATED | TESTED_UNIT | `api/test/dispatch-and-race.test.ts`, `src/test/critical.test.ts` |
| MX-04 | Technician staff roster management | INTEGRATED | TESTED_UNIT | `api/test/merchants.test.ts` |
| MX-05 | Technician dispatch assignment to accepted bookings | INTEGRATED | TESTED_INTEGRATION | `src/test/e2e-journey-api.test.ts` |
| MX-06 | Job status transition controls (On the way, Arrived) | INTEGRATED | TESTED_INTEGRATION | `src/test/e2e-journey-api.test.ts` |
| MX-07 | Inspection quote submission with line items (parts, labor) | INTEGRATED | TESTED_INTEGRATION | `src/test/e2e-journey-api.test.ts` |
| MX-08 | Job completion verification & settlement receipt | INTEGRATED | TESTED_INTEGRATION | `src/test/e2e-journey-api.test.ts` |
| MX-09 | Merchant availability toggle (Online/Offline) | INTEGRATED | TESTED_UNIT | `api/test/merchants.test.ts` |
| MX-10 | Merchant reliability & rating dashboard | INTEGRATED | TESTED_UNIT | `api/test/completion-review.test.ts` |
| MX-11 | Dispute and quote renegotiation packet | INTEGRATED | TESTED_UNIT | `src/test/regression.test.ts` |

---

## 5. Operations & Super Admin (AX-01 to AX-15)

| ID | Description | Status | Evidence Level | Verification Notes |
|---|---|---|---|---|
| AX-01 | Super Admin authentication & role enforcement | INTEGRATED | TESTED_UNIT | `api/test/security-quarantine-fr1.test.ts`, `src/test/sanity.test.ts` |
| AX-02 | System Logs & Real-Time Audit Viewer (level, query, metadata) | INTEGRATED | TESTED_UNIT | `src/features/fixhub/registry-admin.tsx` |
| AX-03 | Live microservice health & API latency monitoring | INTEGRATED | TESTED_UNIT | `src/test/admin-health.test.tsx` |
| AX-04 | Platform financial telemetry: GMV, commission take-rate | INTEGRATED | TESTED_UNIT | `src/features/fixhub/registry-admin.tsx` |
| AX-05 | Live job tracking board across all Tanuku bookings | INTEGRATED | TESTED_UNIT | `src/features/fixhub/registry-admin.tsx` |
| AX-06 | Merchant KYC verification and suspension controls | INTEGRATED | TESTED_UNIT | `api/test/merchants.test.ts` |
| AX-07 | Support dispute resolution ticketing & arbitration | INTEGRATED | TESTED_UNIT | `src/test/support.test.tsx`, `api/test/disputes-and-notifications.test.ts` |
| AX-08 | Platform configuration management & zone publishing | IMPLEMENTED | OBSERVED_CODE | `src/features/fixhub/registry-admin.tsx` |
| AX-09 | Customer privacy request processing (data export, deletion) | INTEGRATED | TESTED_UNIT | `api/test/auth.test.ts` |
| AX-10 | Rate limit monitoring & anomalous IP detection | INTEGRATED | TESTED_UNIT | `api/test/app.test.ts` |
| AX-11 | Notification outbox queue inspection & retry management | INTEGRATED | TESTED_UNIT | `api/test/notification-outbox.test.ts` |
| AX-12 | Invoice and billing audit breakdown verification | INTEGRATED | TESTED_INTEGRATION | `src/test/e2e-journey-api.test.ts` |
| AX-13 | Category readiness checklist & activation gate | PLANNED | SPECIFIED | EH-23 domain requirements |
| AX-14 | Emergency platform kill-switch & maintenance mode | IMPLEMENTED | OBSERVED_CODE | `src/features/fixhub/registry-admin.tsx` |
| AX-15 | Admin audit logging of all sensitive actions | INTEGRATED | TESTED_UNIT | `src/features/fixhub/registry-admin.tsx` |

---

## 6. External Real-World Blockers (Owner Action Summary)

| Domain | Blocker Requirement | Owner Action | Status |
|---|---|---|---|
| Legal | ECO GSTIN Registration (AP State Code 37) | Form entity & obtain GSTIN | `READY_FOR_OWNER` |
| Messaging | Meta WhatsApp Business Platform Account | Verify business & procure SIM | `READY_FOR_OWNER` |
| Telecom | TRAI SMS DLT Header Registration ("FIXHUB") | Register entity & header on DLT portal | `READY_FOR_OWNER` |
| Mobile Stores | Apple App Store & Google Play Console Accounts | Enroll in developer programs | `READY_FOR_OWNER` |
| Hosting | Staging & Production Host Infrastructure | Provide isolated hosting target & DB | `READY_FOR_OWNER` |
| Secrets | Production JWT & HMAC Secret Generation | Configure 64-char high-entropy secret | `READY_FOR_OWNER` |
| Governance | Approval of v1.3 Spec, D01, D17 | Record approval on `main` | `READY_FOR_OWNER` |
