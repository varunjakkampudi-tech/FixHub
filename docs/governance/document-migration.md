# Documentation migration record

## Scope and authority

- Workspace: local Windows desktop workspace (historical exact path intentionally omitted from current public documentation)
- Migration date: 2026-10-14
- Reference received: an attached text describing the proposed `viswatra-marketplace` documentation pack.
- The reference text described a packaged set of documents, but no packaged roadmap file is present in this workspace for provenance inspection. The nine-file mapping below is taken from the reference text itself.
- No Git repository existed in this workspace. The workspace `AGENTS.md` was added during migration. No destination collisions were found.

## Dry-run and applied mapping

| Source | Destination | Result |
|---|---|---|
| `phase-00/PRODUCT_CHARTER.md` | `docs/product/charter.md` | Moved |
| `phase-00/PRODUCT_SCOPE.md` | `docs/product/scope.md` | Moved |
| `phase-00/FUNCTIONAL_REQUIREMENTS.md` | `docs/product/requirements/functional.md` | Moved |
| `phase-00/NON_FUNCTIONAL_REQUIREMENTS.md` | `docs/product/requirements/non-functional.md` | Moved |
| `phase-00/ROLES_PERMISSIONS.md` | `docs/security/access-control.md` | Moved |
| `phase-00/DECISION_REGISTER.md` | `docs/governance/decision-register.md` | Moved |
| `phase-00/ASSUMPTIONS_RISKS.md` | `docs/governance/risk-register.md` | Moved |
| `phase-00/DEFINITION_OF_DONE.md` | `docs/quality/definition-of-done.md` | Moved |
| `phase-00/PHASE_00_REVIEW.md` | `docs/reviews/foundation-review.md` | Moved |

## Preservation and edits (migration-time record)

At the time of migration, all nine original files were copied to `.migration-backup/2026-10-14/phase-00-originals/` and their original SHA-256 hashes were checked against those copies. The migration records that their substantive content and FR, NFR, DEC, RISK, ASM, PERM, ROLE, and DOD identifiers were preserved.

The review document's inventory and DOD-001 are updated to describe the permanent domain-oriented locations. The roadmap status is explicitly pending owner confirmation: no authoritative V4 copy was available to inspect or import. The prior Phase 00 result remains CONDITIONAL; this migration does not approve Phase 00.

| Original | Destination | Original SHA-256 | Destination SHA-256 | Reconciliation |
|---|---|---|---|---|
| `PRODUCT_CHARTER.md` | `docs/product/charter.md` | `FD610C011D36B900A367467E5AC6DFAE34465E551E560100E2A70B627BD69095` | `FD610C011D36B900A367467E5AC6DFAE34465E551E560100E2A70B627BD69095` | Exact |
| `PRODUCT_SCOPE.md` | `docs/product/scope.md` | `61E154AF18B68B92DC9B642A611EE2AD467BCE05716D82A61CD865E62150A3B0` | `61E154AF18B68B92DC9B642A611EE2AD467BCE05716D82A61CD865E62150A3B0` | Exact |
| `FUNCTIONAL_REQUIREMENTS.md` | `docs/product/requirements/functional.md` | `86D758B7C5B9D2D952B6692CCC6888A7BA2BD38DA5FA926EF6B562AEC477F271` | `86D758B7C5B9D2D952B6692CCC6888A7BA2BD38DA5FA926EF6B562AEC477F271` | Exact |
| `NON_FUNCTIONAL_REQUIREMENTS.md` | `docs/product/requirements/non-functional.md` | `1194AED9DB483317B96E7FB8CA3C7B5D16A7C5C72A04EC0F3E8B9CC29237DE83` | `1194AED9DB483317B96E7FB8CA3C7B5D16A7C5C72A04EC0F3E8B9CC29237DE83` | Exact |
| `ROLES_PERMISSIONS.md` | `docs/security/access-control.md` | `D57D90C4E02B1C9E7B74A883D236CFE34CB5BBAA6BDD365CBD6ED62FCDB87DA4` | `D57D90C4E02B1C9E7B74A883D236CFE34CB5BBAA6BDD365CBD6ED62FCDB87DA4` | Exact |
| `DECISION_REGISTER.md` | `docs/governance/decision-register.md` | `DD5DDBA474152B2F416231A03F9AAFE756878C9343D47B3B5B5E2A2A70287AC5` | `53CF897835FBB886F74B102076962FF508C2F6F9BDC083C9E56A26E7991AEDA4` | Roadmap provenance wording updated; status normalized to allowed value; IDs preserved |
| `ASSUMPTIONS_RISKS.md` | `docs/governance/risk-register.md` | `CFD5BE8B01246A44766EE1DCC4915F6B69B2F0DE65A72B8B44961CF3FE415BD7` | `466D968CADD3CCE4712D39852A748C547F5E7734288ABB7A5EE2C27017DE4A06` | Roadmap provenance wording updated; IDs preserved |
| `DEFINITION_OF_DONE.md` | `docs/quality/definition-of-done.md` | `A7A2896F1E82A66A66DEE1370C764F38C1EF87DE20394AD505AF3FA0CA1B7157` | `AA589DEE8A05BB544926FAA1B0C5C168931E17C65957F2270E6BF0365D30A5BA` | DOD-001 location wording updated; IDs preserved |
| `PHASE_00_REVIEW.md` | `docs/reviews/foundation-review.md` | `533AB521941E46A8E42361822C09BB6EFFFE9923137AAFD4CC5B94F33331A636` | `D5DFB2FE24A596617BF63552E1E1A8006FD38A47D29804DFCBC240690B35B6FC` | Inventory, links, roadmap provenance, gate results, and owner decisions updated; IDs preserved |

