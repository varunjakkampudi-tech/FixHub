import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const markdown = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'coverage', 'dist', 'build'].includes(entry.name)) continue;
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

for (const [file, text] of contents) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const headings = new Set();
  for (const match of text.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) headings.add(anchor(match[1]));
  const definitions = new Map();
  for (const match of text.matchAll(/^\[([^\]]+)\]:\s*(\S+)/gm)) definitions.set(match[1].toLowerCase(), match[2]);
  const links = [...text.matchAll(/!??\[[^\]]*\]\(([^)]+)\)|^\[([^\]]+)\]:\s*(\S+)/gm)];
  for (const match of links) {
    const raw = (match[1] ?? match[3] ?? '').trim().replace(/^<|>$/g, '');
    if (!raw || /^(https?:|mailto:|tel:|data:)/i.test(raw)) continue;
    const [target, fragment] = raw.split('#', 2);
    if (!target) {
      if (fragment && !headings.has(decodeURIComponent(fragment))) errors.push(`${rel}: missing heading #${fragment}`);
      continue;
    }
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target.split('?')[0]));
    try {
      const targetStat = await stat(resolved);
      if (fragment && targetStat.isFile() && resolved.toLowerCase().endsWith('.md')) {
        const dest = contents.get(resolved) ?? await readFile(resolved, 'utf8');
        const destHeadings = new Set([...dest.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)].map(m => anchor(m[1])));
        if (!destHeadings.has(decodeURIComponent(fragment))) errors.push(`${rel}: missing heading ${target}#${fragment}`);
      }
    } catch {
      errors.push(`${rel}: broken local link ${raw}`);
    }
  }
  const openFences = (text.match(/^\s*```/gm) ?? []).length;
  if (openFences % 2) errors.push(`${rel}: unclosed fenced code block`);
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
const expectedFunctional = [
  ...['C', 'M'].flatMap(group => Array.from({ length: 8 }, (_, i) => `FR-${group}-${String(i + 1).padStart(3, '0')}`)),
  ...Array.from({ length: 6 }, (_, i) => `FR-A-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `FR-X-${String(i + 1).padStart(3, '0')}`),
];
const expectedNonfunctional = [
  ...Array.from({ length: 3 }, (_, i) => `NFR-SEC-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 2 }, (_, i) => `NFR-REL-${String(i + 1).padStart(3, '0')}`),
  ...['PERF', 'SCALE', 'OBS', 'BCP', 'EXT', 'OPS', 'COST'].map(area => `NFR-${area}-001`),
  ...Array.from({ length: 2 }, (_, i) => `NFR-UX-${String(i + 1).padStart(3, '0')}`),
];
for (const [label, source, expectedIds] of [
  ['functional', functional, expectedFunctional],
  ['non-functional', nonfunctional, expectedNonfunctional],
]) {
  const found = source.match(/\b(?:FR-[A-Z]-\d{3}|NFR-[A-Z]+-\d{3})\b/g) ?? [];
  const counts = new Map();
  for (const id of found) counts.set(id, (counts.get(id) ?? 0) + 1);
  const actual = new Set(found);
  for (const id of expectedIds) {
    if (!actual.has(id)) errors.push(`${label} requirements: required identifier ${id} is missing`);
    const indexCount = (index.match(new RegExp(`\\b${id}\\b`, 'g')) ?? []).length;
    if (indexCount === 0) errors.push(`index: required identifier ${id} from ${label} requirements is not listed`);
    if (indexCount > 1) errors.push(`index: required identifier ${id} appears ${indexCount} times`);
  }
  for (const id of actual) {
    if (!expectedIds.includes(id)) errors.push(`${label} requirements: unexpected identifier ${id}`);
    if (counts.get(id) > 1) errors.push(`${label} requirements: duplicate identifier ${id} appears ${counts.get(id)} times`);
  }
  if (actual.size !== expectedIds.length) errors.push(`${label} requirements: expected ${expectedIds.length} unique identifiers; found ${actual.size}`);
}

if (errors.length) {
  console.error(`Documentation validation failed (${errors.length} issue(s)):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation validation passed: ${markdown.length} Markdown files; ${phases.length} roadmap phases; 27 functional and 14 non-functional IDs complete, unique, and indexed; roadmap checksum and single-release policy verified.`);
}
