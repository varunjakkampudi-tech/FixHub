# FixHub Product Profile

This document records the foundational product attributes and conformance baseline for FixHub under Viswatra, pursuant to Appendix A of `Viswatra-Global-Engineering-Quality-Standard-v1.1.md`.

| Field | Value |
|---|---|
| **Product & Branch Baseline** | FixHub under Viswatra; canonical production and default branch: `main` (active commit `b765206`). No external branches; single synchronized branch model. (Repository verified by agent; named here only as product FixHub per CR-02). |
| **Scope Status & Governing Documents** | Product Scope FROZEN at v1.3. Governing specifications: `docs/specs/FixHub-Product-Spec-v1.3.md`, `docs/specs/FixHub-Engineering-Standards.md`, `docs/specs/FixHub-Autonomous-Goal.md`, `docs/specs/Viswatra-Global-Engineering-Quality-Standard-v1.1.md` (with CR-01 & CR-02), and `docs/specs/Viswatra-Global-Engineering-Completion-Program-v1.1.md`. |
| **Activation Status** | `AWAITING_OWNER_APPROVAL` (Autonomous implementation activation gated on formal owner approval entry recorded in `blocker.txt` as `OWNER-APPROVAL-<n>` or `BLOCKER-001`). Pre-activation security quarantine, real browser testing, and archive verification complete. |
| **Approved Git Workflow** | Synchronized canonical `main` with verified external immutable Git bundle backup; pull requests and development integration branch pending D17 activation. Protected `main` strictly enforced. |
| **Surfaces** | Web (Customer, Merchant, Public), Private Super Admin control plane, Express REST API, Official WhatsApp Business integration (behind approved provider adapter), Android & iOS mobile applications (planned under D06). |
| **Stack Per Surface** | Frontend: React 19, TypeScript, TanStack Router, TanStack Query, Vite, Tailwind CSS, Radix UI. Backend: Node.js 22 LTS, Express 5, Helmet, Zod validation, Pino structured logging. Database: PostgreSQL 16 with PostGIS, advisory locking, transactional outbox. |
| **Hosting & Deployment Target** | Ephemeral CI test environments; staging and production hosting targets pending owner selection under Decision D12 (non-AWS policy strictly enforced per CR-02). |
| **Launch Languages** | Bilingual English (`en-IN`) and Telugu (`te-IN`) only. Hindi disabled per FR-9. Keyed message catalogs with ICU-compatible format. |
| **Roles** | 3-Role Strict Model: Customer, Merchant, Admin (Owner). Technician acts via scoped assigned-job credentials. Role self-assignment strictly forbidden and prevented at API boundary. |
| **Public Pages Needing SEO & Schema** | Public home, Tanuku service directory, categories (Electrician, Plumbing, AC, Appliance), FAQ, safety, terms, and privacy. Structured data: `LocalBusiness`, `Service`, `Organization`, `BreadcrumbList`. |
| **Data Classes & Sensitive Data** | Customer phone, address, coordinates, service issue photos, KYC verification documents, inspection quotes, COD cash-on-completion records. Zero sensitive-data leakage enforced under CR-01. |
| **Providers & Approval Status** | WhatsApp & SMS: Twilio/Meta adapter implemented with durable outbox; live provider activation BLOCKED pending owner accounts (BLOCKER-004, BLOCKER-005). Maps: manual & coordinate bounds active; live tile provider pending D12. |
| **Supported Browsers & Devices** | Desktop Chromium, Mobile Chromium (Pixel 5), Desktop Firefox, Desktop WebKit via Playwright. Mobile matrix covering standard viewport widths (320px, 360px, 390px, 768px, 1024px, 1280px, 1440px, 1920px). |
| **Performance & RTO/RPO Targets** | Initial web bundle load < 1s under standard 4G. LCP <= 2.5s, INP <= 200ms, CLS <= 0.1. RTO/RPO proposed from backup restore drill baselines; pending owner approval under D13. |
| **Thresholds Stricter Than Standard** | Zero unexpected browser console messages or runtime exceptions permitted (CR-01). 100% pass on all 43 test suites. Cryptographically random OTP outside explicit `NODE_ENV === "test"`. |
| **Categories NOT_APPLICABLE_WITH_REASON** | Category 23 (AI & LLM Security): NOT_APPLICABLE_WITH_REASON (FixHub v1.3 contains no public autonomous AI booking bots, generative LLM runtime, or autonomous LLM tool calling). |
| **Owner Exceptions (Decision IDs)** | None. All 30 Viswatra Global Engineering categories apply without exception or threshold lowering. |
