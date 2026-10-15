# Phase 05 brand and design-system proposal

2026-10-15. **DRAFT PREPARATION — OWNER BRAND APPROVAL PENDING; PRIOR PHASE EXITS BLOCKED.** Name Fix Hub and parent Viswatra remain owner-selected. No permanent logo, identity, colours, typography, domain or tagline is selected or approved. [Work authority](../../governance/phase-01-05-work-authorization.md) authorizes proposals, not acceptance. [Phase 05 dossier](../phase-05.md), [requirements](../phase-02-preparation/requirements-draft.md) and [behaviour draft](../phase-04-preparation/behaviour-specification.md) remain gated. No Phase 06 screens, product UI, Lovable or production implementation is created.

## Recommended direction and alternatives

Recommend **Connected work** as the direction to discuss: a calm, capable local-service identity with clear actions, visible uncertainty and equal English/Telugu legibility. Audience includes households arranging repairs, field technicians using small phones, business owners managing real capacity, and staff handling sensitive cases. Personality: practical, respectful, accountable and unhurried—not luxury theatre, guaranteed rescue or anonymous lead brokerage.

The vector study uses one junction and three paths to suggest coordinated responsibilities. It deliberately avoids a shield, tick, star rating, emergency cross or badge that could imply a service guarantee or blanket competence verification. This is an original locally authored geometric study, not a claim of trademark distinctiveness. A restrained F/H monoline wordmark-first alternative reduces icon dependence but may be less distinctive. Both need small-size, one-colour, recognizability and legal review; neither is a permanent logo. The product name is not reopened.

A warmer earth-tone direction was considered but not developed because it competes with caution/status colour and could reduce clear separation of action, warning and confirmation. The recommended palette spends its emphasis on actionable blue, not gradient decoration. Use lists and relevant grouping instead of repeated identical metric cards. Administrative density and field readability should differ in layout without becoming different brands. No premium aesthetic justifies hidden costs or unproven provider claims.

See [actual vector concept board](concept-board.svg), [rendered PNG](concept-board.png) and [asset provenance](asset-provenance.json). It is a design board, not an application screen. Typography in the board requests local Nirmala UI/Segoe UI fallback; the exact resolved font file/version is not pinned and this is NOT a rendering proof of the candidate font families. Candidate copy and Telugu shaping need fluent human review. No stock images, real merchants, customers, third-party icons or font binaries are included.

## Logo creative brief and owner decision

Keep the name readable independently of the mark; Viswatra endorsement must remain subordinate without claiming legal entity structure not established by evidence. Test proposed symbol beside English/Telugu navigation, at small icon size, monochrome, reverse and high zoom. Avoid imagery promising certified trades, universal category support or 24/7 availability. Do not use “verified” as the brand emblem. Owner should choose a direction, request revisions or reject both after legal and legibility review. Assets remain proposal-only and must not be installed into product headers, app icons or store listings.

Tagline is OPEN. Internal copy directions such as “Clear next steps for local service” are discussion prompts, not approved slogans or supported service claims. Domain is OPEN; do not buy/register or represent any candidate as owned. No trademark registration or clearance is claimed.

## Candidate token system

[Machine-readable candidates](design-tokens.json) are not approved CSS or installed theme. Six base colours: Ink `#17324D`, Action `#1558A6`, Calm `#0B635B`, Caution `#8C4A05`, Paper `#FFFFFF`, Mist `#F3F6F8`. Semantic text and boundary variants are separate tokens. Meaning never depends on colour alone. Do not use calm/success styling to imply that a merely listed provider is verified, available or assigned.

Light mode uses white work surfaces, low-noise background and strong ink. Dark mode is a feasibility palette with distinct surface/text/action pairs, not an inverted screenshot. Dark mode must be reviewed for focus, media, maps, shadows, banners and native chrome; no implementation/accessibility approval is inferred. Text-pair thresholds are 4.5:1, meaningful boundary/focus pair checks 3:1. Actual context, focus geometry, alpha overlays and disabled/hover/loading states need separate tests. Never round a failing ratio into a pass.

