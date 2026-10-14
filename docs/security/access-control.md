# Roles and Permissions

## Document control

- Document ID: P00-ROLES
- Status: Working draft for owner review
- Authorization model: proposed least-privilege RBAC with explicit resource and action checks

## Role catalog

| ID | Role | Purpose | Status |
|---|---|---|---|
| ROLE-CUST | Customer | Request and manage own services | Proposed |
| ROLE-MERCHANT | Merchant owner | Manage a verified business and its jobs | Proposed |
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

## Open authorization questions

- Whether operations staff can perform emergency assignment overrides, and what dual approval is required.
- Whether technicians authenticate independently or through a merchant account.
- Which sensitive fields are masked for each role.
- Retention, export, deletion, and legal-hold rules.
- Exact MFA, recovery, session, and device policies.

These remain OPEN and must be resolved before implementation of privileged workflows.
