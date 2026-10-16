# Channel integration feasibility

Status: CONDITIONAL; official access and device integration not tested. [Continuity](../../../flows/cross-channel-continuity.md) remains canonical; [WhatsApp](../integrations/whatsapp-feasibility.md) is a mandatory unresolved dependency.

One backend should expose authenticated commands and scoped snapshots to web/PWA/customer+merchant mobile/WhatsApp adapters. Actor identity, tenant, payload, idempotency key, generation and version cross a single authorization contract. Reconnect fetches current authorized state; no notification or click independently assigns. Staff clients remain private and case-scoped.

Phone number, guessed request ID or token does not prove cross-channel identity. Test shared devices, recycled numbers, revoked merchant membership, account recovery, consent withdrawal, cursor expiry and stale/offline views. Webhook identity must be cryptographically authenticated under verified provider specifications before processing; challenge tokens alone are not notification authenticity.

Outbox delivery may be delayed/duplicated/reordered. Deduplicate callback IDs, record outcomes without advancing illegal business state, enforce expiry and reconcile monotonic versions. Suppress obsolete acceptance offers and never forward private customer data to unrelated recipients. Push accepted by a gateway is not proof of delivery.

Fallback design: show truthful pending/unavailable communication; allow authorized web status; propose user-permitted alternate channel, not unsolicited SMS or duplicate business request. Missing channel access does not silently remove WhatsApp from single-launch scope. EX-P01-03/05 pending; no live credentials/messages/accounts.

## Provider prerequisites checked 2026-10-16

Twilio's public docs describe prerequisites for connecting an eligible sender/WABA, Meta Business Portfolio administration and account onboarding; business-initiated notifications use approved templates under applicable rules. Twilio documents HTTPS webhooks authenticated using its signature and SDK validation. Its public WhatsApp pricing page shows a USD0.005 fee per inbound or outbound message in addition to Meta charges. This dated list input is included in the LOW/BASE/HIGH model using editable assumed FX ₹85/USD; it is not a Fix Hub quote or current FX observation. See SRC-043–046 in the source register. Message counts remain unmeasured assumptions and may not capture recipient fan-out/retries.

Resend's Node sending flow requires an API key and verified sender domain; its webhook documentation provides delivery-event handling and signature verification (SRC-047). No Fix Hub domain has been selected or verified, and no account, key, sender or webhook has been created or tested. The product's domain remains an owner decision. No provider account registration, contact, message, spend or external configuration is authorized by this documentation update.

### Resend pricing snapshot — 2026-10-16

The official public transactional-email page lists a Free plan at $0 for 3,000 emails/month with a 100/day limit, three domains, one webhook endpoint and 30-day retention; Pro is $20/month for 50,000 emails/month with no daily limit, five webhook endpoints and $0.90 per 1,000 over-quota emails on paid plans (SRC-048). This is a dynamic USD list price, not an account quote or tax-inclusive INR cost. Free-tier daily bursts, approved sender-domain ownership, API/account eligibility, deliverability and email event fan-out remain unverified. Do not assume the free tier fits the marketplace's actual notification volume.
