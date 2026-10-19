# Fix Hub Phase 01 provisional feasibility report

As of 2026-10-16. Status: **IN PROGRESS. Revised scoped assessment: 10/10 = 100.0% of retained scored criteria.** This denominator reflects the owner's dated removal of two items from scoring; it is not a pass on the removed items, a feasibility score, product completion, or phase approval. `P01-DOD-008` remains unresolved and deferred; `P01-DOD-014` remains a separate owner exit gate. No genuine customer demand or verified merchant supply exists. Real-world business/build GO remains **NOT ASSESSED**; Phase 02 remains **NOT AUTHORIZED**. See the [scope amendment](../../reviews/phase-01-scope-amendment-2026-10-16.md) and [work authority](../../governance/product-foundation-work-authority.md).

## Executive conclusion and market

Tanuku remains the research geography. Historical municipal tables supply 2011 household and population figures, but conflicting labels and missing current data prevent a numeric current TAM/SAM/SOM. National connectivity is only a proxy. Public directories show discovery activity, not willing verified supply. Urban Company Tanuku availability and Google profile comparison remain unverified. [Market evidence](market/tanuku-market.md), [competitors](market/competitor-analysis.md).

Real-world validation: 0 customer interviews; 0 merchant interviews; 0 verified willing merchants; 0 registration commitments. The former interview targets are historical research instruments, not active Phase 01 criteria. Electrician/plumber remain desk-research candidates; no category/serviceability promise. Actual supply, safety and customer outcome evidence must be obtained before any public launch, including through the separately gated private pilot.

## Commercial and capital assessment

Free basic listing preserved. Compare completed-job fee, accepted lead, optional tools subscription and customer fee without approval; no paid ranking/ads, payment/refund/guarantee commitment. GTV is not revenue.

| Model monthly INR | LOW | BASE | HIGH |
|---|---:|---:|---:|
| Completed expected jobs |112|663|2,160|
| GTV |89,600|795,600|3,240,000|
| Revenue |6,720|79,560|324,000|
| WhatsApp variable (Meta + assumed Twilio) |2,376|7,128|17,820|
| Contribution/request |−66.52|20.55|75.84|
| Operating result before exclusions |−47,606|3,657|192,005|
| Break-even within unchanged cost tier |None|1,023|469|

These are class 5 assumptions, not forecasts. They include public Meta India/INR list rate ₹0.115/message plus Twilio's published USD0.005/message fee converted at assumed FX ₹85/USD, with zero Meta service allowance. Message counts and recipient fan-out remain unverified assumptions. BASE with 20% lower acceptance yields −₹10,266/month; doubled Meta/Twilio message fees and support unit cost leaves −₹9,951. HIGH requires unproved demand, fees and capacity. LOW modeled ₹300k operating cash gives 6.30 months of runway, excluding build spending. Positive results are not net profit; GST, collection, full personnel and unknown obligations are excluded.

The ₹50k validation reference ceiling is NOT spending permission. Bottom-up one-time build/setup bounds of ₹11.4 lakh/₹25.2 lakh/₹50.4 lakh are estimates, not quotes, for unchanged all-channel scope. Monthly fixed costs are ₹21k/₹21k/₹35.5k, plus variable expenses. Legal, distribution and expansion obligations are separate; no capital adequacy is proved. [Finance detail](finance/scenario-analysis.md), [budget](finance/validation-budget.md).

## Integration, stores and legal

WhatsApp is mandatory, and public Meta India list rates plus Twilio's published per-message fee are now retrieved. Twilio's public signature-validation and outbound status-callback protocol is documented; Meta-maintained materials also describe HTTPS webhook delivery, WABA subscription, event envelope and message-status events. However, Meta's signature/retry contract remains unverified, and no Fix Hub callback endpoint, credentials, account configuration, or live delivery evidence exists. Account eligibility, message classification, recipient-level volume, callback configuration, FX and payable all-in terms are not established. Meta's public page and FAQ conflict on service-message free treatment. Modeled combined WhatsApp variable costs of₹2,376/₹7,128/₹17,820, plus assumed BSP fixed cost, are sensitivities and cannot establish actual billing. Do not treat free replies as fact or use unofficial automation. [Dependency](integrations/whatsapp-feasibility.md).

Meta's public India/INR rate selector has now been read (SRC-009/SRC-042), but this is not proof of account eligibility, account-specific payable rate or billable category. The public pricing page's “free service” description conflicts with the FAQ's 2026-10-01 service-charge/1,000-message monthly allowance rule. Do not use either statement alone to characterize a Fix Hub account bill; the provider gate remains CONDITIONAL.

Official Google/Apple fees, identity/D-U-N-S requirements and conditional personal testing were assessed; no accounts, builds, devices or publication approvals exist. A wrapper versus React Native remains a comparison, not final architecture; PWA cannot silently replace required store apps. [Store matrix](integrations/app-store-readiness.md).

DPDP Act/Rules have immediate, one-year and eighteen-month commencement cohorts; the full framework has not commenced as of this assessment. Consumer rules, resident functionary, CERT-In, GST/ECO, worker classification, municipal/task safety, transfers and ID practices need actual applicability review. The indexed 2026 consumer amendment's operative status is unresolved. No legal clearance, unrestricted Aadhaar collection or binding terms are established. [Register](legal/india-compliance-register.md).

## Technical and operating feasibility

Reuse existing backend-authority/tenant/outbox/state blueprints. Locking/isolation/geography mechanisms are plausible, not executed guarantees. Twelve feasibility questions and six bounded future experiments identify concurrency, scheduled capacity, callbacks, identity, geography, devices and restore risk. Application/security/performance/production evidence **NOT ASSESSED**. [Architecture](technical/architecture-feasibility.md).

Modeled support of 25/36/50 hours monthly excludes many duties; BASE nearly fills illustrative founder productive capacity. Evidence does not show funded coverage, a safety verifier or serious-incident backup. The proposed 09:00–18:00 window is not an approved or delivered service. Do not launch an unstaffed operation. [Staffing](operations/capacity-and-staffing.md).

## Finite evidence and prioritized next actions

[DoD](exit-criteria.md): **10 PASS / 10 retained scored criteria = 100.0% scoped assessment coverage**; two criteria are outside this denominator (one deferred evidence item and one separate governance gate). This is not product completion or feasibility. Original 14-criterion, 12-criterion, and 9/12 snapshots remain historical evidence.

P01-DOD-005 now has a bounded delegated desk recommendation with evidence limitations, safe-scope exclusions, four candidate families and explicit separation from launch approval. Deferred (008) still requires effective Meta/Twilio India pricing, technical/account eligibility and access before provider selection/activation and the Phase 14 integration exit. Separate governance gate (014) requires a truthful owner-reviewed risk and phase-exit decision. Legal/tax applicability and realistic funded operating assumptions remain material residuals. **Future prelaunch gates** retain verified merchant permission/competence/capacity, observed customer demand/service outcomes, safe support and funding. No outreach or purchases are authorized by this change.

Historical interview-screen targets remain only in optional research instruments. No Phase 01 interview requirement remains. Actual market feasibility cannot be marked GO from desk research; any scoped phase-exit acceptance must explicitly carry unresolved proof obligations into the approved future gates without bypassing G0, G4 or G5.

## Governance and closure

Phase 00 remains closed planning (1/20); Phase 01 is not closed or signed off; formal Phase 02 execution is not authorized. The active scored denominator changed under owner direction, without retroactively rewriting prior evidence snapshots. Phase 01 remains open; the score change does not close it.
