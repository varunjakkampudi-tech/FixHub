# Phase 02 requirements draft

Date: 2026-10-15. **DRAFT PREPARATION — NOT APPROVED PHASE 02 EXECUTION OR BASELINE.** Prepared under [current work authority](../../governance/phase-01-05-work-authorization.md) while Phase 01 provider evidence and owner exit disposition remain unresolved. G0 is NOT PASSED. This is a candidate specification for review, not a customer promise, implemented feature or authorization to build. Parent sources: [Phase 02 dossier](../phase-02.md), [functional baseline](../../product/requirements/functional.md), [NFR baseline](../../product/requirements/non-functional.md), [roles](../../security/access-control.md) and [traceability](../../blueprint/traceability-matrix.md).

## Product requirements document

Fix Hub, under Viswatra, proposes a Tanuku household-service marketplace connecting customers with eligible independently verified providers. Free basic merchant registration/listing is preserved. One backend owns request identity, eligibility, state and committed assignment. First valid committed acceptance wins; notification delivery or UI tap time does not determine the winner. Website/PWA, official WhatsApp, Android and iOS remain coordinated-release objectives, not approved available channels. No MVP/public staggered-release substitution is introduced.

Five primary personas: customer managing their own request; merchant owner managing one business; independently authenticated technician assigned limited work; operations staff managing authorized cases; Super Admin governing platform policy. Merchant manager and assigned reviewer are scoped capability sets, not general administrator aliases. No person shares the owner's credentials. Candidate technician identity and verification rules remain subject to security/legal review.

Commercial success is NOT ASSESSED. No demand, conversion, availability, attendance, price, revenue, rating or arrival guarantee is inferred. Requirements serve discoverability, clear prices/inspection terms, safe offers, reliable state, explicit consent, bilingual use and accountable support. Metrics distinguish request attempts, unique valid requests, eligible offers, accepted assignments, completed work, cancellations and support incidents. Define observation window, denominator, exclusions and freshness for each metric before use. GTV is not platform revenue.

## Functional acceptance catalogue and user stories

These are refinements mapped to existing stable IDs, not amendments to the approved 27-ID inventory. Each row is a candidate executable acceptance scenario: given an authorized role and configured prerequisites, the success outcome must be observable; denial and recovery outcomes are separate required cases. No test has been implemented or executed for these product requirements.

