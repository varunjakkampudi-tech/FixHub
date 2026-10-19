# FixHub — Provider & External Integration Permission Matrix

**Project:** Fix Hub (Viswatra)  
**Spec Reference:** `FixHub-Product-Spec-v1.3.md` (Section 14 & 18.4)  
**Standard:** `Viswatra-Global-Engineering-Quality-Standard-v1.1.md` (Category 12, 13, 22)  
**Audit Commit:** `554fde9`  

---

## 1. Governance Rules for External Providers

In accordance with FixHub Product Specification v1.3 and Autonomous Goal Section 14:
1. **Mock-First Boundary:** All third-party providers operate behind tested adapter interfaces. Local development and automated test suites MUST run without requiring live external credentials.
2. **Truthful Evidence Levels:** Mocks and synthetic stubs count strictly as `TESTED_UNIT` or `TESTED_BROWSER`. They NEVER qualify as `VERIFIED_PROVIDER`.
3. **Owner-Only Gate:** Connecting live accounts, paying subscription fees, accepting terms of service, and transmitting live messages or payments requires explicit human owner authorization (`READY_FOR_OWNER`).
4. **Secret Protection:** Provider API keys, client secrets, and authentication tokens MUST NOT be stored in repository files. Only variable names are recorded.

---

## 2. Integration Provider Inventory

| Provider | Purpose / Scope | Permission State | Adapter Interface | Test Suite | Live Env Variables Needed |
|---|---|---|---|---|---|
| **Twilio (WhatsApp)** | Transactional WhatsApp messaging fallback | **MOCK_ACTIVE** (Awaiting D05) | `api/twilio.ts` | `api/test/twilio.test.ts` (10 tests) | `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_WHATSAPP_FROM` |
| **Meta WhatsApp Cloud API** | Direct WhatsApp Business Platform messaging | **MOCK_ACTIVE** (Awaiting D05) | `api/whatsapp-contact.ts` | `api/test/whatsapp-contact.test.ts` (9 tests) | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` |
| **Resend** | Transactional operator & administrative email | **ADAPTER_READY** | `api/email.ts` | `api/test/email.test.ts` (4 tests) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **TRAI SMS DLT** | Telecom transactional SMS in India (+91) | **BLOCKED** (Awaiting D04) | `api/services/auth-service.ts` | `api/test/security-quarantine-fr1.test.ts` | `DLT_PE_ID`, `DLT_SENDER_ID`, `DLT_OTP_TEMPLATE_ID` |
| **OpenStreetMap / Haversine** | Tanuku locality geocoding & spatial distance | **LOCAL_ACTIVE** (PostGIS) | `api/db/repository.ts` | `src/test/fixhub-location.test.ts` (11 tests) | None (Local calculation & PostGIS) |
| **Payment Gateway** | Escrow & online digital payment collection | **DEFERRED** (D09 Locked to COD) | `api/routes/bookings-router.ts` | `src/test/demo-bill.test.ts` (4 tests) | None (Cash on Completion only in v1.3 launch) |
| **Private Object Storage** | Work evidence photos & inspection documents | **LOCAL_ADAPTER** (Awaiting D26) | `api/routes/bookings-router.ts` | `src/test/e2e-journey-api.test.ts` | `STORAGE_BUCKET_NAME`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` |

---

## 3. Data Protection & Encryption Invariants

- **WhatsApp Contact Protection:** `WHATSAPP_CONTACT_HMAC_SECRET` (minimum 32-byte secret) and `WHATSAPP_CONTACT_ENCRYPTION_KEY` (AES-256 base64) protect customer phone numbers from plaintext log leakage.
- **Webhook Signature Verification:** Meta webhook challenges enforce HMAC SHA-256 payload verification before dispatching in-app notification events.
- **Transactional Outbox Resilience:** Outbox records in PostgreSQL guarantee at-least-once delivery with exponential backoff retry and dead-letter quarantine (`api/test/notification-outbox.test.ts`).
