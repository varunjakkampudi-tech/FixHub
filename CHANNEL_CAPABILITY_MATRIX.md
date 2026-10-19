# FixHub — Channel Capability Matrix (CH-01 to CH-08)

**Project:** Fix Hub (Viswatra)  
**Spec Reference:** `FixHub-Product-Spec-v1.3.md` (Section 7, 18.2)  
**Audit Commit:** `554fde9`  

---

## 1. Distribution Channels Inventory

| Channel ID | Channel Description | Target Roles | Protocol / Technology | Current Status | Evidence Level | Provider Binding |
|---|---|---|---|---|---|---|
| CH-01 | WhatsApp Business Platform | Customer & Merchant | Meta Cloud API / Twilio REST | **MOCK_ACTIVE** | TESTED_UNIT | Meta Business (D05) |
| CH-02 | Responsive Web Application & PWA | Customer, Merchant, Admin | React 19 + TanStack Router PWA | **ACTIVE** | TESTED_BROWSER | Static / Node Host |
| CH-03 | Android Mobile Application | Customer & Merchant | React Native / Capacitor PWA shell | **SPECIFIED / DEFERRED** | TESTED_BROWSER (Web) | Google Play (D06) |
| CH-04 | iOS Mobile Application | Customer & Merchant | Capacitor iOS wrapper | **SPECIFIED / DEFERRED** | TESTED_BROWSER (Web) | Apple App Store (D06) |
| CH-05 | Transactional SMS Alerts | Customer (OTP & Critical Alerts) | TRAI DLT GSM Gateway / Twilio | **BLOCKED** | TESTED_UNIT (Mock) | Indian DLT (D04) |
| CH-06 | In-App Real-Time Notification Center | Customer, Merchant, Admin | REST Polling / Server-Sent Events | **ACTIVE** | TESTED_UNIT | Internal Outbox API |
| CH-07 | Offline State & Reconnection Sync | Mobile PWA | Service Worker Cache + Queue | **ACTIVE** | TESTED_UNIT | Browser Storage |
| CH-08 | Email Alerts (Staff & Administrative) | Super Admin / Operations | Resend API / SMTP Gateway | **ADAPTER_READY** | TESTED_UNIT | Resend |

---

## 2. In-App Notification Event Taxonomy

| Event Name | Recipient | Trigger Condition | Template Invariant |
|---|---|---|---|
| `BOOKING_CREATED` | Customer | Booking submitted by customer | "Your FixHub booking #{{id}} in Tanuku has been received." |
| `LEAD_BROADCAST` | Eligible Merchants | Matching booking posted within radius | "New {{category}} job request in {{zone}}. Tap to accept." |
| `LEAD_ACCEPTED` | Customer & Merchant | Atomic Redlock won by first merchant | "Merchant {{businessName}} has accepted your booking." |
| `TECHNICIAN_DISPATCHED` | Customer | Merchant assigns technician | "Technician {{name}} is en route to your location." |
| `TECHNICIAN_ARRIVED` | Customer | Technician marks arrived on site | "Technician has arrived at your address." |
| `QUOTE_SUBMITTED` | Customer | Technician submits digital quote | "Formal inspection quote ready for your review: ₹{{total}}." |
| `QUOTE_ACCEPTED` | Merchant & Technician | Customer approves quote in-app | "Customer has approved the quote. You may begin repair." |
| `JOB_COMPLETED` | Customer | Technician finishes repair | "Service completed. Please collect invoice and pay cash: ₹{{total}}." |
| `DISPUTE_RAISED` | Admin & Merchant | Customer files ticket | "Dispute opened for booking #{{id}}. Support reference: {{ref}}." |
