# Fix Hub — Engineering Standards

Company: Viswatra
Product: Fix Hub — local services discovery, booking, dispatch, and fulfilment (Tanuku first; English and Telugu)
Status: Aligned with spec v1.3. Applies to autonomous work only after the Autonomous Build Goal's Section 0.1 prerequisites are satisfied and verified. Product behaviour comes only from FixHub-Product-Spec-v1.3.md. This file covers how the code is built, tested, secured, and shipped.
Baseline: repository `varunjakkampudi-tech/FixHub`, `main` at commit `dd1bc789ae372c80281a7e4f3d11768a48ccaaab` (19 October 2026). Facts marked OBSERVED were read from that commit; nothing here certifies they work.
Applies to: every change, by a person or an AI agent.
Global standard: the frozen Viswatra Global Engineering and Quality Standard v1.1 (`Viswatra-Global-Engineering-Quality-Standard-v1.1.md`), including approved change request CR-01, also applies. Where it and this file differ, the stricter rule wins; it adds no product functionality beyond spec v1.3 (section 7.1a and spec section 19).

---

## 1. Stack

### 1.1 Observed (preserve)

| Layer | Observed | Rule |
|---|---|---|
| Language | TypeScript (`tsconfig.json`, `npm run typecheck`) | Keep strict typing; no new `any` without a reason |
| Web | React 19, Vite, TanStack Router and Start, Radix and shadcn-style components, Tailwind, TanStack Query, react-hook-form, zod | Keep; ~214 route files are a starting inventory, not acceptance |
| API | Express 5 (`api/`), helmet, CORS allowlist, express-rate-limit, pino logging, zod validation, OpenAPI at `/docs` | Keep one API application |
| Database | PostgreSQL via `pg`; migration runner `api/migrations.ts` applying `api/migrations/001`–`008` | Canonical chain (spec FR-3). Never edit applied migrations |
| Outbox | Notification outbox with leases and provider attempts (migrations 006, 007) | Canonical outbox; commit #21's in-memory outbox is not |
| Messaging | Twilio WhatsApp adapter with Content SID templates; disabled by default | Provider choice is owner decision D05 |
| Tests | Vitest, Testing Library, Supertest; named smoke, sanity, critical, regression suites; documentation and contract validators | Keep and correct names (spec FR-5) |
| CI | `docs-validation.yml`: push and pull request to `main`; tests, typecheck, build, `npm audit`, validators | Extend (section 7) |
| Node | `>=22.12.0`; CI uses Node 22 | Keep aligned |

### 1.2 Not real yet (OBSERVED gaps)

- No Redis client: `api/redis/client.ts` is an in-memory stand-in
- No ESLint or Prettier installed despite config files; `npm run lint` is a custom script
- No Playwright installed; `test:playwright` is Supertest under Vitest
- No PostGIS in the canonical migration chain; PostGIS appears only in the unapplied `database/migrations/001_initial_schema.sql`
- No coverage measurement, secret scanning, or SBOM
- Android and iOS technology undecided (spec D06)

### 1.3 Proposed additions (owner approval needed where marked)

| Addition | Approval |
|---|---|
| ESLint (with typescript-eslint, react-hooks, jsx-a11y) and Prettier, installed and enforced | Agent may add (tooling only) |
| `@vitest/coverage-v8` with thresholds | Agent may add |
| Real Playwright browser tests | Agent may add |
| gitleaks (or equivalent) secret scanning and an SBOM step | Agent may add |
| PostgreSQL with PostGIS in tests (containers) | Agent may add; production PostGIS is part of D12 hosting |
| A real Redis client, only if measurements show it is needed; correctness never depends on it (spec DS-03) | Owner (D12) |
| Mobile app technology (for example React Native or Capacitor) after a compatibility proof | Owner (D06) |
| Keyed i18n catalog with ICU messages (replacing positional pairs) | Agent may add |

---

## 2. Code quality

