import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalRoot = await realpath(root);
const errors = [];
const markdown = [];

function isExcludedName(name) {
  const normalized = name.toLowerCase();
  return ['.git', '.recovery', 'node_modules', 'coverage', 'dist', 'build'].includes(normalized) || /^\..*-backup$/.test(normalized);
}

function isExcludedPath(candidate, base) {
  return path.relative(base, candidate).split(path.sep).some(isExcludedName);
}

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (isExcludedName(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) markdown.push(absolute);
  }
}

await walk(root);
const contents = new Map();
for (const file of markdown) contents.set(file, await readFile(file, 'utf8'));

function anchor(text) {
  return text.toLowerCase().trim().replace(/[`*_~]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
}

function headingAnchors(text) {
  const seen = new Map();
  const anchors = new Set();
  for (const match of text.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = anchor(match[1]);
    const count = seen.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    seen.set(base, count + 1);
  }
  return anchors;
}

function removeFencedCode(text) {
  let activeFence;
  const withoutFences = text.split(/(?<=\n)/).map(line => {
    const content = line.replace(/\r?\n$/, '');
    if (activeFence) {
      const closingFence = new RegExp(`^ {0,3}${activeFence.character}{${activeFence.length},}\\s*$`);
      if (closingFence.test(content)) activeFence = undefined;
      return line.replace(/[^\r\n]/g, ' ');
    }

    const openingFence = content.match(/^ {0,3}(`{3,}|~{3,})/);
    if (openingFence) {
      activeFence = { character: openingFence[1][0], length: openingFence[1].length };
      return line.replace(/[^\r\n]/g, ' ');
    }
    return line;
  }).join('');
  return { text: withoutFences, hasUnclosedFence: Boolean(activeFence) };
}

