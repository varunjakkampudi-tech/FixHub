# Architecture feasibility against the approved blueprint

Status: CONDITIONAL conceptual plausibility; runtime/security/performance NOT ASSESSED. Reuse [platform](../../../architecture/platform-overview.md), [data](../../../architecture/data-architecture.md), [trust boundaries](../../../architecture/security-trust-boundaries.md) and [41-ID mapping](../../../blueprint/traceability-matrix.md). No baseline requirement or architecture approval changed.

| Question / likelihood-impact risk | Assessment / mitigation | Dependency and proof |
|---|---|---|
| One backend for all clients; medium/high divergence | Canonical subject/request/version contracts plausible; no adapter owns business state | Account access; authorized replay/device tests |
| Tenant permissions; high/critical leak | Actor/tenant/resource checks, scoped workers/staff and deny-by-default | Phase03 threat model; cross-tenant/role deny tests |
| Single dispatch winner; high/critical race | Transaction plus unique active assignment and commit-only response | EX-P01-01, not executed |
| Capacity consistency; high/high oversell | Lock request/capacity in stable order; constraints and whole-tx retries | EX-P01-01/02 |
| Scheduled reservations; high/high | Time buckets/exclusion/range model must include travel/overrun | EX-P01-02; actual availability |
| Delayed notifications; high/high | Outbox, monotonic generation/version and expiry; reconcile backend | EX-P01-03; provider callback contract |
| WhatsApp identity; high/critical | Ownership proof plus safe linking/revocation, not number equality | Official access; number-recycling/shared-device tests |
| Duplicate requests; high/high | Actor+command+payload idempotency; replay same result | Retention/conflict contract; retry/crash fixtures |
| Geographic eligibility; medium/high | PostGIS geography distance/index possible; pin/boundary validation | EX-P01-04; drive time not distance |
| Initial budget; high/high | Cost tiers and specialist/founder workload modeled | Quotes, measured load and funded scope absent |
| Vendor outage; high/high | Fail closed for unsafe commands; pending-notification truth; alternate authorized channels | Outage/reconnect drills, staffed support |
| Expansion; medium/high | Explicit domains/tenant isolation/zone policies aid scaling | Capacity tests/ops/legal per city; no scale guarantee |

Node/TypeScript/Fastify with PostgreSQL/PostGIS remains a proposal under DEC-012, not locked stack. Prefer maintained Node LTS at implementation rather than hardcoding a stale runtime. Fastify schemas must be trusted application definitions, not supplied by untrusted users; authorization is not schema validation. Official runtime/schema sources are SRC-036/037.

Transactional outbox and workers are justified by consistency, not a need for premature microservices. Optional cache/queue must not own assignments/capacity; PostgreSQL remains authority. Private object storage requires scan/access/retention controls. No frameworks installed, database provisioned or app implementation performed.

Critical findings remain RISK-012 consistency and RISK-007/008/013 external identity/channel constraints; primary demand/funding RISK-006/014. Match future proofs to traceability rather than rewriting diagrams. Final architecture remains Phase03/08.