Spacing candidates: 0/4/8/12/16/24/32/48/64 CSS px; avoid arbitrary one-off gaps. Control radius 8, grouped-container radius 12, inline-status pill only where useful. Default border 1, emphasis 2, visible focus 3 with 2 px gap and surface halo. Elevation is absent in ordinary lists; overlays alone get restrained shadow. Hierarchy comes from alignment and meaningful sectioning rather than all-caps labels or decoration.

Compact/wide/expanded breakpoint candidates: 640/960/1280 CSS px, content maximum 1200. Break when content fails, not because a device name suggests it. Compact reading is single-column, short action labels and disclosed context; merchant/staff tables need an accessible details view rather than hiding critical columns. Sidebar/bottom-navigation choices remain screen-phase decisions. Do not create a screen map here or start Phase 06.

## Typography, localization and licence provenance

Candidate Latin: IBM Plex Sans (400/500/600); Telugu: Noto Sans Telugu. Body 16 px, supporting text 14 px only for non-critical material, scale 14/16/18/22/28/36/48. Latin line-height candidate 1.5, Telugu 1.65. Keep Telugu letter spacing normal, allow combining marks/line boxes and avoid forced all-caps/transliteration. Aim for readable short lines; English character counts do not transfer directly to Telugu. Test 200% text expansion, narrow reflow, long names/prices, plural/date/time differences and actual native text settings. Exact rendered metrics remain untested with candidate fonts.

