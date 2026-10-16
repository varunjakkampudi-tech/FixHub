# Local API foundation

**Status: LOCAL DEMONSTRATION ONLY — NOT A PRODUCTION API.** The service is a first implementation increment, not an approved Phase 03 exit, production deployment, security certification, or live marketplace backend.

## Run and inspect

From the repository root, copy `.env.example` to an ignored local `.env` if configuration changes are needed, then run `npm run dev`. Vite serves the UI at `http://localhost:5173`; a separate Express API listens on `127.0.0.1:4000`. Vite proxies `/api`, `/health`, and `/docs` only in development. Swagger UI is at `/docs/`; the OpenAPI document is at `/openapi.json`.

Current routes include process liveness/readiness, a read-only fictional baseline price example, optional PostgreSQL-backed email-code customer sign-in, customer-owned addresses and COD booking requests, and merchant offer responses for pre-provisioned verified merchant identities. `GET /api/v1/demo/prices/{category}` uses illustrative rates, labels the response `demoOnly`, and does not create a quote, order, or payment instruction. Persisted bookings use configured verified-merchant pricing; they do not collect online payment. Unknown categories and malformed/oversized JSON receive bounded error envelopes. Merchant offer records are not the same as delivered notifications: no WhatsApp outbox worker, customer/merchant consent flow, merchant self-onboarding, or customer-confirmed job completion is implemented. No photo upload endpoint exists.

Production readiness intentionally returns `503` until an explicit production-readiness approval is recorded; configured infrastructure alone does not clear security, privacy, legal, operational or release gates. Browser-local demo personas are not authentication and must never authorize server operations.

## Controls in this increment

- Helmet applies secure HTTP response headers; Express' `X-Powered-By` banner is disabled.
- CORS allows only exact configured web origins and allows credentials only to those origins for cookie-based auth. CORS is a browser policy, not authentication or authorization.
- `express-rate-limit` limits API requests with standard headers and no legacy headers. Its default in-memory store is per-process and is **not** a multi-instance or distributed abuse-control solution. The server does not trust forwarded IP headers; a future reverse proxy requires a narrowly configured trusted-proxy boundary before IP-based limits can be relied on.
- Pino HTTP logging records a generated request ID, method, route template and response status. The API returns that ID as `x-request-id` and exposes the header to exact allowed browser origins so a client can include it in a support report. Query strings, request bodies, headers, contact fields and exception messages are not logged by these serializers. Logs remain local stdout; there is no retention, alerting, or admin log viewer.
- Zod validates route parameters and environment origins. JSON bodies are capped at 32 KiB and malformed/oversized bodies have generic error responses.
- OpenAPI 3.1 and Swagger UI document only the routes that exist today.

These controls have focused local tests; they are not a completed threat assessment and do not prove application security.

## Bounded local runtime verification — 2026-10-16

The local API was started on loopback (`127.0.0.1:4400`) from checkout `b78b5f82a8f837d3dc28091d32172e96f1a86308`; the API implementation is unchanged from its parent/current `main` baseline. This was an offline demo check, not a deployment or security certification.

Observed in the running process:

- `/health/live` returned 200 with Helmet headers, no `X-Powered-By`, and a UUID `x-request-id`.
- Exact configured web origin received CORS access and exposed `x-request-id`; an unrelated origin received no CORS grant.
- The read-only plumbing price endpoint returned the fictional ₹649 estimate, explicitly marked demo-only and COD-only for the demo; it created no booking or payment.
- An unknown category returned a bounded 400 `INVALID_INPUT` response with a request ID matching the response header; malformed and oversized JSON returned bounded 400/413 envelopes.
- `/openapi.json` returned OpenAPI 3.1.0 and `/docs/` served Swagger UI.
- A 121-request loop against the default in-memory limiter returned 200 for requests 1–120 and 429 for request 121, with the draft-8 `RateLimit` header and no legacy `X-RateLimit-*` header.
- A local logging probe confirmed Pino output included request ID, method, route template, status and response time without query values, authorization, cookie or contact data.

