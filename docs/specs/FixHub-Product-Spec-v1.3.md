# Fix Hub — Complete Product Specification v1.3

Company: Viswatra (parent brand)
Product: Fix Hub / FixHub — local services discovery, booking, dispatch and fulfilment platform
Initial service geography: Tanuku, Andhra Pradesh; additional towns only after operational validation
Primary languages: English (en-IN) and Telugu (te-IN)
Source: https://github.com/varunjakkampudi-tech/FixHub
Repository observation: 19 October 2026, main at commit dd1bc789ae372c80281a7e4f3d11768a48ccaaab (verified with git rev-parse HEAD; v1.0 described this as a tree SHA, which was incorrect)
Status: Product scope frozen at v1.3. Owner approval of v1.3, D01 and D17 must be verified against an authentic, dated approval record in the repository. Autonomous implementation remains AWAITING_OWNER_APPROVAL until that evidence and the authorized D17 governance amendments are committed through the approved process. Other open decisions block only their dependent capabilities.
Companion documents are aligned with v1.3. The Autonomous Build Goal becomes ACTIVE only after its Section 0.1 prerequisites are satisfied and verified.
## Changes in v1.3 (19 October 2026)

- Preserve every v1.2 requirement, EH-01–EH-18, QA-01–QA-34, J01–J30, G01–G25 and the single coordinated launch policy.
- Add operations, trust and control enhancements EH-19–EH-25 with proposed classifications and rules that tie them to existing requirements (19.1, 19.2).
- Add security and privacy requirements SR-09–SR-13 and map all 13 amendment security items (19.3).
- Add localization requirements L10N-11–L10N-14 (19.4).
- Extend QA-01–QA-34 scenario coverage without a second test framework, and add a failure-artifacts column to TEST_MATRIX.md (19.5).
- Add proven CI/CD release protections (19.6) and map all additions to existing journeys, QA categories and gates (19.7).
- Add owner decisions D23–D27 (19.9).
- Final pre-approval corrections: FR-1 investigation and rotation of the published default signing secret; SR-10 split between sanitized shared images and restricted investigation originals; activation, decision gating, separately evidenced states and scope freeze (19.11).

## Changes in v1.2 (19 October 2026)

- Preserve all v1.1 requirements CX, MX, TX, AX, CH, DS, L10N, UX, TR, SR, AN, J01–J20 and launch gates G01–G25.
- Add candidate differentiated product enhancements EH-01–EH-18 with scope and release eligibility.
- Add full-platform acceptance/test taxonomy QA-01–QA-34, including real CI execution, staging, manual dispatch, and exact-sha deploy gates.
- Add journey scenarios J21–J30; no new public release phases and no new promises unsupported by evidence.
- Add test traceability, evidence integrity, failure-injection rules and owner-decision amendments D19–D22.
- These additions are product requirements and proposed acceptance criteria; engineering scripts and actual runs belong in the next Engineering Standards/Goal revision.
## Changes in v1.1

v1.1 keeps every v1.0 requirement and adds the following. Nothing is approved until the owner approves this specification.

