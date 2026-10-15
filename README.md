# Fix Hub | Viswatra product planning

Fix Hub is the owner-selected product name under the confirmed parent company Viswatra. `A–Z Services` and `viswatra-marketplace` are historical planning identifiers, not current product names. Logo, visual identity, colors, typography, domain, and tagline remain open. `fixhub-platform` is a recommended identifier; the existing public repository is `varunjakkampudi-tech/FixHub`, with `main` as its default branch.

This repository contains planning documentation and a locally runnable UI demonstration. The demonstration is not a completed or launched marketplace, and it does not provide live authentication, bookings, payments, provider availability, or server-backed business data. It is not an approved final product design. See [the documentation index](docs/README.md), [approved governing roadmap V4.1](docs/roadmap/master-roadmap.md), [document provenance](docs/governance/document-provenance.md), [contribution guidance](CONTRIBUTING.md), and [security policy](SECURITY.md).

## Run the local demonstration

Requires Node.js 22.12 or newer and npm. From the repository root:

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173/`. Development starts the UI and a separate API on port 4000; `/docs` exposes the API's OpenAPI/Swagger reference and `/health/live` reports process liveness. The API is a demo-only foundation: it has no user authentication, persistent booking store, or live provider connection. The sample personas and records are fictional and stored in browser storage; do not enter real personal or sensitive information. `npm test` runs app and API tests; `npm run test:docs` runs repository documentation-validator regressions; `npm run test:all` runs both. `npm run typecheck` and `npm run build` run remaining local checks. `npm start` serves the most recent UI build locally; run `npm run build` first. Set `FIXHUB_WEB_ORIGINS` to an explicit comma-separated origin allowlist when configuring a non-local deployment; do not use `*`.

The remaining proposed engineering directories in the reference architecture are specifications only; this demonstration does not authorize production infrastructure or deployment.

Read the [conceptual blueprint guide](docs/blueprint/README.md) and [owner-delegated planning approval](docs/reviews/foundation-approval.md) for architecture, all role journeys, all 20 phase plans and traceability. Phase 00 is published and closed as planning. Phase 01 feasibility research/documentation is IN PROGRESS under separate owner authorization dated 2026-10-15; the [execution and evidence index](docs/product/feasibility/README.md) records 12 active criteria: 10 PASS and 2 CONDITIONAL (83.3% assessment coverage, not product completion). Zero customer or merchant interviews are claimed; formal interviews are no longer mandatory Phase 01 exit criteria. The superseded 14-criterion assessment remains historical evidence, not the current denominator. Formal Phase 02 execution awaits Phase 01 exit; separately authorized draft preparation does not pass that gate.
