# FixHub — Comprehensive Risk Register

**Project:** Fix Hub (Viswatra)  
**Standard:** `Viswatra-Global-Engineering-Quality-Standard-v1.1.md` (Category 22)  
**Review Reference:** Solo-Maintainer Governance & Spec Section 16A.4  
**Audit Commit:** `554fde9`  

---

## 1. Risk Governance Policy

In accordance with Viswatra Global Engineering and Quality Standard v1.1 Category 22:
- An unresolved exploitable critical vulnerability is never declared production-ready.
- Risk exceptions cannot be granted or created by AI agents; they require documented severity, exploitation conditions, compensating controls, and recorded owner approval in `RISK_EXCEPTIONS.md`.
- No exception may bypass legal, financial, or regulatory compliance.

---

## 2. Risk Inventory

| ID | Category | Risk Description | Severity | Likelihood | Impact | Compensating Controls & Mitigation | Owner | Residual Status |
|---|---|---|---|---|---|---|---|---|
| RSK-001 | Security | Leaked default JWT secret in public Git history | Critical | High | Token forgery, admin privilege escalation | Hardcoded fallback removed; startup halted if missing or insecure in prod; rotation action in `blocker.txt` (BLOCKER-002). | Security Architect | MITIGATED (Code), OPEN (Env Config) |
| RSK-002 | Security | Role self-assignment during unauthenticated OTP | Critical | High | Unauthorized admin account creation | Roles removed from OTP request schema; user role loaded from DB; new signups default to `customer`. Regression tested. | Security Lead | RESOLVED (Verified) |
| RSK-003 | Security | Fixed OTP bypass on phone numbers ending in `0000` | Critical | Medium | Account takeover on specific numbers | Static OTP and `testOtp` response strictly restricted to `test` environment only. Random 6-digit OTP enforced. | Security Lead | RESOLVED (Verified) |
| RSK-004 | Concurrency | Race condition: concurrent double-assignment of single lead | High | High | Two merchants dispatched to same customer | Redlock distributed lock with atomic SETNX acquisition and token release; proven in `critical.test.ts`. | Chief Architect | MITIGATED (Proven) |
| RSK-005 | Regulatory | ECO GST compliance under CGST Act Section 9(5)/52 | High | High | Tax penalties, platform operational halt | COD-only launch scope; platform commission collection deferred until GSTIN registration; legal questions prepared. | Product Owner | BLOCKED (BLOCKER-003) |
| RSK-006 | Telecom | Indian DLT mandate blocking transactional SMS OTP | High | High | Customers unable to receive sign-in SMS | In-app fallback; WhatsApp channel adapter; step-by-step DLT header registration guide in `blocker.txt` (BLOCKER-005). | Operations Lead | BLOCKED (BLOCKER-005) |
| RSK-007 | Privacy | Customer phone & PII leakage in application logs | High | Medium | Data protection violation (DPDP Act) | Pino JSON log redaction; phone masking (`+9198****3210`); zero auth secrets or OTPs in query strings. | Security Architect | MITIGATED (Tested) |
| RSK-008 | Operational | Merchant no-show or unresponsiveness after acceptance | Medium | Medium | Customer dissatisfaction in Tanuku | 15-minute response timer; auto-reassignment trigger; customer support reference dispute ticket. | Operations Lead | MITIGATED (Designed) |
| RSK-009 | Operational | Technician quote dispute on-site | Medium | High | Arguments over parts/labor pricing | Price Clarity Card; itemized parts/labor breakdown; in-app quote rejection with free inspection clause. | Product Lead | MITIGATED (Tested) |
| RSK-010 | Infrastructure | Database connection pool exhaustion during traffic spike | High | Low | API 500 errors, service downtime | Pool sizing limit (`DATABASE_POOL_MAX=10`), health check latency tracking, graceful error 503 response. | SRE Lead | MITIGATED (Tested) |
| RSK-011 | Third-Party | WhatsApp Cloud API outage or webhook delay | Medium | Medium | Delayed customer notifications | Transactional outbox in PostgreSQL with exponential retry backoff and dead-letter queue. | DevSecOps Lead | MITIGATED (Tested) |
| RSK-012 | Localization | Telugu copy translation inaccuracy or unnatural phrasing | Medium | Low | Confusion among rural Tanuku users | Key parity check passing; native speaker review registered in `blocker.txt` (BLOCKER-008). | UI/UX Lead | PENDING (Native Review) |
| RSK-013 | Performance | Client bundle size bloat exceeding 1s mobile load target | Medium | Medium | Slow loading on 3G/4G connections | Vite code-splitting; tree-shaking; asset compression; bundle build verified at < 1MB uncompressed. | Full-Stack Lead | MITIGATED (Measured) |
| RSK-014 | Security | Stored XSS via technician notes or review comments | High | Low | Script execution in Admin Console | Helmet CSP headers; React JSX automatic string escaping; strict Zod schema sanitization. | Security Lead | MITIGATED (Tested) |
| RSK-015 | Availability | Single point of failure if primary server crashes | High | Medium | Temporary platform outage | Stateless API design; session tokens in signed JWT/HMAC; state in PostgreSQL/Redis; auto-restart via PM2/Docker. | SRE Lead | MITIGATED (Architecture) |
