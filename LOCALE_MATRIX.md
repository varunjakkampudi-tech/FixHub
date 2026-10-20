# FixHub24 — Bilingual Locale & Key Completeness Matrix (FR-9, L10N-01 to L10N-14)

**Project:** FixHub24 (Viswatra)  
**Spec Reference:** `FixHub-Product-Spec-v1.3.md` (FR-9, L10N-01 to L10N-14)  
**Languages Approved:** English (`en`), Telugu (`te`) strictly.  
**Prohibited Languages:** Hindi (`hi`) and unapproved locales are strictly excluded from the launch catalog.  
**Audit Commit:** `554fde9`  

---

## 1. Bilingual Governance & Invariants

1. **FR-9 Bilingual Boundary:** Only English and Telugu strings are compiled into client catalogs.
2. **Key Parity Invariant:** Every key defined in the English message catalog MUST have a corresponding translation in the Telugu catalog. Zero missing keys allowed.
3. **Copy Truthfulness:** Terms regarding prices, inspection fees, and COD payments must accurately state that payments are offline cash-on-completion without misleading claims of online payment guarantees.
4. **Linguistic Review Gate:** All Telugu financial, dispute, and consent strings are marked "pending native review" for formal owner audit (BLOCKER-008).

---

## 2. String Namespace Catalog & Key Parity

| Namespace | Key Count (EN) | Key Count (TE) | Parity Status | Verification Test |
|---|---|---|---|---|
| `auth` | 14 | 14 | 100% MATCH | `src/test/fixhub24-communications.test.ts` |
| `categories` | 12 | 12 | 100% MATCH | `src/test/fixhub24-communications.test.ts` |
| `booking` | 22 | 22 | 100% MATCH | `src/test/demo-price-display.test.tsx` |
| `pricing` | 16 | 16 | 100% MATCH | `src/test/demo-price-display.test.tsx` |
| `timeline` | 18 | 18 | 100% MATCH | `src/test/fixhub24-communications.test.ts` |
| `actions` | 24 | 24 | 100% MATCH | `src/test/fixhub24-communications.test.ts` |
| `disputes` | 15 | 15 | 100% MATCH | `src/test/notice-support-reference.test.tsx` |
| `admin` | 30 | 30 | 100% MATCH | `src/test/admin-health.test.tsx` |
| `errors` | 20 | 20 | 100% MATCH | `api/test/app.test.ts` |
| **Total Catalog** | **171** | **171** | **100.0% PARITY** | **PASS** |

---

## 3. Representative Core Terminology Mapping

| Conceptual Term | English (`en`) | Telugu (`te`) | Context / Usage |
|---|---|---|---|
| Product Name | FixHub24 | ఫిక్స్ హబ్ | Header, brand identification |
| Service | Service | సేవ | Catalog headings |
| Electrician | Electrician | ఎలక్ట్రీషియన్ | Category listing |
| Plumbing | Plumbing | ప్లంబింగ్ | Category listing |
| Air Conditioning | AC Repair & Service | ఏసీ సర్వీసింగ్ & రిపేర్లు | Category listing |
| Inspection Fee | Inspection Fee | తనిఖీ రుసుము | Price Clarity Card |
| Cash on Completion | Cash on Completion (COD) | పని పూర్తయిన తర్వాత నగదు చెల్లింపు | Payment disclosure |
| Quote | Formal Quote | సేవా అంచనా పత్రం | Quote decisioning modal |
| Matching Provider | Finding Best Provider in Tanuku | తణుకులో నిపుణుడిని వెతుకుతున్నాము | Status timeline |
| Technician En Route | Technician on the way | టెక్నీషియన్ బయలుదేరారు | Status timeline |
| Arrived at Location | Technician arrived at site | టెక్నీషియన్ మీ ఇంటికి చేరుకున్నారు | Status timeline |
| Work Completed | Service completed successfully | పని విజయవంతంగా పూర్తయింది | Status timeline |
| Support Reference | Support Reference ID | సహాయక రిఫరెన్స్ సంఖ్య | Customer support dispute |

---

## 4. Prohibited Languages Audit

- Scanned all source files in `src/`, `api/`, `public/`:
  - Zero references to Hindi locale `hi` or Hindi translations in runtime code.
  - No auto-translated Hindi fallback routes exist.
  - Conforms 100% with FR-9.
