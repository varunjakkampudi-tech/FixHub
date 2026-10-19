# FixHub — Expected Browser Runtime Messages Register (CR-01 Gate)

**Project:** Fix Hub (Viswatra)  
**Standard:** `Viswatra-Global-Engineering-Quality-Standard-v1.1.md` (CR-01 & Category 30)  
**Scope:** Strict allowlist of permissible browser console and runtime messages during automated E2E and component testing.  
**Rule:** Any runtime console `error` or unhandled `warning` emitted during test execution that is NOT explicitly registered here causes immediate test failure.  

---

## 1. Permissible Runtime Message Register

| Source / Pattern | Level | Context | Justification |
|---|---|---|---|
| `[vite] connecting...` | `info` | Development / HMR client connection | Standard Vite dev server hydration notice |
| `[vite] connected.` | `info` | Development / HMR client connected | Standard Vite dev server confirmation |
| `Download the React DevTools...` | `info` | React DOM initialization | Standard development mode announcement |
| `FixHub bilingual catalog initialized: [en, te]` | `info` | Localization provider mount | Confirms bilingual language bundle ready |
| `503 Service Unavailable` | `warn` / `error` | Admin health probe negative test | Negative test intentionally exercising `/health/ready` probe failure |
| `Incorrect OTP entered` | `warn` | Security quarantine negative test | Negative test proving invalid OTP rejection in `security-quarantine-fr1.test.ts` |
| `No active OTP request found` | `warn` | Security quarantine negative test | Negative test proving unrequested phone verification failure |

---

## 2. Prohibited Runtime Patterns (Zero Tolerance)

The following patterns MUST NEVER appear in browser console logs:
- `UnhandledPromiseRejection`
- `Uncaught TypeError`
- `Warning: Each child in a list should have a unique "key" prop`
- `Warning: React does not recognize the %s prop on a DOM element`
- `Warning: Can't perform a React state update on an unmounted component`
- Any string containing plaintext passwords, raw tokens, or leaked JWT secrets (`fixhub-local-development-secret-key-min-32-chars-long`).
