# Local API foundation

**Status: LOCAL DEMONSTRATION ONLY — NOT A PRODUCTION API.** The service is a first implementation increment, not an approved Phase 03 exit, production deployment, security certification, or live marketplace backend.

## Run and inspect

From the repository root, copy `.env.example` to an ignored local `.env` if configuration changes are needed, then run `npm run dev`. Vite serves the UI at `http://localhost:5173`; a separate Express API listens on `127.0.0.1:4000`. Vite proxies `/api`, `/health`, and `/docs` only in development. Swagger UI is at `/docs/`; the OpenAPI document is at `/openapi.json`.

Current routes are limited to process liveness, demo-service readiness, and a read-only fictional baseline price example. `GET /api/v1/demo/prices/{category}` uses the same illustrative base rates as the browser demo, labels the response `demoOnly`, identifies COD as demo-only, and does not create a quote, order, or payment instruction. Unknown categories and malformed/oversized JSON receive bounded error envelopes. No endpoint creates a booking, accesses user accounts, accepts uploads, or sends messages.

Production readiness intentionally returns `503` while authentication and persistent storage are absent. Browser-local demo personas are not authentication and must never authorize server operations.

## Controls in this increment

- Helmet applies secure HTTP response headers; Express' `X-Powered-By` banner is disabled.
- CORS allows only exact configured web origins and never enables credentialed CORS. CORS is a browser policy, not authentication or authorization.
- `express-rate-limit` limits API requests with standard headers and no legacy headers. Its default in-memory store is per-process and is **not** a multi-instance or distributed abuse-control solution. The server does not trust forwarded IP headers; a future reverse proxy requires a narrowly configured trusted-proxy boundary before IP-based limits can be relied on.
- Pino HTTP logging records a generated request ID, method, route template and response status. Query strings, request bodies, headers, contact fields and exception messages are not logged by these serializers. Logs remain local stdout; there is no retention, alerting, or admin log viewer.
- Zod validates route parameters and environment origins. JSON bodies are capped at 32 KiB and malformed/oversized bodies have generic error responses.
- OpenAPI 3.1 and Swagger UI document only the routes that exist today.

These controls have focused local tests; they are not a completed threat assessment and do not prove application security.

## Location and directions boundary

The customer address editor requests browser geolocation only after the user selects its location button; the browser permission prompt remains user-controlled. For an active booking assigned to the signed-in demo merchant or technician, the booking detail page offers an explicit external Google Maps directions link to the saved job coordinates. Opening that link sends the destination to Google Maps. The link uses Google's keyless Maps URL handoff, not the paid Maps Platform API; it does not geocode addresses, search places, share location in the background, or provide FixHub-side live tracking. The demo screen's SAMPLE data must not be used as a real dispatch destination.

## Explicitly not implemented

- Authentication, account recovery, role/tenant authorization, persistent PostgreSQL access, booking creation, merchant dispatch, durable notification outbox, or real-time cross-device updates.
- WhatsApp Cloud API, Twilio SMS/WhatsApp, Resend email, or Google Maps Platform requests. No provider key is bundled. Actual provider account setup, sender eligibility, opt-in/template policy, credentials, quotas, billing and legal terms remain owner-controlled prerequisites.
- Online payments are deferred. The demo's cash-on-completion label is not a live collection workflow.
- Production logging/monitoring, distributed rate-limit storage, backup/restore, deployment, service-level objectives, incident response, or production support.

The next backend increment must select and implement authenticated persistence before adding booking/merchant mutations. Provider adapters should follow only after the relevant account, consent, policy, cost, security and operational prerequisites are verified.
