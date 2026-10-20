# FixHub24 — Autonomous Build and Validation Goal

**Project:** FixHub24 (Viswatra)
**Repository:** `varunjakkampudi-tech/FixHub24`, baseline `main` at `dd1bc789ae372c80281a7e4f3d11768a48ccaaab` (re-verify at start)
**Product specification:** FixHub24-Product-Spec-v1.3.md (scope frozen; activation requires the recorded approval in section 0.1)
**Engineering baseline:** FixHub24-Engineering-Standards.md, plus the frozen Viswatra Global Engineering and Quality Standard v1.1 (`Viswatra-Global-Engineering-Quality-Standard-v1.1.md`) including approved CR-01
**Execution mode:** Autonomous development and testing on a development integration branch; `main`, production, and all external actions are owner-only
**Objective:** Make the existing code safe and consistent, then build the complete FixHub24 launch scope toward gates G01–G25, with honest evidence levels and every owner or external dependency recorded. One coordinated public launch remains an owner decision (D16).

---

## 0. Activation and prerequisites

### 0.1 When this goal is active
- **Status: AWAITING_OWNER_APPROVAL.** Autonomous implementation stays at this status until both of these exist on `main`, committed by the owner through the approved process: (1) the owner's approval of Product Specification v1.3, D01 and D17, recorded in `PROGRESS.md` or the decision register with date and approver; (2) the D17 change to `AGENTS.md` and `docs/governance/product-foundation-work-authority.md`. Verify both before activating.
- Do not infer approval from this document's title or status lines, a conversation summary or an agent's statement. Never create or backdate an approval record. The agent may prepare the exact proposed `AGENTS.md` and work-authority text as a READY_FOR_OWNER item.
- **Before activation, only where current governance allows:** read-only assessment, analysis, the Stage 0 security investigation (including the signing-secret question), and locally generated draft matrices kept outside tracked repository files. A local Git bundle backup may be created without altering tracked repository content, provided repository access and security policy permit it.
- **Needs the authorization currently governing the repository:** creating or modifying tracked files, committing approval records, changing `AGENTS.md` or the work-authority record, pushing branches, and changing GitHub settings.
- **Approval integrity:** agents may draft proposed approval records and governance amendments, but never create, backdate, impersonate or self-certify owner approval. `PROGRESS.md` keeps an auditable reference to the actual owner approval record and the exact governance-transition commit SHA.
- All security, testing, backup and production restrictions remain in force.
- Activation rule: this goal becomes active only after the owner approves, in writing: FixHub24-Product-Spec-v1.3.md, decision D01 (one-launch scope as successor to phased implementation), and D17 (development-branch workflow and the matching `AGENTS.md` and work-authority update). The owner records the approval date, versions and approver in `PROGRESS.md` or the decision register
- After activation, safe internal engineering proceeds. Each other open decision (D02–D27) blocks only the capability that depends on it, never unrelated work (spec 19.11)
- Product scope is frozen at v1.3. Do not add product features; anything new needs a written owner scope amendment
- Until then, `AGENTS.md` and `docs/governance/product-foundation-work-authority.md` remain the only authority, so there is no gap
- Roadmap phases 00–19 and gates RG0–RG5 remain internal planning and evidence gates. This goal never marks a roadmap phase or gate as passed; it records evidence the owner can use

### 0.2 Prerequisites
- Git access to fetch and push the designated development branch
- Node.js `>=22.12.0`, npm, Docker for PostgreSQL (with PostGIS once added) test containers
- Test-only configuration; provider credentials never needed for automated tests (use mocks); names of missing variables recorded in `blocker.txt`, never values
- GitHub Actions enabled with enough minutes for the trigger matrix
- A separate staging host, provided by the owner, for staging deployment; without one, staging is blocked and validation runs in ephemeral CI

---

## 1. References and precedence

Read in order: the product spec v1.3; the Engineering Standards; the Viswatra Global Engineering and Quality Standard v1.1 (with CR-01); `AGENTS.md`; the roadmap V4.1 and work-authority record; the decision register; the repository code, tests, migrations, and CI.

