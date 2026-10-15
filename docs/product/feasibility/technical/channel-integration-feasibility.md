# Channel integration feasibility

Status: CONDITIONAL; official access and device integration not tested. [Continuity](../../../flows/cross-channel-continuity.md) remains canonical; [WhatsApp](../integrations/whatsapp-feasibility.md) is a mandatory unresolved dependency.

One backend should expose authenticated commands and scoped snapshots to web/PWA/customer+merchant mobile/WhatsApp adapters. Actor identity, tenant, payload, idempotency key, generation and version cross a single authorization contract. Reconnect fetches current authorized state; no notification or click independently assigns. Staff clients remain private and case-scoped.

Phone number, guessed request ID or token does not prove cross-channel identity. Test shared devices, recycled numbers, revoked merchant membership, account recovery, consent withdrawal, cursor expiry and stale/offline views. Webhook identity must be cryptographically authenticated under verified provider specifications before processing; challenge tokens alone are not notification authenticity.

Outbox delivery may be delayed/duplicated/reordered. Deduplicate callback IDs, record outcomes without advancing illegal business state, enforce expiry and reconcile monotonic versions. Suppress obsolete acceptance offers and never forward private customer data to unrelated recipients. Push accepted by a gateway is not proof of delivery.

Fallback design: show truthful pending/unavailable communication; allow authorized web status; propose user-permitted alternate channel, not unsolicited SMS or duplicate business request. Missing channel access does not silently remove WhatsApp from single-launch scope. EX-P01-03/05 pending; no live credentials/messages/accounts.