- TypeScript strict; zero typecheck errors; no new `any`, `@ts-ignore`, or non-null assertions without a reason and issue reference
- ESLint zero errors and zero new warnings; Prettier check clean on all supported tracked formats
- Routes and handlers stay thin: zod validation at the boundary, logic in services, data access in repositories
- Parameterized SQL only; no string-built queries
- No runtime path uses the in-memory `Repository` or in-memory "Redis" outside tests (spec FR-3)
- No default secrets: the API refuses to start if a required secret (session or token signing key, provider credentials when a provider is enabled) is missing outside test mode
- The published default JWT secret from commit #21 is treated as compromised wherever it may have been used (spec FR-1): investigate its use, and where used or uncertain, rotate it, invalidate affected sessions and tokens, and review authentication activity. Rotation in any hosted environment is an owner action recorded in `blocker.txt`; deleting the default from source is not remediation
- No test or demo shortcut (fixed OTPs, returned codes, persona switches) reachable outside an explicit test or local-demo mode, and never in a build intended for staging or production
- Logs: structured pino JSON with request and correlation IDs; no OTPs, tokens, phone numbers, addresses, message bodies, photos, or documents
- Functions do one thing; files over 400 lines need a reason in the change record; no dead or commented-out code
- One active implementation per domain: duplicated flows (for example `/app` versus `/customer`, email versus phone sign-in) are reconciled, not left side by side

---

## 3. Frontend, UX, and localization

- Every screen appears in `APP_SCREEN_MATRIX.md` with role, permission, API, English and Telugu strings, states, journey, and tests (spec UX-01)
- States: loading, empty, success, error, offline, permission-denied, stale. Never show success when the backend failed
- Breakpoints: 320, 360, 390, 768, 1024, 1280, 1440, 1920 px; portrait and landscape; no horizontal clipping
- Accessibility: WCAG 2.2 AA; keyboard, touch, 200 and 400 percent zoom and reflow, reduced motion, correct `lang` attributes for Telugu, screen readers (TalkBack, VoiceOver, NVDA). Automated axe checks plus recorded manual tests
- Browsers: Chromium, Firefox, WebKit through Playwright; real Android and iOS devices where available
- Localization: keyed message IDs with ICU placeholders and plurals; no user-facing text in code; English and Telugu complete for every launch-critical string; Hindi disabled unless added to scope (spec FR-9); locale switch never resets booking, address, quote consent, or privacy state (spec L10N-02); native Telugu review for safety, money, consent, booking, cancellation, and support copy
- Formatting: Indian date and time, INR, phone normalization; server stores timezone-aware canonical values
- Senior-friendly Telugu-first mode (spec EH-05): large type, guided steps, no compulsory GPS or app install; assisted booking only after D20
- Price Clarity Card, Trust Passport, Service Evidence Timeline, and no-provider rescue (EH-01 to EH-04) never display unknown values as zero or imply checks that were not done
- Rescue, safety, and incident screens (EH-19, EH-21) show only real state in English and Telugu; emergency guidance points to 112 and never implies FixHub responds to emergencies
- Localization release rule (spec L10N-14): a missing Telugu key or placeholder text on a launch-critical screen fails CI; each native review records reviewer, date, and string version, and editing a reviewed string resets its review
- Low-end Android devices from the D22 matrix, dynamic text scaling, and long Telugu strings are tested (L10N-13); Telugu search variants and locality names come from the reviewed list (D27)
- Design: shared tokens and components; brand identity, logo, and colours remain owner decision D02 — use neutral tokens until approved; no fake providers, ratings, prices, maps, or testimonials

---

## 4. Backend, data, and marketplace correctness

### 4.1 Authorization and identity
- Deny by default for every actor, merchant, booking, and field across REST, server-sent events or websockets, media, search, exports, admin, and jobs (spec SR-02)
- Roles are granted only by authorized staff or verified workflows; a client can never choose its own role
- One identity and session model (spec FR-2); session rotation, revocation, device list; MFA and step-up for staff and Super Admin
- OTP: delivered only through an approved channel; codes never returned in API responses; rate limits and anti-enumeration; test numbers only in test mode

### 4.2 Data
- One migration chain (`api/migrations`); additive migrations; each tested for upgrade and, where feasible, rollback on a disposable database; model and schema parity checked
- Every mutable record: stable ID, actor, version for optimistic concurrency, timestamps, audit history, retention class
- PostGIS added to the canonical chain only through an additive migration once hosting supports it (D12)

