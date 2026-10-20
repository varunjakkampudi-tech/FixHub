# FixHub24 — Master Execution Roadmap V4.1

## Document control and status

- Product: FixHub24, under parent company Viswatra.
- Version: V4.1.
- Status: **APPROVED governing planning roadmap — owner-delegated decision recorded 2026-10-15.**
- Approval authority: the owner's final Phase 00 master prompts explicitly approve V4.1 supersession; see the [delegated approval record](../reviews/foundation-approval.md). Subsequent phase execution still needs separate authorization.
- Authority: reconstructed from the complete owner-supplied inline specification received 2026-10-14.
- Historical V4: `Viswatra_AZ_Services_Master_Execution_Roadmap_V4.md` was unavailable in the workspace. It was not inspected, imported, compared, or checksum-verified. No historical V4 checksum is claimed.
- Local SHA-256 of this V4.1 document: recorded in the [`current-revision manifest`](../governance/roadmap-provenance.json); historical checksums remain in the [`provenance record`](../governance/document-provenance.md) and [`foundation review`](../reviews/foundation-review.md). A reference amendment does not authenticate unavailable V4 source bytes or approve a new phase.
- Scope: planning and governance. This document does not authorize application code, infrastructure, paid services, Lovable, product deployment, or phase execution. Repository governance work is tracked separately; the existing documentation repository is not application implementation.
- Completion evidence: each phase requires its phase-specific evidence, independent review where applicable, and explicit owner sign-off. A phase is not complete merely because its documents or code exist.

## Release policy

There will be **one complete coordinated public production release** of the approved launch product. Internal engineering phases, development environments, staging, private tests, and private/beta programs are allowed. Incomplete public feature releases are not allowed. Phase 19 requires an explicit owner GO, operational readiness, published approved channels, verified production health, and stabilization review.

## Mandatory stage gates

| Gate | Required evidence before proceeding |
|---|---|
| G0 | Product foundation, complete requirements, and technical/business feasibility reviewed. |
| G1 | Branding and complete UI/UX explicitly approved before Lovable is initiated. |
| G2 | Lovable export, role-isolated applications, and mobile compatibility proven through a bounded compatibility proof. |
| G3 | Backend, dispatch, integrations, and client functionality verified end to end. |
| G4 | Security, operational readiness, private pilot, and required app-store approvals verified. |
| G5 | Explicit owner GO for the single complete coordinated public launch. |

No gate is passed by inference. Evidence and owner sign-off must be recorded.

## Phases

### PHASE 00 — Product Foundation & Governance

Establish the product charter, roles, scope, requirements baseline, decision register, risk register, success criteria, definition of done, approval gates, and documentation traceability.

**Exit:** complete, internally consistent, owner-reviewable foundation documents. Owner approval remains required; this roadmap itself does not close Phase 00.

### PHASE 01 — Market, Commercial, Legal & Technical Feasibility

Validate Tanuku demand through research and customer interviews; merchant supply; business economics; legal/privacy needs; WhatsApp eligibility; app-store conditions; vendor costs; and operating capacity.

**Exit:** evidence-based feasibility assessment with blockers and mitigation plans.

### PHASE 02 — Complete Product Requirements

Approve a complete PRD and customer, merchant, and admin requirements; categories; instant and scheduled booking policies; permissions; pricing and cancellation rules; localization; and measurable acceptance criteria.

**Exit:** approved requirements with traceable coverage.

### PHASE 03 — System Architecture & Integration Contracts

Specify modular-monolith architecture, identity, RBAC, PostgreSQL/PostGIS, transactional outbox, background workers, dispatch, mobile strategy, API contracts, architecture diagrams, ERD, data protection, and failure handling.

**Exit:** independently reviewed architecture contracts and risk decisions.

### PHASE 04 — User Journeys, State Machines & Notification Flows

Specify customer, merchant, technician, operations, and Super Admin journeys. Cover WhatsApp/web/mobile parity; first-acceptance races; expired offers; capacity conflicts; no-shows; cancellation; reassignment; and disputes.

**Exit:** approved state transitions and cross-channel behavior.

### PHASE 05 — Product Branding & Design System

Finalize FixHub24’s visual identity, logo, typography, colors, icons, accessibility requirements, English/Telugu support, responsive navigation, and reusable component system only after explicit owner decisions.

**Exit:** explicit owner approval of branding and global UX direction. Until then all identity elements remain OPEN.

### PHASE 06 — Complete UI/UX Screen Specifications

Create and approve the complete screen registry for Customer, Merchant, Super Admin, and public pages. The earlier 74-screen inventory is a starting estimate, not a cap. Include responsive states, errors, offline behavior, and interaction specifications.

