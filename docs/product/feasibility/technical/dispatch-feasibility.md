# Dispatch and scheduled-capacity feasibility

Status: CONDITIONAL mechanism review, no concurrency experiment executed. [Existing acceptance flow](../../../flows/atomic-acceptance.md) and [states](../../../flows/state-machines.md) unchanged. PostgreSQL locking/isolation sources SRC-029/030 support available mechanisms, not FixHub proof.

Candidate transaction: authorize actor/tenant; bind idempotency payload; lock request/generation then relevant capacity records in deterministic order; recheck live offer/expiry/verification/zone; conditional reservation and unique current assignment; save command result+outbox; commit; return receipt only after commit. Losing/replayed/expired commands cannot reserve again. Deadlock/serialization retry repeats the entire transaction within a bounded retry policy, not isolated last statement.

Scheduling needs explicit interval/time-zone/day-boundary/travel/overrun policy. A present-availability boolean cannot reserve a future slot. Shared technician identity and overlapping services require common capacity authority. Reassignment generations and cancellation serialize with acceptance and preserve history.

## Proof requirements

EX-P01-01:100 simultaneous eligible contenders produce exactly1 committed active assignment and1 reservation; losers reserve0; changed-payload retry rejected. Cover crash before/after commit, stale generation, revoked verification and cancel/accept race.

EX-P01-02: overlapping scheduled reservations never exceed available technician capacity; resource lock order and DST/timezone display tested even if Tanuku has no DST. Cancellation releases only its own committed reservation; idempotent release cannot inflate capacity.

These are proposed thresholds, NOT executed tests or guaranteed throughput. Application/SQL prototype execution needs separate authorization; no proof is claimed. Legal task safety/actual supply/pricing also constrain dispatch validity.