### 4.3 Dispatch and booking
- Canonical request with actor-scoped, payload-bound idempotency keys (spec DS-01)
- First-wins acceptance and capacity reservation in one database transaction that re-checks offer, generation, version, and eligibility (spec DS-02, DS-03). Locks are an optimization only
- Expired, cancelled, or superseded generations cannot win; no replay revival (DS-04)
- Booking, quote, and cancellation state machines are enforced in the domain layer; admin actions cannot bypass them (SR-05)
- Quote changes invalidate previous consent; work cannot start from silence (DS-07)

### 4.4 Operations reliability and controls (spec 19.1–19.2)
- Stuck-booking detection (EH-19) is a database-driven sweeper (`SELECT … FOR UPDATE SKIP LOCKED`), idempotent and safe with several workers and with Redis down; thresholds are published configuration, not constants
- Recovery actions are normal domain commands: retry and reassignment create a new dispatch generation; changing merchant requires recorded customer confirmation unless an approved published policy covers it
- Reliability signals (EH-20) are derived only from verified events in an append-only record; corrections and appeals add entries, never edit history; they do not affect dispatch until D24
- Incident cases (EH-21) are case-scoped; suspension stops new offers only, and in-flight jobs follow the AX-02 impact assessment; incident and dispute evidence carries a legal hold that blocks deletion until released
- Configuration publishing (EH-24): versioned, effective-dated records with draft, validate, approve, publish, rollback; an impact preview lists affected open bookings; open bookings keep the version they agreed to; approver rules follow D25; every step audited
- Category activation (EH-23) is blocked by the server unless the SERVICE_CATEGORY_MATRIX.md readiness checklist for that category is complete

### 4.5 Messaging and outbox
- All external messages go through the canonical transactional outbox; at-least-once delivery with idempotent side effects; bounded retries; dead letters visible
- Delivery states keep provider accepted, sent, delivered, read, and failed separate; none implies booking assignment (CH-05)
- WhatsApp only through the approved provider with opt-in, approved templates, conversation windows, signature-verified callbacks, and replay defence (CH-04, TR-06)

---

## 5. Security standards

- No secrets in code, tests, logs, screenshots, documentation, or the public repository; secrets come from the server environment
- Secret scanning on every push, including history; any found secret is revoked
- `npm audit` and SBOM on every integration; high or critical findings block integration until fixed and independently retested. Risk exceptions follow the Viswatra Global Engineering and Quality Standard v1.1, Category 22: an independent security assessment, documented severity, exploitation conditions, affected data, compensating controls, expiry and re-evaluation dates, the owner's recorded decision and compliance confirmation in `RISK_EXCEPTIONS.md`. There is no generic waiver; an unresolved exploitable critical vulnerability is never declared production-ready; an exception never replaces legal or regulatory compliance; agents cannot create or approve exceptions
- OWASP Top 10, OWASP API Security Top 10, and OWASP Mobile Top 10 (when apps exist)
- Specific checks: role self-assignment, fixed or returned codes, default secrets (spec FR-1), IDOR on bookings, addresses, quotes, and photos, upload type and size checks and malware scanning, CSRF for cookie sessions, CSP and security headers (helmet), CORS allowlist from `FIXHUB_WEB_ORIGINS`, rate limits, webhook signatures and replay, SSRF where URLs are fetched
- Public endpoints never expose exact addresses, phone numbers, evidence images, or documents (SR-02)
- The repository is public: no personal data, private paths, or confidential material in tracked files
- Sessions and recovery (SR-09): device and session list with revocation; MFA and step-up for staff; recovery responses identical whether or not an account exists; OTP sends limited per number, device, and IP with a spend cap against SMS-pumping fraud
- Files (SR-10): private storage, short-lived signed URLs issued after an authorization check, content-based type detection, size limits, malware scanning before any other party can view a file (scanner per D26), KYC documents encrypted and reviewer-only
- Images: shared copies have unnecessary EXIF and GPS metadata removed. Where a dispute, fraud, or safety case legitimately needs the original, it is stored unmodified in a separate encrypted evidence store with purpose-based access, retention limits, access audit, and legal hold. Sanitizing shared copies never deletes an investigation original. Tests cover both paths and confirm shared endpoints never return originals
- Hygiene (SR-11): automated tests prove logs, traces, and CI artifacts are redacted; fork-triggered workflows get no secrets; no `pull_request_target` workflow checks out or runs pull-request code; workflow permissions are least-privilege and actions pinned to commit SHAs
- Backups and rights (SR-12): encrypted off-host backups, restore drills, scheduled expiry; restoring re-applies later deletions; export and deletion cover database, object storage, caches, search indexes, and processors
- Incidents (SR-13): runbooks for unauthorized access, data leakage, credential compromise, and fraudulent accounts, including legal reporting duties confirmed by legal review
- The four commit #21 defects stay launch blockers until fixed or disabled and independently retested