Precedence:
1. Spec foundational promises (section 0), privacy, security, and truthful-claim rules, the enhancement exclusions in spec section 17, and the fit rules in spec section 19.2
2. Spec repository rules FR-1 to FR-9
3. Other spec requirements
4. This goal for workflow and execution
5. Engineering Standards, except where overridden here
6. Existing code

### 1.1 Unapproved decisions
D02–D27 may still be open. Enhancement classifications in spec sections 17 and 19.1 are proposals until D19 and D23; build LAUNCH_REQUIRED proposals only where they need no other open decision, and record the rest. Never treat them as approved. Implement only work that is independent, reversible, and compliant with precedence items 1 and 2. Record each needed decision in `blocker.txt` as READY_FOR_OWNER with the recommended option, alternatives, risks, and exact owner action.

### 1.2 Evidence levels
Use the spec section 18.4 vocabulary: SPECIFIED, OBSERVED_CODE, TESTED_UNIT, TESTED_INTEGRATION_REAL_DB, TESTED_BROWSER, TESTED_STAGING, VERIFIED_PROVIDER, VERIFIED_REAL_DEVICE, FIELD_VALIDATED, LIVE (owner only). Choose the level the requirement needs; a lower or different level never satisfies it. Mocks never count as VERIFIED_PROVIDER, and simulations never count as FIELD_VALIDATED.

---

## 2. Mission, in priority order

1. **Security quarantine (spec FR-1):** fix the four commit #21 defects (role self-assignment, fixed-code bypass, default signing secret, false delivery claim) or disable those routes, with regression tests, before anything else
2. **Baseline and reconciliation:** backup, inventory, and matrices; one identity model (FR-2), one persistence model and migration chain (FR-3), honest test names (FR-5), real tooling (FR-6), CI triggers (FR-7), English and Telugu only (FR-9). Retire or merge commit #21 code per D18
3. **Correctness core:** canonical request, dispatch, first-wins transaction with real multi-worker proof (FR-4, G06), capacity, booking and quote state machines, outbox
4. **Experiences:** customer, merchant, technician, operations and Super Admin flows across the screen matrix, in English and Telugu
5. **Channels:** WhatsApp adapter behind the approved provider with mocks until D05 and provider approval; notifications; cross-channel continuity
6. **Quality, operations, and evidence** toward G01–G25
7. **Mobile apps** after D06

Never mark a requirement complete without evidence. Do not add features beyond the spec.

---

## 3. Autonomous authority

You may decide: implementation order, internal APIs and module boundaries, refactors justified by evidence, test strategy, UI implementation within approved designs, security hardening, observability, CI on the development branch, and documentation structure (updating canonical documents, not duplicating them).

Never: invent consent, provider approval, merchant or customer evidence, prices, ratings, providers, or test results; contact merchants or customers; create accounts; spend money; submit apps; send real messages; change brand identity; mark roadmap phases or gates as passed.

---

## 4. Git workflow — autonomous, no PRs (after D17)

1. Verify repository status and baseline commit
2. Preserve history and uncommitted owner work
3. Create and verify the baseline backup (section 4.1)
4. Use the designated development integration branch
5. Use short-lived task branches or worktrees where helpful
6. One coherent requirement at a time
7. Run the definition of done using section 4.2
8. Independent review (section 16)
9. Commit only validated changes
10. Integrate sequentially; revalidate after each material integration
11. Remove only temporary branches confirmed safe to delete

Never push to or merge into `main`. Never dispatch a production workflow. Never force-push protected branches or rewrite published history. When the development branch is ready for promotion, record READY_FOR_OWNER in `blocker.txt` with branch, SHA, and validation results.

