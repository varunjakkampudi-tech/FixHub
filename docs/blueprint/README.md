# Fix Hub blueprint reader guide

This is the conceptual planning baseline for Fix Hub under Viswatra, initially Tanuku. It documents proposed behavior and future work, without claiming a finished application. Name approval does not approve a logo, identity, domain, vendor or technology. Read [owner-delegated approval](../reviews/phase-00-owner-approval.md) for exact scope and closure publication status.

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

- [flow-01-discovery](../flows/flow-01-discovery.md)
- [flow-02-request](../flows/flow-02-request.md)
- [flow-03-eligibility](../flows/flow-03-eligibility.md)
- [flow-04-atomic-acceptance](../flows/flow-04-atomic-acceptance.md)
- [flow-05-lifecycle](../flows/flow-05-lifecycle.md)
- [flow-06-cancellation](../flows/flow-06-cancellation.md)
- [flow-07-verification](../flows/flow-07-verification.md)
- [flow-08-notifications](../flows/flow-08-notifications.md)
- [flow-09-authentication](../flows/flow-09-authentication.md)
- [flow-10-support](../flows/flow-10-support.md)
- [flow-11-operations](../flows/flow-11-operations.md)
- [flow-12-privacy](../flows/flow-12-privacy.md)
- [state-machines](../flows/state-machines.md)
- [cross-channel-continuity](../flows/cross-channel-continuity.md)

## Role journeys

- [customer-journey](../journeys/customer-journey.md)
- [merchant-journey](../journeys/merchant-journey.md)
- [technician-journey](../journeys/technician-journey.md)
- [operations-journey](../journeys/operations-journey.md)
- [super-admin-journey](../journeys/super-admin-journey.md)

## Execution plans and governance

- [All 20 phase dossiers and gate diagram](../phases/README.md)
- [Phase 00: Product Foundation & Governance](../phases/phase-00.md)
- [Phase 01: Market, Commercial, Legal & Technical Feasibility](../phases/phase-01.md)
- [Phase 02: Complete Product Requirements](../phases/phase-02.md)
- [Phase 03: System Architecture & Integration Contracts](../phases/phase-03.md)
- [Phase 04: User Journeys, State Machines & Notification Flows](../phases/phase-04.md)
- [Phase 05: Product Branding & Design System](../phases/phase-05.md)
- [Phase 06: Complete UI/UX Screen Specifications](../phases/phase-06.md)
- [Phase 07: Lovable UI Implementation](../phases/phase-07.md)
- [Phase 08: Frontend Portability & Mobile Compatibility](../phases/phase-08.md)
- [Phase 09: Engineering Baseline & CI/CD](../phases/phase-09.md)
- [Phase 10: Backend, Identity, Authorization & Privacy](../phases/phase-10.md)
- [Phase 11: Merchant Marketplace, Catalog & Search](../phases/phase-11.md)
- [Phase 12: Smart Dispatch & Atomic First Acceptance](../phases/phase-12.md)
- [Phase 13: Complete Booking & Service Lifecycle](../phases/phase-13.md)
- [Phase 14: WhatsApp, Push & Real-Time Integration](../phases/phase-14.md)
- [Phase 15: Customer, Merchant & Admin Web Integration](../phases/phase-15.md)
- [Phase 16: Android & iOS Applications](../phases/phase-16.md)
- [Phase 17: Security, Reliability, Performance & Operations](../phases/phase-17.md)
- [Phase 18: Complete Private Pilot, QA & Store Approvals](../phases/phase-18.md)
- [Phase 19: Single Coordinated Public Production Launch](../phases/phase-19.md)
- [Traceability matrix](traceability-matrix.md)
- [Open decisions](open-decisions.md)
- [Glossary](glossary.md)
- [Current approval/evidence checklist](../reviews/phase-00-owner-approval.md)
- [Historical foundation reviews](../reviews/foundation-review.md)
- [Documentation validation](../../scripts/validate-docs.mjs)

## How to review the blueprint

Read the diagram and its following text together. Check each role's authority, legal transitions, missing policy and failure response against the requirement row. Run the documented validator/regression commands before proposing a change. If an identity/policy/vendor fact lacks evidence, retain it as OPEN; do not convert it into implementation approval. Phase 01 feasibility research/documentation is now separately authorized on 2026-10-15; see [execution index](../phases/phase-01-execution/README.md). This historical conceptual blueprint remains unimplemented; Phase 02 and detailed architecture/design approval are not granted. GitHub renders editable Mermaid source when supported; local checks establish basic diagram structure, not visual correctness or tested system behavior.
