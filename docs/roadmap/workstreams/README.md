# Phase planning dossiers

These plans preserve the approved V4.1 sequence. Phase 00 prepares conceptual blueprints; Phase 01 verifies feasibility, Phase 02 completes the PRD, Phase 03 approves technical contracts and Phase 04 approves detailed journeys. Later execution and all stage gates remain subject to separate authorization/evidence.

## Dossiers

- [Phase 00 — Product Foundation & Governance](product-foundation.md)
- [Phase 01 — Market, Commercial, Legal & Technical Feasibility](market-commercial-feasibility.md)
- [Phase 02 — Complete Product Requirements](product-requirements.md)
- [Phase 03 — System Architecture & Integration Contracts](system-architecture.md)
- [Phase 04 — User Journeys, State Machines & Notification Flows](service-journeys.md)
- [Phase 05 — Product Branding & Design System](brand-design-system.md)
- [Phase 06 — Complete UI/UX Screen Specifications](interface-design.md)
- [Phase 07 — Lovable UI Implementation](lovable-implementation.md)
- [Phase 08 — Frontend Portability & Mobile Compatibility](source-portability.md)
- [Phase 09 — Engineering Baseline & CI/CD](platform-setup.md)
- [Phase 10 — Backend, Identity, Authorization & Privacy](identity-access-security.md)
- [Phase 11 — Merchant Marketplace, Catalog & Search](merchant-catalogue.md)
- [Phase 12 — Smart Dispatch & Atomic First Acceptance](dispatch-engine.md)
- [Phase 13 — Complete Booking & Service Lifecycle](service-lifecycle.md)
- [Phase 14 — WhatsApp, Push & Real-Time Integration](messaging-notifications.md)
- [Phase 15 — Customer, Merchant & Admin Web Integration](customer-merchant-clients.md)
- [Phase 16 — Android & iOS Applications](mobile-applications.md)
- [Phase 17 — Security, Reliability, Performance & Operations](assurance-operations.md)
- [Phase 18 — Complete Private Pilot, QA & Store Approvals](private-pilot-store-approval.md)
- [Phase 19 — Single Coordinated Public Production Launch](coordinated-public-release.md)

## Dependency and gate diagram

```mermaid
flowchart LR
  P0["00 Product Foundation and Governance"]
  P1["01 Market, Commercial, Legal and Technical Feasibility"]
  P2["02 Complete Product Requirements"]
  P3["03 System Architecture and Integration Contracts"]
  P4["04 User Journeys, State Machines and Notification Flows"]
  P5["05 Product Branding and Design System"]
  P6["06 Complete UI/UX Screen Specifications"]
  P7["07 Lovable UI Implementation"]
  P8["08 Frontend Portability and Mobile Compatibility"]
  P9["09 Engineering Baseline and CI/CD"]
  P10["10 Backend, Identity, Authorization and Privacy"]
  P11["11 Merchant Marketplace, Catalog and Search"]
  P12["12 Smart Dispatch and Atomic First Acceptance"]
  P13["13 Complete Booking and Service Lifecycle"]
  P14["14 WhatsApp, Push and Real-Time Integration"]
  P15["15 Customer, Merchant and Admin Web Integration"]
  P16["16 Android and iOS Applications"]
  P17["17 Security, Reliability, Performance and Operations"]
  P18["18 Complete Private Pilot, QA and Store Approvals"]
  P19["19 Single Coordinated Public Production Launch"]
  P0 --> P1
  P1 --> P2
  P2 --> P3
  P3 --> P4
  P4 --> P5
  P5 --> P6
  P6 --> P7
  P7 --> P8
  P8 --> P9
  P9 --> P10
  P10 --> P11
  P11 --> P12
  P12 --> P13
  P13 --> P14
  P14 --> P15
  P15 --> P16
  P16 --> P17
  P17 --> P18
  P18 --> P19
  P2 --> G0["G0 foundation, feasibility and complete requirements"]
  G0 --> P3
  P6 --> G1["G1 brand and screens approved before Lovable"]
  G1 --> P7
  P8 --> G2["G2 export and mobile compatibility proven"]
  G2 --> P9
  P16 --> G3["G3 backend and all clients integrated"]
  G3 --> P17
  P18 --> G4["G4 security, pilot and stores ready"]
  G4 --> G5["G5 explicit owner launch GO"]
  G5 --> P19
```

The chain orders planned work; arrows never grant execution authority. Gate arrows are additional prerequisites. G0 requires actual feasibility and complete requirements, so Phase 00 closure alone does not pass it. G1 prohibits Lovable until identity/screens are approved. G2 prevents full engineering commitment on unproven export/mobile capability. G3 checks actual integrated behavior. G4 blocks launch on unresolved security, operations, pilot or store readiness. G5 is the separate final owner GO for the single complete public release.

## No-go conditions

| Gate | Stop when |
|---|---|
| G0 | Demand/supply, budget, legal/vendor feasibility or full requirement policy remains unsupported. |
| G1 | Logo/identity, required screens or interactions lack approval. |
| G2 | Export license, role isolation or mobile proof fails. |
| G3 | Backend/client contract, tenant scope, atomic assignment or channel recovery fails. |
| G4 | Launch-blocking security/reliability defect, unsafe fulfilment, unstaffed support or missing mandatory store approval. |
| G5 | No explicit owner GO, incomplete channel publication plan or unverifiable production/recovery readiness. |

## Phase 01 entry checklist

Execution authorization for feasibility research/documentation was GRANTED by the human owner on 2026-10-15 after Phase 00 publication at main ff6425a and successful post-merge CI. Phase 01 is IN PROGRESS; [execution evidence](../../product/feasibility/README.md) and [kickoff](../../product/feasibility/research-authority.md) supersede the earlier no-authorization snapshot. Primary interviews, outreach, account/paid access and application work are not executed or automatically authorized. The [Phase 01 dossier](market-commercial-feasibility.md) remains the original planning outline. The owner-amended active DoD has exactly 12 criteria: 10 PASS and 2 CONDITIONAL; the former 14-criterion assessment is historical. Formal Phase 02 execution is NOT GRANTED; [current authority](../../governance/product-foundation-work-authority.md) separately permits clearly labeled draft preparation and bounded isolated proofs, not earlier gate approval. See [blueprint guide](../../blueprint/README.md) and [owner record](../../reviews/foundation-approval.md).
