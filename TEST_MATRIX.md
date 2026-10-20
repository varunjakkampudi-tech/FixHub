# FixHub — Automated & Manual Test Matrix (QA-01 to QA-34)

**Project:** Fix Hub (Viswatra)  
**Baseline for this checkpoint:** main at `2383a109c35a1259a490db050929690db32c4bc7` (measured 2026-10-20)  
**Total Vitest Suites:** 43 test files; 218 tests on main and 220 on the task branch; all passing on 2026-10-20  
**Total Real Browser Playwright Tests:** 12 (6 per project: Desktop Chromium and Pixel 5); all passed on 2026-10-20  
**Documentation validator:** one `node:test` test (`npm run test:docs`), passing. An earlier figure of 53 was not a test count and is withdrawn.  
**TypeScript Type Check:** 0 Errors (`npx tsc --noEmit`)  
**Lint Suite:** 362 files scanned on the task branch (391 on main), 0 findings. This is a custom script, not ESLint.  
**Formatting Check:** FAIL (`npm run format:check`; 360 files flagged on the Windows checkout; see blocker.txt BLOCKER-018)  

---

## 1. Test Suite Execution Summary

| Suite Script | Target Focus | Test Files | Tests | Result | Evidence Level | Execution Time |
|---|---|---|---|---|---|---|
| `npm run lint` | Custom lint: syntax, security and secret-pattern checks (not ESLint) | 362 files (task branch) | N/A | **PASS** | LINT_STATIC | not re-timed |
| `npm run format:check` | Prettier code style (not installed as a declared dependency) | 360 files flagged | N/A | **FAIL** | FORMAT_STATIC | not re-timed |
| `npm test` | All Vitest unit, component, API suites | 43 files | 220 (task branch); 218 (main) | **PASS** | TESTED_UNIT / INTEGRATION | not re-timed |
| `npm run test:docs` | Documentation & requirement integrity (validator regression) | 1 file | 1 | **PASS** | DOC_INTEGRITY | not re-timed |
| `npm run test:smoke` | API health, OpenAPI Swagger, security headers | 1 file | 3 | **PASS** | TESTED_API_CONTRACT | 1.8s |
| `npm run test:sanity` | 3-Role OTP auth, merchant catalog discovery | 1 file | 2 | **PASS** | TESTED_API_CONTRACT | 2.1s |
| `npm run test:critical` | Atomic Redlock concurrency, role isolation | 1 file | 3 | **PASS** | TESTED_UNIT | 2.4s |
| `npm run test:regression` | Dispute lifecycle, quote renegotiation, payload boundaries | 1 file | 3 | **PASS** | TESTED_API_CONTRACT | 2.2s |
| `npm run test:journey` | Full multi-role REST API journey simulation | 1 file | 1 | **PASS** | TESTED_API_CONTRACT | 2.5s |
| `npm run test:playwright` | Real Playwright browser automation (Chromium + Mobile) | 1 file | 12 | **PASS** | TESTED_BROWSER | not re-timed; web server logged API connection refusals (BLOCKER-019) |
| `npm run test:security` | Security quarantine & defect regression (FR-1) | 1 file | 12 (task branch); 10 (main) | **PASS** | TESTED_UNIT_SECURITY | not re-timed |
| `npm run test:all` | Comprehensive quality pipeline | not re-run in this checkpoint | not measured | NOT_RUN | COMPREHENSIVE_PIPELINE | n/a |

---

## 2. QA-01 to QA-34 Specification Traceability