---

## 6. GitHub workflow

- Protected `main`. In normal mode, changes go through pull requests with one human approval; an agent cannot approve its own work
- Production deploy only through an owner-dispatched workflow from protected `main` with required reviewers, exact commit and artifact, migration and backup checks, post-deploy smoke, sanity, and critical tests, and tested rollback (spec section 14). No such workflow exists yet; creating one is part of G17 and its use is owner-only
- `AGENTS.md` currently directs direct-to-`main` publication. Changing that is owner decision D17
- Release protections in spec section 19.6 are proven with negative fixtures on temporary branches. The production branch guard is proven by configuration review and a guard test; the real production workflow is never dispatched by an agent, even to see it fail. A summary job treats a skipped mandatory job as a failure

Autonomous mode (when FixHub-Autonomous-Goal.md runs an agent loop and D17 is approved):
- Pull-request requirements apply as development-branch integration requirements, using the mapping in Goal section 4.2. Every applicable check runs; no threshold is reduced
- Per-change human approval is replaced by an independent review in a separate agent session (Goal section 16). If it cannot run, it is never claimed; the limitation is recorded in `blocker.txt`
- The agent never pushes to `main`, never dispatches a production workflow, and never changes production configuration
- Owner review before promotion is required for: identity, sessions, and roles; authorization; migrations; dispatch and capacity transactions; quotes and consent; messaging and the outbox; privacy, retention, and deletion; admin config publishing

---

## 7. Testing and definition of done

### 7.1 Test levels

| Level | Covers | When |
|---|---|---|
| Unit | Domain rules, state machines, validators, i18n formatting | Every commit |
| API integration | Routes with real PostgreSQL (and PostGIS once added) in containers | Every integration |
| Authorization | Cross-actor, cross-merchant, technician-scope, admin denial on every protected route | Every integration |
| Concurrency | Multiple workers racing acceptance and capacity against real PostgreSQL (spec G06) | Every integration touching dispatch; nightly |
| Migration | Upgrade on a disposable database; parity; rollback where feasible | Every integration touching schema; nightly |
| Smoke and sanity | Health, sign-in with test channel, one booking path | Every integration and every staging deployment |
| Critical path | J03, J07, J08 core flows | Every integration (Chromium); all browsers nightly |
| End-to-end (real Playwright) | Journeys J01–J20 for the active scope, English and Telugu | Critical subset every integration; full nightly and before promotion |
| Accessibility | axe in Playwright plus recorded manual tests | Every integration (automated); each major module (manual) |
| Responsive | Section 3 breakpoints on changed screens | Every integration; all screens before promotion |
| Localization | Missing-key report, long-string layouts, Telugu search, locale switch mid-booking (L10N-10) | Every integration (keys); nightly (full) |
| Security | Section 5, scans, abuse tests | Every integration (scans); each module and before promotion (full) |
| Provider failure | Outbox replay, lost acknowledgements, rejected templates, out-of-window, delayed webhooks (CH-07, G23) | Every integration touching messaging; nightly |
| Performance and load | Measured baselines only; no invented targets (D13) | Before promotion, on a disposable environment |
| Mobile | Real-device tests once D06 is decided | Per module once apps exist |

