# Bounded acceptance proof and preliminary Phase 03 review

2026-10-15, Asia/Calcutta. **DRAFT PREPARATION; PHASE 03 NOT ENTERED OR APPROVED.** Base local main `79487a24c31182c1a960084f24e819ce4900cacc`; published main remains `aff098c143e44199160ed8e31801b0df57628702`. Direct-main publication was rejected for required `docs-validation`; no repeat push, bypass, protection change or alternate branch/PR is authorized here. See [work scope](../governance/product-foundation-work-authority.md).

## Executive evidence table

| Dimension | Result and limitation |
|---|---|
| Bounded SQL proof | PASS: 13 synthetic cases, 0 failures, 0 skipped; not the production model |
| Real concurrent sessions | Twelve same-request contenders; at least two observed blocked sessions. Shared-resource and same-key cases each require two observed lock waiters |
| Fixture security | Isolated new local cluster, SCRAM, random bootstrap secret, loopback only, no existing DB connection or production/private data |
| Cleanup | Normal completed run stopped its own cluster. Simulated SIGTERM probes after startup and during actual contention each exited 1 and recorded failure with cluster stopped |
| API artifact | Eight unique candidate operation records parse and contain required inventory fields; not complete OpenAPI or schema validation |
| Documentation integrity | Validator passes 117 Markdown files, original roadmap checksum/20 phases, 41 requirement IDs and existing blueprint/Phase 00 inventories; documentation mutation suite 53 PASS, 0 FAIL, 1 Windows symlink SKIP |
| Architecture | Candidate ADR/schema/API/security/failure/integration contracts prepared; approval and remaining proofs unresolved |
| Source reliability | Official mechanism documentation + directly executed local synthetic fixture; no actual provider or service data |
| Implementation security, feasibility and production readiness | NOT ASSESSED; database toy is not auth, tenancy/RLS, privacy compliance or product readiness |
| Phase 03 exit denominator / percentage | NOT MEASURABLE: no reviewed finite exit checklist or prior-phase exit approval |
| Phase decision / owner approval | Formal entry blocked; no phase GO, sign-off or G0 pass claimed |
| Next phase | Phase 04 draft preparation permitted; formal execution and approval remain gated |

## Reproduction and retained evidence

Use existing PostgreSQL binaries; no installation or existing database credentials required. Paths below are workspace-relative commands; supply the existing PostgreSQL bin directory appropriate to the local machine:

```text
node docs/engineering/validation/dispatch/run-acceptance.mjs --pg-bin <existing-postgresql-bin-directory>
node docs/engineering/validation/dispatch/run-acceptance.mjs --pg-bin <existing-postgresql-bin-directory> --simulate-interrupt
node docs/engineering/validation/dispatch/run-acceptance.mjs --pg-bin <existing-postgresql-bin-directory> --simulate-interrupt-during-race
```

The first command must exit 0, emit the 13 PASS outcomes and report stopped cluster. The other two intentionally exit 1: simulated in-process SIGTERM events exercise the installed handler after startup and after observing blocked concurrent contenders. Each retained `run-status.json` must show passed 0, failed 1, initialized true, clusterStopped true. They do not prove Windows external signal delivery or hard-kill cleanup. Match the raw summary hashes to the [recorded result](../engineering/validation/dispatch/acceptance-results-2026-10-15.json), [SQL](../engineering/validation/dispatch/acceptance.sql) and [runner](../engineering/validation/dispatch/run-acceptance.mjs). A changed runner/schema requires rerun; a checksum alone is not independent authenticity.

Each invocation creates its own unpredictable `fixhub-synthetic-proof-` temporary directory outside the live documentation tree. Bootstrap plaintext password is removed after initialization; cluster files, server log, status and successful-run summary are retained locally for diagnosis, not copied wholesale into public Git. The runner does not recursively delete directories or touch existing Postgres services. Retained stopped synthetic cluster files are not product backups. Interrupted initial debugging run lacks a final summary and is not counted as a successful run. Its specific proof runner and cluster were stopped by the implementing agent after verifying their identities; no unrelated service was stopped.

## Executed case results

