# Phase 03 architecture and integration contract candidates

2026-10-15. **DRAFT PREPARATION — NOT APPROVED ARCHITECTURE OR PHASE 03 ENTRY.** Authority: [Phase 01–05 work scope](../governance/product-foundation-work-authority.md). Phase 01 exit, approved Phase 02 requirements and G0 are unresolved. No production application, infrastructure, account or deployment is created. Candidate decisions below are not LOCKED decisions in the canonical register. Sensitive decisions require competent assurance before affected deployment.

## Reuse and ownership

Retain the approved conceptual content of these six sources while updating links where needed: [platform](platform-overview.md), [domains](backend-domains.md), [data](data-architecture.md), [trust boundaries](security-trust-boundaries.md), [deployment](deployment-and-integrations.md) and [system context](system-context.md). Refine their contracts here against the [requirements draft](../product/requirements/product-requirements-draft.md). References to production below describe future design, not implementation evidence.

## Candidate ADR set

| Candidate ADR | Recommendation and alternatives | Trade-off / evidence / disposition |
|---|---|---|
| P03-ADR-001 | Modular monolith, one authoritative transactional DB; reject early microservice split | Request/assignment/capacity/outbox need one consistency boundary. Coordinated deployment and disciplined module ownership cost less than distributed transaction complexity; not an approved hosting choice |
| P03-ADR-002 | TypeScript/Fastify API, maintained Node release and PostgreSQL/PostGIS candidate; alternatives Django or another team's supported typed stack | Reuses DEC-012 proposal, not a final technology approval. Team skill, maintained versions, dependencies, deployment price and PostGIS availability still need verification |
| P03-ADR-003 | Explicit row-lock transaction for acceptance at READ COMMITTED, with unique constraints; SERIALIZABLE alternative with whole-transaction retry | PostgreSQL mechanism and bounded local fixture support only the tested case. Every competing writer must follow the contract; missing lock discipline is not cured by a diagram |
| P03-ADR-004 | Actor/operation/payload-bound durable idempotency result, committed with business effects | Avoid Redis-only key expiry permitting duplicate side effects. Collision serialization may add contention; retention and privacy policy must be approved |
| P03-ADR-005 | Transactional outbox plus DB-leased worker initially; external queue only after measured need | At-least-once delivery requires consumer idempotency. No exactly-once external delivery promise. Poll/lease/backlog overhead must be budgeted |
| P03-ADR-006 | Private object storage, quarantine and narrowly signed access | DB stores metadata/reference only. Object restore/deletion consistency and scan reliability remain required; no public evidence bucket |
| P03-ADR-007 | Stateless API + durable DB sessions/revocation/grants; provider auth selection OPEN | Managed identity reduces credential burden but adds cost/lock-in; custom auth increases security burden. No ad hoc password/token implementation approved |
| P03-ADR-008 | No authoritative cache; read cache optional after profiling | Stale discovery can be a hint only. Every acceptance rechecks fresh grants, offer, eligibility and capacity. Cache must never elect winner |
| P03-ADR-009 | One versioned JSON API/domain contract for web/PWA, WhatsApp adapters and mobile | Native features/background permissions still require platform-specific work. Wrapper versus native architecture remains gated by real device/store proof and Phase 08 portability |
| P03-ADR-010 | Separate API/worker failure processes, one DB consistency boundary; region/vendor OPEN | No premature paid HA deployment. RPO/RTO, data policy, private-object backup and staffing determine topology; cost floor is not a production budget |

