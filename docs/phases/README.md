# Phase planning dossiers

These plans preserve the approved V4.1 sequence. Phase 00 prepares conceptual blueprints; Phase 01 verifies feasibility, Phase 02 completes the PRD, Phase 03 approves technical contracts and Phase 04 approves detailed journeys. Later execution and all stage gates remain subject to separate authorization/evidence.

## Dossiers

- [Phase 00 — Product Foundation & Governance](phase-00.md)
- [Phase 01 — Market, Commercial, Legal & Technical Feasibility](phase-01.md)
- [Phase 02 — Complete Product Requirements](phase-02.md)
- [Phase 03 — System Architecture & Integration Contracts](phase-03.md)
- [Phase 04 — User Journeys, State Machines & Notification Flows](phase-04.md)
- [Phase 05 — Product Branding & Design System](phase-05.md)
- [Phase 06 — Complete UI/UX Screen Specifications](phase-06.md)
- [Phase 07 — Lovable UI Implementation](phase-07.md)
- [Phase 08 — Frontend Portability & Mobile Compatibility](phase-08.md)
- [Phase 09 — Engineering Baseline & CI/CD](phase-09.md)
- [Phase 10 — Backend, Identity, Authorization & Privacy](phase-10.md)
- [Phase 11 — Merchant Marketplace, Catalog & Search](phase-11.md)
- [Phase 12 — Smart Dispatch & Atomic First Acceptance](phase-12.md)
- [Phase 13 — Complete Booking & Service Lifecycle](phase-13.md)
- [Phase 14 — WhatsApp, Push & Real-Time Integration](phase-14.md)
- [Phase 15 — Customer, Merchant & Admin Web Integration](phase-15.md)
- [Phase 16 — Android & iOS Applications](phase-16.md)
- [Phase 17 — Security, Reliability, Performance & Operations](phase-17.md)
- [Phase 18 — Complete Private Pilot, QA & Store Approvals](phase-18.md)
- [Phase 19 — Single Coordinated Public Production Launch](phase-19.md)

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

Separate execution authorization is NOT GRANTED. Before starting: record Phase 00 closure delivery, appoint research/legal/technical/operations owners, approve research/consent scope, distinguish validation allowance from build budget, and authorize any paid/vendor access separately. The [Phase 01 dossier](phase-01.md) is the plan; no research or prototyping has begun. See [blueprint guide](../blueprint/README.md) and [owner record](../reviews/phase-00-owner-approval.md).
