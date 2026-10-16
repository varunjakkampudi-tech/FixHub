# Fix Hub | Viswatra product planning

Fix Hub is the owner-selected product name under the confirmed parent company Viswatra. `A–Z Services` and `viswatra-marketplace` are historical planning identifiers, not current product names. Logo, visual identity, colors, typography, domain, and tagline remain open. `fixhub-platform` is a recommended identifier; the existing public repository is `varunjakkampudi-tech/FixHub`, with `main` as its default branch.

This repository contains planning documentation, a locally runnable UI demonstration and an optional PostgreSQL-backed API implementation. Local tests and synthetic database proofs cover selected behavior; live provider delivery and production operation remain unverified. The marketplace has not launched, and the UI is not an approved final product design. See [the documentation index](docs/README.md), [approved governing roadmap V4.1](docs/roadmap/master-roadmap.md), [document provenance](docs/governance/document-provenance.md), [contribution guidance](CONTRIBUTING.md), and [security policy](SECURITY.md).

## Run the local demonstration

Requires Node.js 22.12 or newer and npm. From the repository root:

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173/`. Development starts the UI and a separate API on port 4000; `/docs` exposes the API's OpenAPI/Swagger reference and `/health/live` reports process liveness. Without database and authentication configuration, use the fictional demo personas and browser-stored records. Optional API paths implement email sign-in, persisted bookings and merchant offers when their dependencies are configured; this does not establish provider eligibility or production readiness. Use synthetic data for local testing. `npm test` runs app and API tests; `npm run test:docs` runs repository documentation-validator regressions; `npm run test:all` runs both. `npm run typecheck` and `npm run build` run remaining local checks. `npm start` serves the most recent UI build locally; run `npm run build` first. Set `FIXHUB_WEB_ORIGINS` to an explicit comma-separated origin allowlist when configuring a non-local deployment; do not use `*`.

### WhatsApp template configuration

Booking notifications remain disabled by default. Before separately authorized activation, configure two distinct, approved Content SIDs: `TWILIO_WHATSAPP_SERVICE_CONTENT_SID` for request receipts and merchant offers with variables `1` (safe status), `2` (service name), `3` (locality); and `TWILIO_WHATSAPP_STATUS_CONTENT_SID` for booking status updates with variable `1` only. Verification uses its separate `TWILIO_WHATSAPP_VERIFICATION_CONTENT_SID`. The adapter rejects blank/control-character values and unsupported booking-variable sets before a provider request. This avoids relying on [Twilio template fallback values](https://www.twilio.com/docs/content/using-variables-with-content-api). A SID's format does not verify its approval, language, content, consent or account eligibility; those still require actual provider/account evidence. Keep credentials in private environment configuration.

The remaining proposed engineering directories in the reference architecture are specifications only; this demonstration does not authorize production infrastructure or deployment.

Read the [conceptual blueprint guide](docs/blueprint/README.md) and [owner-delegated planning approval](docs/reviews/foundation-approval.md) for architecture, all role journeys, all 20 phase plans and traceability. Phase 00 is published and closed as planning. Phase 01 remains IN PROGRESS; the [execution and evidence index](docs/product/feasibility/README.md) records ten retained scored criteria, currently ten PASS (100.0% scoped assessment coverage). The [2026-10-16 owner amendment](docs/reviews/phase-01-scope-amendment-2026-10-16.md) defers provider evidence and retains a separate owner exit gate. Zero customer or merchant interviews are claimed. Historical 12- and 14-criterion assessments are retained as history. Formal Phase 02 execution awaits Phase 01 exit; separately authorized draft preparation does not pass that gate.
