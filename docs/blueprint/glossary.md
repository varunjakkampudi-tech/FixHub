# Blueprint glossary

| Term | Fix Hub meaning |
|---|---|
| Authoritative backend | The authenticated system that validates and commits business decisions across every channel. |
| Canonical ID | Stable backend request/merchant/user identity, distinct from a provider message or push token. |
| Tenant | A merchant business boundary; ownership and delegated grants constrain every read/write. |
| Generation/version | Revision markers preventing expired offers or stale state from affecting current work. |
| Atomic first acceptance | Exactly one valid acceptance transaction commits assignment and capacity; arrival of a click/message alone decides nothing. |
| Idempotency | Repeating the same actor/operation/key/payload returns one saved business result rather than duplicating work. |
| Transactional outbox | An event saved with a business transaction so committed notification intent survives a crash. |
| Replay/reconnect | Authorized current snapshot or permitted event history after connectivity returns. |
| Conceptual blueprint | Initial responsibility/flow model; exact contracts and implementation proofs await later phases. |
| Stage gate | An evidence prerequisite G0–G5; a diagram or plan cannot pass a gate. |
| MFA | Multiple-factor authentication required for privileged roles; specific factor/recovery design remains pending. |
| RPO/RTO | Approved maximum data-loss interval/recovery duration; no numeric target is selected here. |
| No-license posture | No additional software reuse license is granted; legal/commercial terms still require owner review. |
| Planning approval | Owner-delegated acceptance of documented intent and scope; no vendor, security or launch assurance. |
| Repository closure | Approved planning/evidence recorded through legitimate repository controls, distinct from owner authorization alone. |

See [reader guide](README.md), [state machines](../flows/state-machines.md) and [owner approval](../reviews/foundation-approval.md).