| ID | Quality Gate / Focus Area | Test File / Command | Evidence Level | Result |
|---|---|---|---|---|
| QA-01 | Baseline health, liveness & readiness probes | `api/test/app.test.ts`, `src/test/smoke.test.ts` | TESTED_UNIT | PASS |
| QA-02 | Role-based authentication & session isolation | `api/test/auth.test.ts`, `src/test/real-auth.test.tsx` | TESTED_UNIT | PASS |
| QA-03 | Security quarantine & defect regression (FR-1) | `api/test/security-quarantine-fr1.test.ts` | TESTED_UNIT_SECURITY | PASS |
| QA-04 | Atomic single-winner dispatch & Redlock concurrency | `api/test/dispatch-and-race.test.ts`, `src/test/critical.test.ts` | TESTED_UNIT | PASS |
| QA-05 | Service catalog, merchant zones & spatial filtering | `api/test/merchants.test.ts`, `src/test/fixhub-location.test.ts` | TESTED_UNIT | PASS |
| QA-06 | Booking state machine & quote adjustment | `api/test/booking-lifecycle.test.ts`, `src/test/regression.test.ts` | TESTED_UNIT | PASS |
| QA-07 | Cash on Completion (COD) disclosure & settlement | `src/test/demo-bill.test.ts`, `src/test/real-booking-price-preview.test.tsx` | TESTED_UNIT | PASS |
| QA-08 | Completed booking service record download | `src/test/real-booking-service-record.test.tsx` | TESTED_UNIT | PASS |
| QA-09 | 5-Star customer ratings & dynamic score update | `api/test/completion-review.test.ts` | TESTED_UNIT | PASS |
| QA-10 | Support ticket dispute resolution | `src/test/support.test.tsx`, `api/test/disputes-and-notifications.test.ts` | TESTED_UNIT | PASS |
| QA-11 | Bilingual English & Telugu communication strings | `src/test/fixhub-communications.test.ts` | TESTED_UNIT | PASS |
| QA-12 | Database migrations schema validation | `api/test/migrations.test.ts`, `api/test/database.test.ts` | TESTED_UNIT | PASS |
| QA-13 | Notification outbox delivery & retry resilience | `api/test/notification-outbox.test.ts` | TESTED_UNIT | PASS |
| QA-14 | Twilio & messaging adapter interfaces | `api/test/twilio.test.ts` | TESTED_UNIT | PASS |
| QA-15 | WhatsApp contact verification & encryption keys | `api/test/whatsapp-contact.test.ts` | TESTED_UNIT | PASS |
| QA-16 | Multi-role user journey API simulation | `src/test/e2e-journey-api.test.ts` | TESTED_API_CONTRACT | PASS |
| QA-17 | Senior-friendly high-contrast UI controls | `src/test/fixhub-hardening.test.ts` | TESTED_UNIT | PASS |
| QA-18 | Address coordinates normalization & boundary check | `api/test/address-coordinates.test.ts` | TESTED_UNIT | PASS |
| QA-19 | Redis distributed lock acquisition & TTL safety | `api/test/redis-lock.test.ts` | TESTED_UNIT | PASS |
| QA-20 | Super Admin audit logs & real-time telemetry | `src/features/fixhub/registry-admin.tsx` | TESTED_UNIT | PASS |
| QA-21 | Sensitive data leakage prevention in logs | `api/test/auth.test.ts` | TESTED_UNIT | PASS |
| QA-22 | Client bundle secret scanning & zero plaintext secrets | `scripts/lint.mjs` | TESTED_UNIT | PASS |
| QA-23 | Real browser console error gate (CR-01) | `e2e/browser-validation.spec.ts` (Chromium) | TESTED_BROWSER | PASS |
| QA-24 | Responsive viewport checks (Mobile & Desktop) | `e2e/browser-validation.spec.ts` (Pixel 5 & Desktop) | TESTED_BROWSER | PASS |
| QA-25 | Negative control security testing | `api/test/security-quarantine-fr1.test.ts` | TESTED_UNIT_SECURITY | PASS |
| QA-26 | Outbox transactional consistency | `api/test/notification-outbox.test.ts` | TESTED_UNIT | PASS |
| QA-27 | API rate limiting & DoS defense | `api/test/app.test.ts` | TESTED_UNIT | PASS |
| QA-28 | Cross-origin resource sharing (CORS) enforcement | `api/test/app.test.ts` | TESTED_UNIT | PASS |
| QA-29 | Documentation & ID integrity validation | `scripts/documentation-validator.test.mjs` | DOC_INTEGRITY | PASS |
| QA-30 | Live PostgreSQL integration testing | Docker / dedicated PostgreSQL 16+ PostGIS host | TESTED_INTEGRATION_REAL_DB | READY_FOR_OWNER (BLOCKER-007) |
| QA-31 | Third-party provider production live testing | Twilio / Meta WhatsApp production APIs | VERIFIED_PROVIDER | BLOCKED (D05 / BLOCKER-004) |
| QA-32 | Real mobile physical device testing | Physical Android/iOS hardware in Tanuku | VERIFIED_REAL_DEVICE | BLOCKED (D06 / BLOCKER-006) |
| QA-33 | Field pilot with real merchants & customers | Tanuku physical market pilot | FIELD_VALIDATED | BLOCKED (G25 / Launch Gate) |
| QA-34 | Staging environment deployment validation | Isolated staging server | TESTED_STAGING | BLOCKED (BLOCKER-007) |