### 4.1 Verified baseline backup
Before any major modification:
1. Record `git rev-parse HEAD`, branch, `git status --porcelain`, `git branch -a`, `git tag`
2. Never stash, reset, clean, or commit uncommitted owner work; use a separate worktree; archive uncommitted files outside the repository, excluding `.env*`, keys, and credentials (list them by name only)
3. `git bundle create <backup-dir>/fixhub-baseline-<SHA>.bundle --all` outside the repository
4. `git bundle verify`; record a SHA-256 checksum
5. Clone the bundle into a temporary directory; confirm SHA, branches, tags; `git fsck`; delete the copy
6. Record commands, exit codes, checksum, and result in `PROGRESS.md`
7. If any step fails, make no major modifications; continue read-only audit work

### 4.2 Engineering Standards in autonomous mode

| Standards wording | Autonomous-mode equivalent |
|---|---|
| "Every pull request" or "every integration" | Every integration into the development branch: before on the task branch, after on the integrated baseline |
| "Every commit" | Every commit |
| "Nightly" | Scheduled nightly run, every checkpoint, and before any promotion request |
| "Every staging deployment" | Authorized staging deployments only, on a host separate from production |
| Reasons and template fields in a pull request | Commit message and the item's `PROGRESS.md` integration record (requirement, tests, screenshots, migration notes, rollback plan, review result) |
| Human approval | Independent review session; owner review before promotion for the sensitive areas in Standards section 6 |
| Owner-only decisions | Recorded as READY_FOR_OWNER |

No check is dropped and no threshold is reduced.

---

## 5. Baseline audit and matrices

Inspect every route (including `/app` versus `/customer` duplicates and legacy demo views), API handler, migration, test, demo or persona data path, validator, workflow, and `blocker.txt` claim. Classify each with an evidence level. Re-verify spec section 1.1 facts on the current SHA.

