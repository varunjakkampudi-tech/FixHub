# Fix Hub blueprint reader guide

This is the conceptual planning baseline for Fix Hub under Viswatra, initially Tanuku. It documents proposed behavior and future work, without claiming a finished application. Name approval does not approve a logo, identity, domain, vendor or technology. Read [owner-delegated approval](../reviews/foundation-approval.md) for exact scope and closure publication status.

## Choose a reading path

- Nontechnical product readers: start with [customer journey](../journeys/customer-journey.md), [merchant journey](../journeys/merchant-journey.md) and [system context](../architecture/system-context.md).
- Architects/engineers: read the platform, data and security documents, atomic acceptance, continuity and state machines.
- Designers: use journey stages and errors as conceptual inputs; Phase 06 must separately approve actual screen specifications.
- QA: use [traceability](traceability-matrix.md) to plan negative, concurrency and recovery acceptance evidence.
- Operations: read staff journeys, support, incidents and privacy flows; staffing/runbooks are future evidence.

## Architecture explanations and references

- [system-context](../architecture/system-context.md)
- [platform-overview](../architecture/platform-overview.md)
- [backend-domains](../architecture/backend-domains.md)
- [data-architecture](../architecture/data-architecture.md)
- [security-trust-boundaries](../architecture/security-trust-boundaries.md)
- [deployment-and-integrations](../architecture/deployment-and-integrations.md)

## System flows and state references

- [Service discovery](../flows/service-discovery.md)
- [Service request](../flows/service-request.md)
- [Merchant eligibility](../flows/merchant-eligibility.md)
- [Atomic acceptance](../flows/atomic-acceptance.md)
- [Service lifecycle](../flows/service-lifecycle.md)
- [Cancellation and reassignment](../flows/cancellation-reassignment.md)
- [Merchant verification](../flows/merchant-verification.md)
- [Notifications and recovery](../flows/notifications-recovery.md)
- [Authentication and authorization](../flows/authentication-authorization.md)
- [Support and disputes](../flows/support-disputes.md)
- [Operations and incidents](../flows/operations-incidents.md)
- [Privacy rights](../flows/privacy-rights.md)
- [state-machines](../flows/state-machines.md)
- [cross-channel-continuity](../flows/cross-channel-continuity.md)

## Role journeys

- [customer-journey](../journeys/customer-journey.md)
- [merchant-journey](../journeys/merchant-journey.md)
- [technician-journey](../journeys/technician-journey.md)
- [operations-journey](../journeys/operations-journey.md)
- [super-admin-journey](../journeys/super-admin-journey.md)

## Execution plans and governance

- [All 20 phase dossiers and gate diagram](../roadmap/workstreams/README.md)
- [Phase 00: Product Foundation & Governance](../roadmap/workstreams/product-foundation.md)
- [Phase 01: Market, Commercial, Legal & Technical Feasibility](../roadmap/workstreams/market-commercial-feasibility.md)
- [Phase 02: Complete Product Requirements](../roadmap/workstreams/product-requirements.md)
- [Phase 03: System Architecture & Integration Contracts](../roadmap/workstreams/system-architecture.md)
- [Phase 04: User Journeys, State Machines & Notification Flows](../roadmap/workstreams/service-journeys.md)
- [Phase 05: Product Branding & Design System](../roadmap/workstreams/brand-design-system.md)
- [Phase 06: Complete UI/UX Screen Specifications](../roadmap/workstreams/interface-design.md)
- [Phase 07: Lovable UI Implementation](../roadmap/workstreams/lovable-implementation.md)
- [Phase 08: Frontend Portability & Mobile Compatibility](../roadmap/workstreams/source-portability.md)
- [Phase 09: Engineering Baseline & CI/CD](../roadmap/workstreams/platform-setup.md)
- [Phase 10: Backend, Identity, Authorization & Privacy](../roadmap/workstreams/identity-access-security.md)
- [Phase 11: Merchant Marketplace, Catalog & Search](../roadmap/workstreams/merchant-catalogue.md)
- [Phase 12: Smart Dispatch & Atomic First Acceptance](../roadmap/workstreams/dispatch-engine.md)
- [Phase 13: Complete Booking & Service Lifecycle](../roadmap/workstreams/service-lifecycle.md)
- [Phase 14: WhatsApp, Push & Real-Time Integration](../roadmap/workstreams/messaging-notifications.md)
- [Phase 15: Customer, Merchant & Admin Web Integration](../roadmap/workstreams/customer-merchant-clients.md)
- [Phase 16: Android & iOS Applications](../roadmap/workstreams/mobile-applications.md)
- [Phase 17: Security, Reliability, Performance & Operations](../roadmap/workstreams/assurance-operations.md)
- [Phase 18: Complete Private Pilot, QA & Store Approvals](../roadmap/workstreams/private-pilot-store-approval.md)
- [Phase 19: Single Coordinated Public Production Launch](../roadmap/workstreams/coordinated-public-release.md)
- [Traceability matrix](traceability-matrix.md)
- [Open decisions](open-decisions.md)
- [Glossary](glossary.md)
- [Current approval/evidence checklist](../reviews/foundation-approval.md)
- [Historical foundation reviews](../reviews/foundation-review.md)
- [Documentation validation](../../scripts/validate-documentation.mjs)

## How to review the blueprint

Read the diagram and its following text together. Check each role's authority, legal transitions, missing policy and failure response against the requirement row. Run the documented validator/regression commands before proposing a change. If an identity/policy/vendor fact lacks evidence, retain it as OPEN; do not convert it into implementation approval. Phase 01 feasibility research/documentation is now separately authorized on 2026-10-15; see [execution index](../product/feasibility/README.md). This historical conceptual blueprint remains unimplemented; Phase 02 and detailed architecture/design approval are not granted. GitHub renders editable Mermaid source when supported; local checks establish basic diagram structure, not visual correctness or tested system behavior.