Spec section 18.1 (QA-01 to QA-34) is the authoritative test taxonomy. The rows above schedule the most frequent categories; the remaining QA categories run as follows:

| QA category | When |
|---|---|
| QA-15 WhatsApp contracts, QA-16 notifications and outbox | Every integration touching messaging (mocks); provider evidence only after D05 |
| QA-17 Android, QA-18 iOS | After D06, per module on real devices where available |
| QA-21 supply chain (secrets in history, CVEs, SBOM, licenses, action pinning) | Every push (scans); history scan at baseline and nightly |
| QA-24 performance, load, soak | Before promotion, disposable environment; thresholds proposed for D22 |
| QA-25 observability and incidents | Each major module and nightly |
| QA-26 financial truth, QA-29 demo and production truth, QA-32 SEO and public pages | Every integration touching those screens; full before promotion |
| QA-27 location and maps, QA-28 fraud and abuse | Every integration touching them; nightly |
| QA-30 beta and flags, QA-31 deployment and rollback | Each staging deployment and before promotion |
| QA-33 human field acceptance | Owner-arranged only; never simulated |
| QA-34 documentation and governance integrity | Every push (existing validators) and before promotion |

Spec section 19.5 maps the extended scenarios (idempotency, stale versions, Redis outage, webhook replay, interrupted workflows, mobile lifecycle, flags, staging regression) to these categories; each launch-critical module, screen, API, state transition, and integration covers them. Fixtures use synthetic people, reserved test phone ranges, and fictitious addresses.

Every test is recorded in `TEST_MATRIX.md` with the spec section 18.2 columns plus a failure-artifacts column (spec 19.5). In autonomous mode, timings follow Goal section 4.2 and the trigger matrix in Goal section 16B.2. The stricter rule applies where they differ.

### 7.1a Global standard CR-01 inside the existing QA categories
CR-01 controls are applied through QA-01–QA-34, `TEST_MATRIX.md` and G01–G25; there is no separate QA framework.

| CR-01 control (global category) | FixHub QA categories | Gates |
|---|---|---|
| Browser runtime gate: shared Playwright fixture capturing console errors and warnings, `pageerror`, unhandled rejections, hydration errors, failed requests and unsuccessful critical responses; fails on anything not in `EXPECTED_RUNTIME_MESSAGES.md`; runs on development and production builds (25.4) | QA-07–QA-11, QA-12, QA-14 | G02, G03, G15 |
| Mobile device-log capture (25.4) | QA-17, QA-18 | G09 |
| Zero sensitive-data leakage: unauthorized responses, browser storage, client bundles and source maps, console, analytics, traces and diagnostic exports, using synthetic secrets (22) | QA-06, QA-19, QA-20, QA-21 | G13, G14, G22 |
| Audit of sensitive manual and automated actions, tamper-evident storage, role-scoped search, audited exports (13) | QA-10, QA-25 | G19, G20 |
| Automated incident detection with thresholds in `ALERT_THRESHOLDS.md` (12) | QA-23, QA-25 | G16, G20 |
| No silent failure: every unexpected error, finding or leak becomes a defect with severity, reproduction, source location, owner and regression test (11) | QA-25, QA-34 | G15 |
| Manual DevTools and device-log review per major module and release candidate (26) | QA-11, QA-13, QA-17, QA-18 | G16, G25 |
| CI blocks promotion on runtime errors and leaks (27, 30) | QA-31, QA-34 | G15, G16 |

Audit, diagnostics and alerting are built only as far as spec v1.3 already requires (AX-08, AX-09, SR-06, SR-11, SR-13, EH-24). Any CR-01 control needing functionality beyond that is recorded as READY_FOR_OWNER, not built. Each `TEST_MATRIX.md` row records run ID, environment and commit SHA; a requirement is never marked implemented because it is specified.

### 7.2 Coverage
- Changed code: at least 80 percent lines and 70 percent branches, measured
- Authorization, dispatch, capacity, quote consent, and messaging code: every branch covered, including denial and failure paths
- Lowering a threshold is an owner-only decision in writing

