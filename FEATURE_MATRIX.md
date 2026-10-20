# FixHub24 — Feature Matrix & Traceability Register

**Project:** FixHub24 (Viswatra)  
**Spec Reference:** `FixHub-Product-Spec-v1.3.md` (Scope Frozen)  
**Status Reference:** Spec Section 18.4 & Autonomous Goal Section 5  
**Current Audit Commit:** `1ded0fbe89c6a43fb03c6d61371a6570b38d62b1`  

---

## 1. Feature Taxonomy & Identifiers

This matrix inventories every feature requirement under FixHub24 v1.3 across all operational domains:
- **CX:** Customer Experience (CX-01 to CX-14)
- **MX:** Merchant Experience (MX-01 to MX-11)
- **TX:** Technician Workflows (TX-01 to TX-09)
- **AX:** Operations & Super Admin (AX-01 to AX-15)
- **CH:** Channels & Communications (CH-01 to CH-08)
- **DS:** Design System & Responsive Layout (DS-01 to DS-08)
- **L10N:** Localization & Bilingual Support (L10N-01 to L10N-14)
- **TR:** Trust, Transparency & Safety (TR-01 to TR-08)
- **SR:** Security, Privacy & Compliance (SR-01 to SR-14)
- **AN:** Analytics, Metrics & Telemetry (AN-01 to AN-06)
- **EH:** Proposed Enhancements & Classifications (EH-01 to EH-25)

---

## 2. Customer Experience (CX)

| ID | Feature Name | Description | Spec Section | Implementation State | Evidence Level |
|---|---|---|---|---|---|
| CX-01 | Streamlined 3-Role Authentication | Customer sign-in via phone OTP; no persona clutter | Spec 3.1 | IMPLEMENTED | TESTED_API_CONTRACT |
| CX-02 | Tanuku Local Service Catalog | Browse electrician, plumbing, AC, appliance repairs | Spec 3.2 | IMPLEMENTED | TESTED_BROWSER |
| CX-03 | Intuitive Booking Creation | Address selection, issue description, slot timing | Spec 3.3 | IMPLEMENTED | TESTED_COMPONENT |
| CX-04 | Price Clarity Card | Breakdown of inspection fee, labor, estimated parts | Spec 3.4 | IMPLEMENTED | TESTED_UNIT |
| CX-05 | Service Evidence Timeline | Real-time tracking from matching to completion | Spec 3.5 | IMPLEMENTED | TESTED_COMPONENT |
| CX-06 | Inspection Quote Decisioning | Accept/reject adjusted quote before repair begins | Spec 3.6 | IMPLEMENTED | TESTED_COMPONENT |
| CX-07 | Cash on Completion (COD) | Safe offline cash settlement with clear disclosures | Spec 3.7 | IMPLEMENTED | TESTED_UNIT |
| CX-08 | Service Record Download | Itemized proof of service without sensitive PII | Spec 3.8 | IMPLEMENTED | TESTED_COMPONENT |
| CX-09 | 5-Star Ratings & Feedback | Honest review submission updating merchant score | Spec 3.9 | IMPLEMENTED | TESTED_UNIT |
| CX-10 | Support Ticket Creation | In-app dispute raising with unique reference ID | Spec 3.10 | IMPLEMENTED | TESTED_UNIT |
| CX-11 | Bilingual English/Telugu Toggle | 1-click persistent switch in header and navigation | Spec 3.11 | IMPLEMENTED | TESTED_UNIT |
| CX-12 | Senior-Friendly Accessibility | High contrast, large text, clear affordances | Spec 3.12 | IMPLEMENTED | TESTED_UNIT |
| CX-13 | Merchant Trust Passport | Verified KYC badge, job count, authentic reviews | Spec 3.13 | IMPLEMENTED | TESTED_UNIT |
| CX-14 | No-Provider Rescue Flow | Graceful timeout handling when no provider is near | Spec 3.14 | PLANNED (EH-19) | SPECIFIED |

---

## 3. Merchant Experience (MX)