**Exit:** every required design approved before Lovable implementation.

### PHASE 07 — Lovable UI Implementation

Only after explicit authorization, implement approved designs using a standalone Lovable project or independently validated equivalent. First run a small export/compatibility proof before generating all screens. Do not assume access to this workspace or an existing GitHub repository.

**Exit:** approved UI implemented with design fidelity and documented interactions.

### PHASE 08 — Frontend Portability & Mobile Compatibility

Verify Lovable export, role-isolated builds, shared components, framework compatibility, SEO needs, and real-device Capacitor feasibility. Evaluate a React Native fallback if needed.

**Exit:** mobile implementation and source-integration strategy proven.

### PHASE 09 — Engineering Baseline & CI/CD

Only after authorization, evolve the existing GitHub repository into the separately approved engineering baseline: decide repository topology, then add isolated applications, shared packages, API, workers, environment configuration, protected branches, automated tests, security checks, and deployment pipelines. The current repository contains documentation only; this phase is not already complete by virtue of repository existence or documentation CI.

**Exit:** reproducible development environment and verified engineering baseline.

### PHASE 10 — Backend, Identity, Authorization & Privacy

Implement canonical user identity, authentication, merchant/staff accounts, MFA, RBAC, privacy controls, account deletion, secure sessions, storage, and initial database migrations.

**Exit:** authentication, tenant isolation, and security tests pass.

### PHASE 11 — Merchant Marketplace, Catalog & Search

Implement registration, merchant verification, categories, service coverage, geographic queries, hours, staff capacity, fair search ranking, and customer discovery.

**Exit:** search, merchant eligibility, and verification behavior validated.

### PHASE 12 — Smart Dispatch & Atomic First Acceptance

Implement request creation, eligibility matching, simultaneous merchant offers, locking, capacity reservations, atomic assignment, expiry, retries, outbox, audit, and recovery.

**Exit:** zero double assignments and capacity overbooking under defined concurrency tests.

### PHASE 13 — Complete Booking & Service Lifecycle

Implement quotes, inspection charges, customer approval, technician arrival, work execution, completion, cancellation, no-show, direct-payment records, reviews, and disputes.

**Exit:** full lifecycle and exception paths validated.

### PHASE 14 — WhatsApp, Push & Real-Time Integration

Implement official WhatsApp Cloud API, approved templates, customer conversations, merchant interactions, FCM/APNs, Web Push, SSE, reconnect/replay, notification routing, delivery costs, and retry policies.

**Exit:** cross-channel integration and failure recovery verified.

### PHASE 15 — Customer, Merchant & Admin Web Integration

Connect all web screens to real backend APIs and remove preview-only behavior. Validate dashboards, analytics, permissions, SEO, responsive design, accessibility, and English/Telugu functionality.

**Exit:** complete staging web experiences with passing end-to-end tests.

### PHASE 16 — Android & iOS Applications

Complete customer and merchant mobile applications for Android and iOS, native device capabilities, authentication, push notifications, deep links, location, camera, upload, and lifecycle handling.

**Exit:** real-device validation and signed app builds.

### PHASE 17 — Security, Reliability, Performance & Operations

Conduct threat modeling, security tests, privacy review, load/soak testing, backup restoration, observability, alerting, incident recovery, cost analysis, and operational readiness checks.

**Exit:** no unresolved launch-blocking security or reliability defects.

### PHASE 18 — Complete Private Pilot, QA & Store Approvals

Test real service operations with consenting Tanuku merchants and customers; run end-to-end testing; resolve defects; complete TestFlight/Google testing; and obtain required store approvals.

**Exit:** product, merchant supply, real-world fulfilment, and app-store readiness verified.

### PHASE 19 — Single Coordinated Public Production Launch

Launch the approved website, WhatsApp experiences, customer mobile apps, merchant mobile apps, dashboards, production backend, and monitoring as one coordinated complete product.

**Exit:** explicit owner authorization, operational readiness, published channels, verified production health, and stabilization review.

## Owner confirmation record

On 2026-10-15 the owner explicitly delegated and authorized approval of reconstructed V4.1 as superseding historical V4 for governing future planning. DEC-016 is LOCKED for this decision. The owner accepts unavailable historical V4 as a documented provenance limitation; no historical import or verification is claimed. The phase sequence, gates G0–G5 and single-public-release policy are unchanged. This roadmap approval does not authorize Phase 01 or pass any later gate. The [approval record](../reviews/foundation-approval.md) distinguishes planning approval, evidence completion and repository closure publication.
