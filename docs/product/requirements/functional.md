# Functional Requirements

## Document control

- Document ID: P00-FR
- Status: Owner-delegated planning baseline approved 2026-10-15; see [approval record](../../reviews/phase-00-owner-approval.md). Detailed implementation decisions remain separately gated.
- Priority meanings: P0 required for launch hypothesis; P1 important; P2 later or validation-dependent
- Acceptance note: requirements describe expected behavior, not implemented behavior or test evidence.
- Document owner: Product owner (role; individual assignee not recorded)
- Review history: 2026-10-14 — repository audit remediation; stable requirement IDs retained.

## Customer requirements

| ID | Requirement | Priority | Acceptance intent |
|---|---|---:|---|
| FR-C-001 | Customer can discover eligible service categories and providers for a location. | P0 | Results are restricted by configured category, geography, verification, hours, and availability rules. |
| FR-C-002 | Customer can search by service, category, free-text requirement, and location. | P0 | Each search input changes a deterministic, explainable result set. |
| FR-C-003 | Customer can create an instant or scheduled request with address, details, and optional photos. | P0 | Invalid or incomplete requests are rejected with actionable guidance. |
| FR-C-004 | Customer can submit through WhatsApp, website, Android, or iOS where that channel is approved. | P0 | All channels create one canonical request and preserve correlation identity. |
| FR-C-005 | Customer can see request, searching, offer, assignment, progress, completion, cancellation, and exception states. | P0 | State transitions are authoritative and timestamped. |
| FR-C-006 | Customer can review merchant information and applicable verified pricing. | P0 | Missing or uncertain values are shown as unavailable, never fabricated. |
| FR-C-007 | Customer can cancel, review, complain, and receive support guidance. | P0 | Policy, reason, timestamp, and downstream effects are recorded. |
| FR-C-008 | Customer can use English or Telugu for supported content and notifications. | P0 | Language choice persists and unsupported content is identified. |

## Merchant and technician requirements

| ID | Requirement | Priority | Acceptance intent |
|---|---|---:|---|
| FR-M-001 | Merchant can register without a registration fee. | P0 | Registration never requires payment; eligibility and verification state are explicit. |
| FR-M-002 | Merchant can submit verification evidence and see review status. | P0 | Evidence is access-controlled, auditable, and reviewable. |
| FR-M-003 | Merchant can maintain services, prices, hours, coverage, availability, and capacity. | P0 | Changes are validated, versioned as needed, and used by search/dispatch. |
| FR-M-004 | Eligible merchant receives an offer through an approved available channel. | P0 | Offer eligibility uses category, location, verification, hours, availability, and capacity. |
| FR-M-005 | Merchant can accept or decline an offer. | P0 | Duplicate, expired, unauthorized, or over-capacity acceptances fail safely. |
| FR-M-006 | First valid backend-committed acceptance wins atomically. | P0 | Concurrent acceptance tests prove one winner and consistent loser outcomes. |
| FR-M-007 | Merchant can manage assigned jobs, technicians, completion, reviews, and support. | P0 | Access is limited to the merchant’s own business and assigned work. |
| FR-M-008 | Notifications do not require every channel to remain open simultaneously. | P0 | Delivery, retry, failure, and read/ack states are observable where supported. |

## Admin and operations requirements

| ID | Requirement | Priority | Acceptance intent |
|---|---|---:|---|
| FR-A-001 | Admin can manage customers, merchants, categories, cities, and service zones. | P0 | Mutations are permission-checked, validated, and audited. |
| FR-A-002 | Authorized staff can approve, reject, suspend, and verify merchants. | P0 | Each outcome records actor, reason, timestamp, and evidence reference. |
| FR-A-003 | Operations can monitor live requests and dispatch outcomes. | P0 | Views show authoritative current state and stale-data indicators. |
| FR-A-004 | Authorized staff can investigate cancellations, disputes, fraud, and incidents. | P0 | Case notes and access are scoped and auditable. |
| FR-A-005 | Admin can manage staff roles, permissions, notification policy, and dispatch configuration. | P0 | Sensitive changes require appropriate privilege and audit evidence. |
| FR-A-006 | Admin can review analytics, platform costs, audit logs, and system health. | P1 | Metrics have definitions, time basis, access controls, and data freshness. |

## Platform rules

- FR-X-001: all channels use one authoritative backend.
- FR-X-002: dispatch never exceeds merchant capacity.
- FR-X-003: fabricated price, availability, rating, or arrival data is prohibited.
- FR-X-004: WhatsApp uses only an authorized compliant integration.
- FR-X-005: payments, liability, coverage, and guarantees remain outside scope until validated and approved.
