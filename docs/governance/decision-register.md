# Decision Register

## Document control

- Document ID: P00-DECISIONS
- Status: Working draft for owner review
- Status vocabulary: LOCKED = approved constraint; PROPOSED = recommendation; OPEN = unresolved; BLOCKED = cannot resolve without dependency.
- Naming is locked only as recorded in DEC-003; other brand, tool, and integration choices remain separate decisions.

| ID | Decision | Status | Rationale and alternatives | Dependencies / evidence | Owner | Risk | Resolve by |
|---|---|---|---|---|---|---|---|
| DEC-001 | Viswatra is the confirmed parent brand. | LOCKED | Explicit owner constraint. Alternative parent brand is out of scope. | Owner instruction. | Product owner | Low | Phase 00 |
| DEC-002 | “Viswatra A–Z Services” was the temporary planning identifier; it is now historical. | LOCKED | Preserves the original planning record and prevents it being mistaken for the current product name. | Superseded for current naming by DEC-003. | Product owner | Low | Resolved by DEC-003 |
| DEC-003 | Fix Hub is the commercial product name under parent company Viswatra. | LOCKED | Selected explicitly by the owner. Alternative naming exploration is not required for the current product-name decision. | Owner instruction; separate trademark/domain checks may still be required before external use. | Product owner | Medium | Recorded in Phase 00; external checks before launch |
| DEC-004 | Permanent logo. | OPEN | No logo may be generated, selected, approved, or implemented in Phase 00. | Approved name and brand strategy. | Product owner | High | Before UI implementation |
| DEC-005 | Colors, typography, visual identity, tagline, and domain. | OPEN | Brand identity is not finalized. | Brand brief, accessibility, market/legal review. | Product owner | High | Before UI implementation |
| DEC-006 | Lovable workflow. | OPEN | Proposed use is standalone design project, export source, then Codex integration. Lovable repository access/import/sync is not assumed. | Separate capability, permissions, export and license verification. | Product owner + engineering owner | High | Before Lovable initiation |
| DEC-007 | Lovable initiation gate. | LOCKED | Do not initiate Lovable until requirements, architecture, branding decisions, user journeys, and screen specifications receive explicit approval. | Owner approval record. | Product owner | High | Phase 00 exit |
| DEC-008 | Initial launch geography. | PROPOSED | Tanuku is the supplied initial market. | Demand, operations, legal, and provider evidence. | Product owner | Medium | Before launch planning |
| DEC-009 | One coordinated public production release. | LOCKED | Explicit product constraint. | Roadmap and release plan must map private gates. | Product owner | High | Phase 00 |
| DEC-010 | Free basic merchant registration/listing. | LOCKED | Explicit business rule. | Legal/business model review for later monetization. | Product owner | Medium | Phase 00 |
| DEC-011 | First valid backend-committed acceptance wins. | LOCKED | Explicit fairness rule. | Technical concurrency proof and failure policy. | Engineering owner | High | Before dispatch implementation |
| DEC-012 | Proposed backend baseline: Node/Fastify/TypeScript/PostgreSQL/PostGIS, outbox/workers. | PROPOSED | Coherent baseline, but requires feasibility, team, cost, and scale proof. Alternatives remain open. | Architecture review, spikes, cost and operational evidence. | Engineering owner | High | Architecture phase |
| DEC-013 | Proposed channels: WhatsApp, website, Android, iOS. | PROPOSED | Matches stated product objective. | Provider terms, staffing, platform approvals, budget, support model. | Product + engineering owner | High | Before build commitment |
| DEC-014 | App Store and Play Store publication is a mandatory product objective. | PROPOSED | Publication remains subject to platform approval and is not guaranteed. | Developer accounts, policy review, app review evidence. | Product owner | High | Release planning |
| DEC-015 | Payments, liability coverage, guarantees. | OPEN | No assumptions permitted. | Legal, finance, insurance, and business-model decisions. | Product owner | High | Before any related feature |
| DEC-016 | Fix Hub Master Execution Roadmap V4.1 is the proposed sequencing baseline, reconstructed from the complete owner-supplied inline specification; it supersedes historical V4 only if the owner confirms. | PROPOSED | The inline specification defines 20 phases and one coordinated public release. Historical `Viswatra_AZ_Services_Master_Execution_Roadmap_V4.md` was not present, inspected, imported, or checksum-verified; V4.1 is not represented as historical V4. | Owner review and explicit confirmation that V4.1 supersedes V4; historical source provenance remains unresolved. See [roadmap](../roadmap/master-roadmap.md) and [migration ledger](document-migration.md). | Product owner | High | Before roadmap traceability sign-off or Phase 01 |
| DEC-017 | License for the public repository and product documentation. | OPEN | No license has been selected or added. Public visibility is not a grant of an open-source license; do not add a license file until the owner chooses terms. | Owner's legal/IP choice; current repository has no detected license. | Product owner | High | Before inviting reuse or accepting external contributions |