| Stable ID / user story | Observable success | Negative or edge case | Recovery / evidence |
|---|---|---|---|
| FR-C-001: As a customer I discover serviceable categories | Configured location returns only eligible category/provider combinations with freshness and scope | Missing zone, suspended provider, outside hours or zero capacity yields no service promise | Clarify location or show unavailable; retain explicit location choice |
| FR-C-002: I search for the needed work | Category, text and location filters return deterministic paginated results | Unsupported category and invalid location reject; no paid-ranking preference | Clear filters or retry; preserve query without private address in logs |
| FR-C-003: I request instant or scheduled work | Valid details create one request with mode, zone, backend timestamps and optional private photos | Missing address, invalid slot, oversize/unsafe upload or different payload reused with same key reject | Same authorized key/payload returns original request after lost response |
| FR-C-004: I move between approved channels | Authenticated, explicitly linked identities see the same canonical request | Phone possession or provider message ID alone never links accounts; unapproved channel disabled | Reauthenticate and fetch canonical state; no second request from channel retry |
| FR-C-005: I understand progress | Own request exposes committed state/version, actor-safe timestamps and exceptions | Stale cache or push cannot overwrite a newer version; no fabricated arrival | Reconnect fetches latest state with stale indicator until reconciled |
| FR-C-006: I see scope and pricing before consent | Merchant identity, currency, inspection/labour/parts/travel disclosures and current quote are visible | Unknown charge is unavailable, not zero; changed quote invalidates earlier consent | Explicit customer confirmation binds exact quote version |
| FR-C-007: I cancel, review or seek help | Own request produces policy-versioned cancellation/case/review receipt | Other customer's job, duplicate review and unsupported refund promise reject | Retry returns original receipt; case preserves negative findings and escalation |
| FR-C-008: I use English or Telugu | Persisted preference drives interface and supported transactional copy | Missing translation is identified; unsafe silent fallback forbidden | Approved fallback with language choice; no repeated notification from language change |
| FR-M-001: As an owner I register free | Self-registration or founder-assisted intake creates pending business with consent receipt | Payment cannot be required; founder relationship cannot auto-verify; duplicate identity held for review | Resume incomplete intake; assisted entry records actual representative authority |
| FR-M-002: I submit verification evidence | Private case reference and review status visible to own business | Unassigned staff, public evidence URLs and missing competence checks deny approval | Reasoned resubmission/appeal; no government ID collection without lawful necessity |
| FR-M-003: I configure real services and capacity | Versioned category, price, hours, zone, staff and capacity edits affect future eligibility | Negative capacity, conflicting shared technician slots or unsupported category reject | Conflict explains affected future jobs; existing commitments cannot be silently erased |
| FR-M-004: I receive eligible offers | Active offer names current request generation and server expiry without unrelated PII | Expired, wrong-tenant, unverified or ineligible provider cannot receive actionable offer | Refresh from backend; delivery failure does not create assumed decline |
| FR-M-005: I accept or decline | Scoped current offer command returns committed win or recorded decline | Expiry, changed generation, revoked authority, full capacity or losing race returns deterministic conflict | Idempotent same-payload retry; different-payload key reuse rejected |
| FR-M-006: One valid provider wins | Competing valid requests yield one committed assignment and reservation | No double winner under races, crash, retry or multi-device request | Read saved command result after timeout; real database proof remains required |
| FR-M-007: I allocate and progress my jobs | Own-business assignment permits technician allocation and allowed lifecycle commands | Cross-tenant technician or unassigned job access denied; incompatible quote blocks start | Revoke/reassign without dual live capacity; incident route retains audit |
| FR-M-008: I am not forced to keep every channel open | Authorized available channel attempts tracked independently | Provider ACK is not merchant acceptance; closed app or missing token not proof of refusal | Bounded retry and backend reconciliation, with failed-delivery visibility |
| FR-A-001: As an admin I govern catalog and regions | Explicit grant allows versioned customer/merchant/category/city/zone command | Missing privilege, self-elevation or unsafe deletion of live category denied | Disable for new work while preserving historical category snapshot |
| FR-A-002: I govern verification | Assigned reviewer records evidence scope, decision, reason and timestamp | Merchant cannot approve self; suspended status cannot be notification-reverted | Reverification creates audit-linked decision; live jobs get explicit handling |
| FR-A-003: As operations I monitor dispatch | Allowed operational view shows latest backend outcomes and stale markers | Staff outside case/zone grants denied; contact fields masked until necessary | Refresh/reconcile with correlation reference rather than editing rows |
| FR-A-004: I investigate disputes and safety | Case assignment, minimal evidence, escalation and disposition are traceable | Other case evidence and unauthorized compensation promises denied | Safety escalation independent of ordinary service SLA; preserve lawful holds |
| FR-A-005: I configure grants and policy | Privileged authenticated command records reason, previous/new versions and actor | No self-grant, hidden role inheritance or default emergency override | Approved rollback changes future behavior without rewriting prior decisions |
| FR-A-006: I inspect health and economics | Authorized metrics identify definitions, periods, costs and data freshness | No contact exports by generic analytics grant; GTV not labeled revenue | Missing data labeled incomplete; corrected aggregates retain revision provenance |
| FR-X-001: All roles use one backend | Same authorized command/state semantics across approved channels | Independent channel databases cannot decide assignment | Reconcile from canonical service after outage |
| FR-X-002: Capacity is never oversold | Assignment and capacity reservation commit together | Two jobs cannot reserve one overlapping technician unit beyond configured capacity | Atomic release and new generation on reassignment, no double release |
| FR-X-003: Customer information stays truthful | Price, availability, rating and ETA show source/freshness or unavailability | No synthetic rating, estimated availability presented as confirmed, or fictional ETA | Stale/unknown states remain explicit until actual evidence arrives |
| FR-X-004: WhatsApp is authorized | Official approved integration enforces consent, permitted templates and window | No browser automation, unsolicited broadcast or token in client | Opt-out stops affected messaging; backend booking persists; no unapproved channel fallback |
| FR-X-005: No unsupported commercial promise | UI/policies exclude unapproved payment, insurance and guarantee claims | Requesting refund/coverage cannot create platform entitlement | Route factual complaint to authorized support; owner/legal decisions separately gated |