## Roadmap provenance at original migration (historical snapshot)

At the original migration, the reference text stated that a V4 roadmap existed in a separate prepared package, but no roadmap source file was present for inspection. The then-current `docs/roadmap/master-roadmap.md` recorded an import blocker rather than roadmap content. This paragraph records that earlier state; see the 2026-10-14 V4.1 reconstruction amendment below for current status.

## Root guidance files at original migration (historical snapshot)

No generated `README.md`, `AGENTS.md`, or `docs/README.md` versions were supplied. The root README, workspace guidance, and docs index were created from the explicit constraints and the documentation present here. They contain no commercial name or brand approval.

## Reconciliation checklist

- Nine source documents mapped: complete.
- Destination collision check: complete; none found before moves.
- Original backup and initial SHA-256 verification: recorded complete at migration time; the backup directory is absent from the current workspace snapshot and cannot be revalidated here.
- Requirement, decision, risk, role, and DOD identifiers: preserved.
- Markdown link and cross-reference checks: passed for all documentation files; governance ID references resolve.
- Roadmap import and traceability: blocked at original migration until an authoritative V4 file was supplied (historical status; see the V4.1 reconstruction amendment below).
- `.migration-backup/` is excluded by the workspace `.gitignore`; the workspace currently has no Git repository, so Git ignore behavior has not been exercised.
- `phase-00/` removal: recorded as completed after migration-time destination/hash/link/identifier checks; the backup directory is not present in the current workspace snapshot (see owner naming amendment).

## Naming and tooling decisions at original migration (historical snapshot)

Viswatra is the confirmed parent brand. “A–Z Services” and `viswatra-marketplace` are placeholders. Product name, logo, color system, domain, and tagline remain OPEN. Lovable repository access/import is unverified; the standalone-to-export workflow remains a proposal and requires separate approval. Any existing Lovable project remains untouched.

## Owner naming decision amendment — 2026-10-14 (historical snapshot)

The owner subsequently selected **Fix Hub** as the product name under Viswatra. This amendment supersedes the earlier statement above that the commercial name was open. The original nine-file migration matrix and source hashes remain historical evidence and are not rewritten. Their active destination files were updated for current naming. At this review, `.migration-backup/` is absent from the workspace snapshot; prior backup existence was recorded, but current backup retention and original-byte revalidation cannot be confirmed. No replacement archive was reconstructed from edited files. `fixhub-platform` is recorded only as a recommended future repository identifier; the workspace directory and repository state were not renamed or initialized.

The requested import files, `CODEX_IMPORT_INSTRUCTIONS.md` and `Viswatra_AZ_Services_Master_Execution_Roadmap_V4.md`, were absent in this historical snapshot. No V4 content or original-roadmap checksum was available to preserve at that time. The import blocker was not resolved by later V4.1 reconstruction; see the amendment below. DEC-016 and RISK-005 remain unresolved pending owner decision/evidence.

Current SHA-256 values after the naming amendment and senior-review update:

