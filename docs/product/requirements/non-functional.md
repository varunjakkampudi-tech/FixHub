# Non-Functional Requirements

## Document control

- Document ID: P00-NFR
- Status: Working draft for owner review
- Note: Numeric targets below are proposed acceptance targets, not measured baselines. They require owner and technical review.

| ID | Area | Requirement / proposed target | Evidence required |
|---|---|---|---|
| NFR-SEC-001 | Security | Enforce least-privilege access, secure secrets handling, MFA for privileged roles, session protection, and audit logging. | Threat model, security tests, configuration review, and operational evidence. |
| NFR-SEC-002 | Privacy | Minimize, protect, retain, export, and delete personal data under approved policy. | Data inventory, privacy review, access tests, and legal validation. |
| NFR-SEC-003 | Integrity | Dispatch acceptance is atomic and idempotent under concurrency. | Transaction tests, race tests, failure-injection evidence. |
| NFR-REL-001 | Reliability | Requests and assignments survive retries without duplicate jobs or conflicting states. | Integration and recovery tests. |
| NFR-REL-002 | Availability | Define service availability targets for customer, merchant, admin, dispatch, and notifications before launch. | Approved SLOs and monitoring evidence. |
| NFR-PERF-001 | Performance | Define p95 search, request submission, status update, and acceptance latency targets using realistic Tanuku load assumptions. | Load-test plan and results. |
| NFR-SCALE-001 | Scale | Support evidence-gated city expansion without cross-city data or dispatch leakage. | Architecture review, partitioning tests, migration rehearsal. |
| NFR-UX-001 | Accessibility | Web and mobile flows meet an approved accessibility baseline, including keyboard, contrast, labels, focus, and screen-reader behavior. | Automated and manual accessibility checks. |
| NFR-UX-002 | Localization | English and Telugu content, dates, numbers, and notifications are reviewable and consistent. | Translation review and end-to-end language tests. |
| NFR-OBS-001 | Observability | Capture structured logs, metrics, traces where appropriate, correlation IDs, notification outcomes, and audit events without leaking sensitive data. | Dashboard, alert, retention, and redaction evidence. |
| NFR-BCP-001 | Continuity | Define backups, recovery point objective, recovery time objective, and restore-test cadence. | Approved BCP and successful restore rehearsal. |
| NFR-EXT-001 | Integrations | WhatsApp, FCM, APNs, Web Push, maps/location, and app stores are subject to documented credentials, terms, quotas, failure behavior, and approval. | Provider verification and integration tests. |
| NFR-OPS-001 | Operability | Admin actions, dispatch overrides, incidents, and support cases are traceable and reversible where safe. | Runbooks, audit review, and incident drills. |
| NFR-COST-001 | Cost | Hosting, messaging, maps, app distribution, monitoring, and support costs are estimated and approved before build commitments. | Vendor quotes/terms and budget decision. |

## Unspecified targets that block implementation

The prompt does not provide traffic volumes, latency targets, uptime goals, retention periods, RPO/RTO, accessibility standard, support hours, or cost ceilings beyond the validation allowance. These are OPEN requirements, not safe defaults.