function markdownWithoutCode(text) {
  const { text: withoutFences } = removeFencedCode(text);
  return withoutFences.replace(/(`+)([\s\S]*?)\1/g, match => match.replace(/[^\r\n]/g, ' '));
}

function markdownLinks(text) {
  const source = markdownWithoutCode(text);
  const references = new Map();
  for (const match of source.matchAll(/^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/gm)) {
    references.set(match[1].trim().replace(/\s+/g, ' ').toLowerCase(), match[2] ?? match[3]);
  }

  const links = [];
  const undefinedReferences = [];
  const pattern = /!?\[([^\]]*)\](?:\(\s*(<[^>]+>|(?:\\.|[^()\s]|\([^()]*\))*)(?:\s+"[^"]*")?\s*\)|\[([^\]]*)\])?/g;
  for (const match of source.matchAll(pattern)) {
    if (match[2] !== undefined) {
      links.push(match[2].replace(/^<|>$/g, ''));
      continue;
    }
    if (match[3] !== undefined) {
      const reference = (match[3] || match[1]).trim().replace(/\s+/g, ' ').toLowerCase();
      if (references.has(reference)) links.push(references.get(reference));
      else undefinedReferences.push({ label: match[1], reference });
    }
  }
  return { links, undefinedReferences };
}

function isWithinRoot(candidate, base = canonicalRoot) {
  const relative = path.relative(base, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

for (const [file, text] of contents) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const { text: withoutFences, hasUnclosedFence } = removeFencedCode(text);
  const markdownText = withoutFences.replace(/(`+)([\s\S]*?)\1/g, match => match.replace(/[^\r\n]/g, ' '));
  const headings = headingAnchors(markdownText);
  const { links, undefinedReferences } = markdownLinks(text);
  for (const { label, reference } of undefinedReferences) {
    errors.push(`${rel}: undefined Markdown reference [${label}][${reference}]`);
  }
  for (const linkTarget of links) {
    const raw = linkTarget.trim();
    if (!raw || /^(https?:|mailto:|tel:|data:|\/\/)/i.test(raw)) continue;
    const [target, fragment] = raw.split('#', 2);
    if (!target || !target.split('?')[0]) {
      let decodedFragment;
      try {
        decodedFragment = decodeURIComponent(fragment);
      } catch {
        errors.push(`${rel}: invalid percent-encoding in local link ${raw}`);
        continue;
      }
      if (fragment && !headings.has(decodedFragment)) errors.push(`${rel}: missing heading #${fragment}`);
      continue;
    }
    let decodedTarget;
    let decodedFragment;
    try {
      decodedTarget = decodeURIComponent(target.split('?')[0]);
      decodedFragment = fragment ? decodeURIComponent(fragment) : '';
    } catch {
      errors.push(`${rel}: invalid percent-encoding in local link ${raw}`);
      continue;
    }
    const resolved = path.resolve(path.dirname(file), decodedTarget);
    if (!isWithinRoot(resolved, root)) {
      errors.push(`${rel}: local link escapes repository root ${raw}`);
      continue;
    }
    if (isExcludedPath(resolved, root)) {
      errors.push(`${rel}: local link targets excluded content ${raw}`);
      continue;
    }
    try {
      const realTarget = await realpath(resolved);
      if (!isWithinRoot(realTarget)) {
        errors.push(`${rel}: local link escapes repository root through a symlink ${raw}`);
        continue;
      }
      if (isExcludedPath(realTarget, canonicalRoot)) {
        errors.push(`${rel}: local link targets excluded content through a symlink ${raw}`);
        continue;
      }
      const targetStat = await stat(realTarget);
      if (fragment && targetStat.isFile() && resolved.toLowerCase().endsWith('.md')) {
        const dest = contents.get(realTarget) ?? await readFile(realTarget, 'utf8');
        const destHeadings = headingAnchors(markdownWithoutCode(dest));
        if (!destHeadings.has(decodedFragment)) errors.push(`${rel}: missing heading ${target}#${fragment}`);
      }
    } catch {
      errors.push(`${rel}: broken local link ${raw}`);
    }
  }
  if (hasUnclosedFence) errors.push(`${rel}: unclosed fenced code block`);
  // Focused regression guard for a reproduced GitHub Mermaid parse failure;
  // this is deliberately not presented as a complete Mermaid parser.
  for (const block of text.matchAll(/^```mermaid\r?\n([\s\S]*?)^```\s*$/gm)) {
    if (!/^sequenceDiagram\s*\r?\n/.test(block[1])) continue;
    for (const line of block[1].split(/\r?\n/)) {
      if (!/^\s*Note\b[^:]*:/i.test(line)) continue;
      const note = line.slice(line.indexOf(':') + 1).replace(/#(?:\d+|[A-Za-z]+);/g, '');
      if (note.includes(';')) errors.push(`${rel}: Mermaid sequence note contains unescaped semicolon; use #59;`);
    }
  }
}

const all = [...contents.values()].join('\n');
const roadmap = contents.get(path.join(root, 'docs', 'roadmap', 'master-roadmap.md')) ?? '';
const phases = [...roadmap.matchAll(/^### PHASE (\d{2})\b/gm)].map(m => m[1]);
const expected = Array.from({ length: 20 }, (_, i) => String(i).padStart(2, '0'));
if (JSON.stringify(phases) !== JSON.stringify(expected)) errors.push(`roadmap: expected phases 00-19 exactly once in order; found ${phases.join(', ')}`);
if (!/one complete coordinated public production release/i.test(roadmap)) errors.push('roadmap: single coordinated public production release policy missing');
const roadmapProvenancePath = path.join(root, 'docs', 'governance', 'roadmap-provenance.json');
try {
  const provenance = JSON.parse(await readFile(roadmapProvenancePath, 'utf8'));
  const currentHash = createHash('sha256').update(roadmap, 'utf8').digest('hex').toUpperCase();
  const expectedHash = provenance.currentRevision?.sha256?.toUpperCase();
  if (provenance.document !== 'docs/roadmap/master-roadmap.md') errors.push('roadmap provenance: document path does not match canonical roadmap');
  if (!expectedHash || currentHash !== expectedHash) errors.push(`roadmap provenance: current SHA-256 ${currentHash} does not match recorded ${expectedHash ?? 'missing checksum'}`);
  const currentRevisionRecorded = provenance.revisions?.some(revision =>
    revision.commit === provenance.currentRevision?.commit && revision.sha256?.toUpperCase() === expectedHash,
  );
  if (!currentRevisionRecorded) errors.push('roadmap provenance: current revision is missing from the immutable revision ledger');
} catch (error) {
  errors.push(`roadmap provenance: unable to validate checksum manifest (${error.message})`);
}
for (const id of ['DEC-016', 'DEC-017', 'DEC-018', 'RISK-005', 'RISK-016']) {
  if (!all.includes(id)) errors.push(`traceability: required identifier ${id} not found`);
}
const functional = contents.get(path.join(root, 'docs', 'product', 'requirements', 'functional.md')) ?? '';
const nonfunctional = contents.get(path.join(root, 'docs', 'product', 'requirements', 'non-functional.md')) ?? '';
const index = contents.get(path.join(root, 'docs', 'README.md')) ?? '';
let expectedFunctional = [];
let expectedNonfunctional = [];
try {
  const inventoryPath = path.join(root, 'docs', 'product', 'requirements', 'id-inventory.json');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  expectedFunctional = inventory.functional;
  expectedNonfunctional = inventory.nonFunctional;
  if (inventory.version !== 1 || !Array.isArray(expectedFunctional) || !Array.isArray(expectedNonfunctional)) {
    throw new Error('unsupported or malformed inventory schema');
  }
  for (const [label, ids] of [['functional', expectedFunctional], ['non-functional', expectedNonfunctional]]) {
    if (ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) {
      errors.push(`requirement inventory: ${label} IDs must be strings and unique`);
    }
    const expectedCount = label === 'functional' ? 27 : 14;
    if (ids.length !== expectedCount) {
      errors.push(`requirement inventory: expected ${expectedCount} ${label} IDs; found ${ids.length}`);
    }
    const validId = label === 'functional'
      ? /^FR-(?:C|M|A|X)-\d{3}$/
      : /^NFR-(?:SEC|REL|PERF|SCALE|UX|OBS|BCP|EXT|OPS|COST)-\d{3}$/;
    for (const id of ids) {
      if (typeof id === 'string' && !validId.test(id)) {
        errors.push(`requirement inventory: malformed ${label} identifier ${id}`);
      }
    }
  }
} catch (error) {
  expectedFunctional = [];
  expectedNonfunctional = [];
  errors.push(`requirement inventory: unable to load current baseline (${error.message})`);
}
const allExpectedRequirements = new Set([...expectedFunctional, ...expectedNonfunctional]);
const requirementTokens = text => text.match(/\b(?:FR|NFR)(?:[-_][A-Za-z0-9]+)+\b/g) ?? [];
for (const [label, source, expectedIds] of [
  ['functional', functional, expectedFunctional],
  ['non-functional', nonfunctional, expectedNonfunctional],
]) {
  const found = requirementTokens(source);
  const indexed = requirementTokens(index);
  const counts = new Map();
  for (const id of found) counts.set(id, (counts.get(id) ?? 0) + 1);
  const indexCounts = new Map();
  for (const id of indexed) indexCounts.set(id, (indexCounts.get(id) ?? 0) + 1);
  const actual = new Set(found);
  for (const id of expectedIds) {
    if (!actual.has(id)) errors.push(`${label} requirements: required identifier ${id} is missing`);
    const indexCount = indexCounts.get(id) ?? 0;
    if (indexCount === 0) errors.push(`index: required identifier ${id} from ${label} requirements is not listed`);
    if (indexCount > 1) errors.push(`index: required identifier ${id} appears ${indexCount} times`);
  }
  for (const id of actual) {
    if (!expectedIds.includes(id)) errors.push(`${label} requirements: unexpected identifier ${id}`);
    if (counts.get(id) > 1) errors.push(`${label} requirements: duplicate identifier ${id} appears ${counts.get(id)} times`);
  }
  for (const id of new Set(indexed)) {
    if (!allExpectedRequirements.has(id)) errors.push(`index: unexpected or malformed requirement identifier ${id}`);
  }
  if (actual.size !== expectedIds.length) errors.push(`${label} requirements: expected ${expectedIds.length} unique identifiers; found ${actual.size}`);
}

// Phase 00 conceptual scope is finite and owner-authorized; this is structural
// validation, not a Mermaid renderer, a full Markdown parser or product testing.
let blueprintDocumentCount = 0;
let diagramCount = 0;
try {
  const policy = JSON.parse(await readFile(path.join(root, 'docs/governance/blueprint-inventory.json'), 'utf8'));
  if (policy.version !== 1 || !Array.isArray(policy.requiredDocuments) ||
      policy.requiredDocuments.length !== 51 || new Set(policy.requiredDocuments).size !== 51) {
    throw new Error('expected 51 unique required blueprint documents');
  }
  const doc = relative => contents.get(path.join(root, ...relative.split('/'))) ?? '';
  for (const relative of policy.requiredDocuments) {
    if (!/^docs\/[A-Za-z0-9/-]+\.md$/.test(relative) || !isWithinRoot(path.resolve(root, relative), root)) {
      errors.push(`blueprint: unsafe required path ${relative}`);
      continue;
    }
    if (!doc(relative)) errors.push(`blueprint: required document missing or empty ${relative}`);
    else blueprintDocumentCount++;
  }
  const headingCount = (source, heading) => source.split(/\r?\n/).filter(line => line === `## ${heading}`).length;
  if (policy.phaseDocuments?.length !== 20 || policy.phaseHeadings?.length !== 25) {
    errors.push('blueprint: expected 20 phase dossiers with 25 required sections');
  }
  const workstreamNames = ['product-foundation', 'market-commercial-feasibility', 'product-requirements',
    'system-architecture', 'service-journeys', 'brand-design-system', 'interface-design',
    'lovable-implementation', 'source-portability', 'platform-setup', 'identity-access-security',
    'merchant-catalogue', 'dispatch-engine', 'service-lifecycle', 'messaging-notifications',
    'customer-merchant-clients', 'mobile-applications', 'assurance-operations',
    'private-pilot-store-approval', 'coordinated-public-release'];
  for (let i = 0; i < 20; i++) {
    const relative = `docs/roadmap/workstreams/${workstreamNames[i]}.md`;
    if (policy.phaseDocuments?.[i] !== relative) errors.push(`blueprint: phase dossier inventory mismatch ${relative}`);
    for (const heading of policy.phaseHeadings ?? []) {
      if (headingCount(doc(relative), heading) !== 1) errors.push(`blueprint: phase section missing or duplicate ${relative}: ${heading}`);
    }
  }
  for (let i = 0; i < 12; i++) {
    const relative = policy.flowDocuments?.[i];
    const expectedPrefix = `# FLOW ${String(i + 1).padStart(2, '0')} — `;
    if (!relative || doc(relative).split(/\r?\n/).filter(line => line.startsWith(expectedPrefix)).length !== 1) {
      errors.push(`blueprint: required flow heading missing or duplicate ${expectedPrefix}`);
    }
  }
  for (const heading of policy.stateHeadings ?? []) {
    if (headingCount(doc('docs/flows/state-machines.md'), heading) !== 1) errors.push(`blueprint: state heading missing or duplicate ${heading}`);
  }
  for (const [relative, expectedCount] of Object.entries(policy.diagramCounts ?? {})) {
    const source = doc(relative);
    const blocks = [...source.matchAll(/^```mermaid\r?\n([\s\S]*?)^```\s*$/gm)];
    if (blocks.length !== expectedCount) errors.push(`blueprint: expected ${expectedCount} Mermaid diagrams in ${relative}; found ${blocks.length}`);
    for (const block of blocks) {
      const diagram = block[1].trim();
      if (!/^(flowchart (?:LR|TB|TD|RL|BT)|sequenceDiagram|stateDiagram-v2|erDiagram)\r?\n/.test(diagram) ||
          diagram.split(/\r?\n/).length < 3) {
        errors.push(`blueprint: unsupported or empty Mermaid diagram in ${relative}`);
      }
      diagramCount++;
    }
  }
  for (const [role, prefix, expectedCount] of [['customer', 'CJ', 24], ['merchant', 'MJ', 30]]) {
    const source = doc(`docs/journeys/${role}-journey.md`);
    const stages = [...source.matchAll(/^\| (CJ|MJ)-(\d{2}):/gm)].map(match => `${match[1]}-${match[2]}`);
    const expectedStages = Array.from({ length: expectedCount }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);
    if (JSON.stringify(stages) !== JSON.stringify(expectedStages)) errors.push(`blueprint: ${role} journey stages missing, duplicate or out of order`);
  }
  const matrixRows = [...doc('docs/blueprint/traceability-matrix.md').matchAll(/^\| ((?:FR|NFR)-[A-Z]+-\d{3}) \|/gm)].map(match => match[1]);
  for (const id of allExpectedRequirements) {
    if (matrixRows.filter(value => value === id).length !== 1) errors.push(`blueprint traceability: required identifier ${id} must have exactly one row`);
  }
  for (const id of matrixRows) {
    if (!allExpectedRequirements.has(id)) errors.push(`blueprint traceability: unexpected identifier ${id}`);
  }
  const dod = doc('docs/quality/foundation-exit-criteria.md');
  const dodDefinitions = [...dod.matchAll(/^- (DOD-\d{3}):/gm)].map(match => match[1]);
  const expectedDOD = Array.from({ length: 22 }, (_, i) => `DOD-${String(i + 1).padStart(3, '0')}`);
  if (JSON.stringify(dodDefinitions) !== JSON.stringify(expectedDOD)) errors.push('blueprint: expected DOD-001 through DOD-022 exactly once in order');
  const approval = doc('docs/reviews/foundation-approval.md');
  const criteria = [...approval.matchAll(/^\| (DOD-\d{3}) \| (PASS|CONDITIONAL|FAIL|NOT APPLICABLE) \|/gm)];
  if (JSON.stringify(criteria.map(match => match[1])) !== JSON.stringify(expectedDOD) ||
      criteria.filter(match => match[2] === 'PASS').length !== 21 ||
      criteria.find(match => match[1] === 'DOD-016')?.[2] !== 'NOT APPLICABLE') {
    errors.push('blueprint: expected 21 evidenced criteria and only DOD-016 not applicable');
  }
  // Resolve discoverability using the same focused link extractor, without
  // following external links or reading outside the already scanned map.
  const reachable = new Set([path.join(root, 'README.md')]);
  const queue = [...reachable];
  for (const file of queue) {
    const source = contents.get(file);
    if (!source) continue;
    for (const raw of markdownLinks(source).links) {
      if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(raw)) continue;
      try {
        const target = decodeURIComponent(raw.split('#')[0].split('?')[0]);
        if (!target) continue;
        const resolved = path.resolve(path.dirname(file), target);
        if (contents.has(resolved) && !reachable.has(resolved)) { reachable.add(resolved); queue.push(resolved); }
      } catch { /* Main link validation reports malformed targets. */ }
    }
  }
  for (const relative of policy.requiredDocuments) {
    if (!reachable.has(path.join(root, ...relative.split('/')))) errors.push(`blueprint: orphaned document ${relative}`);
  }
  const scope = JSON.parse(await readFile(path.join(root, 'docs/governance/foundation-approval-scope.json'), 'utf8'));
  if (scope.version !== 1 || scope.initialFoundation?.length !== 9 || scope.conceptualBlueprints?.length !== 50) {
    errors.push('approval scope: expected nine original foundation records and 50 exact conceptual artifacts');
  }
  const expectedScopedDocuments = policy.requiredDocuments.filter(relative => relative !== 'docs/reviews/foundation-approval.md');
  const scopedDocuments = (scope.conceptualBlueprints ?? []).map(entry => entry.document);
  if (new Set(scopedDocuments).size !== scopedDocuments.length ||
      JSON.stringify([...scopedDocuments].sort()) !== JSON.stringify([...expectedScopedDocuments].sort())) {
    errors.push('approval scope: exact conceptual document inventory missing, duplicate or unexpected');
  }
  for (const entry of scope.conceptualBlueprints ?? []) {
    const source = doc(entry.document);
    const actualHash = createHash('sha256').update(source, 'utf8').digest('hex').toUpperCase();
    if (!source || actualHash !== entry.sha256) errors.push(`approval scope: artifact hash mismatch ${entry.document}`);
  }
  const governanceDefinitions = new Set();
  for (const register of ['docs/governance/decision-register.md', 'docs/governance/risk-register.md']) {
    for (const match of doc(register).matchAll(/^\| ((?:DEC|RISK)-\d{3}) \|/gm)) {
      if (governanceDefinitions.has(match[1])) errors.push(`traceability: duplicate governance definition ${match[1]}`);
      governanceDefinitions.add(match[1]);
    }
  }
  for (const id of new Set(all.match(/\b(?:DEC|RISK)-\d{3}\b/g) ?? [])) {
    if (!governanceDefinitions.has(id)) errors.push(`traceability: unresolved governance reference ${id}`);
  }
} catch (error) {
  errors.push(`blueprint: unable to validate approved scope (${error.message})`);
}

let phase01Summary = '';
try {
  const base = 'docs/product/feasibility/';
  const doc = relative => contents.get(path.join(root, ...relative.split('/'))) ?? '';
  const inventory = JSON.parse(await readFile(path.join(root, base, 'evidence-inventory.json'), 'utf8'));
  // Fixed owner-requested deliverables; intentional scope changes update this policy and tests.
  const requiredPhase01 = [
    'README.md',
    'exit-criteria.md',
    'evidence/assumptions-register.md',
    'evidence/blockers.md',
    'evidence/interview-register.md',
    'evidence/source-register.md',
    'feasibility-assessment.md',
    'finance/build-and-operating-costs.md',
    'finance/business-model-options.md',
    'finance/scenario-analysis.md',
    'finance/unit-economics.md',
    'finance/validation-budget.md',
    'integrations/android-feasibility.md',
    'integrations/app-store-readiness.md',
    'integrations/ios-feasibility.md',
    'integrations/whatsapp-feasibility.md',
    'research-authority.md',
    'legal/india-compliance-register.md',
    'legal/legal-counsel-questions.md',
    'legal/marketplace-liability.md',
    'legal/merchant-verification.md',
    'legal/privacy-and-data-map.md',
    'market/competitor-analysis.md',
    'market/service-category-opportunities.md',
    'market/tanuku-market.md',
    'operations/capacity-and-staffing.md',
    'operations/merchant-operations.md',
    'operations/support-and-disputes.md',
    'operations/verification-and-safety.md',
    'research/customer-consent-template.md',
    'research/customer-interview-guide.md',
    'research/customer-research-plan.md',
    'research/customer-results.md',
    'research/merchant-interview-guide.md',
    'research/merchant-research-plan.md',
    'research/merchant-results.md',
    'research/merchant-supply-model.md',
    'technical/architecture-feasibility.md',
    'technical/channel-integration-feasibility.md',
    'technical/dispatch-feasibility.md',
    'technical/experiments-register.md',
    'technical/hosting-capacity-cost.md',
  ].sort();
  const expectedIds = [1, 2, 5, 6, 7, 9, 10, 11, 12, 13].map(i => 'P01-DOD-' + String(i).padStart(3, '0'));
  const expectedDeferred = ['P01-DOD-008', 'P01-DOD-014'];
  if (inventory.version !== 1 || inventory.phase !== '01' || inventory.status !== 'IN PROGRESS' ||
      inventory.phase02Authorized !== false || inventory.overallViability !== 'NOT ASSESSED') {
    errors.push('phase01: authority or provisional conclusion changed without review');
  }
  if (JSON.stringify((inventory.deferredCriteria ?? []).map(entry => entry.id)) !== JSON.stringify(expectedDeferred) ||
      inventory.deferredCriteria?.[0]?.status !== 'DEFERRED' || inventory.deferredCriteria?.[1]?.status !== 'GOVERNANCE_GATE' ||
      inventory.criteriaPolicy?.ownerAmendment !== 'docs/reviews/phase-01-scope-amendment-2026-10-16.md' ||
      !doc('docs/reviews/phase-01-scope-amendment-2026-10-16.md')) {
    errors.push('phase01: deferred criteria or owner scope amendment missing');
  }
  if (JSON.stringify([...(inventory.requiredDocuments ?? [])].sort()) !== JSON.stringify(requiredPhase01)) {
    errors.push('phase01: exact required document inventory differs');
  }
  for (const relative of requiredPhase01) {
    if (!doc(base + relative)) errors.push('phase01: missing or empty required document ' + relative);
  }
  const rows = [...doc(base + 'exit-criteria.md').matchAll(/^\| (P01-DOD-\d{3})[^|]*\|[^|]*\|[^|]*\| (PASS|CONDITIONAL|FAIL|NOT ASSESSED) \|/gm)];
  if (JSON.stringify(rows.map(m => m[1])) !== JSON.stringify(expectedIds) ||
      JSON.stringify((inventory.criteria ?? []).map(e => e.id)) !== JSON.stringify(expectedIds)) {
    errors.push('phase01: expected exact 10 unique ordered exit criteria');
  }
  const counts = { pass: 0, conditional: 0, fail: 0, notAssessed: 0, total: 10 };
  const keys = { PASS: 'pass', CONDITIONAL: 'conditional', FAIL: 'fail', 'NOT ASSESSED': 'notAssessed' };
  for (const [i, entry] of (inventory.criteria ?? []).entries()) {
    if (!keys[entry.status]) { errors.push('phase01: invalid criterion status'); continue; }
    counts[keys[entry.status]]++;
    if (rows[i]?.[2] !== entry.status) errors.push('phase01: Markdown/JSON status mismatch ' + entry.id);
    if (!requiredPhase01.includes(entry.evidence) || !doc(base + entry.evidence)) errors.push('phase01: missing criterion evidence ' + entry.id);
  }
  if (Object.entries(counts).some(([k, v]) => inventory.counts?.[k] !== v)) errors.push('phase01: evidenced count mismatch');
  if (inventory.primaryResearch?.customers !== 0 || inventory.primaryResearch?.merchants !== 0) {
    errors.push('phase01: primary research baseline requires genuine reviewed evidence before changing');
  }
  if (inventory.criteriaPolicy?.priorCount !== 14 || inventory.criteriaPolicy?.activeCount !== 10 ||
      inventory.criteriaPolicy?.effectiveDate !== '2026-10-16' || !inventory.criteriaPolicy.historicalReview) {
    errors.push('phase01: owner-authorized criteria change lacks audit metadata');
  }
  const percentage = (100 * counts.pass / counts.total).toFixed(1) + '%';
  for (const relative of ['exit-criteria.md', 'feasibility-assessment.md']) {
    if (!doc(base + relative).includes(percentage)) errors.push('phase01: completion percentage mismatch ' + relative);
  }
  phase01Summary = '; ' + requiredPhase01.length + ' Phase01 assessment documents and 10 active exit criteria reconciled (' + percentage + ' scoped evidence coverage; Phase01 remains open)';
} catch (error) {
  errors.push('phase01: unable to validate execution evidence (' + error.message + ')');
}

if (errors.length) {
  console.error(`Documentation validation failed (${errors.length} issue(s)):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation validation passed: ${markdown.length} Markdown files; ${phases.length} roadmap phases; ${expectedFunctional.length} functional and ${expectedNonfunctional.length} non-functional IDs complete, unique, and indexed; roadmap checksum and single-release policy verified; ${blueprintDocumentCount} required blueprint documents, ${diagramCount} Mermaid sources and 21 applicable DOD criteria checked${phase01Summary}.`);
}