| Case | Required observation | Actual final run |
|---|---|---|
| Same request race | Twelve sessions, observed lock overlap, one WIN, eleven CONFLICT; assignment/reserved/outbox = 1/1/1 | PASS |
| Shared capacity across requests | Both contenders observed waiting on held resource, one WIN, one CAPACITY; 1/1/1 | PASS |
| Same-key retry | Same saved receipt, one result and no extra effects | PASS |
| Changed-payload key reuse | KEY_REUSE and no second assignment | PASS |
| Same key, concurrent different requests | Both contenders observed waiting on held advisory key; one WIN, one KEY_REUSE | PASS |
| Wrong merchant tenant | DENIED with no effects | PASS |
| Revoked membership before command | DENIED with no effects | PASS |
| Stale request generation | STALE with no effects | PASS |
| Expired / invalidated offers | EXPIRED / INELIGIBLE with no effects | PASS |
| Expiry during resource lock wait | Actual waiting session observed; DB clock recheck yields EXPIRED, no effects | PASS |
| Cancellation holding request lock | Cancellation commits before waiter; CONFLICT and no assignment | PASS |
| Precommit SQL error | Intentional division-by-zero error rolls back assignment, capacity, outbox, key result and request version/state | PASS |
| Committed response discarded | Same key reconciles saved WIN with one assignment/reservation/outbox | PASS |

The rollback case is a transaction-error test, not a killed backend/server or crash-recovery test. Discarded-response case is controlled receipt loss, not a real network fault injection. Fixture member IDs and tenant parameters are trusted synthetic inputs; a denied toy input is not production authentication or RLS evidence. Contention assertion observes real PostgreSQL sessions, not only `Promise.all` scheduling.

## Findings and remediation history

| Severity | Reproduced finding | Remediation | Retest |
|---|---|---|---|
| MEDIUM | Windows inherited child pipes prevented runner progress after successful cluster startup | Restrict bounded post-exit stream drain fallback to pg_ctl; ordinary psql awaits stream closure | Final run progresses and shuts down normally |
| MEDIUM | Two initial races could pass serially without contention evidence | Explicit held locks and require two observed live Lock waiters for resource and shared key cases | Both stronger cases PASS |
| MEDIUM | Initial runner lacked handled interruption cleanup | SIGINT/SIGTERM handler tracks only own child processes; finally stops only own cluster | Simulated SIGTERM path PASS; real OS signal/hard kill NOT ASSESSED |
| MEDIUM | Delayed contender/holder rejection could become unhandled during observation/interruption | Attach settlement handlers immediately and join started outcomes even on observation errors | Active-race interruption probe PASS; full 13-case rerun PASS |
| LOW | Cleanup failure could leave recorded failed count at zero | Include shutdown failure in final status/summary, emit summary after cleanup | Source inspected; failure injection of pg_ctl stop NOT EXECUTED |
| LOW | Windows autocrlf could alter hash-bound proof sources on checkout | Pin only proof SQL/MJS files to LF in repository attributes | Working and staged blob hashes reconcile; no broader source normalization |

An additional fresh-context AI reviewer identified the contention, interruption and failure-count defects. Final source retest of runner SHA-256 `307183971475a644f1137bb0e6d65df35d02df7c0fb4a681af4f15500890ee18` found no unresolved material defect in this bounded scope; the reviewer did not independently execute the runner. Implementing-agent runtime retests above are direct evidence; independent human/security assurance is absent. Static review of cleanup-failure accounting does not imply executed shutdown-failure injection.

## Remaining architecture and phase obligations

The [architecture candidates](../architecture/architecture-contracts-draft.md) explain module ownership, data invariants, idempotency, outbox, lock/revocation order, error contracts, deployment failures and trust boundaries. The [API inventory](../engineering/contracts/service-api-candidates.json) is intentionally a candidate subset, not a final API specification. Outstanding proofs include scheduled interval units/shared staff, release/reassignment and suspension races, complete eligibility locks, full schema constraints, hostile API/storage/RLS access, durable restart/restore, PostGIS geography, actual providers, device lifecycle, performance and deployment. EX-P01-01's proposed 100-session/crash/cancel/revoke experiment is NOT marked passed by this 12-session partial proof; EX-P01-02 is still NOT ASSESSED. Preserve those historical experiment statuses.

