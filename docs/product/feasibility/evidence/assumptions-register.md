# Model and research assumptions

Status: explicit class5 assumptions, not approved product requirements or measured market data. Owner: delegated research/finance/operations lead. Date2026-10-15. Every numeric finance input is in [editable model](../finance/model-assumptions.json); [formulas](../finance/unit-economics.md) describe purpose/limitations.

| ID | Claim/input | Basis / counterevidence | Impact / evidence needed |
|---|---|---|---|
| P01-A01 |400/1,200/3,000 monthly requests | Scenario probes only; no customer interviews | Demand evidence and category/zone mix |
| P01-A02 | Acceptance40/65/80%; completion70/85/90% of accepted | No observed assignments; merchant no-show risk | Primary recent behavior; later real operational validation |
| P01-A03 | Job value₹800/1,200/1,500; collectible fee₹60/120/150 | No local quotes or fee agreement | Neutral willingness, CA/counsel and collection leakage |
| P01-A04 | CAC, new shares, merchant/verification rates in JSON | No campaign/onboarding purchase | Quotes, lawful acquisition, retention/payback |
| P01-A05 | Support case share/minutes₹180/h; fixed ops/maintenance | No staffed roster; serious incidents excluded from simple case mean | Time study and funded coverage |
| P01-A06 |4 utility+1 auth+6 service/request, Meta ₹0.1150 and if using Twilio USD0.005 per message | Message volumes and recipient counts remain assumptions; Meta selector and Twilio list fee retrieved2026-10-16 (SRC-009/SRC-042/SRC-043); editable FX ₹85/USD; model applies no Meta service allowance. FAQ charging/allowance conflicts with Meta page copy (SRC-040). | Account eligibility, actual billable message/recipient counts, service/utility terms, FX, taxes, number and BSP charges |
| P01-A07 | SMS0.5/request₹0.25; BSP₹1,500 fixed | No approved quote or provider | Owner-approved vendor terms |
| P01-A08 | Hosting/storage/monitoring tier allowances | DBUSD25 benchmark not all-in total | Itemized region/billing/egress/restore quote |
| P01-A09 | Dispute reserve₹25/15/10 completion | Not refund guarantee; unobserved exposure | Actual disputes, legal remedies and scope |
| P01-A10 | Operating cash₹300,000; FX₹85/USD | Neither verified funds nor spot rate | Owner funding and dated conversion at purchase |
| P01-A11 | Build10/18/30 person-month and rates/contingency | Internal bottom-up assumption, no quotes | Scope, skill/team assessment and supplier bids |
| P01-A12 | Supply24 h/week,70%availability,60%utilization,2.5 h/job | No merchant evidence | Consented workload/travel/skill validation |
| P01-A13 | Founder2 h/day26 days70%utilization | Not staffing agreement | Named roster, incident backup and actual capacity |
| P01-A14 | Category trust/seasonality/channel benefits | Hypotheses not Tanuku field findings | Customer/merchant cases and negative evidence |
| P01-A15 | Research thresholds/90 day note retention | Precommitted research screens; no law approval | Consent/language/storage counsel review before outreach |

Do not silently promote these to LOCKED decisions. Replace with dated evidence, retaining prior values/provenance and explaining changed recommendation. Public geography/technology/legal facts are recorded separately in [sources](source-register.md); use no arbitrary viability or security score.
