# Official WhatsApp feasibility

Status: CONDITIONAL, mandatory dependency unresolved; no account, phone, message or purchase configured. Owner: product/integration lead; human owns accounts/billing. Sources SRC-009–012 in [register](../evidence/source-register.md), retrieved2026-10-15.

## Effective pricing versus explanatory copy

Meta's public pricing describes delivered-message categories and still calls service/responsive utility free. AiSensy reports charges effective1 October2026. Its India₹0.145 category rates/1,000-service allowance are provider statements, not independently verified Meta rate-card values. Developer pricing pages returned throttling/fetch errors; no effective dated official India rate card or account billing obtained. Do not resolve conflict by choosing the cheaper statement. Taxes, rounding, free entry windows, BSP markup, subscriptions and eligible message classification require a dated quote and invoice basis.

Later targeted verification: [Meta official FAQ](https://whatsappbusiness.com/resources/faq/) (SRC-040) explicitly confirms service-message charging effective 1 October 2026 after the first 1,000 service messages per business phone number each month. This verifies the charging/allowance rule, but not numeric India rates. Its published-rate link returned HTTP 429. Preserve contrary free-service explanatory text as stale/conflicting copy, not equal evidence for choosing free billing. The official [Postman overview](https://www.postman.com/meta/whatsapp-business-platform/overview) confirms Cloud API collections and deprecated on-premises access (SRC-041); detailed callback specifications still unavailable.

[Offline model](../finance/unit-economics.md) assumes4 utility+1 authentication+6 service/request,₹0.145,1,000-service allowance. Monthly WhatsApp variable₹493/1,769/4,640; BSP₹1,500 separate fixed assumption. Removing allowance and doubling messaging/support are calculated stress cases. Marketing baseline0; no acquisition broadcast authorized. These are budget sensitivities, not a bill promise.

## Account and policy prerequisite matrix

| Item | Current evidence | Required proof |
|---|---|---|
| Viswatra legal identity/business verification | Owner entity evidence absent | Legal name, authority and Meta-supported verification |
| Phone number/ownership/migration | Not configured | Approved number, ownership, coexistence/migration policy and recovery |
| WABA/Cloud API/direct versus BSP | No account eligibility proof | Official onboarding/permissions, authorized owner, support and revocation plan |
| Callback security/webhooks | Developer docs unavailable; blueprint only | Effective callback signature scheme, challenge, tokens, TLS, replay/idempotency tests |
| Consent/opt-out/templates | Official policy reviewed | Purpose-specific notices and logged consent; approved templates; workable human escalation |
|24 h free-form window | Policy constraint reviewed, pricing conflict retained | Enforce permitted message types independently of cost |
| Quality/volume/account limits | Account-specific NOT ASSESSED | Actual limits, templates/quality and appeal/outage routes |
| Country/category rate and tax | NOT VERIFIED | Dated effective Meta India rate card + billing/BSP quote |
| Customer and merchant notifications | Plausible, not tested | Distinct consent/tenant authorization, redacted payloads, delivery failure behavior |

No unofficial WhatsApp automation. Direct API removes a BSP dependency but adds token lifecycle, reliability, policy/support and operational work; BSP adds costs, subprocessor/privacy and portability questions. Neither is selected.

## Failure and continuity

Backend commit remains authoritative; delayed/duplicate/out-of-order callbacks cannot assign a winner. Persist message IDs, outcomes, retry bounds and freshness; verify callbacks before accepting state and reconcile from backend. Number ownership alone cannot link accounts. Stop business-initiated notifications after opt-out, without erasing bookings. A vendor outage must show pending/unavailable communication and alternate authorized channels, not false delivery.

P01-DOD-008 cannot PASS until official effective access/pricing/technical conditions are verified. Owner-approved provider contact/account inspection is required; no spending or new registration inferred. Single coordinated release remains unchanged.