| File | SHA-256 |
|---|---|
| `README.md` | `C0FF6E79E7F27E76C77DB56A7E00F33EC6D0C7B1A76A3E694C1870BCB5AE6A13` |
| `AGENTS.md` | `AEE52BCCEDBE754A3ADD23EC26C69076CBFCCC6AFA669E9742005508F8F8D287` |
| `docs/README.md` | `AF2D1E7755BF069114601CFCC96A0811C91214649F273256D51679F4CD55290D` |
| `docs/product/charter.md` | `48313F44AAA4F92673717DAAAF40A040A99EEBB4640A1922428A7BBD79514EB0` |
| `docs/product/scope.md` | `7356E3FB5844EAABAECCC68E516F5BC7B79E81D6E3523E3C9F66FFC5258311F3` |
| `docs/governance/decision-register.md` | `7F870BCD8C840E081EBF5FB96539556A22980C496B3283959A1F6D04C98DBAB2` |
| `docs/governance/risk-register.md` | `7284F759424EFCE6B9807AD8D62BC9F6697F97B6C54D9AC067DFA7963E805374` |
| `docs/reviews/foundation-review.md` | `E436AD9672F0205629C147F840C5436DDAEBA4545DCECA089E32EC9D43B59513` |

## Roadmap V4.1 reconstruction amendment — 2026-10-14

The owner supplied the complete roadmap specification inline in the Codex request titled “CODEX MASTER PROMPT — FIX HUB: Authoritative Roadmap Reconstruction, Documentation Reconciliation & Phase 00 Senior Audit.” The local historical V4 roadmap and the separately named `CODEX_IMPORT_INSTRUCTIONS.md` were not present in this workspace. Therefore this amendment records a **new V4.1 reconstruction**, not an import, inspection, comparison, or checksum verification of historical V4.

The canonical active roadmap is [`../roadmap/master-roadmap.md`](../roadmap/master-roadmap.md). It contains the specified Phase 00 through Phase 19 sequence and the single coordinated public production release rule. Its status is **PROPOSED — awaiting owner confirmation as superseding roadmap**. SHA-256 of the completed V4.1 file: `49FC8F6B35E1CF20740002DE125E67AE97B35D29FD48C42720CF9C9DAEC21763`.

### Roadmap checksum drift reconciliation

The hash above identifies the initial reconstructed V4.1 bytes at commit `da0661bfc709e9aba31e364c4459b7b129cf92e2`; it is not a mutable “current file” checksum. The roadmap was subsequently edited in `424dede7371cd7a3c592f3ace3bde91573e939d2`. Independent SHA-256 recomputation from each Git revision verified:

| Roadmap revision | Commit | SHA-256 |
|---|---|---|
| Initial reconstructed V4.1 | `da0661bfc709e9aba31e364c4459b7b129cf92e2` | `49FC8F6B35E1CF20740002DE125E67AE97B35D29FD48C42720CF9C9DAEC21763` |
| Roadmap after repository documentation edits | `424dede7371cd7a3c592f3ace3bde91573e939d2` | `089E73B14BA797FC1518B4ECE9C3852D20EADCEA360DCEC9BBEFA48A782D3E48` |

The machine-readable [roadmap provenance manifest](roadmap-provenance.json) records both immutable revisions. `scripts/validate-docs.mjs` recomputes the current file hash and fails CI if it differs from the manifest's current revision. A future intentional roadmap edit must add a new revision entry and update `currentRevision`; this does not authenticate the unavailable historical V4 source. A checksum and its manifest can be changed together in a branch, so authenticity depends on protected `main`, the required independent human approval, and retained Git history—not on the checksum alone.

### Validator follow-up from independent review

- **Requirement extensibility:** The current expected identifiers live in the reviewed [`id-inventory.json`](../product/requirements/id-inventory.json), rather than being embedded in validator code. Its expected category counts and accepted ID forms remain validator policy. Expanding or changing the 41-ID owner-review baseline requires a reviewed change to the inventory, validator policy, source requirements, documentation index, and regression coverage. This does not mark the requirements owner-approved.
- **Markdown coverage:** CI checks inline and reference-style links, including wrapped reference definitions/titles, explicit full and collapsed references, angle-bracket destinations, one-level parenthesized paths, local targets and ATX heading fragments; fenced/inline code is excluded. Undefined explicit references, path traversal, malformed percent-encoding, and symlink escapes are rejected; ordinary bracketed prose is not treated as an explicit reference. This remains a focused repository validator, not a complete CommonMark implementation; deeper nested destinations and other unimplemented constructs remain a known coverage boundary.
- **Provenance trust:** The manifest explicitly describes the limits of checksums. The independent review requirement is a governance control; the required approval is still outstanding for PR #1 and must not be represented as satisfied by this automated validator.