| # | Change | Where |
|---|---|---|
| C1 | Markdown formatting for tables and headings | Whole document |
| C2 | Commit SHA corrected (it is a commit SHA, not a tree SHA) | Header |
| C3 | Verified repository facts from a code inspection, with rules FR-1 to FR-9, including four security defects in commit #21 | 1.1 |
| C4 | CI description corrected: the existing workflow runs tests, typecheck, build, and npm audit, not only documentation checks | 1.1 |
| C5 | Gate naming: roadmap gates G0–G5 are written RG0–RG5 in new documents, with a map to launch gates G01–G25 | 15.1 |
| C6 | WhatsApp provider path clarified: direct Meta Cloud API or an approved provider such as the existing Twilio adapter | CH-04 |
| C7 | New owner decisions D17 (git workflow and AGENTS.md) and D18 (disposition of commit #21 code) | 16.2 |

## 0. Executive product contract
Mission. Make discovering, booking, coordinating, completing and supporting trusted local services substantially easier for residents and local service businesses, in their language and using channels they are comfortable with.

Vision. One bilingual, secure, accountable local-services operating marketplace that connects a customer to an eligible provider and keeps the booking, assignment, quotation, service work, support and evidence consistent across web, WhatsApp, Android and iOS.

Complete-app decision. The goal is one complete launchable product, not a chat demo, route collection, partial MVP, or staggered public feature releases. Internal development workstreams and technical milestones are allowed, but there is one coordinated public launch for the explicitly approved launch scope, after all required customer, merchant, technician, operations, platform, provider, security, app-store and field-operation gates pass. Legacy roadmap phases 00–19 are internal project management and evidence gates only. They do not define independently marketable or public releases. Retain historical phase documents for audit; the new product goal does not falsify their status or erase their dependencies.

Foundational promises:
1. Free basic merchant registration and listings; no advertising or paid placement influencing eligibility/rank at launch unless the owner changes scope with evidence and disclosure.
2. Reliable first valid backend-committed acceptance wins and capacity is reserved in the same authoritative transaction. Neither a notification nor a faster UI tap creates a winner.
3. Truthful service availability, provider verification, price, fees, quotes, time estimates, support, and payment statements. “Unknown” is never silently shown as zero or guaranteed.
4. Only authorized, currently eligible providers receive actionable offers. No self-verification, cross-account assignment, double-booked technician, or phantom availability.
5. Explicit customer agreement to the exact currently valid quote before chargeable work. Quote changes invalidate obsolete consent.
6. One canonical request/booking record accessible by authorized actors across supported channels; retries cannot create duplicates or revive expired offers.
7. Genuine Telugu localization—not a translated landing page—including transactional content, error and safety communication and support workflows.
8. Strong confidentiality, least-privilege access, privacy-by-default, auditable operations and no secondary sale/model-training use of customer information.
9. Accessibility and simple low-bandwidth experiences, including alternative paths when WhatsApp, location, network, app stores or push are unavailable.
10. No “production ready”, “verified”, “live”, “guaranteed”, or numeric performance claim without environment-specific recorded evidence.
### 0.1 Launch scope versus future options
The one coordinated public launch targets: responsive public website/PWA; working customer and merchant web experiences; role-scoped technician web/mobile experience; private operations and Super Admin dashboards; supported customer and merchant Android/iOS apps; official verified WhatsApp customer/merchant workflows; service catalogue, merchant verification, geospatial discovery, instant/scheduled requests, first-wins dispatch, end-to-end booking/quote/completion, human support/disputes, notifications, privacy, analytics and admin controls. Every listed launch channel must work or require an explicit owner-approved scope change before launch.

Optional future functionality, not silently added to the launch promise: platform-handled payments/escrow/refunds; insurance/guarantees; subscriptions; advertising; paid rankings; public AI booking bots; voice-call booking; third-party marketplaces; nationwide rollout; financing or credit. Each needs a separate permission, legal, commercial and product decision. If any launch-channel provider or app-store approval cannot be obtained, public launch remains blocked unless the owner expressly amends scope (not a disguised phased release).
### 0.2 Key personas and boundary

| Persona | Product access | Explicit boundary |
|---|---|---|
| Visitor | Public catalogue, coverage, pricing policies, explanations, sign-in/register | No access to private bookings, IDs or provider evidence |
| Customer | Own addresses, quotes, bookings, communications, privacy, reviews and support | Cannot manipulate assignment, other customers' data or payment evidence |
| Merchant owner | Own business onboarding, verification, services, staff, hours, offers, jobs, reviews, support and performance | No other merchant's work; cannot verify self or grant platform rights |
| Merchant manager | Delegated permissions on owned merchant | Cannot exceed owner's grants or access unrelated tenants |
| Technician | Independently authenticated currently assigned-job subset; availability and work steps | No unassigned customer records, merchant financial records, platform policy or general admin |
| Operations/support | Case/region/role-scoped dispatch, verification, complaints and service recovery | No unrestricted customer-data search, automatic refunds or admin self-promotion |
| Reviewer/trust & safety | Document review and time-bound verification or incident permissions | No unlogged changes; separation of duties for high risk |
| Super Admin / platform owner | Restricted web-only control plane, policy, roles, catalog, rollout, incidents, financial/operational analytics | MFA/step-up, reason/audit, cannot silently impersonate or bypass law/consent |

## 1. Repository baseline: observed versus verified
Observed from repository tree and selected files: React 19, TypeScript, TanStack Router, Vite, Radix/shadcn-style UI; Express 5 API; PostgreSQL/PostGIS migration and database repository; Redis/lock; booking, merchant, notification, support, dispute, review and WhatsApp-related code; src/routes/ includes extensive customer, merchant, technician and admin views; local/demo persona flows and real auth/booking modules coexist; Vitest unit/integration suites, named smoke/sanity/critical/regression scripts, and a Playwright-named test file; .github/workflows/docs-validation.yml exists.

Limits of this review: file presence, prior PR assertions, README, roadmap, requirements and blocker.txt were inspected; this is not a line-by-line security audit, runtime proof, executed CI validation, field pilot or production acceptance. blocker.txt states “100% completed” and “84 passing”; those are historical/self-reported and conflict with README's unlaunched scope, provider blocks, and Phase 01 status. Verify against the actual repository commit and fresh independent test execution before adopting either assertion. The README's older statement that the repo is only docs/demo is likewise not a reliable current code inventory.

The current governing docs/roadmap/master-roadmap.md is V4.1, owner-delegated approved as planning, with 20 internal phases (00–19) and G0–G5. Phase 00 is planning-closed; Phase 01's revised 10/10 assessment does not equal Phase 01 exit; actual customer and merchant interview evidence remains zero in the consulted amendment. No later-phase formal execution or provider activation is inferred. The new spec is a proposed owner-requested consolidation; once approved, record supersession/compatibility against roadmap and decision register rather than covertly reinterpreting old authorities.

Repo reconciliation requirement: audit all routes, API handlers, tests, live/demo data paths, duplicated flows, blocker.txt claims, dependencies and migration parity. Label each OBSERVED_CODE, TESTED_LOCAL, TESTED_STAGING, VERIFIED_PROVIDER, FIELD_VALIDATED, LIVE, BLOCKED, PLANNED or RETIRED; report exact SHA, evidence and gaps.
### 1.1 Verified repository facts at commit dd1bc78
These were read from the code on 19 October 2026. They are inspection findings, not runtime proof; the baseline audit re-verifies them on the current SHA.

| Area | Finding |
|---|---|
| Canonical persistence | api/migrations.ts applies api/migrations/001–008 (identity, marketplace, quote consent, WhatsApp contact, notification outbox leases and provider attempts, support requests) under an advisory lock |
| Second schema | database/migrations/001_initial_schema.sql (commit #21: users, merchants, technicians, bookings, offers, quotes, reviews, disputes, notifications, outbox, PostGIS) is not applied by the migration runner |
| Second backend | Commit #21 routes (/api/v1/auth, /merchants, /bookings, /disputes, reviews, /notifications, /webhooks) are mounted in api/app.ts and store data in an in-memory Repository (JavaScript maps); data is lost on restart |
| "Redis" and "Redlock" | api/redis/client.ts is an in-memory stand-in; no Redis client package is installed. The lock proves nothing across processes |
| Phone OTP (commit #21) | OTP is stored in memory and never sent, while the response says "OTP sent successfully via SMS and WhatsApp" |
| Existing sign-in | The earlier API implements email sign-in with database-backed sessions; README states roles cannot be self-assigned |
| Tests | test:playwright runs Supertest API calls under Vitest, not Playwright browser tests; Playwright is not installed. blocker.txt claims ("100% completed", "84 passing") are self-reported |
| Lint and format | npm run lint is a custom script (scripts/lint.mjs). .eslintrc.json and .prettierrc exist, but ESLint and Prettier are not installed |
| CI | .github/workflows/docs-validation.yml runs on push and pull request to main only: npm test, typecheck, build, npm audit, and documentation, financial-model, behaviour-contract, and design-token validators |
| Localization | src/features/fixhub/locales.ts defines locales en-IN, te-IN, and hi-IN with hindiEnabled = true, but messages are positional English–Telugu pairs, not keyed message IDs with ICU placeholders |
| Governance | AGENTS.md directs direct-to-main publication without feature branches and limits authority to Phases 01–05 plus the local demonstration |

Security defects in commit #21 (verified by reading the code):
1. Role self-assignment: the OTP request accepts role including admin from the client, and a new user is created with that role
2. Fixed-code bypass: any phone number ending in 0000 receives the code 123456 in every environment, and the code is returned in the API response
3. Default signing secret: if JWT_SECRET is unset, a hard-coded secret published in the public repository signs tokens, so tokens can be forged
4. False delivery claim: the API reports an OTP as sent by SMS and WhatsApp when nothing is sent
Rules:
- FR-1 Security quarantine: the four defects are fixed, or the commit #21 routes are disabled, before the API runs anywhere other than a developer machine. Gates G13 and G14 cannot pass until they are fixed and regression-tested. Removing the default JWT signing secret from source is not enough: investigate whether that published default was used in any accessible environment (local, preview, staging, hosted demo or production). If it was used, or use cannot be ruled out, treat it as compromised: rotate the secret, invalidate affected sessions and tokens, review authentication activity for misuse, and record the remediation evidence. No previously unsafe route is re-enabled until all four defects are verified fixed; otherwise those routes stay fully disabled
- FR-2 One identity system: email sign-in (database-backed) and phone OTP (commit #21, in memory) are reconciled into one identity and session model under D04. No parallel authentication paths
- FR-3 One persistence model: the runner-applied api/migrations chain is canonical. Useful parts of database/migrations/001_initial_schema.sql (technicians, quotes, disputes, PostGIS) move into that chain as additive migrations, or are retired. The in-memory repository is test-only and never a runtime path outside tests
- FR-4 Real concurrency proof: first-wins correctness is proven by database transactions with multiple workers against real PostgreSQL (DS-03, G06). In-memory lock tests do not count
- FR-5 Honest test names: a suite named for a tool or level must use that tool or level. test:playwright is renamed, and real Playwright browser tests are added
- FR-6 Real tooling: ESLint and Prettier are installed and run in CI, replacing or supplementing the custom lint script
- FR-7 CI scope: add development-branch, nightly, and manual triggers to the existing workflow (14 and the Engineering Standards)
- FR-8 Governance transition: AGENTS.md and the work-authority record are updated only by owner decision D17; until then they govern
- FR-9 Languages: launch languages are English and Telugu (section 8). Hindi stays disabled unless the owner adds it to scope. Strings move to keyed message IDs with ICU-compatible placeholders (L10N-03)
## 2. Complete customer experience — CX
CX-01 Discover. Public localized homepage, category directory, service categories, city/area coverage, text search, location-aware eligible results, merchant/service detail, FAQ, safety, terms, trust explanation; discoverability without account where privacy permits. No manufactured providers, ratings or prices. Empty-coverage alternatives: broaden area, schedule, request support or notify-me only with consent.

CX-02 Location and addresses. Manual address/location entry; optional precise GPS permission only on user action; map pin confirmation when provider integration approved; multiple named saved addresses, landmarks, serviceability zone, geospatial validation, edit and remove; approximate public locations and exact details only after assignment/need-to-know. Permission-denied and inaccurate geocoder recovery.

CX-03 Customer identity. Accessible onboarding, email/phone as approved, verified OTP/recovery, safe login/logout/device sessions, consent and privacy choices, profile, saved addresses, notifications and language settings, account export/delete. No auth bypass disguised as demo.

CX-04 Search and selection. Filter by verified category, service, coverage, hours, availability, applicable price model and supported fulfillment mode; display verification scope and freshness; no ranking by unapproved payments, relationship or fabricated response speed. Compare options only when reliable data exists.

CX-05 Service request wizard. Instant and scheduled; service/sub-service, problem description, optional photos, address, availability slot/time zone, explicit inspection or travel-charge policy, current summary, consent and final submission. Save/recover draft without transferring another persona's address, or creating phantom bookings. Accessibility, compression, malware and upload limits.

CX-06 Booking and dispatch states. Distinguish requestState, bookingState, generation, version, event freshness; searching, no eligible provider, offers sent (without personal details), merchant assigned, awaiting inspection, travelling, arrived, quote pending, customer consent, work started, completed, customer confirmation, cancelled, reassignment, service failure. No fake live map/ETA.

CX-07 Quotes and informed consent. Breakdown by inspection, labour, parts, transport and taxes only when approved and known; disclosure of what is not included; quote version, optional expiry, merchant notes/evidence and explicit approve/decline/request-change. Changed quote revokes former acceptance; no work-start from silence.

CX-08 Progress and communications. Timeline with authoritative timestamps and recent activity; legitimate merchant/technician identity at appropriate stage; masked contact or approved calling; in-app notifications, authorized WhatsApp, and app push with fallback; consistent canonical state after reload/offline/reconnect.

CX-09 Completion and evidence. Technician/merchant records performed work, permitted photos and customer confirmation; downloadable factual service record only if data exists, with clear distinction between service record, actual payment receipt and valid tax invoice. No automatic confirmation or invented settlement.

CX-10 Cancellation, rescheduling and no-show. Display relevant policy/possible charges before confirmation; reason, actor, time, quote and assignment effects; no double live assignment or stale offer revival. Customer and merchant cancellation paths differ and are authorization-scoped.

CX-11 Review and feedback. One authenticated review per eligible completed service, eligibility proof, edit/moderation/appeal rules, fraud reporting; never show synthetic scores or publicly reveal private disputes.

CX-12 Support and safety. Booking-linked tickets, help centre, urgent safety guidance, case history, response expectations actually supported, attachments with privacy controls, appeals/disputes and escalation. Hazard emergencies explicitly redirected to appropriate emergency services; platform never represents itself as an emergency dispatcher.

CX-13 Personal account. Booking history/search, notification preferences, consent and channel opt-out, favorite eligible providers if approved, data export/delete, account security and accessibility.

CX-14 Low-connectivity UX. Read-only cached status marked stale; drafts saved safely; mutating commands require authoritative acknowledgement and idempotent retry; no false offline acceptance.
## 3. Complete merchant business experience — MX
MX-01 Free basic onboarding. Registration with no listing fee; business and authorized representative identity, services, work zones, hours, optional documents as lawfully necessary, staff, pricing model and verification application; pending status visible. No self-approval and no bypass for known/founder-assisted providers.

MX-02 Verification. Document submission, precise evidence/access scope, reviewer status and reason, expiry/reverification, appeals/resubmission, suspension and reinstatement policy; never portray a merchant as verified beyond the evidence scope.

MX-03 Service catalogue. Categories/services, service details, conditional inspection fee, time bands, labour/parts estimates with uncertainty, minimum charges only if approved, service-area geofences, skill tags and localization; version history so live bookings preserve historical terms.

MX-04 Coverage and capacity. Operating hours, holidays, zones, technician schedules, skill/vehicle/shift requirements if needed, concurrent-capacity limits, planned leave, blackout windows. Shared technician cannot be reserved twice for overlapping jobs; existing commitments persist when availability changes.

MX-05 New offer inbox. Event freshness, request generation, expiry, limited customer information before win, accept/decline, capacity preview and mutually exclusive outcomes; losing race must report a truthful conflict. Notification receipt/read ≠ acceptance.

MX-06 Assigned job command centre. Scheduled/today/history views, job states, task assignment, technician identity, allowed address release, route-out, arrival, work log, notes/evidence, parts quote, customer consent, completion and service record.

MX-07 Quotes and negotiation. Draft/send/revise scope and charges; customer approve/change/decline; no work before consent where required; audit of every revision and accepted price; payment status only from trusted evidence.

MX-08 Business communication. Approved provider/customer messages and booking notes without leaked phone/address or raw documents; no WhatsApp blasts; opt-out respected; staff messages scoped.

MX-09 Staff/team administration. Add/invite/revoke technician and manager accounts, permission boundaries, qualification/availability, conflicts, transfers and leaver revocation. Technician acts via own session.

MX-10 Business performance. Verified booking funnel, accepted/lost offers, response latency, completion, customer-confirmed reviews, cancellations, capacity/utilization and payouts only if platform actually processes them; source and time window disclosed.

MX-11 Merchant support and compliance. Questions, dispute response, allegation evidence, moderation appeals, data/retention rights, fraud reports, policy notices, service suspension and continuity for in-flight jobs.

MX-12 Multi-location/branch option. Planned only if validated: location-specific roles, inventory/capacity and per-branch pricing; no uncontrolled shared account.
## 4. Technician assigned-job experience — TX
TX-01 Independent sign-in/verification and current active job grants; no credential sharing with merchant.
TX-02 Assigned/upcoming jobs only, status/version and safe directions link; no unrelated customer listings.
TX-03 Availability/shift and leave acknowledgements; merchant capacity remains authoritative.
TX-04 Accept/acknowledge assigned task according to merchant delegation; not a replacement for atomic merchant dispatch.
TX-05 On-the-way, arrived, inspection, quote evidence, work start, work photos, done, unable to attend; versioned and audit logged.
TX-06 Current customer quote and explicit approved-work scope visible; cannot invent consent or mutate price without grant.
TX-07 Safety instructions, incident escalation, emergency redirects, data minimization.
TX-08 Offline-state guidance, stale-read warnings and safe idempotent synchronization; no silent finalization.
TX-09 English/Telugu, accessibility and Android/iOS flows where applicable; technician may be provided limited merchant-app mode rather than a fifth customer-facing app, but identity and permissions stay distinct.
## 5. Operations, support, trust and Super Admin — AX
AX-01 Private dashboard. Verified new bookings, matching backlog, unassigned/stuck, incidents, merchant supply, support workload, provider health, costs, real funnel/quality metrics. Never show fictional GMV or commission. Permission-scoped overview.

AX-02 Merchant management. Registration queue, verification evidence review, competent human disposition, due rechecks, appeal, suspend/restrict/reinstate with in-flight-job impact assessment.

AX-03 Customer/case management. Account health, abuse evidence, suppression, requests, support and privacy rights. Scoped support view, time-bound escalation; no default global PII search.

AX-04 Dispatch control. Live authoritative request and offer state, eligibility reasons, expiration, reassignment and incident recovery, constrained operator actions; server-side command guards and trace history. No arbitrary database state editing.

AX-05 Catalogue and locations. Categories, service metadata, cities, towns, zones, boundaries, verified price rules, locality spellings, serviceability, controlled activation of new areas. Tanuku first; Bhimavaram/Eluru require separate field and supply evidence.

AX-06 Pricing/policy configuration. Inspection/labour/travel disclosures, cancellation terms, invoice/payment policy as legally approved, versioned effective dates, migration of in-progress bookings only with clear user consent and compatibility.

AX-07 Communications centre. Message/template status, consent, retries, failure/dead letter, provider costs, throttles, suppression, kill switches, locale variants. Draft → validate → approved → publish; vendor template approval is separate.

AX-08 Role and access management. Grant matrix, assigned region/case, MFA/step-up for sensitive actions, no self-elevation, no silent impersonation, revocation and time-bound break glass with review.

AX-09 Incident and diagnostics. Search by opaque correlation ID or assigned case, release/trace/version, redacted provider attempts, audit events, safe log export with reason and expiration, on-call alerts, mitigation, rollback and postmortem. No unrestricted raw chat/photo/address export.

AX-10 Analytics and reports. Source-event-defined request funnel, conversion to assigned/completed, cancellation reasons, no-show, time-to-assign, offer fairness, matching quality, supply coverage, complaint types, localization usage, outbox costs, support throughput, provider SLA and risk; export audit and aggregation privacy.

AX-11 Admin config publishing. DRAFT → VALIDATED → REVIEWED → STAGING_VERIFIED → APPROVED → PUBLISHED → ROLLED_BACK/RETIRED for relevant configuration, role-based publish privileges, approval on sensitive changes, dry-run impact preview, version/actor/diff/audit, safe rollback. Publishing configuration ≠ deploying code or bypassing WhatsApp/app-store approval.

AX-12 Feature flags and beta. Target specific consenting testers/roles/tenants/cities, strict dependency checks, opt-in, feedback, kill switch, expiration, preview/release evidence; never bypass launch-wide privacy or dispatch guarantees.

AX-13 Business operational tools. Supplier density, queue alerting, zone ops, issue triage, refund/compensation requests only after business/legal approval; support escalation and staff shift management.

AX-14 Data governance. Subject data requests, encryption-key/config references, retention/legal holds, deletion status across backup/object stores, processor inventory, security and abuse audits.

AX-15 Platform release visibility. Current live build SHA, environment, protected deploy status, health, migration version, rollback evidence, unresolved blockers and historical incidents; only owner-authorized workflows deploy production.
## 6. Four coordinated interfaces and channel invariants — CH
CH-01 Public web/PWA. Search, discovery, FAQ, legal, localized SEO, authentication, service flow, privacy; responsive, low bandwidth; accessible and linkable content.
CH-02 Customer web and Android/iOS. Same authorized customer domain commands and stable request identity; permission-aware camera/photos/location/push/deep-link; store review/permissions required.
CH-03 Merchant web and Android/iOS. Offers, staff/capacity, booking work, notifications and secure handoff, no background-execution guarantees. Technician uses scoped assigned-job functionality.
CH-04 Official WhatsApp Business integration. Customer request/status/quote where provider-supported; merchant offers and accept/decline only through provider-approved identity/capability; permitted conversation windows, approved templates, opt-in/opt-out, language, signature-verified callbacks and retries; privacy-sensitive operations redirect to authenticated secure web when necessary. No unauthorized WhatsApp Web automation or claim of live capability solely from adapter code. Provider path: the Meta WhatsApp Cloud API directly, or an approved provider (the repository already contains a Twilio WhatsApp adapter with Content SID template configuration); the choice, number, and budget are decided under D05.
CH-05 Notifications. In-app, web push, Android FCM, Apple APNs, WhatsApp and any approved email/SMS channel have distinct availability/consent/delivery states. Backend events are canonical; provider acceptance never implies customer read or booking assignment.
CH-06 Cross-channel continuity. Explicit verified identity links only; one request ID and event history. Stale buttons/offers and duplicate events cannot create double bookings. Sensitive data excludes lock-screen notifications and unverified linked profiles.
CH-07 Channel failures. Offline, app closed, revoked token, undelivered push, rejected template, out-of-window WhatsApp, delayed webhook, clock skew and reordered event: recover safely without inventing outcomes.
CH-08 Business support access. If WhatsApp becomes unavailable, customer and merchant can still see and act on own current state via approved web/app path.
CH-09 Rollout authority. One coordinated public launch, private beta beforehand; unsupported channel blocks launch until owner-amended scope, not silently replaced by a limited public release.
## 7. Dispatch and service state contract — DS
DS-01 Request identity. Canonical request with authenticated actor, idempotency key scoped to actor + operation + normalized payload, request generation, version and server timestamps; duplicate same payload returns original receipt, conflicting payload rejects.
DS-02 Merchant eligibility. Current verification, category, zone, hours, staff/skill capacity, service mode, suspension/leave and policy version checked before offer and again at acceptance.
DS-03 Atomic first winner. A single database-committed transaction validates offer/generation/version/eligibility and reserves assignment/capacity atomically; Redis lock is an optimization, not sole correctness authority. Exactly one winner, deterministic losers, no cross-merchant leak.
DS-04 Expiry and cancellation. Offers expire under server time, cancelled/superseded generations cannot win; no replay revival.
DS-05 Recovery. Server restart, Redis failure, multiple workers, duplicate delivery and lost ACK must preserve committed winner; outbox bridges state to messages; dead letters visible; reconciliation repairs stale projections, not canonical facts.
DS-06 Booking lifecycle. Booked → merchant/technician assigned → en route/arrived → assessment/quote → explicit consent → work start → done → customer confirmation → closed; cancellation/reschedule/no-show/reassignment are separately guarded pathways.
DS-07 Quote invariant. Display precise price components, quote ID/version, origin, expiry and consent evidence; a change makes earlier consent unusable.
DS-08 Capacity correctness. Merchant/technician overlapping reservations and leave/reassignment conflict tests; no dual live reservation.
DS-09 Evidence levels. UI, mocked tests, real PostgreSQL/PostGIS transaction proof, real Redis stress, actual provider and field pilot are different. Only applicable higher evidence levels can satisfy launch gates.
DS-10 Financial truth. Direct customer-to-provider money handling is not platform payment settlement, receipt or invoice. No tax or refund capability inferred from a print view.
DS-11 Dispute and safety. Complaint ≠ verified misconduct; investigation actions and evidence are traceable with legal holds/retention and escalation.
## 8. Localization: full English + Telugu contract — L10N
L10N-01 Coverage. 100% of launch-critical customer, merchant, technician, operations and Super Admin UI strings, forms, validation, errors, empty/permission/offline states, push, supported WhatsApp templates, email/SMS where enabled, policies, refund/cancellation/consent/quote text, help centre, metadata and service listings carry language keys and approved translations. No untranslated string in a critical user journey.

L10N-02 Selection. First-run language switch (English / తెలుగు), persist to profile and browser/app preference; guest defaults from user choice/device locale with explicit easy override. Switching does not reset address, form, booking, assigned merchant, notifications, quote consent or privacy state. No hidden locale-dependent authority changes.

L10N-03 Translation quality. Source-of-truth message IDs, ICU-compatible placeholders and pluralization, context notes, glossary, transliteration aliases only for search, Telugu native-speaker review of safety, money, consent, booking, cancellation and support copy; no machine-only unreviewed legal text. Keep exact numbers/amounts/dates/currency, quote IDs and legal meaning consistent.

L10N-04 Search and discovery. Telugu script and English transliterated service synonyms, local area and category aliases, spell-variant matching where validated, normalized search indexing without distorting personal/business names. Merchant may enter bilingual service names; searchable but human-approved display copy.

L10N-05 Forms and input. Telugu Unicode, grapheme-aware limits, safe punctuation, numeric/phone normalization, screen-reader pronunciation guidance, optional romanized search; no forced English entry for names or problems.

L10N-06 Formatting. Locale-aware Indian date/time, INR currency, local phone conventions, address formats, measurements, holidays and district/area naming; server stores timezone-aware canonical values. Never derive consent from a localized label.

L10N-07 Accessibility. Telugu font rendering, shaping, line height, text expansion, screen readers/TalkBack/VoiceOver with correct language attributes, keyboard/focus order and accessible notifications; RTL readiness only if future language requires it (Telugu is left-to-right).

L10N-08 WhatsApp/templates. Provider-approved language variants per notification family; recipient preference honored only if template is actually approved, otherwise clear opt-in fallback policy without fabricated notification. Language change does not resend a past offer or create a new request.

L10N-09 Operations. Admin translation catalogue, owner-controlled reviewed publish, missing-key report, change diff and revision/version; prevent accidental inconsistent financial/safety copy between channels.

L10N-10 Acceptance. Full J01–J16 bilingual E2E matrix, long-string/zoom/mobile layouts, native review sign-off, Telugu search and keyboard, locale switch mid-booking, API error localization, no-price-drift regression, provider-template availability evidence.

Representative terminology (draft, requires native review): Book service → సేవ బుక్ చేయండి; My bookings → నా బుకింగ్‌లు; Service provider → సేవా ప్రదాత; Cancel booking → బుకింగ్ రద్దు చేయండి; Help → సహాయం. These are glossary candidates, not legally approved notification templates.
## 9. UX, screens and design contract — UX
UX-01 Complete screen registry. Existing src/routes is a starting route inventory, not acceptance. Make APP_SCREEN_MATRIX.md covering page, modal, form, drawer, tab, notification, phone/mobile screen, role, permission, API, English/Telugu strings, empty/loading/success/error/offline/denied/stale states, exact journey and automated/manual test. Resolve duplicate /app and /customer or legacy views through validated routing, not blind deletion.

UX-02 Customer screens. Home, catalogue/search/filter, location/addresses, service/merchant, login and OTP, profile, instant/scheduled booking (service/details/photos/address/slot/pricing/review/submit/matching/assignment), detail/progress/timeline, quote, reschedule, cancel, completion, payment record if validated, review, support/dispute, notifications, settings/privacy/language/export/delete, offline/error and legal pages.

UX-03 Merchant screens. Register, complete staged onboarding (business/identity/documents/services/coverage/hours/pricing/team/review/status), pending/appeal, dashboard/offers, active/scheduled/history jobs, job detail/quotes/technician, staff/services/pricing/coverage/availability/calendar, notifications/messages, reviews/analytics, disputes/support, profile/settings/security.

UX-04 Technician screens. Own jobs/upcoming/availability, assigned job detail, directions, acknowledgment, on-the-way, arrival, inspection, quote evidence, customer confirmation, work start/photos/completion, incidents/unavailable, notifications, profile/settings/support.

UX-05 Operations/admin screens. Secure sign-in/MFA, dashboard/analytics, city/area/zone/category/service, customers/merchants/verification/technicians, dispatch/exception board, bookings, quotes, disputes/support/safety/fraud, notification/templates/consent/delivery/costs, policies/pricing, localization/translation approvals, privacy, roles/access/audit, health/logs/incidents/cost, beta/flags/settings/config publish/rollback.

UX-06 Public pages. Tanuku service coverage, service categories, how it works, why Fix Hub, partners/merchant recruitment, FAQ/support, contact, privacy/cookies/terms, cancellation/refund policies where approved, merchant terms, safety, accessibility, unavailable/maintenance/status, downloads/store pages only if actually approved.

UX-07 Premium product design. Cohesive mobile-first professional design, approved Fix Hub brand identity (brand still owner decision), shared tokens/components, accessible contrast, easy touch targets, meaningful motion, dark mode if validated, zero confusing role switching or uncontrolled sample persona contexts. No fake logos, provider counts, delivery status, maps, price, merchant ratings or fabricated testimonials.

UX-08 Quality. Responsive 320/360/390/768/1024/1280/1440/1920 widths; keyboard, touch, zoom/reflow up to 400%, WCAG 2.2 AA, reduced motion, browsers Chromium/Firefox/WebKit and real device Android/iOS. Clear progress and error recovery; never show fake success when backend fails.
## 10. Trust, economics, compliance and fair marketplace — TR
TR-01 Merchant participation. Free basic listings and onboarding. Reviewed verification status/expiry, no pay-to-win dispatch or concealed sponsored rank. If later paid products exist, maintain basic fair route and obtain owner decision/transparent disclosure.

TR-02 Merchant trust. Verify only what is actually checked; avoid describing identity checks as proof of craftsmanship, certification or insurance. Recertify by risk and expiry. Protect documents and minimize collection.

TR-03 Customer trust. Clearly distinguish Fix Hub as marketplace/coordinator from independent provider (subject to counsel); service safety, complaints, refunds, guarantees and liability must match approved legal obligations and operating practice.

TR-04 Direct payments. At present payment gateway, escrow, settlement, GST invoice, refund workflows and merchant compensation rules are not approved merely because frontend labels or API summaries exist. Define clear truthful direct-payment record and no invoice implication until legal/commercial evidence and integration.

TR-05 India legal verification. Obtain current professional review of relevant marketplace/e-commerce consumer obligations, DPDP implementation applicability, IT/intermediary rules if applicable, merchant identity/data handling, GST/e-commerce operator rules, employment/contractor classification, emergency and safety policies. No hardcoded claim a specific incorporation/GST/DLT step is universally mandatory before applicability is checked.

TR-06 WhatsApp/telecom. Official Meta WhatsApp Business Platform with actual account eligibility, templates/windows, opt-in/opt-out, phone verification, provider charges, webhook/auth, callback provenance and delivery receipt limits. SMS/voice DLT registration and templates only if those channels are enabled and applicability verified. No unsolicited marketing blasts.

TR-07 Commercial feasibility. Real Tanuku customer and merchant interviews, supply availability, field training, service category economics, support staffing, failure handling, complaint resolution, verified recurring costs and acceptable conversion—not simulated financial claims. ₹50,000 planning allowance is not evidence of full launch affordability.

TR-08 Coverage/expansion. Tanuku release region first, new regions require on-the-ground supply, localized operations, actual maps/geocoding coverage and cost approval; city configuration alone is not market readiness.

TR-09 Accessibility/ethics. Seniors/low literacy, Telugu-first, screen reader, manual support, safe identity verification and fraud reporting; never penalize users for not granting location or installing app.
## 11. Data, API, privacy, security and reliability product contracts — SR
SR-01 Canonical data. PostgreSQL/PostGIS authoritative models: account/roles, customer/address, merchant/verification/services/zone/staff/capacity, request/offer/generation/assignment/booking/version, quote/quoteConsent, work evidence, review/dispute/support, notification/outbox/provider attempts, audit, config/flags, language preference and privacy requests. Redis advisory coordination; queue/outbox resilience. Preserve existing migrations and compatible external APIs.

SR-02 Authorization. Deny-by-default per actor, organization/merchant, booking and field across REST, websocket/SSE, media, search, exports, admin and background jobs. Unauthorized data is not leaked in response details/errors/URLs/cache. Public endpoints never expose evidence images, contact phone, exact residential address.

SR-03 Privacy. Purpose-limited collection, consent or appropriate lawful basis, encryption transit/at-rest, role-specific retention, data export/correction/delete, processor inventory, backup retention expiry, limited diagnostic visibility, no data sale, no default AI training. Do not claim “no customer data is processed”; marketplace operation necessarily processes customer information.

SR-04 App/web security. Input schemas, size/upload/file scanning, SQL parameterization, CSRF protection for cookie auth, secure session/cookie/token rotation, MFA privileged roles, CORS allowlist, CSP/HSTS/security headers applied without breaking app/widget, XSS/SSRF checks, rate limit, anti-enumeration, webhook signature/replay, queue/job idempotency, dependency/SBOM/license and secret-history audits.

SR-05 Data integrity. ACID winner/capacity, version/optimistic concurrency, payload-bound idempotency, mutation audit and stable event ordering; no manual Admin action bypasses state machines. Transactional outbox and bounded retries; provider ACK vs actual delivery vs user acknowledgement distinguished.

SR-06 Operational observability. Request/correlation IDs, structured redacted logs, metrics/traces, alerting, job/queue/Redis/DB health, secure incident export and audit; short objective for detection and triage but no guarantee all bugs are fixed “in seconds”.

SR-07 Safety/resilience. Safe replays after worker outages/network splits, backup/restore drills in disposable environment, off-host encrypted backup, Caddy/TLS/Hostinger or owner-approved deployment boundaries, controlled migrations/rollbacks, runtime capacity/DoS review and incident runbooks.

SR-08 Availability correctness. No false immediate booking if no merchant active, location unsupported or out of hours; show pending/retry alternatives; SLA targets measured from real pilot and approved by owner.
## 12. Analytics and success criteria — AN
All metrics expose numerator/denominator, event source, interval/time zone, exclusions, freshness and role-authorized drilldown. No imaginary revenue, GTV/GMV, active merchants, SLA or five-star rating.

| Metric | Canonical definition / evidence |
|---|---|
| Valid service requests | Unique backend-committed requests, exclude synthetic, rejected, and idempotent retries |
| Eligible offers | Distinct version/generation offers whose policy checks passed when created |
| Assignment success | Requests with one backend-committed valid assignment / eligible request cohort |
| Time to assignment | Server request-created → committed assignment, report distribution, failures and censoring |
| Double-assignment rate | Unique requests with more than one simultaneous valid live assignment (target zero; prove via DB race tests) |
| Capacity conflict rate | Valid acceptance attempts denied due to current capacity / relevant eligible attempts |
| Quote consent adherence | Chargeable work with matching signed/current quote consent / applicable work starts |
| Completed services | Customer-confirmed or contractually permitted evidenced closeouts, separately categorized |
| First support response | Case creation → actual authorized staff response; bot/auto receipt separate |
| Verified merchant supply | Distinct currently verified eligible businesses by category/service area, not applications |
| Service cancellation/reassignment | Counts by source/reason and verified state history |
| Language usability | Bilingual workflow pass rates, missing-string incidents, reviewed template availability |
| Notification outcomes | Provider accepted/sent/delivered/read (if supported), retries, failed, unsubscribed separately |
| Financial totals | Direct merchant-customer payment reports separate from actually settled platform revenue |

Use privacy-preserving aggregation and no cross-user tracking without lawful basis.
## 13. End-to-end acceptance journeys — J
Each journey is defined in English and Telugu where customer/staff-facing, plus valid, invalid, unauthorized, network/provider-down, duplicate/replay, cross-actor, mobile, accessibility and recovery variants.
- J01 Discover Tanuku category/service/provider with eligible location and unknown/no-supply states.
- J02 Customer register/login/OTP/recovery, permissions and preference persistence.
- J03 Instant booking from service → location → details/photo → review → submit → searching → one committed merchant winner.
- J04 Scheduled booking with slot and availability changes, cancellation before accept, retry after timeout.
- J05 Merchant free register → staged verification → approval/appeal → active listing and eligibility.
- J06 Merchant capacity/hours/zone update → valid offers; race with conflicting assigned work.
- J07 Two or more merchants accept concurrently → exactly one winner; loser sees definite denial; redis failure/restart recovery.
- J08 Merchant→technician job assignment → arrival → inspection → versioned quote → customer consent → work → customer confirmation.
- J09 Quote revision invalidates previous acceptance and blocks old-price work; unknown fees never shown as zero.
- J10 Customer reschedule/cancel and merchant no-show/unavailable → safe generation change/reassignment, no ghost assignments.
- J11 Book across website/Android/iOS/WhatsApp, where official channel approved, then refresh latest canonical status with verified identity.
- J12 WhatsApp opt-in, template/window decision, dispatch, provider failure, opt-out, retries and suppression.
- J13 Private review, complaint/dispute, evidence, ops response, appeal and policy resolution.
- J14 Technician assigned-only access and revocation, cross-merchant/customer data denial.
- J15 Super Admin verification/dispatch/flag/template/config draft→publish→rollback with MFA and audit.
- J16 English ↔ Telugu switch during booking, pricing, quote, cancellation, WhatsApp and support, with persistent safe state.
- J17 Device offline, restart, expired session, revoked grant, DB/Redis/worker outage and restoration with zero duplicate side effects.
- J18 Data export/delete/retention and staff redacted support trace access with privacy/audit checks.
- J19 Closed pilot: invite consenting users/merchants, gated feature exposure, feedback, rollback and no external public release.
- J20 Owner GO: complete launch gates, store and provider approvals, protected deploy, migration/backup, staging smoke, real mobile review, real Tanuku field workflow and verified support operation.
## 14. Operational delivery and CI acceptance (product-level expectations only)
Engineering Standards will later specify implementation commands and toolchain. At the product level, every launch module and channel must pass: unit, integration, contract/API, real database concurrency, smoke, sanity, critical-path, regression, E2E, security/abuse, privacy, cross-role authorization, localization, WCAG 2.2 AA, cross-browser/mobile, network failure, provider failure, recovery, performance/load and retention tests. Critical public actions require manual exploratory assessment as well.

GitHub automation expectation: checks on development pushes/integrations, scheduled full regression, manual workflow_dispatch suites, pre/post isolated staging deployment, artifact/evidence provenance, fail-closed promotion. Production deploy only from protected main through a deliberately triggered owner-authorized workflow with reviewers, exact commit/artifact, safe migrations, backups, smoke/sanity/critical validation, monitoring and tested rollback. Repo presently exposes docs-validation.yml, which runs tests, typecheck, build, npm audit, and documentation validators on pushes and pull requests to main (section 1.1); do not claim complete workflows already exist from local npm scripts.

Beta is pre-launch, isolated and consenting. Sensitive official provider test numbers and real pilot messages remain owner/partner authorized. No production customer data in CI fixtures. Admin configuration publishing is audited and different from code deployment.
## 15. Required complete-app acceptance gates — G
PASS requires a source, environment, commit/build SHA, actual test/run and reviewer/owner record; otherwise FAIL, BLOCKED, NOT_ASSESSED or explicitly NOT_APPLICABLE with rationale. The one coordinated launch may not be declared ready until every applicable mandatory gate passes. No weighted average can hide a hard blocker.

| Gate | Required evidence before public launch |
|---|---|
| G01 | Current repo audit, exact SHA, clean backup/history, legacy-demo reconciliation and real migrations/model parity |
| G02 | All customer/merchant/technician/ops/admin routes have tested API contracts, real data and no fake backend success |
| G03 | All requirements, screen inventory, journey matrix and bilingual strings traced to passing evidence |
| G04 | Tanuku customer demand, willing verified providers, staffing, service-zone and unit-economics field evidence |
| G05 | Merchant free registration, verification, re-review, capacity and category governance actually work |
| G06 | Postgres/PostGIS-based multi-worker race proof gives one valid committed winner and no oversell |
| G07 | Full instant/scheduled booking, quote exact consent, service, cancellation, reassignment and completion verified |
| G08 | WhatsApp official provider permissions, opt-in/windows/templates, secure webhooks and real approved test account evidence |
| G09 | Customer/merchant Android and iOS actual-device tests, signing/build, store acceptance, push/deeplink/permissions evidence |
| G10 | Website/PWA and cross-channel booking identity and current-state continuity verified |
| G11 | Human support, emergency escalation, disputes, reviews and operational staffing ready |
| G12 | Complete English/Telugu UX, native-reviewed policy copy, notifications/templates, search and accessibility PASS |
| G13 | Per-role access and tenant/booking/case isolation, MFA and authenticated device/session recovery PASS |
| G14 | Security OWASP web/API/mobile, CSP/headers/input/upload, dependencies/SBOM, secret history and remediation PASS |
| G15 | Complete CI automatic/nightly/manual suites executed (not merely declared); actual failure blocks integration/release |
| G16 | Staging deployment, smoke/sanity/critical, E2E, load/fault, backup/restore and rollback drills PASS |
| G17 | Owner-authorized protected-main production workflow and DNS/TLS/host monitoring pass; no autonomous prod dispatch |
| G18 | Public claims, provider listings/prices/availability/ratings/location all factual; no synthetic/demo data as live |
| G19 | Admin policy/config draft→review→publish→rollback, feature flags/beta and complete audit PASS |
| G20 | Secure metrics, searchable redacted diagnostic traces, alerting, incident runbooks and role-scoped export PASS |
| G21 | Legal/compliance review: applicable India marketplace/privacy/tax/communications terms; approved operational policies |
| G22 | Privacy requests/export/deletion, retention, consent, backups and processor mapping tested |
| G23 | Provider outage, callback replay, lost ACK, duplicate notification and customer/merchant reconciliation tested |
| G24 | Cost and capacity assessment: real WhatsApp, SMS/push, maps, hosting, monitoring, mobile/app-store, staff and merchant operations |
| G25 | Independent security/quality review, field pilot with real consenting users, owner GO and stabilization/rollback plan |

### 15.1 Gate naming and map to the roadmap
The V4.1 roadmap uses gates G0–G5 and this specification uses launch gates G01–G25. To avoid confusion, new documents write roadmap gates as RG0–RG5.

| Roadmap gate | Meaning in V4.1 | Related launch gates |
|---|---|---|
| RG0 | Foundation, requirements, feasibility | G01, G03, G04 |
| RG1 | Branding and complete UI/UX approved | G12, G18 (and D02) |
| RG2 | Frontend portability and mobile compatibility proof | G09, G10 |
| RG3 | Backend, dispatch, integrations, client verified end to end | G02, G05–G08, G10, G23 |
| RG4 | Security, operations, private pilot, store approvals | G09, G11, G13–G16, G19–G22, G24 |
| RG5 | Owner GO for the single public launch | G17, G25, D16 |

Until the owner amends the roadmap (D01), RG0–RG5 keep their current meaning and order.
## 16. Product documentation, decisions and transition instructions
### 16.1 Mandatory product documentation
Maintain product charter, vision/mission, complete PRD, stable requirement ID inventory, FEATURE_MATRIX.md, APP_SCREEN_MATRIX.md, JOURNEY_MATRIX.md, LOCALE_MATRIX.md, CHANNEL_CAPABILITY_MATRIX.md, SERVICE_CATEGORY_MATRIX.md, PROVIDER_PERMISSION_MATRIX.md, DISPATCH_STATE_MATRIX.md, COMPLETE_LAUNCH_GATE_MATRIX.md, GAP_MATRIX.md, RISK_REGISTER.md, PROGRESS.md, QUALITY_AUDIT.md, blocker.txt, ADRs, API/security/privacy/operations runbooks, merchant field onboarding, WhatsApp/app-store approval evidence and legal policies. Update existing canonical files instead of creating contradictory duplicates.
### 16.2 Owner decisions requiring explicit answers/evidence
- D01: Approve this consolidated one-launch product scope as the intended successor to old phased implementation goals; preserve phases as internal workstreams only.
- D02: Confirm current Fix Hub branding, logo/domain and visual identity (currently not final in governing docs).
- D03: Confirm exact launch service categories, inspection/parts/travel-charge policies and no-guarantee wording.
- D04: Approve identity/OTP channels and cost cap; verify owner-owned sender identities.
- D05: Approve official WhatsApp account/provider, number, template/opt-in policy and budget.
- D06: Approve Android/iOS technology, store publisher accounts, supportable devices and maintenance costs after compatibility proof.
- D07: Confirm Tanuku town/area boundaries, expansion condition and real merchant field evidence.
- D08: Approve merchant safety verification evidence, review authority and lawful identity data collection.
- D09: Decide platform payment scope, invoice/tax language, cancellation/fee/refund policy after counsel/CA review (do not default to payment gateway).
- D10: Approve privacy/retention/processor policy and legally applicable disclosures.
- D11: Approve support staffing, hours, incident responsibilities, escalation and pilot targets.
- D12: Approve hosting, backups, DNS, secrets, domain, production workflow authority and budgets.
- D13: Approve required performance/SLA targets from load and real-field baselines, without fake targets.
- D14: Approve restricted beta participants/feature flags and consent protocols.
- D15: Confirm no ads/paid ranking and basic listing free; future monetization needs separate product authority.
- D16: Approve full public-launch decision only after G01–G25 and official provider/app-store/field operations evidence.
- D17: Approve the git workflow for autonomous development (a development integration branch with main owner-only, matching the other Viswatra projects) and the matching update to AGENTS.md and the work-authority record.
- D18: Decide the disposition of commit #21 code: merge its useful parts into the canonical persistence and identity model (FR-2, FR-3) or retire it, after the FR-1 security fixes.
### 16.3 Reconcile, don't erase, existing plan
The older V4.1 roadmap 00–19, detailed workstream documents and stage-gate policy remain valuable internal planning and historical evidence. This new proposed single product spec changes how completion is framed: overall app completeness and a single coordinated external launch are primary; internal milestone numbers never confer customer availability. If current formal phase-exit controls remain legally/operationally binding, they continue to require owner action until explicitly amended, not ignored. Phase 01's 10/10 rescored criteria are not an approval to bypass real market/provider validation. No implicit permission to deploy, buy, launch apps, publish WhatsApp, contact merchants, or run live payment/refund workflows is created by this spec.
### 16.4 Final product owner statement
Build Fix Hub as one complete, genuinely working, Telugu-and-English, trusted local-service coordination product, with separate customer and merchant experiences, an independently permissioned technician workflow, private operations/Super Admin, and authoritative web–Android–iOS–WhatsApp continuity. Keep code, design, legal/commercial assumptions and proof of operation clearly separated. Build and validate everything needed for the approved launch scope before one coordinated public release.
## 17. Carefully selected differentiators and enhancements — EH (v1.2 additions)
These enhancements increase trust, retention, usability and local-market differentiation. They are not evidence of existing code, and an EH requirement does not silently authorize payments, insurance, background location surveillance or AI booking. Every enhancement must map to an owner-approved launch classification (LAUNCH_REQUIRED, LAUNCH_OPTIONAL, POST_LAUNCH_CANDIDATE, NOT_APPROVED) in FEATURE_MATRIX.md, plus explicit cost/legal/provider dependencies; no omission from an all-launch-required gate without an owner scope amendment. Initial suggestions below are proposed, not owner-approved.

| ID | Enhancement | User experience and acceptance | Proposed classification |
|---|---|---|---|
| EH-01 | Trust Passport for each merchant | Visible verified business identity scope, relevant skills/permit checks where legally appropriate, verification date, recheck date, operating area and actual review provenance; no universal “background checked” claim | LAUNCH_REQUIRED |
| EH-02 | Price Clarity Card | Before request and before work, clearly separate known inspection charge, estimated labour, parts not yet known, taxes if applicable, policy version and who collects payment; approval bound to exact quote version | LAUNCH_REQUIRED |
| EH-03 | Service Evidence Timeline | Timestamped authorized actions from request to completion, quote decisions, work notes and consent; photographs strictly access-scoped, optional, minimized and removable subject to lawful retention | LAUNCH_REQUIRED |
| EH-04 | No-provider rescue flow | When no valid supply exists, show truthful next steps: change location/time, leave an explicit request-for-follow-up with consent, or contact staffed support; do not fabricate an available worker | LAUNCH_REQUIRED |
| EH-05 | Senior-friendly Telugu-first mode | Simplified big-type guided flows, no compulsory GPS or app installation, concise Telugu safety/price copy and accessible manual-assisted booking with actual authority | LAUNCH_REQUIRED |
| EH-06 | Operator-assisted booking | Trained support staff may help users who cannot use apps; consent, identity proof, purpose and actor recorded; no OTP bypass or stealth proxy-account use | LAUNCH_OPTIONAL |
| EH-07 | Merchant capacity calendar | Visible busy intervals, technician skills and conflicts, blackout days, holiday rules; prevents simultaneous booking against one capacity slot | LAUNCH_REQUIRED |
| EH-08 | Coverage and demand gap heatmap | Privacy-safe, aggregated unmet demand and supply by Tanuku area/category/time; minimum cohort thresholds, no exposing precise household addresses | LAUNCH_OPTIONAL |
| EH-09 | Dispatch fairness and explanation | Staff sees reason codes (distance, eligible category, verification, capacity, availability) and distribution diagnostics; no paid ranking, hidden priority, or guaranteed rotation that violates first-valid-acceptance | LAUNCH_REQUIRED |
| EH-10 | Identity-safe household and address book | User-owned named addresses and optional household scheduling delegation via explicit granular grant, expiry and revocation; never infer family relationship or share another person's bookings | POST_LAUNCH_CANDIDATE |
| EH-11 | Service reminders and maintenance history | Opt-in AC servicing/appliance check reminders from known service dates, configurable frequency and opt-out; no invented diagnostic urgency or unsolicited promotions | LAUNCH_OPTIONAL |
| EH-12 | Repeat service / favorite merchant | Customer can request a previously used merchant if currently eligible, without bypassing verification, availability, scope, capacity or fair-dispatch rules | POST_LAUNCH_CANDIDATE |
| EH-13 | Trust and fraud signals | Flag duplicate/fraudulent reviews, suspicious dispatch patterns and abusive requests for human review with evidence and appeal; do not automatically blacklist based on opaque scores | LAUNCH_OPTIONAL |
| EH-14 | Reliable quote revisions and dispute packet | Users can compare quote versions, flag missing scope, report work variance, and privately share a minimally necessary case packet with authorized staff | LAUNCH_REQUIRED |
| EH-15 | Service quality learning loop | After completed verified jobs, collect optional structured feedback about punctuality, price clarity and workmanship; avoid public star ratings based on synthetic or unverified work | LAUNCH_OPTIONAL |
| EH-16 | Safe location and privacy controls | Separate approximate area for search from exact address shown only to confirmed assigned merchant/technician; explicit stop-sharing and access audit | LAUNCH_REQUIRED |
| EH-17 | Merchant microbusiness toolkit | Free job calendar, basic performance insights, quote templates, customer-approved work records, staff access and business-hours management; no invented net earnings | LAUNCH_OPTIONAL |
| EH-18 | Optional conversational booking assistance | Future Telugu/English guided assistant for service category triage and form filling, with explicit AI disclosure, user confirmation before submission, and no safety diagnoses or unsupported promised providers | POST_LAUNCH_CANDIDATE |

Enhancement exclusions: do not silently introduce paid listing/ranking, subscription paywalls, payment gateways, fee guarantees, worker background checks without actual verification, predictive emergency advice, always-on tracking, telemarketing, unsolicited WhatsApp outreach, or AI autonomous booking. New benefits may never weaken DS-03 first-wins, SR-02 privacy or verified supply requirements.
### 17.1 Full app UX — functional completeness checklist
Cover real public/SEO, customer, merchant, technician, operations/support, reviewer/trust and Super Admin navigation, including every route, modal, document export and event notification in each supported language. Required transversal capabilities: saved search/filter state; paginated empty lists; duplicate/delayed request handling; explicit permission-denied and session-expired recovery; account and merchant suspension; protected edit drafts; compare/confirm/undo for permitted mutations; stable notifications; search and exports with RBAC; app lifecycle background/resume; consent and terms version display; accessible error summary; connectivity status; versioned policies; and truthful unsupported-feature state. Every entry is tied to role, API, event, permissions, locale and automated/manual acceptance case in APP_SCREEN_MATRIX.md.
## 18. Comprehensive quality, testing and release acceptance — QA (v1.2)
Non-negotiable rule: testing is not satisfied by test file names, self-reported percentages, green documentation validation, mocked happy paths, or a one-machine simulation of Redis. Each applicable test must run in its named environment against the exact code/artifact and have retained redacted evidence. All roles, channels, product features, languages and applicable platforms are in scope. The 25 existing launch gates G01–G25 remain authoritative; QA IDs refine evidence required by those gates rather than adding a second contradictory launch system.
### 18.1 Test categories and required cases

| ID | Test category | Minimum explicit coverage |
|---|---|---|
| QA-01 | Unit and boundary tests | Every new domain rule, calculation, input validator, consent/quote/state machine, error branch, locale formatter, helper and component behavior |
| QA-02 | API contract and schema | OpenAPI request/response shape, version compatibility, role-specific DTOs, validation, pagination, idempotency, error codes, HTTP semantics, cache headers |
| QA-03 | Real database integration | PostgreSQL migrations and transactions, constraints, unique keys, PostGIS location selection, rollback/restore, multi-row concurrency, real persistence after restart |
| QA-04 | Atomic dispatch adversarial tests | Multiple processes/instances accept same offer; race with expiry, cancellation, reassign, invalid verification, capacity shrink, lost ACK, Redis outage, DB crash; one committed assignment and capacity reservation |
| QA-05 | Authn/session/OTP | Registration, verified delivery, rate limits, recovery, token rotation/revocation, device switching, expired sessions, replay, anti-enumeration; reject client role assignment, fixed OTP and default JWT secrets |
| QA-06 | Role/field/object authorization | Visitor, customer, merchant owner/manager, technician, operations, reviewer, Super Admin: positive and negative matrix across every read/write/search/export/media/queue/webhook/admin path |
| QA-07 | Full customer journey E2E | Instant and scheduled booking, address/serviceable area, quote revision/consent, cancellation, review, support, privacy; happy, error, abandonment, retry, stale-version and negative cases |
| QA-08 | Full merchant journey E2E | Free enrollment, verification rejection/appeal, service/price editing, dispatch accept/lose, capacity, technician assignment, completion, dispute, availability and status changes |
| QA-09 | Technician journey E2E | Job-scoped identity, assigned-only data, arrival/inspection/work/evidence/quote, permission revocation, shift conflict, offline retry; no independent dispatch authority |
| QA-10 | Admin, reviewer and operations E2E | Verification separation of duties; catalog/zones/prices, incident handling, read-only audit, config draft–review–publish–rollback, beta flag dependencies, MFA and restricted log exports |
| QA-11 | Browser-level E2E | Actual Playwright Chromium, Firefox and WebKit on real app screens and API; existing Supertest suite cannot be relabeled Playwright |
| QA-12 | Responsive visual/function | 320, 360, 390, 768, 1024, 1280, 1440, 1920px, portrait/landscape when relevant, long strings, keyboard-only, touch, clipping, forms, dialogs, tables, navigation |
| QA-13 | Accessibility | WCAG 2.2 AA automated axe plus manual NVDA, TalkBack and VoiceOver, semantic input labels, focus, modal traps, 200/400% zoom, reduced motion, screen reader announcement of async states |
| QA-14 | Full bilingual locale | en-IN and te-IN keys/ICU interpolation, plural/case/currency/date/time, Telugu search/sort, critical policy/legal copy native review, language switch mid-booking and cross-device preference sync |
| QA-15 | Official WhatsApp contracts | Inbound and outbound permissions/windows, approved Telugu/English template variants, opt-in/out, provider signatures, timestamp/replay, reordered callbacks, provider acceptance vs actual delivery, rate/spend caps and reconciliation |
| QA-16 | Notifications and outbox | App/push/WhatsApp/email or SMS when activated, duplicate/retry/lost ACK, leases, worker crash, dead letters, cancel/opt-out before send, stale link resolution and opt-out propagation |
| QA-17 | Mobile Android | Real supported-device build/install, login, auth deep link, permissions, photo/location capture, FCM, foreground/background recovery, app kill/restart, upgrade, offline, language and accessibility |
| QA-18 | Mobile iOS | Signed/TestFlight candidate as authorized, physical device, APNs, app lifecycle, camera/location/permission changes, deep link, session recovery, locale, VoiceOver, app-store policy compliance |
| QA-19 | Data privacy and rights | Export/correction/deletion, legal hold, minimal location access, masking, consent withdrawal, processor propagation, retention expiration, backups/data restores, role-scoped telemetry; never use live customer data in CI |
| QA-20 | App/API security | OWASP Web/API/Mobile, CSRF/XSS/SQLi/SSRF/IDOR/BOLA/BFLA, content security policy, HSTS/CORS/cookie/security headers, request size and file bombs, rate limits, session abuse, webhook signing |
| QA-21 | Supply-chain security | Secret scan of current tree and git history, dependency CVEs/direct/transitive, SBOM, licenses, provenance and reviewed GitHub actions; require credential rotation for exposed secrets |
| QA-22 | Lint and format | Real ESLint, Prettier and strict TypeScript on all applicable tracked source/config/docs (with documented generated/binary exclusions); no custom grep script presented as ESLint or formatter |
| QA-23 | Reliability/fault injection | Disposable PostgreSQL/Redis/worker/network outage, queue backlog, restart, partial write, duplicate callbacks, clock skew, webhook delay, device disconnect, reconciliation and recovery integrity |
| QA-24 | Performance/load/soak | Real DB spatial query/explain plans; p50/p95/p99 API and dispatch, concurrent acceptances, worker lag, notification delivery, mobile/network use, capacity saturation; thresholds proposed from reproducible baselines for owner signoff |
| QA-25 | Observability/incidents | End-to-end correlation from UI→API→DB/outbox→provider, synthetic error injection, sanitized logs, correct alerts, audit access, secure log export, runbook, rollback and detection/response evidence |
| QA-26 | Financial and commercial truth | Free listings always free; direct payments not shown as platform settled, service records not invoices, fees/cancellation only approved, numerators and denominators correct, no invented GMV or payout |
| QA-27 | Location and maps | Tanuku zone inclusion/exclusion, inaccurate GPS, location permission denial, PostGIS boundary behavior, geocoder failure, stale zone config, no leakage of exact residential coordinates |
| QA-28 | Fraud/safety/abuse | Fake merchant attempts, unauthorized self-verification, false review, malicious uploads, scam complaints, unsafe service escalation, abusive users and evidence-chain integrity; human review and appeal |
| QA-29 | Demo/production truth | No fictitious providers, prices, maps, bookings, ratings, support confirmations or route success in production; preview/demo data isolated and unmistakably labeled; test credentials absent |
| QA-30 | Beta/cohort/feature flags | Selected consenting users, staff scope, deterministic assignments, kill switches, no permission bypass, controlled disable/re-enable and data cleanup; beta is never a public stealth release |
| QA-31 | Deployment and rollback | Separate staging, migration dry run, artifact SHA/signature/checksum, dependencies/ports/TLS, pre/post smoke/sanity/critical, restore, rollback of app without unsafe DB reversals, owner-only production dispatch |
| QA-32 | SEO/public/web compatibility | Tanuku localized landing/service pages, lang/hreflang/canonical, sitemap, metadata, structured data only if factual, URL deep links, real forms and privacy/legal reachability |
| QA-33 | Human field acceptance | Consenting Tanuku customer + real eligible merchant + actual technician on approved channels; true verification/availability/assignment/quote/support; field conditions separate from synthetic CI |
| QA-34 | Documentation/governance integrity | Requirements↔API↔screens↔test↔run↔release evidence, roadmap authority, AGENTS.md, blocker.txt, current deployment runbooks, privacy policies, provider permissions, licensing and incident docs reconcile |

### 18.2 Executable scenario matrix for every module and screen
For each CX/MX/TX/AX/CH/DS/L10N/UX/TR/SR/AN/EH requirement and each route:
1. Success and realistic normal data (not a hard-coded fake result); first visit and returning user.
2. Invalid, missing, oversized, malicious or contradictory input; invalid transitions; schema, HTTP and UI error correctness.
3. Wrong actor/role, wrong merchant/customer/technician/case, wrong session, revoked entitlement and cross-tenant leakage attempts.
4. Delayed, reordered, duplicate and concurrent requests; retries with same and changed payload; 409/conflict and no phantom success.
5. Provider, database, cache, worker, mobile network and authentication outage/restart, partial failure and data recovery.
6. Abandon/cancel/resume; browser navigation; app background/process death; stale cache/optimistic UI reconciliation.
7. EN and TE locale, long translated content, invalid/missing catalog key and persisted locale on device switch.
8. Accessibility, small screen, keyboard, touch, zoom, screen-reader and offline/error states.
9. Privacy, consent, opt-out, retention, data export/deletion, audit, secure logs and suppression before notification.
10. Performance under baseline and bounded stress; cost and provider rate limits where applicable.
11. Admin configuration/feature-flag changes, preexisting customer/merchant state compatibility and rollback.
12. Data migrations, upgrade/version compatibility, backup/restore and release regression for affected journeys.
TEST_MATRIX.md uses columns: test ID, product requirement, screen/journey, role, locale, channel, environment, scenario category, expected result, fixture origin, command/workflow, run ID, exact SHA, evidence, owner and status. A passing happy-path test never compensates for an untested denial or known critical issue.
### 18.3 Mandatory GitHub CI/CD trigger and deployment acceptance contract

| Trigger | Minimum quality suite | Proof required |
|---|---|---|
| Every task/dev push | Real ESLint + Prettier, TypeScript, unit tests, dependency vulnerability + license/SBOM + secret scans, build, docs/contract validators | Actual CI run and fail-on-error, exact SHA |
| Development integration | Above + real disposable PostgreSQL/PostGIS, auth and role-denial, state/dispatch concurrency, migration parity, API integration, smoke/sanity, Chromium critical E2E, changed-screen axe/responsive/English-Telugu, changed-code coverage | Re-run on integrated SHA; no skipped critical checks |
| Every major module | Full impacted module positive/negative/recovery regression, all three Playwright browsers, localization, privacy/security and manual accessibility evidence | Module test matrix and reviewer approval |
| Nightly scheduled | Whole active-scope regression on all browsers and languages, DB/Redis/worker recovery, canonical dispatch races, security/dependency scanning, mobile build checks where supported | At least one real scheduled run before claiming verified |
| Manual workflow_dispatch | Explicit selectors for unit, api, integration, smoke, sanity, critical, regression, e2e, accessibility, responsive, localization, security, dependencies, secret-scan, migrations, dispatch-race, whatsapp, mobile, load, restore, all; module/browser/allowed environment selectors | Each advertised selection maps to a real command; no production provider sends |
| Pre-staging deployment | Artifact provenance and SHA, scans, passing checks, DB migration dry run, secrets/environment/backup and allowlisted host verification | Explicit protected staging approval and reports |
| Post-staging deployment | Health (web/API/DB/PostGIS/queue), smoke/sanity/critical bilingual booking flow, permission denial, no dummy data, logs/alerts, stable worker recovery | Verified environment-specific acceptance and rollback-on-failure record |
| Preproduction release candidate | Full regression, security, manual a11y/Telugu review, real mobile and approved WhatsApp evidence, measured load/soak, off-host backup and restore, disaster recovery, field pilot and every G01–G25 gate | Missing applicable gate = NO GO |
| Production deployment | Owner-only protected main manual workflow; typed confirmation, GitHub environment reviewers, exact immutable artifact, controlled migration and backup, pre/post smoke/sanity/critical, live health, monitoring, rollback/recovery | Operator approval and production run evidence; no autonomous production action |

Fail-closed CI is acceptance tested with negative fixtures (deliberately failing test, vulnerability/secrets fixture, under-threshold coverage, incompatible migration and blocked permission) on disposable branches, never exposing real secrets. GitHub workflows must not automatically deploy production on a push. Signed actions/immutable SHA refs and environment-scoped least-privilege secrets are mandatory. Test artifacts/redacted logs never contain actual contacts/addresses/verification documents.

Manual release operator responsibilities: official WhatsApp template/provider approval, Indian policy/privacy/legal review, consented Tanuku field tests, app-store signatures and approval, actual Hostinger or owner-approved infrastructure, production provider keys/DNS/TLS, real monitoring and off-host backups. Automation never invents their completion. The OS is not considered a completed public product just because CI is green.
### 18.4 Test evidence, severity and reporting
- Evidence levels: SPECIFIED, OBSERVED_CODE, TESTED_UNIT, TESTED_INTEGRATION_REAL_DB, TESTED_BROWSER, TESTED_STAGING, VERIFIED_PROVIDER, VERIFIED_REAL_DEVICE, FIELD_VALIDATED, LIVE (only after owner-authorized deployment). Levels are labels, not a single ladder; satisfy the specific requirement with appropriate evidence.
- Test statuses: PASS, FAIL, BLOCKED, NOT_RUN, SKIPPED_WITH_REASON, FLAKY, NOT_APPLICABLE with proof and reviewer. Skipped mandatory gates block release. Retried-pass tests remain flagged flaky until root cause/fix and rerun.
- Each defect: severity, reproduction and safely redacted logs, affected customer/merchant data scope, RCA, fix commit, new regression test, impacted tests, independent review, deployed verification and closure evidence.
- Security Critical/High: affected release NO GO until fixed and independently validated; no agent-created risk acceptance. Risk exceptions follow the Viswatra Global Engineering and Quality Standard v1.1, Category 22: an independent security assessment, documented severity, exploitation conditions, affected data, compensating controls, expiry and re-evaluation dates, the owner's recorded decision and compliance confirmation in `RISK_EXCEPTIONS.md`. There is no generic waiver; an unresolved exploitable critical vulnerability is never declared production-ready; an exception never replaces legal or regulatory compliance; agents cannot create or approve exceptions.
- Every release matrix records numerator/denominator by feature, screen, language, role, channel, test class, environment and gate; no global “100% complete” from self-reported or partial checks.
- Implement real ESLint/Prettier and browser E2E, not name-only placeholders. Preserve existing documentation validator, API integration tests and existing source history.
### 18.5 New product journeys added in v1.2
- J21: Senior Telugu-first customer books with location denied and assisted support; complete identity, informed quote and no privacy bypass.
- J22: Merchant verification expires during an open offer; acceptance denied safely, active assigned jobs handled through approved policy.
- J23: Customer's selected technician is already reserved by another simultaneous booking; no oversell and clear alternative availability.
- J24: Two customers request the same merchant while supply is saturated; fairness and deterministic capacity constraints upheld.
- J25: Customer compares a quote revision against previous approved amount and opens a private dispute packet; old consent cannot authorize work.
- J26: Opted-in service reminder delivered only via authorized channel; opt-out/revocation immediately suppresses queued unsent message.
- J27: Incident report raised with opaque correlation reference; authorized support sees only case-scoped redacted trace, exports are audited.
- J28: Staff edits a zone, category, holiday or pricing rule while bookings exist; new requests get current policy, historical agreements remain unmodified.
- J29: Closed-beta merchant uses feature flag; cohort exit or kill switch removes feature without breaking outstanding bookings or exposing data.
- J30: Production-candidate fails security, Telugu review, WhatsApp provider approval or actual mobile test; launch is blocked with reason and no deceptive status or automatic scope reduction.
### 18.6 Owner decisions appended (do not resolve by assumption)
- D19 — Enhancements: approve which EH-01–EH-18 are mandatory for the single public launch versus optional/future, and their associated costs. The proposed classification is not binding yet.
- D20 — Localized assisted support: permit operator-assisted booking and determine user consent/identity, hours, staffing and data visibility.
- D21 — Maintenance reminders: allow opt-in service reminders and choose approved outbound channel, purpose/retention, rate caps and content review.
- D22 — Product quality thresholds: approve measured performance targets, supported mobile device/OS matrix, test coverage policy, and manual provider/field sample sizes after baseline measurements.
Document integrity instruction: Once v1.2 is approved, update the companion FixHub-Engineering-Standards.md and FixHub-Autonomous-Goal.md to cite this exact version, incorporate QA-01–QA-34/J21–J30/EH status classification and D19–D22, and reconcile their existing G01–G25 / RG0–RG5 references. Do not represent those companion documents as updated or authorized merely because this specification exists.

## 19. Final enhancement and quality amendment — v1.3

This section adds the final proposed enhancement pass before owner approval. It removes or weakens nothing: every existing requirement, EH-01–EH-18, QA-01–QA-34, J01–J30, G01–G25 and the single coordinated public launch policy stay as they are. Everything here is PROPOSED until the owner approves v1.3 and decisions D23–D27.

### 19.1 Service operations and operational controls — EH-19 to EH-25

| ID | Enhancement | Requirements and acceptance | Proposed classification |
|---|---|---|---|
| EH-19 | Booking recovery and rescue engine | Detect requests stuck in matching, merchant acceptance, technician assignment, travel, inspection, quotation and completion. Offer safe recovery: retry matching, reschedule, contact support, or authorized reassignment. Never assign two merchants automatically or override customer consent. Escalate to operations when automated recovery is unsafe. Show truthful progress in English and Telugu | LAUNCH_REQUIRED |
| EH-20 | Merchant and technician reliability intelligence | Track verified attendance, response times, cancellations, no-shows, capacity conflicts, complaint outcomes and completed jobs. Provide explainable operational signals, not arbitrary AI ratings. Allow dispute, correction and appeal of inaccurate records. Never rank using unverified allegations | LAUNCH_REQUIRED |
| EH-21 | Customer and worker safety controls | Accessible emergency guidance and incident reporting; incident categories for unsafe work, harassment, damage, impersonation and suspected fraud; authorized emergency suspension of further assignments that preserves evidence and existing job obligations; case-scoped investigation, escalation and appeal. Never claim FixHub provides emergency response, insurance or guaranteed protection | LAUNCH_REQUIRED |
| EH-22 | Verified service history and maintenance passport | Customer-controlled history of completed repairs, service dates, approved scope, parts descriptions when known and provider details; download or delete eligible records under the retention policy; maintenance reminders only with explicit opt-in. Never fabricate warranties, guarantees, invoices or payments | LAUNCH_OPTIONAL |
| EH-23 | Service area launch readiness | Before a category goes live in Tanuku, validate real merchant coverage, verified capability, capacity, supported hours, support ownership and operational response procedures. Super Admin can keep unsupported categories and zones disabled. No synthetic merchants or demonstration capacity count toward production serviceability | LAUNCH_REQUIRED |
| EH-24 | Admin-controlled configuration publishing | Extend draft → validate → approve → publish → rollback to categories, service zones, dispatch rules, cancellation policies, pricing disclosures, notification templates, localization and feature flags. Change preview and impact assessment on existing bookings; server-side authorization and audit; separation of duties for sensitive global changes. Never grant admin access through client-selected roles or developer shortcuts | LAUNCH_REQUIRED |
| EH-25 | Proactive operations intelligence | Identify real unassigned bookings, overdue support cases, merchant shortages, failed notifications, recurring service issues and emerging reliability problems. Source-linked, explainable recommendations; human review before consequential action. No AI-generated decision bypasses assignment, consent, authorization or safety invariants | LAUNCH_OPTIONAL |

The section 17 exclusions apply to all seven items.

### 19.2 How EH-19 to EH-25 fit existing requirements

These rules prevent the new items from contradicting earlier ones.

- **EH-19** extends EH-04 (no-provider rescue) and AX-04 (dispatch control). Every recovery action is a normal domain command: retry and reassignment create a new dispatch generation (DS-04), and earlier generations cannot win. Moving a booking to a different merchant needs the customer's informed confirmation, unless an owner-approved policy published under EH-24 says otherwise and the customer was told before booking. "Stuck" thresholds are published configuration, proposed from measured baselines (D22), never invented. Detection is database-driven and works with Redis down.
- **EH-20** sits beside EH-09 (dispatch explanation), EH-13 (fraud signals) and EH-15 (feedback). Signals are built only from verified events, and corrections are recorded as new entries rather than edits. Each merchant and technician can see their own record and appeal it. At launch, signals are visible to authorized staff only and do not change dispatch eligibility or order. Any dispatch effect needs D24 and must keep first-valid-acceptance (DS-03) and EH-09 explainability. Signals are never shown publicly as a score.
- **EH-21** supports G11 and QA-28. Emergency guidance points to India's emergency number 112 and states plainly that FixHub is not an emergency service. Technicians and merchants can report unsafe customers, as well as the reverse. Suspending further assignments does not silently cancel jobs in progress; those follow the AX-02 in-flight impact assessment, and affected customers get a truthful status. Evidence attached to an open incident or dispute is under legal hold, which takes precedence over a deletion request until the hold is released (SR-03). Staffing comes from D11.
- **EH-22** includes the history and reminder parts of EH-11. Reminders stay subject to D21. Records are "service records", never invoices, receipts or warranties (QA-26). Deletion respects legal holds.
- **EH-23** turns category activation into an evidence checklist in SERVICE_CATEGORY_MATRIX.md, tied to G04, D03 and D07. A category that is not active is hidden or shown truthfully as "not yet available in Tanuku".
- **EH-24** extends AX-06, AX-07, L10N-09, J15, J28 and G19. Published versions are effective-dated; existing bookings keep the version they agreed to. Configuration publishing is separate from code deployment (section 14). The launch team may be small, so how separation of duties works is D25.
- **EH-25** uses the same data as EH-08, AX-01 and AX-10. It only recommends; staff act through normal commands with their own authorization.

### 19.3 Security and privacy additions — SR-09 to SR-13

The 13 security items in the amendment map to existing and new requirements:

| Amendment item | Requirement |
|---|---|
| 1 Session/device revocation, privileged MFA, step-up | SR-09 (new), AX-08 |
| 2 Account recovery, anti-enumeration | SR-09 |
| 3 Login, OTP, API and notification abuse prevention | SR-09 |
| 4 Object- and field-level authorization for every role | SR-02 (existing) |
| 5 Protection of coordinates, photos, KYC documents, support evidence (shared images sanitized; restricted originals for investigations) | SR-10 (new), EH-16 |
| 6 Signed, expiring, authorized file access | SR-10 |
| 7 File-content inspection, size limits, malware protection | SR-10, SR-04 |
| 8 No secrets, customer data, credentials or OTPs in logs, traces, Git history or CI artifacts | SR-11 (new) |
| 9 Backup encryption, verified restore, retention | SR-12 (new), SR-07 |
| 10 Deletion/export across databases, object storage, caches, search indexes, processors | SR-12 |
| 11 Input validation, output encoding, safe SQL, headers, CSRF, CORS, SSRF | SR-04 (existing) |
| 12 Dependency, supply-chain, license, SBOM, secret-history, CI workflow audits | SR-11, QA-21 |
| 13 Incident response procedures | SR-13 (new) |

SR-09 Account and session lifecycle. Users see and revoke their sessions and devices. Staff and Super Admin use MFA, with step-up for sensitive actions. Recovery never reveals whether an account exists. Login, OTP, API and notification sends have per-number, per-device and per-IP limits plus a spend cap, which also guards against SMS-pumping fraud (D04).

SR-10 Sensitive files and data. Photos, KYC documents and support evidence live in private storage, reachable only through short-lived signed links issued after an authorization check. File type is checked from content, not the file name. Size limits apply. Files are scanned for malware before anyone else can see them. Two image classes are kept apart: (a) shared images shown to customers, merchants, technicians or support have unnecessary GPS and EXIF metadata removed; (b) where the original metadata is legitimately needed for a dispute, fraud or safety investigation, the unmodified original is kept only in restricted, encrypted evidence storage, with purpose-based authorization, a retention limit, audited access and legal-hold controls. Routine sanitization of shared copies never destroys investigation evidence. KYC documents are encrypted and visible only to assigned reviewers. Exact address coordinates go only to the assigned merchant or technician (EH-16).

SR-11 Secret, log and supply-chain hygiene. No secrets, OTPs, tokens, customer data or credentials appear in logs, traces, screenshots, CI artifacts or Git history; this is enforced by redaction tests and history scanning. The repository is public, so workflows triggered by fork pull requests never receive secrets and never run untrusted code with write permission. Dependencies, licenses, the SBOM, secret history and workflow permissions are audited.

SR-12 Backup and data-rights completeness. Backups are encrypted, kept off-host, restored in drills and expired on schedule. Export and deletion cover databases, object storage, caches, search indexes and processors. Restoring a backup re-applies deletions made after it was taken, so deleted data never comes back into live use.

SR-13 Incident response. Runbooks cover unauthorized access, data leakage, compromised credentials and fraudulent accounts: containment, credential rotation, evidence preservation, user communication, post-incident review, and any reporting the law requires in India (for example CERT-In incident reporting and Digital Personal Data Protection breach notification), as confirmed by legal review (TR-05, G21).

The four commit #21 security defects remain launch blockers (FR-1, G13, G14) until they are fixed or securely disabled and independently retested, including the FR-1 investigation and, where needed, rotation of the published default signing secret.

### 19.4 English and Telugu — final localization additions

L10N-01 to L10N-10 stand. Additions:

L10N-11 Coverage extension. The 100% launch-critical coverage includes the new rescue, safety, incident, recovery and configuration screens, plus quote consent, cancellation, support and every notification.

L10N-12 Search verification. Telugu search terms, spelling variants and Tanuku locality names are checked against a reviewed reference list (D27), not invented.

L10N-13 Rendering and devices. Font rendering, screen readers, dynamic text scaling, long translations and low-end Android devices from the D22 device matrix are tested. Language switching is tested during booking, quotation, payment-state display and account recovery. Language preference persists across authenticated sessions and approved channels.

L10N-14 Release rule. A missing Telugu key or placeholder text on a launch-critical production screen fails the localization gate (G12). Native-speaker review of legal, financial, safety and consent text records the reviewer, date and string version. Changing a reviewed string resets its review.

### 19.5 Testing expansion inside QA-01 to QA-34

QA-01 to QA-34 remain the only taxonomy. The amendment's scenarios extend them, mapped as follows, for every launch-critical module, screen, API, state transition and integration:

| Required scenarios | QA categories |
|---|---|
| Happy path, invalid input, boundary values, negative cases | QA-01, QA-02, QA-07–QA-10 |
| Authentication, authorization, privilege escalation, cross-account denial | QA-05, QA-06, QA-20 |
| Duplicate requests, idempotency, concurrency races, stale versions | QA-02, QA-04 |
| Transaction integrity, migration compatibility, rollback | QA-03, QA-31 |
| PostgreSQL/PostGIS integration, multi-process dispatch | QA-03, QA-04, QA-27 |
| Redis outage and recovery without depending on Redis for correctness | QA-04, QA-23 |
| Provider timeout, duplicated, replayed and delayed webhooks | QA-15, QA-16, QA-23 |
| Browser reload, connection loss, expired session, interrupted workflow | QA-07–QA-11, QA-23 |
| Mobile termination, background/foreground, offline recovery, deep links, notifications | QA-17, QA-18 |
| English and Telugu cases | QA-14 |
| Chromium, Firefox, WebKit, appropriate real devices | QA-11, QA-17, QA-18 |
| Accessibility, responsive, keyboard, touch, TalkBack, VoiceOver | QA-12, QA-13 |
| Large datasets, performance, load, soak, resource exhaustion | QA-24 |
| Privacy export/deletion, retention, unauthorized download | QA-19, QA-20 |
| Payment and invoice truthfulness without platform payments | QA-26 |
| Admin configuration draft, approval, publish, rollback, audit | QA-10 |
| Beta enrollment, flag isolation, expiration, kill switches | QA-30 |
| Staging smoke, sanity, critical path, full regression | QA-31 |
| Production preconditions and post-deployment health | QA-31 (owner-run in production) |
| Safety incidents, reliability-record disputes, rescue flows (EH-19–EH-21) | QA-08, QA-10, QA-23, QA-28 |

Every test maps to a stable requirement ID and records execution evidence, exact commit SHA, environment, outcome and, on failure, the failure artifacts (trace, screenshot, redacted log). TEST_MATRIX.md gains a failure-artifacts column.

Automated tests use real tools: Playwright tests run Playwright; distributed dispatch tests use real PostgreSQL transactions across independent workers; formatting checks run ESLint and Prettier. Simulated, in-memory or mocked tests are never labelled as real database, provider, mobile-device or production verification. Fixtures use synthetic people, reserved test phone ranges and fictitious addresses, never real Tanuku residents.

### 19.6 GitHub release protection proofs

Keep push and integration checks, nightly regression, manual `workflow_dispatch`, staging validation and owner-controlled production deployment (section 18.3). Each protection is proven, not assumed:

| Protection | How it is proven | Links |
|---|---|---|
| A failing critical test blocks integration | Deliberately failing test on a temporary branch; the run fails and integration is refused | QA-34, G15 |
| A vulnerability or exposed secret blocks the release | Known-vulnerable dependency fixture and a fake secret pattern (never a real secret) | QA-21, G14 |
| A migration failure blocks deployment | Incompatible migration fixture fails the staging pre-deploy check | QA-31, G16 |
| Missing Telugu fails launch gates | A removed Telugu key fixture fails the localization check | QA-14, G12 |
| A broken required customer, merchant or technician flow prevents promotion | Failing critical-path E2E fixture | QA-07–QA-09, G15 |
| Reports, screenshots and traces stored with the exact SHA | Inspection of real run artifacts | QA-34 |
| Production cannot run from an unauthorized branch | Workflow branch guard plus environment branch policy, proven by configuration review and a guard test. Dispatching the real production workflow, even to see it fail, is owner-only | QA-31, G17 |
| Production secrets unavailable to test jobs and untrusted pull requests | Environment-scoped secrets; no secrets for fork-triggered runs; no workflow runs untrusted pull-request code with secrets | QA-21, G14 |
| Deployment uses a verified artifact, pre-deploy backup, health checks and safe rollback | Staging rehearsal; production by owner only | QA-31, G16, G17 |
| A skipped mandatory suite cannot be reported as PASS | A summary job requires every mandatory job to succeed; skipped counts as failure | QA-34, G15 |

No claim of production readiness is permitted until every applicable G01–G25 gate is independently satisfied.

### 19.7 Mapping to existing journeys, QA categories and gates

No new journeys or gates are added. The new items are tested as scenario variants of existing journeys.

| Item | Journey variants | QA | Gates | Decisions |
|---|---|---|---|---|
| EH-19 | J04, J10, J17: stuck at each of the seven stages, recovery with and without customer confirmation, unsafe case escalated | QA-04, QA-07, QA-08, QA-23 | G07, G11, G23 | D11, D22, D23 |
| EH-20 | J13, J22, J24: verified no-show recorded, disputed, corrected; unverified allegation has no effect | QA-06, QA-28 | G05, G18 | D23, D24 |
| EH-21 | J13, J27: customer and technician incident reports, suspension with a job in progress, appeal | QA-14, QA-19, QA-28 | G11, G21 | D11, D23 |
| EH-22 | J18, J26: history export, deletion blocked by legal hold, reminder opt-in and opt-out | QA-19, QA-26 | G22 | D10, D21, D23 |
| EH-23 | J01, J28: inactive category shown truthfully; activation blocked without evidence | QA-27, QA-29 | G04, G18 | D03, D07, D23 |
| EH-24 | J15, J28, J29: draft, preview, approve, publish, rollback; existing bookings unchanged | QA-10, QA-30 | G19 | D23, D25 |
| EH-25 | J27: recommendation links to its sources; no action without a staff command | QA-25 | G20 | D23 |
| SR-09–SR-13 | J02, J14, J17, J18, J27 | QA-05, QA-06, QA-19–QA-21 | G13, G14, G20, G22 | D04, D10, D12, D26 |
| L10N-11–L10N-14 | J16, J21 | QA-13, QA-14 | G12 | D22, D27 |

### 19.8 Scope and approval rules

Proposed: EH-19, EH-20, EH-21, EH-23 and EH-24 launch-required; EH-22 and EH-25 optional, needing demonstrated demand, clear acceptance criteria and approval. Unchanged: free basic merchant registration, no paid ranking or advertisements at launch, Tanuku first, official WhatsApp, Android and iOS, private Super Admin, and one coordinated public release. No unsupported payment, insurance, voice-call, autonomous AI or guarantee claims.

### 19.9 Owner decisions appended

- D23 — Classify EH-19 to EH-25 for the single launch (extends D19), with costs.
- D24 — Whether verified reliability signals (EH-20) may ever affect dispatch eligibility, on which thresholds, and with what appeal.
- D25 — Separation of duties for configuration publishing given the launch team size: two-person approval, or owner-only publishing with step-up MFA, mandatory preview, a delay window and after-the-fact review.
- D26 — Private file storage, malware scanning service and backup encryption key custody (cost and hosting, with D12).
- D27 — Native Telugu reviewers and the source of the reviewed Tanuku locality and spelling reference list.

### 19.10 Document reconciliation

After owner approval: integrate the approved items into this specification with stable IDs and no renumbering; update FEATURE_MATRIX.md, APP_SCREEN_MATRIX.md, JOURNEY_MATRIX.md, LOCALE_MATRIX.md, TEST_MATRIX.md, RISK_REGISTER.md and GAP_MATRIX.md; keep the Engineering Standards and Autonomous Goal pointing at the approved version; change AGENTS.md, the roadmap and the work-authority record only through D01 and D17; preserve repository history, the canonical migration chain and verified code; start implementation with the commit #21 security defects and the identity and persistence conflicts before new features. This documentation step alters or deploys no production system.

### 19.11 Approval, sequencing and scope freeze

- **Activation.** Once the owner approves v1.3, D01 and D17 in writing, the autonomous agent may carry out safe internal engineering work on the development branch.
- **Open decisions gate only what they affect.** Each other open decision (D02–D27) blocks only the capability that depends on it; unrelated development continues. The blocked capability is recorded in `blocker.txt` as READY_FOR_OWNER.
- **Separately evidenced states.** These are distinct and each needs its own evidence; one never implies another:
  1. Internal software implementation complete
  2. Mock-provider validation complete
  3. Field readiness (real Tanuku merchants, staff and pilot)
  4. Live provider approval (WhatsApp, OTP, maps and others)
  5. Mobile app-store approval
  6. Public production launch (owner only, single coordinated release)
- **No paper passes.** A required launch gate is never marked PASS from documentation, simulated or mocked tests, or unverified third-party claims.
- **Scope freeze.** With these corrections, the product scope is frozen. No further product features are required before implementation. Changes after this point need a written owner scope amendment with a new version number. Work proceeds with the Stage 0 security quarantine, repository reconciliation and verified engineering execution.

**Final intended outcome:** one complete, trustworthy, professionally engineered English and Telugu local-services platform with full customer, merchant, technician, operations and Super Admin workflows, validated across website, official WhatsApp, Android and iOS, and launched once, only after real acceptance evidence and owner authorization.

---

## Review notes added with the Markdown edition

These notes do not change any requirement. They flag three points for the owner and reconcile vocabularies so agents read the document consistently.

1. **EH-05 depends on an optional item.** EH-05 (proposed LAUNCH_REQUIRED) includes "accessible manual-assisted booking with actual authority", but the assisted booking itself is EH-06 (proposed LAUNCH_OPTIONAL) and depends on D20. Decide under D19 and D20 whether assisted booking is launch-required; until then, the agents build EH-05's simplified Telugu-first flows and treat the assisted-booking part as pending D20.
2. **Two evidence vocabularies.** Section 1 uses TESTED_LOCAL, and section 18.4 splits local evidence into TESTED_UNIT, TESTED_INTEGRATION_REAL_DB, and TESTED_BROWSER. Section 18.4 is the authoritative vocabulary; TESTED_LOCAL in earlier sections means "one of the three section 18.4 local levels, as appropriate to the requirement".
3. **Rule order.** FR-8 and FR-9 were listed out of order in v1.2; this edition lists them in order without changing their text.
