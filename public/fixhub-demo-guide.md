# FixHub three-city demo guide and actual test report

This extends the existing FixHub preview. It is not a launch, verified marketplace, real authentication, payment system, geographic tracking service or backend authorization.

## Five-minute demo

1. Open `/demo`, reset sample fixtures, then select **SAMPLE Customer A**. Open **Sample addresses**. Choose **Eluru**, press **Load sample address**, use the **DEMO manual pin** control, confirm the SAMPLE address and save. Services show Eluru's electrical/plumbing/AC catalog and eligible SAMPLE Eluru Care. The pin is a coordinate-entry schematic, not a geographic map.
2. Choose **Bhimavaram** and accept the city-change warning. The service catalog switches to electrical/plumbing/appliance, with different SAMPLE supply. Its outskirts have no eligible providers. Electrical also deliberately has no eligible Bhimavaram merchant. Cities are planned/future demos, never publicly live markets.
3. Choose **Tanuku**, electrician, enter a SAMPLE problem, skip optional filename-only photos, load and confirm a sample address at the schedule step. Choose a future weekday and morning slot. Dates beyond 2026-10-20 avoid seeded staff conflicts. Review inspection ₹149 + labor ₹450 + estimated parts ₹200 + fee ₹0 − discount ₹0 = ₹799, with applicable taxes unconfigured and excluded. Submit once: the request awaits a merchant response; no merchant is assigned yet.
4. Open two tabs on the same origin, choosing **SAMPLE Merchant A** and **SAMPLE Merchant B**. Open the new DEMO ID. Both get their own offer and notification. Only locality appears before acceptance. A accepts; B sees closed and cannot record another acceptance. A assigns **SAMPLE Technician A**.
5. Technician: On the way → Arrived → Inspection. Change parts from ₹200 to ₹300 and submit/revise quote. Customer explicitly approves the fresh ₹899 quote in the confirmation dialog. Technician starts and completes; customer reads the completed approved ₹899 snapshot. Switch to **SAMPLE Super Admin** to edit Merchant A's coverage or suspend it with reason + confirmation, then inspect future eligibility in Dispatch; historical booking records remain unchanged. Add a category/service or disable a service for a city and inspect the public catalog. Leads filters cover city, merchant, category, lifecycle and date range.

## Fictional selectors — no credentials

Use Sign in or Demo switcher; **no passwords, real phone numbers or private details** are required. The openly fictional OTP UI uses `000000`; no message is sent.

| Selector | ID | Seed coverage |
|---|---|---|
| SAMPLE Customer A / B | sample-c1 / sample-c2 | Separate fictional customer requests and addresses |
| SAMPLE Merchant A — Spark & Flow | sample-m1 | Tanuku/Velpur; electrical, plumbing, AC |
| SAMPLE Merchant B — Home Care | sample-m2 | Tanuku/Undrajavaram; electrical, plumbing, appliance |
| SAMPLE Merchant C — Cooling Works | sample-m3 | Pending; Velpur/Undrajavaram; AC/appliance |
| SAMPLE Merchant 4 — Eluru Care | sample-m4 | Eluru Center; electrical/plumbing/AC |
| SAMPLE Merchant 5 — Bhimavaram Repairs | sample-m5 | Bhimavaram Center; plumbing/appliance |
| SAMPLE Merchant 6 | sample-m6 | Suspended Eluru example |
| SAMPLE Merchant 7 | sample-m7 | Offline Bhimavaram example |
| SAMPLE Merchant 8 | sample-m8 | Capacity-full Tanuku example |
| SAMPLE Technician A/B/C and 4–8 | sample-t1 through sample-t8 | Linked to corresponding merchants |
| SAMPLE Operations Agent | sample-ops | Demo leads/dispatch/support diagnostics; not owner-level location |
| SAMPLE Super Admin | sample-admin | Demo registry and control panel |

## Screens and implemented interactions