Sources read 2026-10-15: PostgreSQL 17 [locking](https://www.postgresql.org/docs/17/explicit-locking.html), [isolation](https://www.postgresql.org/docs/17/transaction-iso.html), [isolated initialization](https://www.postgresql.org/docs/17/app-initdb.html); PostGIS [distance predicate](https://postgis.net/docs/ST_DWithin.html). Mechanism documentation is not FixHub runtime evidence. Actual local proof is separately bounded in the [proof record](../reviews/dispatch-proof-review.md).

## Domain, identity and data contracts

Identity owns subjects, authenticated sessions, linked identities and revocations; Merchant owns membership and business grants; Verification owns competence/approval decisions; Availability owns reservable resources; Request owns canonical request/mode/generation; Dispatch orchestrates acceptance; Booking owns fulfilment; Support owns case disposition; Notifications owns delivery attempts, never assignment. Administration invokes audited domain commands, not arbitrary row edits. Reporting is scoped/eventually consistent and cannot authorize a write.

Derive subject from authenticated session, never JSON `actorId`; derive permitted merchant from active membership and request resource. Customers see own requests; merchant staff see own-business offers/jobs; technicians see assigned job subset; reviewers see assigned evidence; ops see assigned operational case; privileged staff require MFA and explicit scope. Do not make platform-admin privileges inheritable through merchant manager invitations. Invitations bind business, capability, expiry and verified accepting subject. Phone OTP alone proves neither business ownership nor task competence. Account linking must authenticate both identities; consent and revocation are explicit. Recovery, device/session limits and auth provider are OPEN security decisions.

Grant changes and tenant membership need transactional revocation ordering: acceptance holds a shared lock on the applicable authorization record until commit; revocation obtains incompatible lock. If revocation commits first, later acceptance denies; if acceptance commits first, revocation triggers governed active-work handling, not retroactive assignment erasure. Platform policy/verification/category/zone versions need equivalent consistent freshness/locking or a proven version-check strategy. The small proof does not validate the entire production eligibility graph.

## Candidate logical schema

UUIDs, authoritative timestamps, integer versions and explicit FK ownership are candidates. Never use user-entered merchant labels as keys. Money uses integer minor units plus ISO currency and policy/quote version, not binary floating point. Store UTC instants and requested IANA timezone; local calendar windows are not UTC arithmetic alone. Approved numeric limits and retention are not supplied by this draft.

| Entity | Minimum logical fields and invariant | Sensitive boundary / required index |
|---|---|---|
| Subject, Session, LinkedIdentity | subject ID, issuer-specific identity, session hash/reference, revoked/expires, auth strength; unique issuer/identity | Private; no raw tokens in events/logs; session lookup and revocation index |
| Merchant, Member, TechnicianLink | tenant, subject, capability, active/version; unique member/tenant link; scoped technician membership | Staff identity/private shared-resource mapping hidden from other businesses |
| VerificationCase | tenant, assigned reviewer, status, task-scope/validity, evidence refs, reason, version | Evidence private; no merchant self-approval; assigned-case/status index |
| Category, MerchantService, ServiceZone | parent taxonomy, enabled status/version, task scope, merchant/category FK, geometry/geography SRID, disclosure | Public fields separated from precise personal location; GiST index where applicable |
| ServiceRequest | customer, category/zone, encrypted/private address ref, instant/scheduled mode, desired window/timezone, state, generation, version | Customer-owned; mode/window consistency; owner/status and scheduled activation indexes |
| Offer | request, tenant, generation, expiry, eligibility/config versions, permitted command state | Unique request/generation/tenant; tenant/expiry lookup; no exact customer address before permission |
| CapacityUnit, Reservation | verified resource, tenant-authorized link, buffered interval, assignment ref, active/released | Shared technician identity must deduplicate privately across authorized links; interval collision rules below |
| Assignment, Booking | request/generation, winning tenant, active/released/completed, technician, state/version, consented quote ref | One active assignment per request across all generations plus unique request/generation; tenant/job authorization |
| Quote, QuoteConsent | request, immutable amount/scope/charge details, version/expiry, consenting customer/time | Changed quote requires new consent; absent price never means zero |
| CommandResult | subject, operation, key, canonical payload digest, outcome/resource/version | Unique subject/operation/key; keyed request digest for sensitive low-entropy payloads; retention remains OPEN |
| OutboxEvent, DeliveryAttempt | event ID/type/schema, request/generation/version, tenant/purpose, minimal payload, lease/attempt/next time | Unique event + recipient/channel/template delivery key; pending/time index; no secrets/location payload |
| Audit, Incident, PrivacyCase | actor/action/resource/reason/correlation, case scope, append-only corrections, hold/deletion state | Case-scoped access and governed export; approved retention/redaction required |

SQL constraints supplement commands: positive/nonnegative counts; FK request/customer/tenant coherence; unique active assignment across generations; unique logical command key; legal state/version compare-and-swap. A partial unique generation-only index is insufficient because a stale live assignment could survive a new generation. Actual DDL, migrations, RLS/security-definer hazards and denial tests remain unapproved/unimplemented. The fixture [SQL](../engineering/validation/dispatch/acceptance.sql) is deliberately smaller and is NOT this schema.

PostGIS candidate: verified SRID/geography coordinates with `ST_DWithin` in metres, proper spatial index and configured legal zone boundary. Straight-line distance is not road travel time or a service promise. Missing/low-confidence pins ask for clarification; manual overrides require provenance and cannot bypass a closed service zone. Exact map provider/data permissions and Tanuku address accuracy remain external proof obligations.

## Acceptance transaction and linearization

Candidate command `acceptOffer` receives authenticated subject, offer ID, request ID/generation, expected version and idempotency key. Client tenant/clock/verification claims are not authority. Full transaction at READ COMMITTED:

1. Hold applicable subject/membership authorization locks in stable order; deny revoked or mismatched scope. Check current access even when replaying an earlier receipt; a revoked actor must not retrieve private prior results.
2. Serialize actor/operation/key (unique durable ledger, with transaction-scoped advisory lock in the fixture). Same key and different canonical payload yields conflict, not another command. Hash collisions serialize extra work but never bind two keys as equal; compare original ledger keys and payload digest. Never use session advisory locks.
3. Lock canonical request; then offer; then configured eligibility records and resource units in one documented global order. For bulk requests/resources sort IDs. All cancel/reassign/expire/verification writers must be analyzed for the same order; retry deadlock/serialization failures as a whole transaction with bounded jitter and the same key.
4. Validate searching state, expected version/generation, current offer, expiry using DB wall clock, current verified category/zone/hours and reservable buffered capacity. Lock waits must not preserve a stale `now()` snapshot as the expiry check. Recheck deadline after all capacity waits.
5. Insert reservation and unique active assignment; transition request and create initial booking coherently; persist key receipt, minimal audit and outbox in this transaction. Rollback means no capacity, assignment, success receipt or notification event.
6. Respond with committed receipt only after COMMIT. Losing contenders observe committed current state and return deterministic conflict; never silently retry as another offer or generation. Lost response replays the original receipt after current authorization check.

“First” means first valid assignment transaction that commits, not API arrival, UI tap, push ACK or local clock. Eligibility deadline is evaluated at the locked decision point. A deadline crossed between final validation and COMMIT is a distinct policy question: a strict commit-before-expiry promise is NOT proven by a precommit clock check. Specify a transaction budget and approved expiry semantics before final approval; no approximate timeout can be advertised as a proven commit deadline. A transaction paused indefinitely must fail/rollback under configured server timeouts. No partial response can expose uncommitted reservation as confirmed assignment.

Two different requests for the same resource also serialize, preventing lost updates/oversell. Availability hints and merchant headcount cannot replace shared-technician identity/capacity. No lock cycle is ruled out merely by the small fixture; full command lock-order review remains required.

## Scheduled capacity and release

Draft preference: distinguish requested window from confirmed reservation. Request capture alone is unconfirmed. Confirm only when an eligible merchant and actual resource/time interval can be committed together. Future staffing, open hours, travel and buffer assumptions must be evidence-backed; closed/unverified windows cannot be sold. Owner must approve whether merchants accept in advance or dispatch activates nearer the slot; this draft does not silently choose a commercial promise.

Candidate interval enforcement uses half-open `[start,end)` ranges including approved travel/setup buffers. Allocate explicit unit IDs, not an unconstrained merchant counter. A PostgreSQL exclusion constraint on active `(capacity_unit_id =, interval &&)` can prevent overlapping reservations for each unit, subject to required extension support and actual database tests. Two merchant aliases sharing one technician must map to the same private resource or the constraint proves nothing. Multi-unit allocation, variable travel, long jobs, replacement staff and time-zone boundaries need their own proofs. The present integer-resource fixture is NOT an interval/scheduled-capacity proof.

Cancel/reassign/release lock request then reservation/resources consistently. Mark release exactly once with version/unique command guard; no negative capacity. Reassignment releases old live reservation before new generation/offer set becomes eligible in the same governed sequence. Do not release a technician merely because a notification fails or an app goes offline. In-progress safety incidents need a staffed intervention policy before changing service/reservation state. Late completion cannot resurrect cancelled generations or double-count capacity.

## API, event and worker contract

Use the [candidate API envelope](../engineering/contracts/service-api-candidates.json), not a deployed endpoint. HTTPS, authenticated session and object authorization precede reads/writes. JSON schemas are trusted code assets, never user-supplied runtime schemas. Limit lengths, upload counts, pagination, filters and replay/key lifetimes after approval. Unknown properties and mismatched content types fail at the boundary. Validation is not authorization.

Create request returns canonical ID, mode, state, generation/version, backend timestamp and correlation; scheduled creation never says confirmed merely because it exists. Conditional commands require expected generation/version. `401` authentication missing/expired; `403` action denied without foreign-object details; `404` permitted masked-not-found; `409` stale version/generation, already assigned, capacity or key reuse; `410` expired offer; `422` invalid supported payload; `429` retry timing; `503` transient unavailable with unknown commit outcome explicitly reconciled. Error body has stable code, safe message key, correlation and retryability, not SQL/token/address/stack. Retrying a `503` or timeout must preserve key and payload. No generic retry of terminal denied/expired/conflict outcomes.

Events use stable ID, schema version, aggregate ID/generation/version, committed time, tenant-safe recipient reference, purpose and correlation/causation. Suggested event types: request.created.v1, request.cancelled.v1, assignment.committed.v1, booking.transitioned.v1, quote.updated.v1, quote.consented.v1, merchant.suspended.v1, privacy.deletion.requested.v1. New schema versions remain backward-compatible where possible; consumers reject/quarantine unknown versions rather than reinterpret state. Never put media binaries, exact addresses, contact details, secrets or government evidence in an outbox payload.

Outbox worker leases bounded batches with `FOR UPDATE SKIP LOCKED`, commits claim/lease before network I/O, then records outcome. Failed leases expire and retry; provider success followed by process failure can duplicate delivery. Use provider idempotency where supported, plus delivery ledger; otherwise explain at-least-once limitation. Retry with capped backoff/TTL, dead-letter classification and staffed reconciliation. Recheck current recipient consent and event relevance before delivery. Quarantining poison events cannot silently drop booking state or loop spend indefinitely.

Webhook ingress verifies current official signature over raw bounded bytes, secret lifecycle, replay/dedupe identifiers, content type and allowed event schema before parsing/processing. Exact Meta callback signature/verification and account permissions remain unverified; never copy a guessed scheme into production. Challenge/token handling is separate from authenticated user identity. Receipt statuses update delivery records only. Customer/merchant actions conveyed by an authorized provider must resolve authenticated linked identity, allowed command and current resource state; an arbitrary phone number cannot grant a tenant role.

Push/realtime carries minimal event references; on receipt/reconnect the app reads authorized current state. Deduplicate by event ID and reject stale aggregate version. Offline commands remain “pending”, not locally won; expiry uses server decision. FCM/APNs/Web Push token ownership, lifecycle and permissions need real-device testing. Provider ordering and “delivered” are not customer/merchant consent.

## Security, privacy and failure-mode analysis

| Threat/failure | Required contract / recovery | Evidence still required |
|---|---|---|
| Cross-tenant object guessing or forged actor/tenant field | Server-derived subject, tenant + resource + action checks; masked denials and denied-path audit | Real API/RLS/worker/object-storage negative tests |
| Privileged takeover, recovery abuse, staff self-grant | MFA, scoped sessions, no shared credentials, bounded governed recovery, no self-elevation | Auth-provider review, abuse scenarios and independent assurance |
| Callback forgery/replay/out-of-order event | Verify official raw-body scheme; dedupe event; delivery never mutates assignment | Effective official specs and signed/invalid/replayed fixtures |
| Double winner, oversell, stale key/generation | Single transaction, request/resource serialization, constraints and durable command result | Bounded proof is partial; production-schema race/cancel/release tests pending |
| Evidence/upload malware or public URL leakage | Quarantine, type/size checks, strip metadata, scan, private access after object authorization | Storage vendor permissions, malicious file and URL-expiry tests |
| Location/contact leakage in offers/logs/push | Coarse preacceptance zone; private address only to assigned authorized actors; redacted event refs | Role/field masking and telemetry redaction tests |
| Queue duplicate, poison payload or worker crash | Lease + bounded retries, idempotent ledger, current relevance check, staffed dead letter | Crash/duplicate/restart and provider cost caps |
| Database outage/unknown commit | No optimistic success; same-key reconciliation after recovery | Lost-connection, database restart and failover tests |
| DB/object restore mismatch, deletion resurrection | Consistent checkpoints, object manifest, deletion tombstones and legal-hold reconciliation | Isolated restore drill with measured RPO/RTO |
| Merchant suspension/cancellation during live work | Serialize changes and preserve factual history; staffed safety policy | Full command lock-order/race and operations exercises |
| Misleading KPI or unfunded support | Defined denominators, observed workload, conservative costs, staffed escalation | Actual demand/capacity/funding evidence, no invented SLA |

No threat table row is a deployed security control or passed security audit. Tenant isolation in the fixture is a toy trusted-actor assertion, not an authentication/RLS test. Legal retention and merchant competence cannot be inferred from technical masking.

## Integration and deployment dependency matrix

| Dependency | Verified planning evidence / open boundary | Commitment gate |
|---|---|---|
| PostgreSQL | Local 17.11 available; documented locking/isolation; bounded proof separately recorded | Supported pinned deployment version, schema review, restore/concurrency tests and cost |
| PostGIS/maps | Documented distance mechanism, not local address accuracy or drive time | Extension/region support, permitted maps data, accuracy tests and cost |
| WhatsApp direct/BSP | Official pathway exists; effective India numeric rates/account/callback details unresolved | P01-DOD-008, business identity, actual permission, policy/opt-in/templates and billing |
| FCM/APNs/Web Push | Planned adapter interfaces only | Account/entitlement/device permission, background/reconnect, token revocation and cost |
| Identity, object storage, email/SMS | No vendor commitment | Security/privacy/region/support/quotas/itemized price and owner approval |
| Hosting, telemetry, backup | Architecture option only; no resources | Approved budget, operational ownership, data location, RPO/RTO and restore proof |
| Android/iOS client strategy | Shared contract, not assumed shared lifecycle or approved wrapper | Device/store/portability proof; no app build in this task |
| Lovable/export | Separate standalone export is proposed, not repo import | Phase 06 design approval, Phase 07 authority and Phase 08 portability proof |

Candidate failure domains separate public API and background workers from private database/object storage; no database credentials in browsers/mobile/WhatsApp clients. Use restricted service identities, private DB network and managed secret rotation. Regional deployment, replicas, queues, cache and failover are choices, not provisioning instructions. Backups must be encrypted/off-device, access reviewed and restored with private objects and deletion constraints. RPO, RTO, restore cadence, uptime/latency targets and funded on-call remain OPEN approval inputs, not safe invented defaults.

## Preliminary technical review and unresolved decisions

Mapped to FR-C-003/004/005/006/007, FR-M-002 through FR-M-008, FR-A-001 through FR-A-006, FR-X-001 through FR-X-005 and NFR-SEC/REL/OBS/BCP/EXT/OPS/COST. Original IDs and blueprint artifacts remain unchanged. All command denials, scheduled timing and privacy terms must reconcile with approved Phase 02 and final Phase 04 specifications before approval.

Unresolved: Phase 01 exit; complete approved requirements/policy; full eligibility/revocation lock order; precise expiry/commit semantics; scheduled interval allocation; provider/auth/storage/hosting choices; legal retention; numeric SLO/RPO/RTO; mobile portability and independent security assurance. Concurrency proof has narrower evidence than this architecture. Phase 03 exit denominator/percentage is NOT MEASURABLE without its reviewed finite exit checklist. No phase closure, G0 pass, final ADR approval or production-readiness score is claimed.