| Source / checked 2026-10-15 | Evidence status | Implication and limitation |
|---|---|---|
| [IBM Plex Sans OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsans/OFL.txt) | VERIFIED published licence source | OFL 1.1 with reserved Plex name; preserve notices and restrictions if font files are later distributed. No font binary retrieved or approval implied |
| [Noto Sans Telugu OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstelugu/OFL.txt) | VERIFIED published licence source | OFL 1.1 source identifies Noto Project authors. Distribution requires applicable notice/licence handling; no font binary bundled |
| [IBM Plex Sans specimen](https://fonts.google.com/specimen/IBM+Plex+Sans) and [Noto Sans Telugu specimen](https://fonts.google.com/noto/specimen/Noto+Sans+Telugu) | PARTIAL | Pages resolve, but no readable specimen text retrieved; candidate-font/device shaping and actual package/version remain NOT VERIFIED |
| Locally authored vector board | VERIFIED local source and rendered artifact exist | No copied stock artwork; similarity/distinctiveness, ownership/registration strategy and legal clearance remain NOT VERIFIED |

Licence-source verification is not evidence of installing, shipping or testing a specific font file. Do not package fonts without preserving the applicable exact version, notices and hash. Local system fallback used to render this board is not redistributed font software and is not the chosen product typography.

## Accessibility and interaction principles

WCAG 2.2 AA is a proposed baseline, not an owner-approved or achieved certification. Official [text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) informed candidate arithmetic. Keyboard order follows content/action order; visible focus cannot be clipped or covered. Use semantic buttons/links/headings, accessible names, logical error associations and status announcements without stealing focus. Modals trap focus only while open, return it on close, and support a safe dismiss path unless an actually necessary confirmation requires otherwise.

Web touch-target candidate is 48 CSS px; native platform dp/pt, safe areas, keyboards and gestures require separate review. No claim equates CSS pixels with native units. Do not auto-submit on select changes or use colour/icon alone for dangerous states. Loading actions preserve the current label, expose busy state and prevent duplicate commands without implying completion. Respect reduced motion; 120/180 ms motion candidates collapse to zero nonessential motion. No urgency pulse, fake countdown, endless shimmer or misleading ETA.

Forms label purpose and required fields explicitly, keep text after validation errors and offer permission-denied/manual location alternatives. Place errors next to fields plus a navigable summary; never replace the whole form with a vague toast. Private uploads show pending/quarantined/accepted/rejected separately. Customer quote confirmation names exact scope/charges/version and cannot be visually framed as work already started. Cancellation actions communicate stage/policy limits, not invented fees or refund entitlements.

Verification indicators must state what was reviewed, relevant category/scope, currency/expiry and pending/suspended conditions. A generic “trusted/certified” shield is prohibited without substantiation. Assigned status appears only after backend commit. Searching says no provider assigned; delivery/read indicators never imitate acceptance. Use text plus shape/status cue; complaints/safety reports are not visually dismissed as routine success.

## Reusable component inventory candidates

All are specifications, not built components. Each needs keyboard/screen-reader, English/Telugu, narrow viewport, current/stale, permission-denied and error testing where relevant.

| Candidate family | Required variants and states | Important constraint |
|---|---|---|
| Action button / link | Primary, secondary, destructive; default/hover/focus/busy/disabled | Action labels describe real next effect; no colour-only danger |
| Text input / textarea | Empty/filled/invalid/read-only/disabled | Persistent label, preserved value, field-linked error and clear purpose |
| Select / combobox / filters | Keyboard search, loading/empty/error | Accessible option focus and no hidden automatic submission |
| Checkbox / consent control | Unchecked/checked/indeterminate/invalid | Purpose-specific unbundled consent; never preselected quote/account agreement |
| Language selector | English/Telugu, persisted preference | No loss of unsent input or cross-account consent from switching language |
| Location entry | Manual/permission-denied/ambiguous/confirmed | Precise address private; no false serviceability from location alone |
| Category / provider list | Available/unavailable/loading/empty | Honest scope, prices and verification status; no fabricated stock rating |
| Offer/action summary | Current/expired/lost/declined/pending response | Server generation/expiry; no optimistic winning state |
| Status timeline | Committed/current/stale/exception | Distinguish reported arrival/work from confirmation; accessible text sequence |
| Quote and consent summary | Current/revised/expired/declined/consented | Exact version and charges; consent separate from actual work start |
| Capacity / schedule editor | Requested/reserved/full/conflict | No confirmed slot from intent; shared technician constraints |
| Private upload | Selected/quarantined/accepted/rejected/removal pending | No public preview link or attachment sent to unapproved chat |
| Alert / offline strip | Informational/warning/error/security/stale | Clear recovery action and timestamp; no forced success on reconnect |
| Empty / loading / error panel | No supply/no results/unavailable/busy | Explain limits and next safe action, not fictional statistics |
| Modal / confirmation | Open/error/pending/confirmed/dismissed | Focus handling, precise consequence and no simulated customer consent |
| Table / list details | Compact/wide/sort/filter/pagination | Critical data available in accessible detail view, no hidden actions |
| Case queue / incident view | Assigned/pending/escalated/closed | Scope and evidence permissions; no unstaffed response-time promise |
| Role / permission editor | View/grant/revoke/pending/denied | No self-elevation or implied emergency override |
| Notification / toast | Queued/failed/relevant/stale/suppressed | A transport receipt is not a booking transition |
| Privacy request summary | Recorded/processing/held/completed/withdrawn | Receipt is not deletion; lawful hold and secure next steps |
| Inline status / verification label | Pending/limited/approved scope/suspended | Text, scope and date; no blanket competence guarantee |
| Navigation / breadcrumbs | Role-scoped/current/offline/deep-link denied | Public links never grant staff/tenant access; final screen hierarchy Phase 06 |

Iconography: original simple 20/24-unit monoline candidates, consistent optical weight and accessible labels. Use familiar function icons only where their meaning is clear; decorative symbols are hidden from screen readers, unlabeled icon-only controls need an accessible name. No third-party icon collection is selected or bundled. SVG must be sanitized and contain no external scripts/tracking. Normal lists favour direct text and clear dividers; cards group a meaningful object, not every sentence. Images are optional—not stock “verified technicians” or identifiable people without consent/rights.

## Domain and trademark review boundary

Read-only Verisign RDAP query for `fixhub.com` on 2026-10-15 returned a domain object with transfer-prohibited status. **Registered domain object VERIFIED; FixHub/owner ownership, availability to purchase, price and permission to use NOT VERIFIED.** The web-reading tool could not access the RDAP URL; the implementing agent read the official JSON endpoint and retained only domain/status facts, not registrant contacts. [Official endpoint](https://rdap.verisign.com/com/v1/domain/fixhub.com). Do not assume a registered domain belongs to this founder. Other domains are NOT VERIFIED; none was registered or purchased.

[IP India official search gateway](https://ipindia.gov.in/trade-marks-before-you-apply-search-existing-trademarks) was read. Identifying the gateway is not an executed clearance search. Exact/phonetic Fix Hub/FixHub, device marks, Viswatra endorsement and relevant goods/services classes need qualified current review; legal classification is not guessed here. No CAPTCHA bypass, paid search, registration or trademark professional contacted. **Conflict/registrability status NOT VERIFIED.** Existing public use and domain registration would not by themselves prove infringement or clearance. Preserve the owner-selected name while resolving this external obligation before public use commitments.

## Future handoff and approval packet

Owner review should cover direction A versus B, revised/rejected marks, light/dark direction, candidate fonts and actual bilingual rendering, component principles, accessibility baseline and accepted residuals. Record exact approved artifact revisions/hashes, scope/date and owner statement; do not infer approval from this work authorization or another AI's praise. DEC-004 and DEC-005 remain OPEN.

Future Phase 06 needs approved requirements, architecture, journeys, identity and actual screen specifications. Only after their approval may Phase 07 initiate a separately authorized standalone Lovable project; verify export/terms/source ownership and do not assume current-repository import or sync. Phase 08 must prove portability with real exported source and target-platform evidence. This design board creates none of those capabilities. No existing Lovable project was touched.

Design proposal status: **READY FOR OWNER APPROVAL of a direction, not Phase 05 COMPLETED or formally ready to exit**. Prior-phase gates, owner identity decisions, legal/domain review, actual candidate-font/native rendering and fluent bilingual/accessibility review remain open. Exit percentage is NOT MEASURABLE without a reviewed finite checklist. G1 is not passed, no new phase is closed, and overall product/engineering completion remains NOT MEASURABLE.

## Local quality checkpoint — 2026-10-15

Base local main `9e307f066d865a5126d0ef25e8919053d02b7d8b`; remote main remains `aff098c143e44199160ed8e31801b0df57628702`. Local design preparation was guided by the frontend-design skill's intentional hierarchy, restrained decoration and legible action/status language. That methodology does not grant brand approval or claim implemented accessibility.

Executed `node docs/phases/phase-05-preparation/validate-design.mjs --self-test`: **20 specified opaque colour pairs PASS, 7 negative mutations PASS and 3 contrast reference assertions PASS; 0 failures, 0 skips**. Comparisons use unrounded ratios; results are not a domain score or overall WCAG compliance. Existing bundled Sharp rendered the 1440×1200 concept board. The implementing agent viewed the final PNG, corrected one crowded status label and confirmed no visible clipping in the inspected board; candidate-font/native rendering and fluent Telugu review remain NOT ASSESSED.

A separate fresh-context native AI reviewer inspected the source/proposal, reran the token checks and found no unresolved material contradiction in the bounded scope. No SVG scripts or external image resources were identified. The reviewer did not refresh external licensing/domain evidence. This is neither human approval nor legal/security/accessibility certification. Standard documentation regressions: **53 PASS, 0 FAIL, 1 Windows symlink SKIP**. Hosted CI on unpublished candidates is NOT EXECUTED. A legal conflict search, owner decision, actual fonts/devices and assistive-technology review remain essential before permanent identity or phase exit.
