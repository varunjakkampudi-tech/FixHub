import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalRoot = await realpath(root);
const errors = [];
const markdown = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', '.migration-backup', 'node_modules', 'coverage', 'dist', 'build'].includes(entry.name)) continue;
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
    try {
      const realTarget = await realpath(resolved);
      if (!isWithinRoot(realTarget)) {
        errors.push(`${rel}: local link escapes repository root through a symlink ${raw}`);
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
for (const id of ['DEC-016', 'DEC-017', 'RISK-005', 'RISK-016']) {
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

if (errors.length) {
  console.error(`Documentation validation failed (${errors.length} issue(s)):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation validation passed: ${markdown.length} Markdown files; ${phases.length} roadmap phases; ${expectedFunctional.length} functional and ${expectedNonfunctional.length} non-functional IDs complete, unique, and indexed; roadmap checksum and single-release policy verified.`);
}
