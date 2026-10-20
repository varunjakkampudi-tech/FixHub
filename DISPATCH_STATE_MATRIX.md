# FixHub24 — Smart Dispatch & Booking State Machine Matrix

**Project:** FixHub24 (Viswatra)  
**Spec Reference:** `FixHub-Product-Spec-v1.3.md` (FR-4 & Section 8)  
**Concurrency Engine:** Redlock Distributed Lock Engine with atomic SETNX & token-verified release  
**Audit Commit:** `554fde9`  

---

## 1. Booking State Machine Lifecycle

```
[requested]
     |
     v
 [offered] --------(Timeout / No Merchant)-------> [rescue_pending] -> [cancelled]
     |
     v (Atomic Redlock Win)
 [accepted]
     |
     v
[technician_assigned]
     |
     v
 [on_the_way]
     |
     v
  [arrived]
     |
     v
[quote_pending] ---(Quote Rejected & Fee Paid)---> [completed] -> [settled]
     |
     v (Quote Accepted)
 [in_progress]
     |
     v
 [completed]
     |
     v
  [settled] (Cash Collected)
     |
     +-----(Customer Dispute)-----> [disputed] -> [resolved]
```

---

## 2. State Transition Permissibility Matrix

| From State | To State | Allowed Actor | Trigger / Event | Concurrency Control |
|---|---|---|---|---|
| `requested` | `offered` | System Dispatch | Locality & category matching within Tanuku radius | Spatial query |
| `offered` | `accepted` | Merchant | Merchant taps Accept on broadcast lead | **Redlock Atomic Lock (SETNX lock:booking:id)** |
| `offered` | `cancelled` | Customer / System | Customer cancels before acceptance OR 15-min timeout | Status CAS update |
| `accepted` | `technician_assigned`| Merchant | Merchant assigns available technician from roster | Idempotent assignment |
| `technician_assigned` | `on_the_way` | Technician / Merchant | Technician departs shop for customer address | State update CAS |
| `on_the_way` | `arrived` | Technician | Technician reaches customer location in Tanuku | State update CAS |
| `arrived` | `quote_pending` | Technician | Technician performs inspection and submits quote | Quote record created |
| `quote_pending` | `in_progress` | Customer | Customer approves parts & labor estimate | Customer digital sign-off |
| `quote_pending` | `completed` | Customer | Customer rejects quote; base inspection fee charged | State update CAS |
| `in_progress` | `completed` | Technician / Merchant | Technician completes repair work | Work verification |
| `completed` | `settled` | Customer / Technician | Customer pays cash on completion; technician confirms | Payment receipt recorded |
| `settled` | `disputed` | Customer | Customer opens dispute ticket within 48 hours | Dispute record created |
| `disputed` | `settled` / `cancelled`| Super Admin | Admin arbitrates dispute and issues resolution | Admin audit log |

---

## 3. Concurrency Protection & Race Defense (FR-4)

- **Atomic Lock Acquisition:**
  `SET lock:booking:<id> <random_token> NX PX 10000`
  Only the single transaction that successfully acquires this Redis key can transition the booking from `offered` to `accepted`.
- **Race Condition Verification:**
  - Automated concurrency test in `api/test/dispatch-and-race.test.ts` simulates 3 parallel worker processes submitting simultaneous accept requests for the exact same booking.
  - Exactly 1 worker wins (`200 OK`, `booking.status === "accepted"`).
  - All competing workers fail gracefully (`409 Conflict`, `"Booking has already been accepted by another merchant"`).
  - Zero double-assignments proven.
