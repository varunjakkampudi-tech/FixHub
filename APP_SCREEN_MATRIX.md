# FixHub24 — Application Screen & Responsive UI Matrix

**Project:** FixHub24 (Viswatra)  
**Spec Reference:** `FixHub24-Product-Spec-v1.3.md` (Section 3–6, 16A.2)  
**Engineering Standards:** `FixHub24-Engineering-Standards.md` (Breakpoints: Mobile <= 767px, Tablet 768px-1023px, Desktop >= 1024px)  
**Audit Commit:** `554fde9`  

---

## 1. Screen Inventory & Role Mapping

FixHub24 enforces strict role consolidation into 3 clean, unambiguous user workspaces:
1. **Customer Workspace**
2. **Merchant & Technician Workspace**
3. **Super Admin Workspace (Platform Operations)**

---

## 2. Screen Specifications

| Screen ID | Target Role | Screen Name | Route Path | Responsive Viewports | WCAG / Senior Mode | Bilingual (EN/TE) | Primary UI Controls & Components |
|---|---|---|---|---|---|---|---|
| SCR-01 | Public / All | Universal Role Sign-In | `/login`, `/auth` | Mobile, Tablet, Desktop | High contrast, auto-focus, large inputs | 100% | Phone number input, 6-digit OTP boxes, role workspace tabs |
| SCR-02 | Customer | Tanuku Marketplace Catalog | `/`, `/customer/services` | Mobile, Tablet, Desktop | Fluid grid, 48px touch targets | 100% | Category cards (Electrician, AC, Plumbing), search filter, location pill |
| SCR-03 | Customer | Service Booking Request | `/customer/book` | Mobile, Tablet, Desktop | Form landmarks, error announcements | 100% | Address picker, slot date/time selector, issue description textarea |
| SCR-04 | Customer | Price Clarity Card | Component overlay | Mobile, Tablet, Desktop | High-contrast fee breakdown | 100% | Flat inspection fee pill, labor scope range, parts disclaimer |
| SCR-05 | Customer | Service Evidence Timeline | `/customer/bookings/:id` | Mobile, Tablet, Desktop | Live region announcements | 100% | Step timeline (Matching, En Route, Arrived, Work, Complete) |
| SCR-06 | Customer | On-Site Inspection Quote Review | Modal dialog | Mobile, Tablet, Desktop | High contrast, action buttons | 100% | Itemized parts/labor list, Accept Quote button, Reject Quote button |
| SCR-07 | Customer | Cash on Completion (COD) Receipt | `/customer/bookings/:id/receipt`| Mobile, Tablet, Desktop | Printable, clean layout | 100% | Total amount, COD badge, Service record download link |
| SCR-08 | Customer | Rating & Review Submission | Modal dialog | Mobile, Tablet, Desktop | Accessible star rating | 100% | 1–5 Star rating buttons, comment textarea, Submit Feedback button |
| SCR-09 | Customer | Support Dispute Ticketing | `/customer/support` | Mobile, Tablet, Desktop | Form landmarks, reference code | 100% | Booking selector, issue category, ticket submission, status tracker |
| SCR-10 | Customer | Profile & Address Management | `/customer/profile` | Mobile, Tablet, Desktop | Keyboard navigable | 100% | Saved Tanuku addresses, default address toggle, language preference |
| SCR-11 | Merchant | Merchant Dashboard Overview | `/merchant` | Mobile, Tablet, Desktop | Stat cards, responsive reflow | 100% | Active jobs counter, rating score card, today's earnings, availability switch |
| SCR-12 | Merchant | Incoming Lead Broadcasts | `/merchant/leads` | Mobile, Tablet, Desktop | Audible alert, single-tap accept | 100% | Lead offer cards, customer locality, service category, Accept button |
| SCR-13 | Merchant | Active Job Dispatch Manager | `/merchant/jobs/:id` | Mobile, Tablet, Desktop | Status flow stepper | 100% | Technician assign dropdown, job notes, status transition buttons |
| SCR-14 | Merchant | Technician Roster Management | `/merchant/technicians` | Mobile, Tablet, Desktop | Table to card responsive reflow | 100% | Add technician modal, active status toggle, skill tags |
| SCR-15 | Merchant | Business Profile & Coverage | `/merchant/settings` | Mobile, Tablet, Desktop | Zone checkboxes | 100% | Tanuku zone checklist, category multiselect, KYC upload status |
| SCR-16 | Technician | Mobile Job Assignment Card | `/technician/job` | Mobile Optimized | Touch-friendly, high contrast | 100% | Customer locality, service summary, Navigate button, Call button |
| SCR-17 | Technician | Job Status Progression Bar | Component | Mobile Optimized | Large 52px action buttons | 100% | On the way button, Arrived at site button, Start Diagnostic button |
| SCR-18 | Technician | On-Site Quote Builder | `/technician/quote` | Mobile Optimized | Number pad inputs | 100% | Add parts item, labor charge input, total preview, Present to Customer |
| SCR-19 | Technician | Completion & Cash Collection | `/technician/complete` | Mobile Optimized | Confirmation check | 100% | Work completed checkbox, Confirm Cash Received button |
| SCR-20 | Super Admin | Platform Operations Command Center | `/admin` | Desktop & Tablet Optimized | Data tables, metrics grid | 100% | Live GMV, completed jobs, active merchants, system alerts |
| SCR-21 | Super Admin | Real-Time Audit Log Viewer | `/admin/logs` | Desktop & Tablet Optimized | Monospace viewer, level filter | 100% | Level filter (INFO, WARN, ERROR), search query, JSON inspector |
| SCR-22 | Super Admin | Microservice Health & Latency Monitor | `/admin/health` | Desktop & Tablet Optimized | Gauge indicators, status badges | 100% | PostgreSQL probe, Redis Redlock probe, API latency graph |
| SCR-23 | Super Admin | Live Tanuku Job Tracking Kanban | `/admin/jobs` | Desktop & Tablet Optimized | Drag-and-drop / filter columns | 100% | Kanban columns: Matching, Accepted, In Progress, Complete, Disputed |
| SCR-24 | Super Admin | Merchant KYC Approval Desk | `/admin/merchants` | Desktop & Tablet Optimized | Document preview drawer | 100% | Business certificate preview, Verify button, Reject button, Suspend button |
| SCR-25 | Super Admin | Support Dispute Arbitration Desk | `/admin/disputes` | Desktop & Tablet Optimized | Case notes, resolution actions | 100% | Customer complaint, merchant statement, Resolve & Close button |