The earlier statements in this ledger that the import source remained absent are historical snapshots from before the inline specification was supplied. They remain as history and are superseded for current planning by this amendment. The historical V4 source/checksum remains unavailable. No recovery candidates were found anywhere inside this workspace; the historical backup folder is absent and no substitute backup was created. The nine historical source/destination hash pairs remain recorded historical evidence, not present-day proof of recoverable originals.

DEC-016 is updated to PROPOSED: V4.1 is a candidate sequencing baseline, pending owner confirmation. RISK-005 is OPEN: historical V4 provenance remains unresolved and proposed V4.1 must not govern later phases until confirmed. No owner confirmation or Phase 00 closure is implied.

## Public-repository audit remediation amendment — 2026-10-14

The owner subsequently supplied the public repository URL and requested repository remediation. The current checkout was verified clean on `main` at `da0661bfc709e9aba31e364c4459b7b129cf92e2`, tracking `origin/main` at `https://github.com/varunjakkampudi-tech/FixHub`. This repository is documentation-only; its existence does not mean Phase 09 or any application implementation has started. The root and docs indexes and this record were corrected to describe that current state. Earlier statements that no Git repository existed remain historical observations, not current status.

The earlier migration report records the exact local desktop path, and commit `da0661bfc709e9aba31e364c4459b7b129cf92e2` is public. The current file now omits the exact path, but editing it does not erase prior public commit content. The commit author email also uses a personal address. Future local commits are configured to use this account's GitHub noreply address; history will not be rewritten without separate owner authorization. This is a residual historical-disclosure risk, not a claim that the information was removed from GitHub history.

The owner-supplied independent audit reports prior creation of a Lovable project. That claim has not been independently checked in the Lovable account. No Lovable tool/project was opened or modified during this remediation; current documents no longer claim the project is unopened, and further Lovable activity remains unauthorized.

`SECURITY.md`, `CONTRIBUTING.md`, a dependency-free documentation validation script, a Dependabot GitHub Actions schedule, and a GitHub Actions documentation-check workflow were added. The workflow action is pinned to an immutable commit. Before changes, GitHub showed public visibility, `main` default branch, secret scanning and push protection enabled, no license, no branch protection/ruleset, vulnerability alerts and private vulnerability reporting disabled, Dependabot security updates disabled, and only the owner listed as collaborator. After remediation, vulnerability alerts, Dependabot security updates, and private vulnerability reporting were enabled. The workflow passed on commit `424dede7371cd7a3c592f3ace3bde91573e939d2` (run `38596389077`). `main` is now protected with strict `docs-validation`, one approving PR review, dismissal of stale approvals, conversation resolution, admin enforcement, and no force pushes/deletions. Because only the owner is listed as a collaborator, the review gate cannot currently be satisfied; adding an independent reviewer is an owner action.

The historical `.migration-backup/` directory and original source bytes remain missing; the prior nine hash pairs cannot be revalidated. The current public Git history is a recoverable snapshot of committed documents only and is not a substitute for the missing historical originals. No claim of historical backup recovery is made.

### New repository recovery baseline — 2026-10-14

A local Git bundle was created at `.migration-backup/recovery-baseline-2026-10-14/FixHub-01e33f5.bundle` for snapshot commit `01e33f5c8ae2aae793ef22437265f220b07bf6cf`. It contains only the named `main` and `docs/audit-settings-evidence` local/remote refs, and `git bundle verify` passed. Its SHA-256 is `A395A2C813D9EB3809D2E7C88659E95E00CD6F4CEAB2372CE3D9A81C0D5E67AE`; the ignored local `MANIFEST-01e33f5.txt` records scope and limitation. Earlier `b4794f1` and `349e672` checkpoints are also retained. `.migration-backup/` remains excluded by `.gitignore`. This is a new current repository recovery point only. It does not contain or replace the missing nine original files and does not verify historical V4.

All three retained bundles and their manifest SHA-256 values were rechecked on 2026-10-14; `git bundle verify` confirmed each bundle contains complete history for its recorded refs. A mirror clone of the `01e33f5` bundle was created under the OS temporary directory and passed `git fsck --full`, without changing this checkout or its refs. The temporary rehearsal clone remains in the OS temporary directory because cleanup was refused by the execution environment. All known bundles are on the same device, so they do not protect against device loss. A second encrypted, access-controlled organizational backup destination with a rehearsed restore is recommended; no destination has been selected and nothing was uploaded. The historical nine-document backup is still missing and is not recoverable from these Git snapshots.