## Non-functional acceptance catalogue

All figures below remain OPEN unless expressly described as draft candidates; existing baseline explicitly forbids invented target approval. Candidate release controls are test designs, not tested controls.

| Stable ID | Candidate measurable acceptance and negative case | Unresolved input / proof |
|---|---|---|
| NFR-SEC-001 | Deny every role/resource/action outside explicit grants; privileged MFA; revoked session cannot mutate | Authentication/recovery design, threat review, rate limits, penetration and access tests |
| NFR-SEC-002 | Trace each personal field to purpose/access/retention; export/deletion respects ownership and legal holds | Qualified lawful basis, retention periods, withdrawal channel, legal review and deletion/restore tests |
| NFR-SEC-003 | Real database race/crash tests show one winner, no oversell and payload-bound idempotency | Phase 03 isolation/locking contract and executed proof; no in-memory substitute |
| NFR-REL-001 | Duplicate/reordered commands/events preserve request identity and legal state; restart reconciles pending work | Fault matrix and integration recovery tests |
| NFR-REL-002 | Measure availability separately for API, dispatch, clients and notifications; no success from stale health data | Approved SLO, window, exclusions, dependencies and staffed response |
| NFR-PERF-001 | Record p95/p99 search/create/accept/status latency under stated arrival/load/error mix | Approved numeric budgets, realistic load and database/provider test environment |
| NFR-SCALE-001 | Two-city fixtures never match/dispatch or disclose outside allowed scope | Expansion authorization, partition/index/cost evidence and migration rehearsal |
| NFR-UX-001 | Candidate WCAG 2.2 AA: keyboard-only core flow, visible focus, semantic errors, non-color status and screen-reader labels | Owner accessibility baseline approval plus manual web/native testing |
| NFR-UX-002 | English/Telugu strings reviewed for meaning, dates/INR/local time; 200% text expansion has no lost action | Native-language review, font licensing, platform/device rendering |
| NFR-OBS-001 | Every command/event has correlation, state version and outcome; logs omit tokens, photos and precise addresses | Telemetry schema, redaction tests, retention and alert ownership |
| NFR-BCP-001 | Restore database and private objects to consistent authorization/state; purge/deletion tombstones reapplied | Approved RPO/RTO/cadence, off-device encrypted backup and restore evidence |
| NFR-EXT-001 | Provider failures yield pending/failed communication, never invented booking changes | Effective provider terms/rates, account approval, quotas, signatures and integration tests |
| NFR-OPS-001 | Case-scoped overrides require reason/grant/audit; unsafe reversal rejected | Named support/security owners, escalation thresholds and drills |
| NFR-COST-001 | Separate one-time, fixed, variable, taxes and reserves; sensitivity preserves GTV/revenue distinction | Itemized quotes, full personnel/funding and owner-approved commitments |

## Authorization and identity matrix

This refines candidate policy only; the [existing matrix](../../security/access-control.md) remains unchanged. Resolve differences before approval. Proposed routine ops/admin emergency assignment is **disabled** until separately approved, rather than an implied bypass of first acceptance.