Limits: one local Node process and loopback client only; no distributed/multi-instance limit, trusted-proxy boundary, authentication, persistent storage, live provider, production logging/retention, admin log viewer, performance target, or formal threat/security review was tested. These observations do not change the demo-only readiness status above.

## Location and directions boundary

The customer address editor requests browser geolocation only after the user selects its location button; the browser permission prompt remains user-controlled. For a persisted job assigned to the signed-in verified merchant, the jobs page offers an explicit Google Maps directions link to the saved job coordinates. Opening that link sends the destination to Google Maps. It uses Google's keyless Maps URL handoff, not the paid Maps Platform API; it does not geocode addresses, search places, share location in the background, or provide FixHub-side live tracking. The demo screen's SAMPLE data must not be used as a real dispatch destination.

## First persisted identity increment — 2026-10-16

The current feature branch adds PostgreSQL pool configuration with bounded connection/query timeouts and production TLS certificate verification, checksum-verified ordered SQL migrations, email-code authentication, a Resend email adapter, and a Twilio WhatsApp approved-template sender adapter. Migrations create identity subjects, explicitly granted roles, sessions, catalog, merchant/service configuration, customer addresses, bookings with cash-on-completion-only payment method, merchant-offer records, reviews, idempotency records, privacy-request records and a transactional outbox. Booking requests use an authenticated owner-scoped address, a payload-bound idempotency key, verified/accepting merchant eligibility and the merchant's configured travel radius; intended-offer and outbox records are committed together. Offers expire after 15 minutes. A pre-provisioned, verified merchant account can list its own pending offers and atomically accept one or decline it; acceptance claims the booking only if it is still unassigned, snapshots that merchant's offer price, and cancels competing offers. The saved booking status is `offered` until a merchant accepts. The merchant portal is currently pull-to-refresh only: no outbox worker, WhatsApp dispatch, provider delivery receipt, or customer-confirmed job completion is implemented. Outbox payloads contain opaque identifiers, not the customer's address or phone. Customer account deletion can be requested; the API disables access and revokes sessions but does not claim immediate erasure or resolve legal retention/holds. The OTP is six digits, stored only as a keyed HMAC, expires after ten minutes, has a five-attempt cap, is single-use, and is throttled per normalized email in persistent storage. Sessions are random, persisted by HMAC, HttpOnly/SameSite cookies with a separate CSRF token; newly created identities receive only the `customer` role. Existing roles must be explicitly provisioned; the email flow does not let users self-assign merchant, technician, support, or admin access.

The local regression suite exercises auth with a fake PostgreSQL client, a mocked email sender, and mocked provider transports; it does not prove live Resend deliverability, Twilio account eligibility, WhatsApp template approval or consent, database behavior, migration compatibility against production data, multi-instance rate limiting, identity-provider compliance, security certification, or production readiness. The Resend integration is disabled without both `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; Twilio requires complete credentials, an approved WhatsApp sender, and a Content SID. No credentials or provider account were created and no outbound message was sent. Set provider secrets only in a private local environment. Do not put secrets in `.env.example` or tracked files. Production readiness remains deliberately blocked by code and cannot be enabled by setting environment variables.

## Explicitly not implemented

- Account recovery, merchant/technician onboarding and role review, complete tenant authorization, customer-confirmed service completion, outbox worker and retries, deletion-request adjudication/erasure, support/admin operations, or real-time cross-device updates.
- Twilio/WhatsApp outbox dispatch, recipient phone verification and consent management, WhatsApp callbacks, and Google Maps Platform requests. The provider adapter is not called by the application. Actual provider account setup, sender eligibility, approved templates, recipient opt-in, credentials, quotas, billing and legal terms remain owner-controlled prerequisites.
- Online payments are deferred. The demo's cash-on-completion label is not a live collection workflow.
- Production logging/monitoring, distributed rate-limit storage, backup/restore, deployment, service-level objectives, incident response, or production support.

Booking/merchant mutations and external message delivery must not be treated as live until the remaining APIs, ownership/eligibility checks, reliable outbox worker, consent/preferences, provider policy/cost and operational prerequisites are implemented and independently assessed.