### 7.3 Definition of done
1. `npm run typecheck` — zero errors
2. ESLint and Prettier checks — zero findings (once installed); existing `npm run lint` passes
3. `npm test` and `npm run test:api` — pass, coverage thresholds met
4. API integration, authorization, and (when touched) concurrency and migration suites against real PostgreSQL — pass
5. Critical Playwright journeys (Chromium) in English and Telugu — pass
6. Accessibility, responsive, and localization checks on changed screens — pass
7. `npm audit`, SBOM, and secret scan — no high or critical findings without a fix or a valid Category 22 risk exception (section 5)
8. Documentation validators (`test:docs` and the existing validators) — pass
9. Browser runtime gate and leakage tests (section 7.1a) — no unexpected findings on affected journeys
10. `npm run build` — succeeds
11. Feature flags: WhatsApp sending, Hindi, unapproved channels, and test shortcuts off outside test mode
12. `TEST_MATRIX.md` rows for the change updated with command, run ID, SHA, result, and failure artifacts
13. English and Telugu key completeness for changed screens — no missing keys or placeholder text
14. Log-redaction tests pass for any changed code that logs

Evidence levels follow spec section 18.4 (TESTED_UNIT, TESTED_INTEGRATION_REAL_DB, TESTED_BROWSER, TESTED_STAGING, VERIFIED_PROVIDER, VERIFIED_REAL_DEVICE, FIELD_VALIDATED, LIVE). Test statuses: PASS, FAIL, BLOCKED, NOT_RUN, SKIPPED_WITH_REASON, FLAKY, NOT_APPLICABLE with proof.

Defects close only through the fix, retest, and verify cycle in Goal section 16A.6.

---

## 8. Architecture

- One modular-monolith API with domain modules: identity, merchants and verification, catalogue and zones, requests and dispatch, bookings and quotes, technicians, reviews, support and disputes, messaging and outbox, admin and config, analytics, privacy
- Web clients for customer, merchant, technician, and operations; mobile apps per D06; all use the same domain commands and request IDs (CH-02, CH-06)
- Architecture decisions in `docs/architecture/` and decision records; update existing canonical documents rather than creating duplicates (`AGENTS.md` documentation practice)

---

## 9. Documentation

Keep the existing documentation structure and validators. Add or update: `FEATURE_MATRIX.md`, `APP_SCREEN_MATRIX.md`, `JOURNEY_MATRIX.md`, `LOCALE_MATRIX.md`, `CHANNEL_CAPABILITY_MATRIX.md`, `DISPATCH_STATE_MATRIX.md`, `COMPLETE_LAUNCH_GATE_MATRIX.md`, `GAP_MATRIX.md`, `PROGRESS.md`, `QUALITY_AUDIT.md`, `blocker.txt`, runbooks (incident, outbox replay, provider outage, secret rotation, backup and restore, staging deploy). Correct `blocker.txt` claims that are not evidenced.

---

## 10. Owner-only decisions

- Approval of FixHub-Product-Spec-v1.3.md and D01–D27. Approval of v1.3, D01, and D17 activates safe internal engineering; each other open decision blocks only the capability it affects (spec 19.11)
- Product scope is frozen at v1.3; changes need a written owner scope amendment
- `AGENTS.md`, work-authority, and roadmap amendments (D01, D17)
- Brand identity (D02); launch categories and policies (D03); identity channels (D04); WhatsApp provider (D05); mobile technology and stores (D06); geography (D07); merchant verification (D08); payments and invoices (D09); privacy (D10); support staffing (D11); hosting and budgets (D12); performance targets (D13); beta participants (D14); monetization (D15); launch GO (D16); commit #21 disposition (D18); enhancement classification (D19); assisted booking (D20); maintenance reminders (D21); quality thresholds, device matrix, and field sample sizes (D22); classification of EH-19 to EH-25 (D23); reliability signals affecting dispatch (D24); separation of duties for config publishing (D25); file storage, malware scanning, and backup key custody (D26); native Telugu reviewers and the locality reference list (D27)
- Coverage threshold changes; security risk exceptions only under the global standard Category 22 process (section 5); never for an exploitable critical vulnerability declared production-ready
- Any merchant or customer contact, field pilot, real message, app-store submission, account creation, spending, or production deployment