| ID | Feature Name | Description | Spec Section | Implementation State | Evidence Level |
|---|---|---|---|---|---|
| MX-01 | Merchant Onboarding & Profile | Business name, Tanuku address, KYC status | Spec 4.1 | IMPLEMENTED | TESTED_UNIT |
| MX-02 | Service Categories & Coverage | Select categories and active Tanuku coverage zones | Spec 4.2 | IMPLEMENTED | TESTED_UNIT |
| MX-03 | Atomic Broadcast Acceptance | Single-winner lead acceptance via Redlock engine | Spec 4.3 | IMPLEMENTED | TESTED_UNIT |
| MX-04 | Technician Roster Management | Add, edit, and assign technicians to jobs | Spec 4.4 | IMPLEMENTED | TESTED_UNIT |
| MX-05 | Dispatch Job Assignment | Assign on-duty technician to accepted booking | Spec 4.5 | IMPLEMENTED | TESTED_API_CONTRACT |
| MX-06 | Real-Time Status Updates | Dispatch updates (On the way, Arrived at site) | Spec 4.6 | IMPLEMENTED | TESTED_COMPONENT |
| MX-07 | Formal Inspection Quote | Itemized parts and labor submission | Spec 4.7 | IMPLEMENTED | TESTED_COMPONENT |
| MX-08 | Job Completion & Bill Receipt | Mark job done, record COD collection | Spec 4.8 | IMPLEMENTED | TESTED_COMPONENT |
| MX-09 | Availability Toggle | Switch merchant online/offline availability | Spec 4.9 | IMPLEMENTED | TESTED_UNIT |
| MX-10 | Performance & Score Dashboard | View rating, completed jobs, and dispute history | Spec 4.10 | IMPLEMENTED | TESTED_UNIT |
| MX-11 | Dispute & Renegotiation Packet | Submit counter-evidence for disputed bookings | Spec 4.11 | IMPLEMENTED | TESTED_UNIT |

---

## 4. Technician Workflows (TX)

| ID | Feature Name | Description | Spec Section | Implementation State | Evidence Level |
|---|---|---|---|---|---|
| TX-01 | Technician Mobile Assignment View | Assigned job card with customer address in Tanuku | Spec 5.1 | IMPLEMENTED | TESTED_COMPONENT |
| TX-02 | One-Tap Navigation & Call | Reach customer locality without PII exposure | Spec 5.2 | IMPLEMENTED | OBSERVED_CODE |
| TX-03 | Status Progression Buttons | Transit, arrived, diagnosing, work in progress | Spec 5.3 | IMPLEMENTED | TESTED_COMPONENT |
| TX-04 | Digital Quote Generation | On-site parts and labor estimate builder | Spec 5.4 | IMPLEMENTED | TESTED_COMPONENT |
| TX-05 | Customer Approval Capture | In-person digital acceptance acknowledgment | Spec 5.5 | IMPLEMENTED | TESTED_COMPONENT |
| TX-06 | Work Evidence Photo Upload | Before and after repair photo submission | Spec 5.6 | IMPLEMENTED | OBSERVED_CODE |
| TX-07 | Cash Collection Confirmation | Record cash collected on completion | Spec 5.7 | IMPLEMENTED | TESTED_COMPONENT |
| TX-08 | Technician Availability Status | Toggle active duty status | Spec 5.8 | IMPLEMENTED | TESTED_UNIT |
| TX-09 | Incident / Safety Escalation | Report hazard or customer dispute on site | Spec 5.9 | PLANNED (EH-21) | SPECIFIED |

---

## 5. Operations & Super Admin (AX)

| ID | Feature Name | Description | Spec Section | Implementation State | Evidence Level |
|---|---|---|---|---|---|
| AX-01 | Super Admin Protected Workspace | RBAC role check; administrative dashboard | Spec 6.1 | IMPLEMENTED | TESTED_UNIT |
| AX-02 | Real-Time Structured Log Viewer | Search, level filtering (INFO, WARN, ERROR), metadata | Spec 6.2 | IMPLEMENTED | TESTED_UNIT |
| AX-03 | Microservice Health & Latency | Liveness/readiness probes, DB, Redis, latency | Spec 6.3 | IMPLEMENTED | TESTED_UNIT |
| AX-04 | Live Job Tracking Kanban Board | Status columns: Matching, Accepted, Travel, Done | Spec 6.4 | IMPLEMENTED | TESTED_UNIT |
| AX-05 | Platform Financial Telemetry | GMV calculation, commission rates, job totals | Spec 6.5 | IMPLEMENTED | TESTED_UNIT |
| AX-06 | Merchant KYC Verification Desk | Approve, reject, or suspend merchant listings | Spec 6.6 | IMPLEMENTED | TESTED_UNIT |
| AX-07 | Dispute Arbitration & Resolution | Review support tickets and resolve conflicts | Spec 6.7 | IMPLEMENTED | TESTED_UNIT |
| AX-08 | Outbox Queue & Retry Monitor | View unsent notifications, dead-letter retries | Spec 6.8 | IMPLEMENTED | TESTED_UNIT |
| AX-09 | Data Privacy & Right to Erasure | Execute customer data export and anonymization | Spec 6.9 | IMPLEMENTED | TESTED_UNIT |
| AX-10 | Rate Limiting & Threat Monitor | Track anomalous IP traffic and failed auth attempts | Spec 6.10 | IMPLEMENTED | TESTED_UNIT |
| AX-11 | Geographic Coverage Config | Manage Tanuku municipal boundary zones | Spec 6.11 | IMPLEMENTED | OBSERVED_CODE |
| AX-12 | Category Activation Gates | Enable/disable service categories (EH-23) | Spec 6.12 | PLANNED | SPECIFIED |
| AX-13 | Emergency Kill-Switch | Maintenance mode toggle for platform safety | Spec 6.13 | IMPLEMENTED | OBSERVED_CODE |
| AX-14 | Manual Audit Log History | Tamper-evident record of administrative operations | Spec 6.14 | IMPLEMENTED | TESTED_UNIT |
| AX-15 | Invoice Audit & Breakdown Check | Inspect itemized bills and settlement receipts | Spec 6.15 | IMPLEMENTED | TESTED_COMPONENT |

