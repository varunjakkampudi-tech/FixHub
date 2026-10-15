# Official WhatsApp feasibility

Status: CONDITIONAL, mandatory dependency unresolved; no account, phone, message or purchase configured. Owner: product/integration lead; human owns accounts/billing. Sources SRC-009–012 and SRC-040–042 in [register](../evidence/source-register.md); dated follow-up 2026-10-16.

## Effective pricing versus explanatory copy

Meta's official public pricing selector was read on 2026-10-16 with market India and currency INR: marketing ₹0.8631, utility ₹0.1150, authentication ₹0.1150, service ₹0.1150, and authentication-international ₹2.4971 per delivered message. These are displayed list rates, not an account-specific quote or paid invoice. The page's explanatory text still calls service and responsive utility free, while Meta's FAQ says service messages became chargeable after the first 1,000 per business phone number each month effective 2026-10-01. Preserve the conflict; do not assume the free allowance, utility response treatment, or category classification applies to a particular Fix Hub message without current official terms/account evidence. Taxes, rounding, free entry windows, BSP markup, subscriptions and billing require a dated quote and invoice basis.

The official rate selector is dynamic and its numeric values were visible in the page after selecting India/INR/category (SRC-042); its values can change, so retain the retrieval date and recheck before commitment. The official [Postman overview](https://www.postman.com/meta/whatsapp-business-platform/overview) confirms Cloud API collections and deprecated on-premises access (SRC-041); detailed callback specifications still unavailable.

[Offline model](../finance/unit-economics.md) assumes4 utility+1 authentication+6 service messages/request, Meta at displayed ₹0.1150 per assumed message, and a Twilio public USD0.005/message fee converted at assumed ₹85/USD (SRC-043). Modelled combined WhatsApp variable cost is ₹2,376/₹7,128/₹17,820 across LOW/BASE/HIGH; an assumed ₹1,500 BSP fixed cost remains separate. The old ₹0.145 provider proxy is superseded as the Meta model input but retained in SRC-011 as historical provider evidence. These are not account-specific payable amounts: message volumes, recipient fan-out, FX, taxes, provider/account eligibility and current terms remain unresolved. Meta category-specific billing and allowance conflict is preserved, not resolved.

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
| Country/category rate and tax | Public India/INR list values retrieved 2026-10-16; payable account rate/tax NOT ASSESSED | Confirm applicability, effective terms, tax and itemized direct/BSP billing |
| Customer and merchant notifications | Plausible, not tested | Distinct consent/tenant authorization, redacted payloads, delivery failure behavior |

No unofficial WhatsApp automation. Direct API removes a BSP dependency but adds token lifecycle, reliability, policy/support and operational work; BSP adds costs, subprocessor/privacy and portability questions. Neither is selected.

## Failure and continuity

Backend commit remains authoritative; delayed/duplicate/out-of-order callbacks cannot assign a winner. Persist message IDs, outcomes, retry bounds and freshness; verify callbacks before accepting state and reconcile from backend. Number ownership alone cannot link accounts. Stop business-initiated notifications after opt-out, without erasing bookings. A vendor outage must show pending/unavailable communication and alternate authorized channels, not false delivery.

P01-DOD-008 cannot PASS until official effective access/pricing/technical conditions are verified. Owner-approved provider contact/account inspection is required; no spending or new registration inferred. Single coordinated release remains unchanged.

## Follow-up under Phase 01–05 work authority — 2026-10-15

The official developer pricing endpoint was retried and again returned HTTP 429. The official FAQ remains readable and confirms the October service-message charging/allowance rule; it does not supply the effective numeric India category rate card. No new account-specific eligibility, billing, callback or volume-limit evidence was obtained. P01-DOD-008 remains CONDITIONAL; the offline model is unchanged. Smallest owner action: supply a dated effective official India rate card and authorized account/technical evidence, without publishing credentials or private account identifiers. This is a failed-access record, not a request to create an account or spend money.

## Dated pricing follow-up — 2026-10-16

Read the official [Meta/WhatsApp Business Platform pricing page](https://whatsappbusiness.com/products/platform-pricing/) in its public interactive selector; India and INR were selected, and each value was read from the rendered selector. Displayed per-delivered-message values: marketing ₹0.8631; utility ₹0.1150; authentication ₹0.1150; service ₹0.1150; authentication-international ₹2.4971. Utility/authentication volume tiers are also published, but thresholds start at 750,000 monthly messages and are not used in this small-scale model. These are dated public list values, not proof of effective account-level rate, availability, category eligibility, taxes or BSP charges. Meta's same page says service is not charged, conflicting with its FAQ's effective 2026-10-01 service-charge/1,000 monthly allowance statement. Preserve this source conflict pending authoritative account/billing interpretation. The model now uses ₹0.1150 for utility/authentication/service and applies no free allowance (conservative on service volume; still excludes taxes/markup). P01-DOD-008 remains CONDITIONAL because account eligibility, technical callbacks, classifications and billable terms are unresolved.