| Action/resource | Customer | Merchant owner / delegated manager | Technician | Operations / reviewer | Super Admin / worker |
|---|---|---|---|---|---|
| Profile, account and sessions | Own verified subject | Own subject/business grants | Own subject, no shared owner login | Assigned support scope; no credential view | Governed recovery only; workers no human login |
| Create/read/cancel request | Own, legal state only | Own offer subset, assigned business jobs | Assigned job subset | Case-scoped on-behalf action with customer authority recorded | Explicit grant/audit; worker only scheduled commands |
| Offer acceptance | Deny | Current offer + tenant + actor grant + capacity | Deny by default; delegation requires explicit policy | Deny; no routine manual winner override | No override by generic admin grant; worker cannot impersonate merchant |
| Verification | Own status if applicant | Submit own evidence, never decide | Limited status | Assigned non-conflicted reviewer only | Governed reviewer grant; no automated competence approval |
| Quote/work progression | Confirm own quote | Own job, assigned staff and legal state | Assigned allowed progress, not arbitrary price | Case oversight, no customer consent impersonation | Governed incident actions only |
| Grants/configuration/audit | No platform grants | Limited business-member delegation, never platform grants | No grant creation | Named scoped capability, no self-grant | MFA, explicit grant, reason and audited change; narrow worker scope |
| Privacy export/deletion | Own authenticated request | Own subject and lawful business request | Own subject request | Authorized privacy case, masked evidence | Scoped orchestration; holds and proof of deletion, no arbitrary bulk export |

Authentication mechanism/provider is OPEN. Enrollment must distinguish phone verification from legal identity and competence. Account linking needs explicit authenticated proof of both identities and revocation behavior. Recovery cannot silently transfer merchant or privileged grants. Founder-assisted registration records actual business representative consent; public listing is not permission to create an account.

## Candidate product policies

**Category and pricing:** use the [four-family bounded recommendation](../phase-01-execution/market/service-category-opportunities.md) as disabled taxonomy candidates. Task exclusions, inspection/travel/labour/parts/tax disclosure and quote-expiry policy require owner/legal approval. Show INR and price version; no unknown-as-zero. Customer consents to exact quote revision before work. No platform collection, commission agreement, cancellation fee, refund, insurance or guarantee is authorized. Free basic registration/listing never depends on a paid tier or ranking.

**Instant/scheduled:** instant searches use currently verified hours, zone and reservable capacity. “Searching” is not an assignment or arrival promise. Scheduled bookings use a declared timezone and explicit requested window; whether capacity is reserved in advance or dispatch activates later is OPEN. Never sell a confirmed slot while merely recording interest. Server clock decides expiry; fanout, TTL, radius, service durations and retry policy are OPEN configurable proposals, not invented numeric defaults. Changes invalidate stale generations.

**Cancellation/no-show/dispute:** before assignment, cancel atomically against accept. After assignment, cancellation releases only the correct reservation once and records stage/reason/policy. Reassignment creates a new generation after prior release. Post-arrival or unsafe/in-progress work needs a separately approved safety/exit policy; do not automatically cancel to hide incidents. No-show timing and appeals require actual staffed operations and approval. Complaints retain evidence and negative outcomes without publishing personal data. Reviews require genuine eligible service interaction, one reviewer scope and moderation provenance; no paid suppression.

**Notifications:** backend state commits before enqueue. Event ID, request generation/version, recipient, purpose, language, template version, expiry, dedupe key and provider result are distinct. Minimize payload and hide exact address until authorized. Track queued/attempted/provider-accepted/delivered/read only where actually supported; none means booking acceptance. Retry bounded by relevance/TTL and current consent; expired offers never remain actionable. Opt-out respects purpose and channel while retaining lawful service records. Official WhatsApp template/window/rate/account constraints remain P01-DOD-008 blockers; no fallback to unofficial automation. FCM/APNs/Web Push are pending account/device permission and implementation validation.