- Existing `/`, `/services`, `/search` and service detail leaves: prominent shared city selection, city-aware catalog, full estimate on detail, eligible SAMPLE merchant list. Homepage retains existing image/identity and follows selected city.
- `/customer/addresses`: multiple Home/Work/Other sample addresses, manual structured India fields, six-digit PIN validation, local landmark fixture search, deliberate GPS permission/errors, accuracy, manual coordinate entry, SAMPLE pin center, consent, save/select/edit/preferred/delete-confirm; addresses stale after 24 hours require reconfirmation.
- Existing `/customer/book/new`, `/details`, `/photos`, `/schedule`, `/review` under `/customer/book`: enabled service, problem, filename-only photos, confirmed address + schedule, itemized review, idempotent request submission.
- `/customer/bookings/$id`, `/demo/bookings/$id`, merchant inbox and technician jobs: canonical lifecycle, offer viewed, acceptance, decline, other acceptance closed, expiry, assignment, travel/arrival/inspection, quote review/revision, explicit approval/rejection, completion, cancellation/support/dispute. Exact location displayed only for customer, assigned team and demo owner; unassigned offers hide competitors' names and house coordinates.
- `/admin`, `/admin/dashboard`: fixture counts, approval queue count, lead lifecycle distribution and exceptions.
- `/admin/cities`, `/admin/cities/$id`, existing `/admin/locations` and `/admin/areas`: city/locality/area/service records, create/edit/pause/resume, radius settings, per-city enablement, reason/confirmation, validated references, guarded deletion, archive alternative and undo existing registry edits.
- `/admin/categories`, `/admin/services`: bilingual names/descriptions, stable IDs, create/edit/archive, guarded delete and per-city service activation. New services use one of four existing pricing/calculation categories; arbitrary new service pricing engines are not implemented.
- `/admin/merchants`, `/admin/merchants/$id`: search, city/category/status filters, capacity display, edit approval/rejection/suspension/offline, categories/services, cities/localities, hours, weekdays, blackouts, radius; offered/assigned leads linked to their details. Reasons and changes enter audit.
- `/admin/leads`, `/admin/leads/$id`, `/admin/bookings`: all demo requests, filters, schedule and estimate, owner location, per-merchant offer states, shared timeline and exception actions.
- `/admin/dispatch`: all merchants' readable eligibility/ineligibility reasons; shared lead actions include expiry/cancellation. No forced production dispatch or transaction guarantee.
- `/admin/users`, `/admin/customers`, `/admin/technicians`, `/admin/operations`: fictional lists/create/edit/deactivate/unavailable and illustrative role edits, with reason and audit; referenced active participants cannot change roles. Current admin cannot edit itself.
- `/admin/pricing`: city/service fee configuration, price source version, zero-default commission and fee, separate merchant earnings; historical snapshots unchanged. Taxes remain explicitly unconfigured; no tax-law claim.
- `/admin/notifications`: personal inbox and read state, timestamps and linked target.
- `/admin/support`: seeded/request-created support cases, open/resolved changes and lead links.
- `/admin/audit`: registry before/after history stored canonically, readable reasons/time/actor and booking event log.
- `/admin/analytics`: fixture-derived counts and lead status distribution, not live analytics.
- `/admin/settings`: explicit browser-local/Maps boundaries and reset/scenario access.
- `/demo`: persona selection, deterministic scenario reset, five price examples and this guide.

Remaining pre-existing advanced URLs are preserved, but shared route rendering does not establish completed specialized workflows. Dedicated verification-document review, calendars, robust reports/charts, real technician checklists/camera, full onboarding/staff management and all-route acceptance remain incomplete.

## Five default price examples (INR; SAMPLE assumptions only)

| Example | Inspection | Labor | Parts | Fee | Discount | Estimated subtotal before unconfigured taxes | Merchant gross / net |
|---|---:|---:|---:|---:|---:|---:|---:|
| Electrical | 149 | 450 | 200 | 0 | 0 | 799 | 799 / 799 |
| Plumbing | 149 | 350 | 150 | 0 | 0 | 649 | 649 / 649 |
| AC | 249 | 650 | 300 | 0 | 0 | 1,199 | 1,199 / 1,199 |
| Appliance | 199 | 550 | 250 | 0 | 0 | 999 | 999 / 999 |
| Plumbing discount hypothesis | 149 | 600 | 300 | 0 | 100 | 949 | 1,049 / 1,049 |

Default commission is zero. The last example's discount is a platform-funded hypothesis, not a merchant deduction or approved payment policy. Parts and tax uncertainty mean estimates are not fixed payable totals. New city pricing affects new quotes; old request estimates and approved quotes keep immutable snapshots. Merchant-specific historical catalog assumptions exist, but automatic provider-specific repricing and merchant-owned pricing CRUD are not complete.

## Persistence and privacy limitations

One versioned browser-local store holds fictional registry, addresses, merchants, personas, requests, quotes, notifications and audit. Session/persona and current customer draft are tab-scoped; draft survives navigation/reload and language switching. Same-origin tabs share store updates through storage events/BroadcastChannel; Web Locks serialize supported browser writes. Without Web Locks, concurrent tabs lack transactional guarantees. No cross-browser or cross-device delivery, external push, SMS/email, real authentication or server permissions.