Phase 01 still has unresolved official provider evidence and final owner exit decision. Phase 02 policy/requirements remain draft. Technology/hosting, identity provider, precise deadline semantics, legal retention, SLOs, RPO/RTO, funded support and permanent brand are not silently approved. G0/G1 remain unpassed; only Phase 00 is published closed (1/20). Overall engineering/product completion remains NOT MEASURABLE. Phase 06, Lovable, application implementation and production infrastructure were not started.

## Additional bounded interval and release evidence — 2026-10-15

The separate [scheduled SQL fixture](../engineering/validation/dispatch/scheduled.sql), [standalone runner](../engineering/validation/dispatch/run-scheduled.mjs) and [matching result](../engineering/validation/dispatch/scheduled-results-2026-10-15.json) preserve the historical 13-case proof unchanged. The existing local PostgreSQL 17.11 installation already supplied btree_gist; it was loaded only into a new synthetic SCRAM-authenticated loopback cluster. No dependency installation or existing database/service access occurred.

Final normal run: **17 PASS, 0 FAIL, 0 SKIP; cluster stopped**. Evidence covers half-open adjacency, observed overlapping contenders sharing one unit, merchant aliases mapped to one synthetic unit, distinct units, pre-expanded buffers, invalid windows/identities/keys, repeat-safe release, payload-bound successful receipt replay, exclusion-constraint rejection, rollback of reserve/release effects, equivalent explicit timezone offsets, foreign release denial, termination of an observed uncommitted client backend, and committed reservation/outbox persistence through a normal isolated server restart. Final-revision startup and observed-race interruption probes each intentionally exit 1, record the failed run and stop the cluster; those expected failures are not counted as business-case failures.

Source review identified a NULL-comparison scope bypass in the toy release function and a potentially vacuous pre-termination setup assertion. Both were fixed. One intermediate strengthened assertion run failed because a mutating call and effect reads shared one SQL expression. The final runner assigns/verifies the receipt in a separate statement before reading effects; only that final matching source hash is recorded as successful. No intermediate failed run is silently promoted to PASS. A separate native AI source reviewer examined the changes; runtime results are implementing-agent evidence, not independent human assurance.

Limits: resource identity and buffers are synthetic supplied inputs, not actual shared-staff verification or route time. Successful reserve receipt replay is modeled, not durable caching of every terminal denial. A normal restart is not host-crash/off-device recovery; backend termination is not a host power-loss test. Full request-generation reassignment, production auth/RLS, actual providers, geography, device lifecycle, load and deployment remain unproven. This additional partial mechanism evidence does not retrospectively pass the original complete future experiment or approve architecture/phase exit.

## Notification outbox PostgreSQL proof — 2026-10-16

Implementation baseline: `c253ddf361338846079f1c44f71b6b9a63fc067e`. Reproducible runner: [`scripts/notification-outbox-postgres-proof.mjs`](../../scripts/notification-outbox-postgres-proof.mjs), SHA-256 `7CD4D458683D3FCEE15A42974F3CE9CF3C88950CC38576EEA92024F0166157E6` (exact source revision executed below). Command used with the existing local PostgreSQL 17 binaries:

```text
node --import tsx scripts/notification-outbox-postgres-proof.mjs --pg-bin "C:\Program Files\PostgreSQL\17\bin"
```

Observed result: **PostgreSQL 17.11; all 7 migrations applied; 0 migrations on idempotent rerun; provider-attempt column and `uncertain` state present; 2 fake-sender sends (customer request receipt and eligible merchant offer); 1 stale customer event suppressed; actual updater session observed waiting on the booking row lock during the send.** All records used synthetic identities/contacts and the temporary loopback-only cluster was stopped and removed after the successful run. No Twilio request, account credential, existing database, or customer/merchant data was used.

Limits: one bounded real-database lock case does not prove all state races, provider delivery or exactly-once behavior. The sender was a fake; no webhook, Twilio account, production deployment, failure injection, database restore, application security review, or legal/consent basis was validated. This evidence strengthens the outbox mechanism only; it does not approve architecture or phase exit. The Phase 01 statuses and owner decisions are unchanged.