---

## 6. Proposed Enhancements (EH-01 to EH-25) & D19 Classification

| ID | Enhancement Title | Proposed Classification | D19 Status | Dependencies | Implementation Status |
|---|---|---|---|---|---|
| EH-01 | Price Clarity Card | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED (CX-04) |
| EH-02 | Service Evidence Timeline | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED (CX-05) |
| EH-03 | Trust Passport Verification | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED (CX-13) |
| EH-04 | Quote Revision & Dispute Packet | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED (MX-11) |
| EH-05 | Senior Mode & Contrast Controls | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED (CX-12) |
| EH-06 | Assisted Operator Booking | POST_LAUNCH_CANDIDATE | OPEN (D20) | D20 (Call center ops) | PLANNED |
| EH-07 | Merchant Capacity Calendar | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED |
| EH-08 | Multi-Worker Concurrency Proof | LAUNCH_REQUIRED | OPEN (D19) | Redis Lock | IMPLEMENTED (QA-04) |
| EH-09 | Dispatch Rejection Reason Codes | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED |
| EH-10 | Automatic Dynamic Surge Pricing | POST_LAUNCH_CANDIDATE | OPEN (D19) | D15 | OUT_OF_SCOPE |
| EH-11 | Predictive Maintenance Alerts | POST_LAUNCH_CANDIDATE | OPEN (D21) | D21 | PLANNED |
| EH-12 | Voice Booking & Audio Notes | POST_LAUNCH_CANDIDATE | OPEN (D19) | Audio ML | OUT_OF_SCOPE |
| EH-13 | WhatsApp Adapter Architecture | LAUNCH_REQUIRED | OPEN (D05) | Twilio/Meta | IMPLEMENTED (Adapter/Mock) |
| EH-14 | Exact Coordinate Normalization | LAUNCH_REQUIRED | OPEN (D19) | PostGIS | IMPLEMENTED (QA-18) |
| EH-15 | Offline Client PWA Sync | LAUNCH_REQUIRED | OPEN (D19) | Service Worker | IMPLEMENTED |
| EH-16 | Safe Location Permission Handlers | LAUNCH_REQUIRED | OPEN (D19) | None | IMPLEMENTED |
| EH-17 | Customer Anonymized Proxies | POST_LAUNCH_CANDIDATE | OPEN (D19) | Twilio Proxy | PLANNED |
| EH-18 | Merchant In-App Chat | POST_LAUNCH_CANDIDATE | OPEN (D19) | WebSocket | PLANNED |
| EH-19 | No-Provider Rescue Workflow | LAUNCH_REQUIRED | OPEN (D19) | None | PLANNED |
| EH-20 | Merchant Reliability Scores | LAUNCH_REQUIRED | OPEN (D24) | D24 | IMPLEMENTED (Staff View) |
| EH-21 | On-Site Safety Incident Reports | LAUNCH_REQUIRED | OPEN (D19) | None | PLANNED |
| EH-22 | Multi-City Geographic Expansion | POST_LAUNCH_CANDIDATE | OPEN (D23) | D07, D23 | OUT_OF_SCOPE (Tanuku Only) |
| EH-23 | Category Readiness Checklists | LAUNCH_REQUIRED | OPEN (D19) | None | PLANNED |
| EH-24 | Hot-Reloadable Config Publishing | LAUNCH_REQUIRED | OPEN (D25) | D25 | IMPLEMENTED |
| EH-25 | Advanced Merchant Analytics | POST_LAUNCH_CANDIDATE | OPEN (D23) | D23 | PLANNED |