UI privacy is only a simulation: all local storage is inspectable, so **do not enter real sensitive personal details**. Sample address changes/deletion don't mutate booking snapshots. Registry mutations preserve booking history; safe deletion rejects referenced entities. Pausing a merchant changes future matching, but operational actions can be blocked while suspended. All city centers, localities and coverage coordinates are labelled approximate fixtures, not verified geographic coverage.

## Actual QA — this addendum

| Check | Result |
|---|---|
| Full Vitest suite | PASS: 18 tests, 4 files |
| Added pure helpers | PASS: 8 tests for city activation, radius/verification/capacity/hours/blackouts, address validation/snapshots/privacy, stale location, registry CRUD, city price versions, viewed/closed acceptance |
| Chromium cross-role UI | PASS: Eluru sample address, EN/TE edit preservation, Bhimavaram catalog, Tanuku request ₹799, two merchant tabs, private offer display, acceptance and closed peer, assignment, technician status, fresh ₹899 quote approval, completion |
| Admin UI | PASS: suspension with reason + confirmation + readback; bilingual category creation + readback |
| Responsive EN/TE | PASS: 216 checks = 12 screens × 9 widths × 2 languages; no document overflow, exactly one H1 and labelled standard form fields |
| Screen sweep | Addresses, booking schedule/review, services, admin dashboard/cities/city detail/services/merchants/leads/dispatch/pricing |
| Widths | 320/360/390/430 mobile; 768/820 portrait tablet; 1024 landscape tablet; 1280/1440 desktop |
| Browser runtime | PASS: no page errors in successful E2E and sweep |
| Deliberate denied GPS | PASS: error and manual fallback |
| Latest automatic compilation | PASS: build OK inspected after code edits |
| Live Google Maps/Places/Geocoding | NOT TESTED, not configured or approved; no Google API requests |
| Every CRUD/error/undo state through UI | NOT TESTED; representative CRUD plus pure guards tested |
| All existing routes and all lifecycle widths | NOT TESTED this addendum; prior smoke evidence remains historical |
| Physical devices, screen reader, complete WCAG 2.2 AA, native Telugu editorial review | NOT TESTED |

No overall production/readiness percentage is claimed. Current automated layout denominator is exactly 12 screens, not the whole route inventory. Earlier QA describes the previous version and must not be interpreted as current all-screen acceptance.

## Google Maps setup — pending authorization, external costs

1. Owner explicitly approves billable Google Maps use and any server/backend work. Nothing has been provisioned here.
2. Create a Google Cloud project with billing; review current Google Maps pricing and establish budget alerts, per-API quotas and monitoring. Browser Maps rendering requests have separate usage from server calls.
3. Enable Maps JavaScript API for browser rendering. Use a dedicated API- and HTTP-referrer-restricted browser key allowing authorized HTTPS domains; native apps need separate restricted credentials.
4. Places API (New) and Geocoding use separate appropriately API-restricted server credentials, never exposed in JavaScript. Authenticate callers, bound requests, debounce/cancel search, cache only as provider terms allow, preserve attribution and autocomplete session tokens. No unauthenticated public Maps proxy.
5. Configure the supported Google Maps connector after authorization. Replace the disabled adapter with live async/callback Maps rendering, draggable pin confirmation and authenticated Places/reverse-geocoding. Map labels, coordinates and derived city must reconcile; GPS still requires accuracy-aware confirmation.
6. Validate Maps on an authorized deployed origin; agent sandbox Maps rendering/live calls are unsupported. **Google Maps behavior remains unverified; the owner must validate it on that authorized origin.** No public deployment is performed by this task.

## Next tasks / blockers

- Live map, drag/reverse-geocode, structured Places search: owner-approved billing, keys and separately authorized authenticated server support required.
- Native-device, screen-reader and native Telugu review: device/editorial access required.
- Full verification document workflow, technician checklists/camera and schedules, merchant-specific price editing, complete all-route CRUD/state accessibility: not completed in this iteration; no external authorization blocker, but need dedicated follow-up implementation and acceptance.
- UI charts/reports, detailed staff capacities and polygon editing (radius fixture only), provider profile CRUD and notification-failure scenario: not completed. Existing reset includes no supply, capacity, timeout, offline/status error, expiry and duplicate scenarios.