Produce before implementation: `GAP_MATRIX.md`, `FEATURE_MATRIX.md` (CX, MX, TX, AX, CH, DS, L10N, UX, TR, SR, AN, and EH IDs, with each EH's proposed classification and D19 status), `TEST_MATRIX.md` (spec section 18.2 columns plus failure artifacts, QA-01 to QA-34), `SERVICE_CATEGORY_MATRIX.md` (with the EH-23 readiness checklist per category), `PROVIDER_PERMISSION_MATRIX.md`, `RISK_REGISTER.md`, `APP_SCREEN_MATRIX.md`, `JOURNEY_MATRIX.md` (J01–J30), `LOCALE_MATRIX.md`, `CHANNEL_CAPABILITY_MATRIX.md`, `DISPATCH_STATE_MATRIX.md`, `COMPLETE_LAUNCH_GATE_MATRIX.md` (G01–G25 with RG0–RG5 mapping from spec 15.1). Correct `blocker.txt` so self-reported claims are marked as such.

---

## 6. Status vocabulary

Requirement statuses: the section 1.2 evidence levels plus IMPLEMENTED, INTEGRATED, BLOCKED, READY_FOR_OWNER, NOT_ASSESSED, NOT_APPLICABLE (with rationale), PLANNED, RETIRED. Test statuses (spec 18.4): PASS, FAIL, BLOCKED, NOT_RUN, SKIPPED_WITH_REASON, FLAKY, NOT_APPLICABLE with proof. Every percentage states numerator and denominator.

---

## 7. Execution stages

- **Stage 0 — Security quarantine:** FR-1 fixes with regression tests: roles never client-selected; no fixed or returned codes outside test mode; startup fails without signing secrets; no false "sent" messages. Keep the unsafe routes fully disabled until all four fixes are verified. Investigate whether the published default JWT secret was used in any accessible environment (repository history, CI, workflow and deployment configuration, preview or demo hosts, `blocker.txt` and docs). Record the finding in `docs/investigations/fr-1-jwt-secret.md`. If it was used or use cannot be ruled out, raise a READY_FOR_OWNER blocker to rotate the secret, invalidate affected sessions and tokens, and review authentication activity in each affected environment; the agent never touches hosted or production environments itself. Stage 0 is complete only with that evidence recorded
- **Stage A — Foundations:** backup, matrices, ESLint, Prettier, coverage, real Playwright with the CR-01 browser runtime fixture and `EXPECTED_RUNTIME_MESSAGES.md`, sensitive-data leakage and client-bundle secret tests, secret scanning, SBOM, CI triggers for the development branch, nightly, and manual runs; log-redaction tests; fork-safe workflow permissions; skipped-means-failed summary job; Telugu key-completeness check (SR-11, L10N-14)
- **Stage B — Reconciliation:** one identity and session model (FR-2, D04); merge useful commit #21 schema parts into `api/migrations` as additive migrations or retire them (FR-3, D18); remove runtime use of in-memory repository and Redis stand-in; locale catalog to keyed ICU messages, Hindi off (FR-9)
- **Stage C — Correctness core:** request identity and idempotency; merchant eligibility; first-wins transaction and capacity with multi-worker PostgreSQL proof (G06, QA-04); merchant capacity calendar (EH-07); dispatch reason codes (EH-09); journeys J22–J24; booking, quote, cancellation, reassignment state machines; outbox and dead letters; stuck-booking detection and recovery commands (EH-19, J04, J10, J17 variants)
- **Stage D — Customer experience:** CX-01–CX-14; Trust Passport, Price Clarity Card, Service Evidence Timeline, no-provider rescue, quote revision and dispute packet, safe location controls (EH-01–EH-04, EH-14, EH-16); senior-friendly Telugu-first flows (EH-05, assisted part pending D20); customer rescue progress and incident reporting (EH-19, EH-21); session and device management, private files (SR-09, SR-10); journeys J01–J04, J09, J10, J21, J25
- **Stage E — Merchant and technician:** MX-01–MX-11, TX-01–TX-09; own reliability record with dispute and appeal (EH-20); technician and merchant incident reporting (EH-21); journeys J05–J08, J14
- **Stage F — Operations and Super Admin:** AX-01–AX-15; config publishing extended to all EH-24 domains with impact preview (approver rule pending D25); category readiness checklist (EH-23); reliability signals staff view (EH-20, no dispatch effect until D24); incident cases and suspension (EH-21); flags and beta; diagnostics; journeys J13, J15, J18, J27–J29
- **Stage G — Channels:** notifications and CH invariants; WhatsApp adapter with mocks and contract tests (J12, QA-15, QA-16) until D05 and provider approval; maintenance reminders (EH-11, J26) only after D21
- **Stage H — Localization and accessibility completion:** L10N-01–L10N-14, J16, G12 evidence short of native review (owner-arranged, D27)
- **Stage I — Quality and operations:** QA-01 to QA-34 coverage in `TEST_MATRIX.md`, including the spec 19.5 scenario expansion; backup restore that re-applies deletions and data-rights checks across all stores (SR-12); incident runbooks (SR-13); security, performance baselines for D22, resilience (J17), launch-blocking behaviour (J30), backup and restore drills on disposable infrastructure, runbooks; shared-image sanitization and restricted evidence originals tested separately (SR-10)
- **Stage J — Mobile:** after D06, Android and iOS per CH-02 and CH-03 (J11), real-device tests where devices are available
- **Stage K — Reports**

Stage 0 always comes first. Baseline problems come before new features.

---

## 8. Scope limits

Out of scope until separately approved: EH items classified POST_LAUNCH_CANDIDATE or NOT_APPROVED (EH-10, EH-12, EH-18 are proposed POST_LAUNCH_CANDIDATE); EH-22 and EH-25 until D23; any dispatch effect of reliability signals until D24; operator-assisted booking until D20; reminders until D21; payments, escrow, refunds, invoices (D09); advertising and paid ranking (D15); expansion beyond Tanuku (D07); voice booking and AI booking bots; any real message, merchant or customer contact, field pilot, store submission, or production action.

---

## 9. Safety limits

Do not: push to `main`; deploy or change production; send real WhatsApp, SMS, email, or push messages; contact merchants or customers; create accounts or accept terms; spend money; use real personal data in fixtures; put personal data, private paths, or secrets in the public repository; leave test shortcuts reachable outside test mode; lower thresholds; hide failing tests; fabricate evidence; run destructive or load tests on any shared or production host.

---

## 10–11. Standards and testing

Apply FixHub24-Engineering-Standards.md in full, including the definition of done in Standards section 7.3 and coverage rules in 7.2. Record exact commands, exit codes, test names, coverage, SHAs, and CI run IDs.

---

## 12. Security and abuse testing

Prioritize: role escalation and self-assignment; OTP abuse, enumeration, and fixed codes; token forgery and default secrets; session rotation and revocation; IDOR on bookings, addresses, quotes, photos, and support tickets; technician scope; merchant cross-access; admin MFA and step-up; account enumeration in recovery; OTP send abuse and spend caps; upload parsing, content-type spoofing, EXIF location leaks, signed-URL expiry and reuse; secrets or OTPs in logs and CI artifacts; fork-triggered workflow secret exposure; CSRF, XSS, SSRF; webhook signatures and replay; rate limits; secrets in history; dependencies. Serious defects block the affected function until fixed and retested; unresolved ones go to `blocker.txt`.

---

## 13. UX and localization

Standards section 3 applies. Every journey is tested in English and Telugu. Never show fake success, fake providers, ratings, prices, maps, or availability. Use real rendered screenshots as UI evidence. Native-speaker review is an owner-arranged action; until then Telugu safety, money, and consent copy is marked "pending native review".

---

## 14. Providers and data permissions

Twilio, Meta, maps, push, and SMS integrations stay behind adapters and mocks until the owner approves the provider and account (D04, D05, D12). Record each provider's permission state in `PROVIDER_PERMISSION_MATRIX.md`. Never report mocks as VERIFIED_PROVIDER.

---

## 15. Failure handling and resilience

On disposable infrastructure: database, worker, and provider outages; duplicate delivery; lost acknowledgements; delayed or reordered webhooks; clock skew; offline clients; expired sessions (J17, CH-07, G23). Verify the state after recovery. No invented recovery measurements.

---

## 16. Independent review

Every material change gets a review in a separate agent session with only the requirements, diff, surrounding code, and test results. A same-session review does not count. If unavailable: never claim it; record the limitation and SHAs in `blocker.txt`; integrate only with all checks passing, labelled "independent review pending"; sensitive areas (Standards section 6) stay on their task branch; unreviewed work cannot be promoted.

### 16A. Quality audit, fix, and retest

- **16A.1 Accessibility:** automated plus recorded manual tests, English and Telugu
- **16A.2 Responsive:** all screens at the Standards breakpoints
- **16A.3 Cross-browser:** Chromium, Firefox, WebKit; real mobile browsers where available; limitations recorded
- **16A.4 Security:** section 12; critical and high findings, including ones that predate the current change, fixed and independently retested before the function is ready. Risk exceptions follow the Viswatra Global Engineering and Quality Standard v1.1, Category 22: an independent security assessment, documented severity, exploitation conditions, affected data, compensating controls, expiry and re-evaluation dates, the owner's recorded decision and compliance confirmation in `RISK_EXCEPTIONS.md`. There is no generic waiver; an unresolved exploitable critical vulnerability is never declared production-ready; an exception never replaces legal or regulatory compliance; agents cannot create or approve exceptions
- **16A.4a Runtime and leakage (CR-01):** manual DevTools review (Console, Network, Storage) on each supported browser and device-log review on supported phones, per major module and release candidate; record tester, environment, SHA and findings in `QUALITY_AUDIT.md`; every unexpected finding becomes a defect with a regression test
- **16A.5 Performance:** measure and propose targets for D13; no invented thresholds
- **16A.6 Fix cycle:** reproduce, record severity, root cause, smallest safe fix, regression test, focused and integration tests, full definition of done, independent review, evidence, close only after verification. Review unavailable means "fixed, review pending". Repeated failures follow section 20.1
- **16A.7 Continuous gates:** rerun relevant suites after each major module; a full audit before declaring development complete
- **16A.8 Report:** `QUALITY_AUDIT.md` with category, scope, tests, issues found, fixed, remaining, severity, evidence, result

### 16B. CI/CD

- **16B.0 Authority:** spec section 18.3 is the authoritative trigger and deployment contract, including the manual-run selector list; the matrix below implements it and the stricter rule applies
- **16B.1 Workflows:** extend `docs-validation.yml` (keep its validators). Add development-branch, nightly, and `workflow_dispatch` triggers. Production deploy workflow, if created, is manual, `main` only, protected environment with required reviewers, and never dispatched by the agent
- **16B.2 Trigger matrix:**

| Trigger | Required checks |
|---|---|
| Every push | typecheck, ESLint, Prettier, unit tests, `npm audit`, secret scan, build, documentation validators |
| Every integration | Above plus API integration with PostgreSQL, authorization suite, concurrency suite when dispatch changes, migration checks when schema changes, critical Playwright (Chromium) in English and Telugu with the CR-01 runtime gate, sensitive-data leakage tests, accessibility, responsive, and localization checks on changed screens, coverage |
| Every major module | Relevant regression, Playwright on all three engines, security review |
| Nightly | Full regression, all journeys and engines, concurrency, migrations, provider-failure suite, localization, security scans |
| Manual | Allowlisted selectors from spec 18.3 (unit, api, integration, smoke, sanity, critical, regression, e2e, accessibility, responsive, localization, security, dependencies, secret-scan, migrations, dispatch-race, whatsapp, mobile, load, restore, all), module, browser, and environment (ephemeral or staging; never production); each selector maps to a real command |
| Before and after staging deployment | Build provenance, migrations on synthetic data, smoke, sanity, critical path, health; separate staging host only |

- **16B.3 Evidence:** run ID, trigger, branch, SHA, suite, counts (passed, failed, skipped, flaky), coverage, artifacts, Playwright traces on failure; retention 30 days for reports, 14 for media (owner may change); no personal data in artifacts; skipped mandatory tests count as incomplete; at most 2 retries per test, retry-only passes reported flaky
- **16B.4 Security:** least-privilege permissions; actions pinned to commit SHAs; no production secrets in test workflows; no secrets to fork-triggered runs
- **16B.5 Usage limits:** check Actions minutes and permissions; record shortfalls as blockers rather than skipping runs
- **16B.6 Acceptance:** prove with real runs every protection in spec section 19.6: pushes trigger checks, a failing critical test blocks integration, low coverage fails, a vulnerability or fake-secret fixture blocks, an incompatible migration blocks staging deployment, a removed Telugu key fails, an unexpected browser runtime error fails, a synthetic-secret leakage fixture fails, a skipped mandatory suite is not PASS, artifacts carry the exact SHA, manual runs map to real commands, nightly has run, Playwright runs on three engines, and no agent workflow reaches production. The production branch guard is proven by configuration review and a guard test, never by dispatching the production workflow. Negative fixtures go on temporary branches and are removed. A workflow file is not evidence

---

## 17. blocker.txt

Use the template: ID, title, priority, module, spec requirement or gate, status (OPEN, READY_FOR_OWNER, RESOLVED, VERIFIED), problem, verified cause, current state, impact, what was tried, work completed, why autonomous resolution is unsafe or impossible, exact owner action, step-by-step instructions, environment variable names (no values), dependencies, expected result, verification, tests to rerun, evidence. Separate verified facts from assumptions. Keep resolved items.

Expected blockers: D02–D27; malware scanning service and private file storage (D26); Tanuku locality reference list (D27); WhatsApp provider and template approval; OTP channel and sender identity; maps and geocoding; hosting, backups, domain, TLS; staging host; app-store accounts; native Telugu review; legal review (TR-05); Tanuku field evidence and merchant supply (G04); support staffing (G11); pilot (G25).

---

## 18. Documentation and evidence

Maintain the matrices from section 5, `PROGRESS.md`, `QUALITY_AUDIT.md`, `blocker.txt`, decision records, `docs/investigations/`, and runbooks, using the repository's existing documentation structure and validators. Evidence traces to code, test runs, environment, and SHA.

---

## 19. Reporting

Report separately, as distinct evidenced states that never imply one another (spec 19.11): internal software implementation complete; mock-provider validation complete; tested on staging; field readiness; live provider approval; mobile app-store approval; public production launch (owner only). Also report blocked items, open defects, and CI results. Never report launch readiness, or mark a launch gate PASS, from documentation, local or mocked evidence, simulations, or unverified third-party claims.

After each item: ID, status, SHA, checks, remaining issues. Checkpoints (not stops): every 10 integrated items or 24 hours of work, update the matrices, `PROGRESS.md`, and `blocker.txt`, and post a summary of no more than ten lines. Then continue.

---

## 20. Hard-stop conditions

Stop the affected task, record a blocker, and continue unrelated safe work when: a change would break a foundational promise or FR rule; it depends on an open decision; credentials, provider approval, legal review, field evidence, or spending are needed; a production action, real message, or real contact would be required; branch protection prevents integration; a critical security risk cannot be fixed safely; a destructive operation would risk real data; a mandatory check still fails after section 20.1.

### 20.1 Failure escalation
After three failed attempts on one item: stop that approach; write a root-cause analysis in `docs/investigations/<item-id>.md`; try a justified new approach with its own three attempts. If two consecutive approaches fail without measurable progress, the item is blocked: keep it on its task branch, flags off, dependents marked blocked, and continue other work. Never skip or weaken a test or threshold.

---

## 21. Gate tracking

QA-01 to QA-34 refine the evidence each gate needs; they are not a second launch system (spec section 18). Track G01–G25 in `COMPLETE_LAUNCH_GATE_MATRIX.md` with source, environment, SHA, run, reviewer, and result (PASS, FAIL, BLOCKED, NOT_ASSESSED, NOT_APPLICABLE with rationale). The agent can produce TESTED_UNIT, TESTED_INTEGRATION_REAL_DB, TESTED_BROWSER, and TESTED_STAGING evidence. Gates needing field, provider, store, legal, staffing, or owner evidence (G04, G08, G09, G11, G17, G21, G24, G25 and parts of others) stay BLOCKED with exact owner actions. No weighted average hides a hard blocker. The agent cannot waive any gate.

---

## 22. Completion definition

Development is complete when: Stage 0 fixes are verified and the FR-1 signing-secret investigation is recorded (with any owner rotation action raised); reconciliation is done (one identity, one persistence model, honest tests, real tooling); all safe locally executable launch-scope functionality is implemented and tested in English and Telugu; matrices cover every requirement, screen, journey, locale string, channel, and gate; CI acceptance (16B.6) is proven with real runs or blocked; the quality audit is complete; every unresolved dependency is in `blocker.txt`; the repository is clean and recoverable; and nothing was deployed, sent, contacted, submitted, or bought.

The final report distinguishes: development complete, technically validated (with evidence levels), release candidate ready for owner review, and owner launch decision pending. Only the owner authorizes promotion, production, pilot, or launch.

---

## 23. Final deliverables

Executive summary; Stage 0 security fixes with evidence; baseline inventory; all matrices; architecture summary; reconciliation record (identity, persistence, commit #21 disposition); test totals and coverage; concurrency proof results; security, privacy, accessibility, localization, responsive, and browser results; performance baselines and proposed targets; provider permission states; G01–G25 statuses with RG0–RG5 mapping; outstanding issues; `blocker.txt`; branch and SHA; CI run IDs; `QUALITY_AUDIT.md`.

---

## 24. Final execution instruction

**After the owner activates this goal (section 0.1), fix the commit #21 security defects first, reconcile the codebase into one identity and one persistence model, then build and validate the complete FixHub24 launch scope autonomously on the development branch.**

Do not push to `main`, deploy, send real messages, contact anyone, spend money, submit apps, mark roadmap gates passed, or invent evidence.

**The desired outcome is one safe, consistent, tested, bilingual FixHub24 codebase moving toward a single coordinated launch, with every owner, field, provider, and legal dependency clearly recorded.**
