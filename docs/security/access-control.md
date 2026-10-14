# Roles and Permissions

## Document control

- Document ID: P00-ROLES
- Status: Owner-delegated planning baseline approved 2026-10-15; see [approval record](../reviews/phase-00-owner-approval.md). Detailed implementation decisions remain separately gated.
- Authorization model: proposed least-privilege RBAC with explicit resource and action checks

## Role catalog

| ID | Role | Purpose | Status |
|---|---|---|---|
| ROLE-CUST | Customer | Request and manage own services | Proposed |
| ROLE-MERCHANT | Merchant owner | Manage a verified business and its jobs | Proposed |
| ROLE-MANAGER | Merchant manager | Manage explicitly delegated catalog, staff, and job actions for one merchant | Proposed |
| ROLE-TECH | Merchant technician | Perform assigned work with limited merchant scope | Proposed |
| ROLE-OPS | Operations staff | Dispatch and support operations | Proposed |
| ROLE-REVIEW | Verification/review staff | Review merchant evidence and incidents | Proposed |
| ROLE-ADMIN | Super Admin | Full platform administration, subject to audit | Proposed |
| ROLE-SYS | Service account/worker | Narrow machine actions only | Proposed |

## Permission principles

- PERM-001: deny by default; grant only the minimum action and resource scope.
- PERM-002: tenant boundaries prevent a merchant from reading another merchant’s private data.
- PERM-003: customers can access only their own profile, requests, communications, and reviews, subject to support/legal retention rules.
- PERM-004: privileged access requires MFA, strong session controls, audit logs, and periodic review.
- PERM-005: sensitive actions require reason capture and immutable audit evidence.
- PERM-006: service accounts cannot sign in as humans or gain interactive admin access.

## Capability matrix

| Capability | Customer | Merchant owner | Technician | Ops | Review staff | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| Maintain own profile | Own | Own business | Limited own | Support-only | Read | Govern |
| Create service request | Yes | No | No | On behalf, audited | No | On behalf, audited |
| Search eligible providers | Yes | No | No | Yes | No | Yes |
| Receive/accept offers | No | Yes | Policy-dependent | No | No | Emergency override, audited |
| Manage merchant catalog/capacity | No | Yes | No | Support | No | Yes |
| View assigned job details | Own | Own business | Assigned jobs | Operational | Case-scoped | Yes |
| Verify/suspend merchant | No | No | No | No | Proposed | Yes |
| Configure dispatch/policies | No | No | No | Proposed limited | No | Yes, dual-control candidate |
| View audit/system health | No | Limited own | No | Operational | Case-scoped | Yes |
| Manage staff roles | No | No | No | No | No | Yes, subject to separation of duties |

## Resource and action boundary (proposed; not an implementation grant)

| Resource | Read | Create | Update / transition | Delete / privileged action | Required scope |
|---|---|---|---|---|---|
| Customer profile and requests | Customer: own; support: case-scoped | Customer: own request | Customer: own allowed state; staff: audited support action | No hard delete by default; privacy workflow is policy-gated | Subject identity and request ownership |
| Merchant profile, catalog, service area, capacity | Merchant owner/manager: own business; technician: assigned subset | Owner/manager: own business | Owner/manager: delegated fields; review staff: verification decision | Suspend/restore: authorized reviewer or admin with reason and audit | Merchant tenant ID |
| Verification evidence | Submitting merchant: own status; reviewer: assigned case | Merchant: own submission | Reviewer: status only, with evidence reference and reason | Restricted retention/deletion workflow; never general staff access | Assigned verification case; sensitive fields minimized |
| Job and dispatch offer | Customer: own; merchant: own/assigned; technician: assigned; ops: operational case | Customer/system: canonical request/offer | First-valid acceptance is atomic; overrides require explicit privileged policy and audit | No direct deletion of dispatch history | Request, merchant tenant, assignment, and role scope |
| Staff roles and security configuration | Self-service minimum; admin: governed view | Admin only | Admin with MFA, reason, audit, and separation-of-duties controls | No self-grant or self-elevation; emergency path requires separate approval policy | Named tenant/platform scope |
| Audit and incident records | Ops/reviewer: case-scoped; admin: governed access | System and authorized staff | Append-only evidence; corrections are additional events | No routine edit or delete | Case, actor, and lawful retention policy |

This matrix is a design proposal only. Exact field masking, export/deletion, emergency access, manager delegation, reviewer assignment, and retention remain OPEN and require owner/security review before implementation.

## Open authorization questions

- Whether operations staff can perform emergency assignment overrides, and what dual approval is required.
- Whether technicians authenticate independently or through a merchant account.
- Which sensitive fields are masked for each role.
- Whether ROLE-MANAGER is needed and which exact capabilities the merchant owner may delegate.
- Whether review work is assignment-scoped and how conflicts of interest are prevented.
- Retention, export, deletion, and legal-hold rules.
- Exact MFA, recovery, session, and device policies.

These remain OPEN and must be resolved before implementation of privileged workflows.