**Localization and accessibility:** persist English/Telugu preference across explicitly linked channels. Separate UI language, customer quote text and merchant free text; never present unreviewed machine translation as agreed contractual scope. Dates show local zone where ambiguity matters; server stores instants plus requested timezone. Provide keyboard, screen-reader, non-color status, clear field errors and accessible support paths. Content and font licenses, Telugu text shaping and native-language review remain pending.

**Privacy and operations:** no public request/photo indexing, precise customer address in pre-acceptance offers or generic analytics export. Private uploads need size/type checks, quarantine/scanning, object-level authorization, signed short-lived access, metadata stripping and retention. Exact limits, locations and periods await security/legal approval. Account deletion must address linked channel identifiers, media, legal holds, immutable minimized audit and restore tombstones. No serious incident waits for a speculative support-hours promise; launch requires an actual staffed escalation route.

## Change ledger and exclusions

No existing stable ID, approved roadmap byte, Phase 00 acceptance or requirement inventory is changed. This draft adds candidate acceptance detail only. Approval must log each accepted/refined requirement, evidence, owner/date/revision and policy version; any new IDs must be added through the inventory/validator/test/index change-control mechanism, not silently renumbered. Detailed candidate scenarios here are mapped to their parent IDs; these rows are not claimed as executed tests.

Excluded: payment processing/refunds, paid ranking, guarantees/insurance, emergency rescue promises, unsupported geography, real account creation, implementation, provider signup, spending and public launch. Remaining assumptions include account eligibility, actual category supply, safe legal scope, service windows/durations, realistic demand, budget/staffing, numeric SLOs, retention/RPO/RTO and owner policy decisions. Proposed defaults never become approval by repetition in later drafts.

## Draft deliverable and review coverage

| Requested deliverable | Location in this draft | Remaining acceptance gate |
|---|---|---|
| PRD | Product requirements document | Prior Phase 01 exit and owner scope acceptance |
| Functional catalogue | Functional acceptance catalogue and user stories | Requirement-by-requirement product/QA review |
| NFR catalogue | Non-functional acceptance catalogue | Numeric policy/target decisions and security assurance |
| User stories | Actor and purpose in each functional row | Real stakeholder review, no invented validation |
| Acceptance criteria | Success, denial and recovery columns | Detailed executable scenarios in approved phase |
| RBAC matrix | Authorization and identity matrix | Identity/recovery, emergency authority and privacy decisions |
| Category/pricing policy | Candidate product policies | Qualified lawful scope and owner commercial approval |
| Booking policy | Candidate product policies | Scheduled capacity semantics and timers |
| Cancellation/dispute/no-show | Candidate product policies | Safety/legal/operations approval and staffed support |
| Notifications | Candidate product policies | Provider evidence and formal catalogue in Phase 04 |
| Localization | Candidate product policies | Human bilingual and accessibility review |
| Traceability | All 27 FR and 14 NFR parent IDs above | Changed-ID ledger and eventual test mapping |
| Exclusions/assumptions | Change ledger and exclusions | Explicit accepted residual-risk treatment |
| Phase 02 review | This coverage record, preliminary only | Full finite exit review and owner sign-off remain PENDING |

Preliminary AI review: baseline ID mapping and policy conflicts inspected; no product tests, manual accessibility, threat validation, legal clearance or stakeholder acceptance performed. Specific unresolved launch-critical rules prevent declaring this complete or approved: scheduled reservation model, numeric service/SLO/retention targets, support staffing, legal scope, pricing terms and provider eligibility. Phase 02 exit percentage **NOT MEASURABLE** until a finite reviewed exit checklist exists; document coverage is not phase completion. Formal Phase 02 entry and G0 remain blocked. No claim of a final PRD, independent human approval or architecture proof is made.