## Post-merge governance amendment — 2026-10-14

PR #1 merged as `281e3d5551b3be070d26947129fcd84798b9d07b` at 18:09:53 UTC. Its tree exactly matches reviewed head `ffe01fae41f5ec1cda51b30521b1b2c0a63e5353`, and [post-merge CI](https://github.com/varunjakkampudi-tech/FixHub/actions/runs/38612820612) passed on that merge SHA, including all 33 hosted regressions. Earlier open-PR and pending-merge statements above are historical snapshots.

GitHub records zero submitted reviews. Pre-merge independent approval is not evidenced; retrospective review cannot supply that historical approval. Current branch-protection endpoints disagree about required reviews, and the dedicated endpoint reports stale-review dismissal disabled. The precise merge-enabling mechanism and settings-change history are undetermined. See the [post-merge review and owner decision record](../reviews/foundation-review.md#post-merge-governance-audit-and-owner-sign-off-preparation) for direct evidence, owner-side verification steps and proposed controls. No protection setting was changed by this audit.

The three retained bundles were reverified against their manifests and are still older same-device repository snapshots, not the final merge or missing historical source bytes. Historical V4 and the nine originals remain unavailable. Roadmap hashes, historical migration evidence and stable IDs are retained unchanged. Owner approval of V4.1, the foundation, requirements, risk dispositions and Phase 01 remains pending. The owner explicitly requested any documentation amendment directly on existing `main`, without a new branch or PR; this does not authorize changing protection settings or bypassing a rejected push.

## Delegated planning closure amendment — 2026-10-15

The owner's two final master prompts supersede the earlier pending-owner and direct-main delivery instructions. The unpublished audit commit `5da44a198009aa235e04ff482e1f9ab94740f825` is preserved intact in the single closure branch. Owner-delegated decisions approve governing V4.1 and the initial foundation/41-ID baseline, accept historical provenance/metadata/review exceptions, and retain temporary no-license posture and limited recovery strategy. Phase 00 scope now adds conceptual architecture, flows, five role journeys and 20 phase dossiers. Current approval/evidence and 21 applicable criteria are recorded in [owner approval](../reviews/phase-00-owner-approval.md), with [exact scope hashes](phase-00-approval-scope.json). Earlier observations remain history; historical recovery did not occur.

Approved roadmap bytes first occur at actual commit `96ea4d94cc44440918b36573d84e7ef77520bea3`, SHA-256 `6053CC821FC3697BE1038E5D1402B5690FF4620B4B02068C8DE0EAD82AB36919`. The next metadata/documentation commit records that SHA in the immutable revision ledger; no circular commit reference is invented. The initial `49FC8F6B35E1CF20740002DE125E67AE97B35D29FD48C42720CF9C9DAEC21763` and later `089E73B14BA797FC1518B4ECE9C3852D20EADCEA360DCEC9BBEFA48A782D3E48` hashes are preserved. The phase sequence and one-release policy are unchanged.

Delivery now uses one consolidated PR, actual hosted head checks and eligible independent approval. No protection setting is changed. Owner-delegated planning acceptance is not GitHub review, published repository closure, vendor authorization or Phase 01 permission. New conceptual files are versioned plans, not later-phase designs/tests/implementation.

Markdown and JSON use canonical LF through `.gitattributes` so Windows autocrlf checkouts do not silently alter approved roadmap/artifact bytes. This controls future checkout reproducibility without normalizing away hash mismatches or rewriting historical commits.

## Solo-maintainer transition amendment — 2026-10-15

The human owner's permanent-technical-ownership instruction supersedes the blanket independent-review delivery requirement for qualifying low-risk documentation. The [policy](solo-maintainer-policy.md) requires exact-head CI, a recorded adversarial AI audit and actual human OWNER SELF-REVIEW/merge accountability; sensitive work retains additional independent assurance before release. No GitHub setting or PR #1 history is changed. Policy adoption is recorded on the existing PR #2 branch; publication still awaits final owner review and normal merge. Any actually enforced review-rule adjustment requires separate authorization.

Two conceptual documents receive governance-reference updates only: the Phase 00 dossier and open-decision register. Their current hashes are updated in the approval-scope manifest; original `a44bd3d9908f40bd311da0eb04032f37ea28984c` bytes and manifest remain in retained Git history. The 41 requirements, 20 dossier sequence, 34 diagrams and approved roadmap bytes are unchanged.
