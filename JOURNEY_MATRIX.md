# FixHub — End-to-End User Journey Matrix (J01 to J30)

**Project:** Fix Hub (Viswatra)  
**Spec Reference:** `FixHub-Product-Spec-v1.3.md` (Section 10 & 18.2)  
**Audit Commit:** `554fde9`  

---

## 1. User Journey Catalog (J01 to J30)

| Journey ID | Journey Title | Primary Persona | Key Stages & User Steps | Automated Test Suite | Status |
|---|---|---|---|---|---|
| J01 | Customer Sign-In & Onboarding | Customer | Enter phone -> receive OTP -> verify -> land on Tanuku marketplace | `src/test/sanity.test.ts`, `api/test/auth.test.ts` | **PASS** |
| J02 | Instant Service Request | Customer | Select category -> pick Tanuku address -> review Price Clarity Card -> submit | `api/test/booking-lifecycle.test.ts`, `src/test/e2e-journey-api.test.ts` | **PASS** |
| J03 | Scheduled Booking Request | Customer | Select date & time slot -> describe issue -> confirm booking | `src/test/real-booking-price-preview.test.tsx` | **PASS** |
| J04 | Quote Decisioning & Acceptance | Customer | Review technician's itemized parts/labor quote -> accept quote -> work begins | `src/test/e2e-journey-api.test.ts`, `src/test/regression.test.ts` | **PASS** |
| J05 | Merchant Registration | Merchant | Enter business details -> select Tanuku coverage zones -> submit KYC | `api/test/merchants.test.ts` | **PASS** |
| J06 | Atomic Lead Acceptance | Merchant | Receive broadcast offer -> tap Accept -> Redlock acquires atomic single win | `api/test/dispatch-and-race.test.ts`, `src/test/critical.test.ts` | **PASS** |
| J07 | Technician Job Assignment | Merchant | Open accepted booking -> select available technician -> technician alerted | `src/test/e2e-journey-api.test.ts` | **PASS** |
| J08 | On-Site Diagnostic & Quote | Technician | Mark Arrived -> inspect appliance -> build digital quote -> submit to customer | `src/test/e2e-journey-api.test.ts` | **PASS** |
| J09 | Cash on Completion (COD) | Customer | Verify job completed -> pay cash to technician -> receive digital service record | `src/test/demo-bill.test.ts`, `src/test/real-booking-service-record.test.tsx` | **PASS** |
| J10 | Customer Feedback & Review | Customer | Rate 1–5 stars -> write feedback -> merchant rating dynamically updates | `api/test/completion-review.test.ts` | **PASS** |
| J11 | Mobile Touch PWA Interaction | Mobile User | Touch navigation -> responsive layout -> sticky actions | `e2e/browser-validation.spec.ts` | **PASS** |
| J12 | WhatsApp Channel Alert | Customer/Merchant| Outbox records notification -> adapter formats template -> status logged | `api/test/notification-outbox.test.ts`, `api/test/twilio.test.ts` | **PASS** |
| J13 | Super Admin Health Monitoring | Super Admin | View liveness/readiness probes -> inspect DB & Redis latency | `src/test/admin-health.test.tsx` | **PASS** |
| J14 | Merchant Dispute Response | Merchant | Customer raises issue -> merchant submits dispute evidence packet | `src/test/regression.test.ts` | **PASS** |
| J15 | Admin Dispute Arbitration | Super Admin | Review customer claim & merchant counter-evidence -> issue final ruling | `src/test/support.test.tsx` | **PASS** |
| J16 | Telugu-First Navigation | Telugu User | Toggle Telugu -> all screens, buttons, categories, and bills localize to Telugu | `src/test/fixhub-communications.test.ts` | **PASS** |
| J17 | Network Offline & Reconnection | Mobile User | Client loses connectivity -> reconnection restores current step state | `src/test/fixhub-hardening.test.ts` | **PASS** |
| J18 | Admin Merchant KYC Approval | Super Admin | Inspect business registration -> verify merchant -> merchant enters active pool | `api/test/merchants.test.ts` | **PASS** |
| J19 | Outbox Delivery Retry Recovery | System SRE | Temporary webhook failure -> exponential retry backoff -> delivery confirmed | `api/test/notification-outbox.test.ts` | **PASS** |
| J20 | Customer Privacy Data Erasure | Customer/Admin | Request data export -> admin triggers erasure -> identity records anonymized | `api/test/auth.test.ts` | **PASS** |
| J21 | Senior Mode Accessibility | Senior Citizen | Toggle high contrast & large text -> enlarged touch targets activate | `src/test/fixhub-hardening.test.ts` | **PASS** |
| J22 | Multi-Worker Concurrency Race | System Engine | 3 merchants accept simultaneous lead -> exactly 1 succeeds, 2 get rejected | `src/test/critical.test.ts`, `api/test/dispatch-and-race.test.ts` | **PASS** |
| J23 | Merchant Capacity Exhaustion | Merchant | Merchant completes quota -> status toggles to Busy -> excluded from leads | `api/test/merchants.test.ts` | **PASS** |
| J24 | Lead Broadcast Timeout | Customer/System| No merchant accepts within 15 min -> status updates to searching / rescue | `api/test/dispatch-and-race.test.ts` | **PASS** |
| J25 | Pre-Dispatch Cancellation | Customer | Customer cancels before merchant accepts -> fee waived -> status cancelled | `api/test/booking-lifecycle.test.ts` | **PASS** |
| J26 | En Route Cancellation | Customer | Customer cancels after technician dispatched -> inspection fee policy applied | `src/test/regression.test.ts` | **PASS** |
| J27 | Emergency Platform Kill-Switch| Super Admin | Admin enables maintenance mode -> new bookings paused -> active jobs finish | `src/test/admin-health.test.tsx` | **PASS** |
| J28 | Config Hot-Reload Publishing | Super Admin | Admin updates service fee or zone -> client fetches new config without reboot | `api/test/app.test.ts` | **PASS** |
| J29 | Rate Limiting IP Throttling | Security Engine | Bot sends > 120 requests/minute -> 429 Too Many Requests enforced | `api/test/app.test.ts` | **PASS** |
| J30 | Launch-Blocking Gate Audit | Quality Lead | Run test:all pipeline -> verify 100% pass -> compile G01–G25 launch gates | Full test pipeline (`npm run test:all`) | **PASS** |
