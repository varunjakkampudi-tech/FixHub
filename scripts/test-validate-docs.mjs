import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'fixhub-doc-validator-'));
const fixtureRoot = path.join(tempRoot, 'repo');

async function createFixture() {
  await rm(fixtureRoot, { recursive: true, force: true });
  await cp(sourceRoot, fixtureRoot, {
    recursive: true,
    filter(source) {
      const relative = path.relative(sourceRoot, source);
      if (!relative) return true;
      return !relative.split(path.sep).some(part =>
        ['.git', '.migration-backup', 'node_modules', 'coverage', 'dist', 'build'].includes(part),
      );
    },
  });
}

function runValidator() {
  return spawnSync(process.execPath, ['scripts/validate-docs.mjs'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  });
}

async function expectFailure(name, mutate, expectedMessage) {
  await createFixture();
  await mutate();
  const result = runValidator();
  assert.notEqual(result.status, 0, `${name}: validator unexpectedly passed`);
  assert.match(result.stderr, expectedMessage, `${name}: expected diagnostic was missing`);
  console.log(`PASS ${name}`);
}

try {
  await createFixture();
  const baseline = runValidator();
  assert.equal(baseline.status, 0, `baseline fixture failed:\n${baseline.stdout}\n${baseline.stderr}`);
  console.log('PASS valid documentation baseline');

  await expectFailure('missing ID removed from source and index', async () => {
    const requirementPath = path.join(fixtureRoot, 'docs/product/requirements/functional.md');
    const requirementText = await readFile(requirementPath, 'utf8');
    await writeFile(requirementPath, requirementText.replace(/^\| FR-C-001 \|.*\r?\n/m, ''), 'utf8');
    const indexPath = path.join(fixtureRoot, 'docs/README.md');
    const indexText = await readFile(indexPath, 'utf8');
    await writeFile(indexPath, indexText.replace('`FR-C-001`, ', ''), 'utf8');
  }, /FR-C-001 is missing/);

  await expectFailure('missing NFR ID removed from source and index', async () => {
    const requirementPath = path.join(fixtureRoot, 'docs/product/requirements/non-functional.md');
    const requirementText = await readFile(requirementPath, 'utf8');
    await writeFile(requirementPath, requirementText.replace(/^\| NFR-SEC-001 \|.*\r?\n/m, ''), 'utf8');
    const indexPath = path.join(fixtureRoot, 'docs/README.md');
    const indexText = await readFile(indexPath, 'utf8');
    await writeFile(indexPath, indexText.replace('`NFR-SEC-001`, ', ''), 'utf8');
  }, /NFR-SEC-001 is missing/);

  await expectFailure('source FR omitted from index', async () => {
    const indexPath = path.join(fixtureRoot, 'docs/README.md');
    const indexText = await readFile(indexPath, 'utf8');
    await writeFile(indexPath, indexText.replace('`FR-C-001`, ', ''), 'utf8');
  }, /FR-C-001 from functional requirements is not listed/);

  await expectFailure('source NFR omitted from index', async () => {
    const indexPath = path.join(fixtureRoot, 'docs/README.md');
    const indexText = await readFile(indexPath, 'utf8');
    await writeFile(indexPath, indexText.replace('`NFR-PERF-001`', ''), 'utf8');
  }, /NFR-PERF-001 from non-functional requirements is not listed/);

  await expectFailure('inventory ID missing from source', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/functional.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace(/^\| FR-C-001 \|.*\r?\n/m, ''), 'utf8');
  }, /required identifier FR-C-001 is missing/);

  await expectFailure('source ID missing from reviewed inventory', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/functional.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, `${text}\nUnreviewed inventory expansion: FR-C-009\n`, 'utf8');
  }, /unexpected identifier FR-C-009/);

  await expectFailure('duplicate inventory identifier', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/id-inventory.json');
    const inventory = JSON.parse(await readFile(file, 'utf8'));
    inventory.functional.push('FR-C-001');
    await writeFile(file, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  }, /functional IDs must be strings and unique/);

  await expectFailure('inventory cannot silently shrink with source and index', async () => {
    const inventoryPath = path.join(fixtureRoot, 'docs/product/requirements/id-inventory.json');
    const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
    inventory.functional = inventory.functional.filter(id => id !== 'FR-C-001');
    await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
    const requirementsPath = path.join(fixtureRoot, 'docs/product/requirements/functional.md');
    const requirements = await readFile(requirementsPath, 'utf8');
    await writeFile(requirementsPath, requirements.replace(/^\| FR-C-001 \|.*\r?\n/m, ''), 'utf8');
    const indexPath = path.join(fixtureRoot, 'docs/README.md');
    const index = await readFile(indexPath, 'utf8');
    await writeFile(indexPath, index.replace('`FR-C-001`, ', ''), 'utf8');
  }, /expected 27 functional IDs; found 26/);

  await expectFailure('NFR inventory cannot silently shrink with source and index', async () => {
    const inventoryPath = path.join(fixtureRoot, 'docs/product/requirements/id-inventory.json');
    const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
    inventory.nonFunctional = inventory.nonFunctional.filter(id => id !== 'NFR-SEC-001');
    await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
    const requirementsPath = path.join(fixtureRoot, 'docs/product/requirements/non-functional.md');
    const requirements = await readFile(requirementsPath, 'utf8');
    await writeFile(requirementsPath, requirements.replace(/^\| NFR-SEC-001 \|.*\r?\n/m, ''), 'utf8');
    const indexPath = path.join(fixtureRoot, 'docs/README.md');
    const index = await readFile(indexPath, 'utf8');
    await writeFile(indexPath, index.replace('`NFR-SEC-001`, ', ''), 'utf8');
  }, /expected 14 non-functional IDs; found 13/);

  await createFixture();
  const expansionInventoryPath = path.join(fixtureRoot, 'docs/product/requirements/id-inventory.json');
  const expansionInventory = JSON.parse(await readFile(expansionInventoryPath, 'utf8'));
  expansionInventory.functional.push('FR-C-009');
  await writeFile(expansionInventoryPath, `${JSON.stringify(expansionInventory, null, 2)}\n`, 'utf8');
  const expansionRequirementsPath = path.join(fixtureRoot, 'docs/product/requirements/functional.md');
  const expansionRequirements = await readFile(expansionRequirementsPath, 'utf8');
  await writeFile(expansionRequirementsPath, `${expansionRequirements}\nFR-C-009: Coordinated baseline-expansion fixture.\n`, 'utf8');
  const expansionIndexPath = path.join(fixtureRoot, 'docs/README.md');
  const expansionIndex = await readFile(expansionIndexPath, 'utf8');
  await writeFile(expansionIndexPath, `${expansionIndex}\nReviewed expansion fixture: \`FR-C-009\`.\n`, 'utf8');
  const expansionValidatorPath = path.join(fixtureRoot, 'scripts/validate-docs.mjs');
  const expansionValidator = await readFile(expansionValidatorPath, 'utf8');
  assert.match(expansionValidator, /label === 'functional' \? 27 : 14/);
  await writeFile(expansionValidatorPath, expansionValidator.replace("label === 'functional' ? 27 : 14", "label === 'functional' ? 28 : 14"), 'utf8');
  // A reviewed expansion must also update the conceptual matrix and exact
  // artifact scope, rather than silently orphaning the additional ID.
  const expansionMatrixPath = path.join(fixtureRoot, 'docs/blueprint/traceability-matrix.md');
  const expansionMatrix = await readFile(expansionMatrixPath, 'utf8');
  const expansionRow = expansionMatrix.match(/^\| FR-C-001 \|.*$/m)?.[0];
  assert.ok(expansionRow, 'expansion fixture requires an existing traceability row');
  const expandedMatrix = `${expansionMatrix}\n${expansionRow.replace('FR-C-001', 'FR-C-009')}\n`;
  await writeFile(expansionMatrixPath, expandedMatrix, 'utf8');
  const expansionScopePath = path.join(fixtureRoot, 'docs/governance/phase-00-approval-scope.json');
  const expansionScope = JSON.parse(await readFile(expansionScopePath, 'utf8'));
  expansionScope.conceptualBlueprints.find(entry => entry.document === 'docs/blueprint/traceability-matrix.md').sha256 =
    createHash('sha256').update(expandedMatrix, 'utf8').digest('hex').toUpperCase();
  await writeFile(expansionScopePath, `${JSON.stringify(expansionScope, null, 2)}\n`, 'utf8');
  const expansionResult = runValidator();
  assert.equal(expansionResult.status, 0, `reviewed inventory expansion fixture failed:\n${expansionResult.stdout}\n${expansionResult.stderr}`);
  assert.match(expansionResult.stdout, /28 functional and 14 non-functional IDs/);
  console.log('PASS coordinated reviewed requirement-inventory expansion');

  await expectFailure('malformed inventory identifier', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/id-inventory.json');
    const inventory = JSON.parse(await readFile(file, 'utf8'));
    inventory.functional[0] = 'FR-BOGUS-001';
    await writeFile(file, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  }, /malformed functional identifier FR-BOGUS-001/);

  await expectFailure('malformed NFR inventory identifier', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/id-inventory.json');
    const inventory = JSON.parse(await readFile(file, 'utf8'));
    inventory.nonFunctional[0] = 'NFR-BOGUS-001';
    await writeFile(file, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  }, /malformed non-functional identifier NFR-BOGUS-001/);

  await expectFailure('duplicate NFR inventory identifier', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/id-inventory.json');
    const inventory = JSON.parse(await readFile(file, 'utf8'));
    inventory.nonFunctional.push('NFR-SEC-001');
    await writeFile(file, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  }, /non-functional IDs must be strings and unique/);

  await expectFailure('broken reference-style link', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[missing target][validator-ref]\n\n[validator-ref]: absent-target.md\n`, 'utf8');
  }, /broken local link absent-target\.md/);

  await expectFailure('undefined explicit reference link', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[documentation][missing-definition]\n`, 'utf8');
  }, /undefined Markdown reference \[documentation\]\[missing-definition\]/);

  await expectFailure('undefined collapsed reference link', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[missing-definition][]\n`, 'utf8');
  }, /undefined Markdown reference \[missing-definition\]\[missing-definition\]/);

  await expectFailure('reference link cannot traverse outside repository', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[escape][outside-target]\n\n[outside-target]: ../outside.md\n`, 'utf8');
  }, /local link escapes repository root \.\.\/outside\.md/);

  await expectFailure('missing destination fragment', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[missing heading](docs/README.md#not-a-heading)\n`, 'utf8');
  }, /missing heading docs\/README\.md#not-a-heading/);

  await expectFailure('query-only destination still validates its fragment', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[query fragment](?view=compact#not-a-heading)\n`, 'utf8');
  }, /missing heading #not-a-heading/);

  await expectFailure('backtick-fenced headings cannot satisfy fragments', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[fenced heading](#fenced-only)\n\n\`\`\`md\n# fenced-only\n\`\`\`\`\n`, 'utf8');
  }, /missing heading #fenced-only/);

  await expectFailure('tilde-fenced headings cannot satisfy fragments', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[tilde heading](#tilde-only)\n\n~~~md\n# tilde-only\n~~~~\n`, 'utf8');
  }, /missing heading #tilde-only/);

  await createFixture();
  const targetReadme = path.join(fixtureRoot, 'docs/README.md');
  const targetReadmeText = await readFile(targetReadme, 'utf8');
  await writeFile(targetReadme, `${targetReadmeText}\n# Repeated heading\n\n# Repeated heading\n`);
  const duplicateHeadingReadme = path.join(fixtureRoot, 'README.md');
  const duplicateHeadingText = await readFile(duplicateHeadingReadme, 'utf8');
  await writeFile(duplicateHeadingReadme, `${duplicateHeadingText}\n[second repeated heading](docs/README.md#repeated-heading-1)\n`, 'utf8');
  const duplicateHeadingResult = runValidator();
  assert.equal(duplicateHeadingResult.status, 0, `duplicate heading anchor fixture failed:\n${duplicateHeadingResult.stdout}\n${duplicateHeadingResult.stderr}`);
  console.log('PASS duplicate ATX heading anchor suffix');

  await expectFailure('unclosed tilde fence is reported', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n~~~md\n# still code\n`, 'utf8');
  }, /unclosed fenced code block/);

  await expectFailure('malformed percent encoding is reported as validation failure', async () => {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[malformed encoding](bad%ZZ.md)\n`, 'utf8');
  }, /invalid percent-encoding in local link bad%ZZ\.md/);

  await createFixture();
  await writeFile(path.join(fixtureRoot, 'target (draft).md'), '# Parenthesized target\n', 'utf8');
  await writeFile(path.join(fixtureRoot, 'file_(draft).md'), '# Nested destination target\n', 'utf8');
  const referenceReadme = path.join(fixtureRoot, 'README.md');
  const referenceText = await readFile(referenceReadme, 'utf8');
  await writeFile(referenceReadme, `${referenceText}\n[reference target][validator-ref]\n[validator-ref][]\n[ordinary bracketed text]\n[inline target](<target (draft).md#parenthesized-target>)\n[unbracketed nested path](file_(draft).md)\n\n[validator-ref]:\n  target%20(draft).md\n  "title"\n`, 'utf8');
  const markdownResult = runValidator();
  assert.equal(markdownResult.status, 0, `reference and parenthesized link fixture failed:\n${markdownResult.stdout}\n${markdownResult.stderr}`);
  console.log('PASS reference-style and parenthesized local links');

  await expectFailure('unexpected malformed ID', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/functional.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, `${text}\nMalformed identifier fixture: FR-CC-001\n`, 'utf8');
  }, /unexpected identifier FR-CC-001/);

  await expectFailure('unexpected malformed NFR ID', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/non-functional.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, `${text}\nMalformed identifier fixture: NFR-SEC-1000\n`, 'utf8');
  }, /unexpected identifier NFR-SEC-1000/);

  await expectFailure('duplicate requirement ID', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/functional.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, `${text}\nDuplicate identifier fixture: FR-C-001\n`, 'utf8');
  }, /duplicate identifier FR-C-001/);

  await expectFailure('duplicate NFR identifier', async () => {
    const file = path.join(fixtureRoot, 'docs/product/requirements/non-functional.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, `${text}\nDuplicate identifier fixture: NFR-REL-001\n`, 'utf8');
  }, /duplicate identifier NFR-REL-001/);

  await expectFailure('duplicate index entry', async () => {
    const file = path.join(fixtureRoot, 'docs/README.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace('`FR-C-001`', '`FR-C-001`, `FR-C-001`'), 'utf8');
  }, /FR-C-001 appears 2 times/);

  await expectFailure('duplicate NFR index entry', async () => {
    const file = path.join(fixtureRoot, 'docs/README.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace('`NFR-SEC-001`', '`NFR-SEC-001`, `NFR-SEC-001`'), 'utf8');
  }, /NFR-SEC-001 appears 2 times/);

  await expectFailure('missing required architecture document', async () => {
    await rm(path.join(fixtureRoot, 'docs/architecture/system-context.md'));
  }, /required document missing or empty docs\/architecture\/system-context\.md/);

  await expectFailure('missing required phase dossier', async () => {
    await rm(path.join(fixtureRoot, 'docs/phases/phase-19.md'));
  }, /required document missing or empty docs\/phases\/phase-19\.md/);

  await expectFailure('missing phase dossier section', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-12.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace('## Testing requirements', '## Removed test section'));
  }, /phase section missing or duplicate.*Testing requirements/);

  await expectFailure('duplicate mandatory flow heading', async () => {
    const file = path.join(fixtureRoot, 'docs/flows/flow-04-atomic-acceptance.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, `${text}\n# FLOW 04 — Duplicate\n`);
  }, /required flow heading missing or duplicate # FLOW 04/);

  await expectFailure('missing required Mermaid source', async () => {
    const file = path.join(fixtureRoot, 'docs/architecture/system-context.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace('```mermaid', '```text'));
  }, /expected 1 Mermaid diagrams.*system-context/);

  await expectFailure('unsupported Mermaid diagram declaration', async () => {
    const file = path.join(fixtureRoot, 'docs/architecture/system-context.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace('flowchart LR', 'unknownDiagram'));
  }, /unsupported or empty Mermaid diagram/);

  await expectFailure('missing customer journey stage', async () => {
    const file = path.join(fixtureRoot, 'docs/journeys/customer-journey.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace(/^\| CJ-24:.*\r?\n/m, ''));
  }, /customer journey stages missing, duplicate or out of order/);

  await expectFailure('missing blueprint traceability row', async () => {
    const file = path.join(fixtureRoot, 'docs/blueprint/traceability-matrix.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace(/^\| FR-C-001 \|.*\r?\n/m, ''));
  }, /blueprint traceability: required identifier FR-C-001 must have exactly one row/);

  await expectFailure('duplicate blueprint traceability row', async () => {
    const file = path.join(fixtureRoot, 'docs/blueprint/traceability-matrix.md');
    const text = await readFile(file, 'utf8');
    const row = text.match(/^\| FR-C-001 \|.*$/m)?.[0];
    assert.ok(row);
    await writeFile(file, `${text}\n${row}\n`);
  }, /blueprint traceability: required identifier FR-C-001 must have exactly one row/);

  await expectFailure('missing expanded DOD criterion', async () => {
    const file = path.join(fixtureRoot, 'docs/quality/definition-of-done.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, text.replace(/^- DOD-022:.*\r?\n/m, ''));
  }, /expected DOD-001 through DOD-022 exactly once in order/);

  await expectFailure('approved artifact scope detects content drift', async () => {
    const file = path.join(fixtureRoot, 'docs/architecture/system-context.md');
    const text = await readFile(file, 'utf8');
    await writeFile(file, `${text}\nUnrecorded scope amendment.\n`);
  }, /approval scope: artifact hash mismatch docs\/architecture\/system-context\.md/);

  await expectFailure('duplicate approval-scope entry cannot hide a missing artifact', async () => {
    const file = path.join(fixtureRoot, 'docs/governance/phase-00-approval-scope.json');
    const scope = JSON.parse(await readFile(file, 'utf8'));
    scope.conceptualBlueprints[1] = scope.conceptualBlueprints[0];
    await writeFile(file, `${JSON.stringify(scope, null, 2)}\n`);
  }, /exact conceptual document inventory missing, duplicate or unexpected/);

  await createFixture();
  await expectFailure('missing Phase01 deliverable', async () => {
    await rm(path.join(fixtureRoot, 'docs/phases/phase-01-execution/market/tanuku-market.md'));
  }, /missing or empty required document/);

  await expectFailure('Phase01 inventory deletion', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/execution-inventory.json'); const v = JSON.parse(await readFile(file, 'utf8')); v.requiredDocuments.pop(); await writeFile(file, JSON.stringify(v));
  }, /exact required document inventory/);

  await expectFailure('duplicate Phase01 criterion', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/execution-inventory.json'); const v = JSON.parse(await readFile(file, 'utf8')); v.criteria[1] = v.criteria[0]; await writeFile(file, JSON.stringify(v));
  }, /exact 14 unique ordered exit criteria/);

  await expectFailure('Phase01 status mismatch', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/definition-of-done.md'); const v = await readFile(file, 'utf8'); await writeFile(file, v.replace('| PASS |', '| CONDITIONAL |'));
  }, /Markdown\/JSON status mismatch/);

  await expectFailure('Phase01 completion inflation', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/execution-inventory.json'); const v = JSON.parse(await readFile(file, 'utf8')); v.counts.pass = 14; await writeFile(file, JSON.stringify(v));
  }, /evidenced count mismatch/);

  await expectFailure('Phase01 primary interviews cannot be fabricated', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/execution-inventory.json'); const v = JSON.parse(await readFile(file, 'utf8')); v.primaryResearch.customers = 30; await writeFile(file, JSON.stringify(v));
  }, /primary research baseline requires genuine/);

  await expectFailure('Phase02 cannot be silently authorized', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/execution-inventory.json'); const v = JSON.parse(await readFile(file, 'utf8')); v.phase02Authorized = true; await writeFile(file, JSON.stringify(v));
  }, /authority or provisional conclusion changed/);

  await expectFailure('Phase01 final report percentage consistency', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/final-feasibility-report.md'); const v = await readFile(file, 'utf8'); await writeFile(file, v.replace('64.3%', '100%'));
  }, /completion percentage mismatch/);

  await expectFailure('Phase01 evidence must resolve to approved inventory', async () => {
    const file = path.join(fixtureRoot, 'docs/phases/phase-01-execution/execution-inventory.json'); const v = JSON.parse(await readFile(file, 'utf8')); v.criteria[0].evidence = '../phase-01.md'; await writeFile(file, JSON.stringify(v));
  }, /missing criterion evidence/);

  await createFixture();
  const externalTarget = path.join(tempRoot, 'outside.md');
  await writeFile(externalTarget, '# Outside repository\n', 'utf8');
  try {
    await symlink(externalTarget, path.join(fixtureRoot, 'outside.md'), 'file');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      console.log(`SKIP symlink escape test (${error.code}; supported by hosted Linux CI)`);
    } else {
      throw error;
    }
  }
  if (await import('node:fs/promises').then(({ lstat }) => lstat(path.join(fixtureRoot, 'outside.md')).then(() => true, () => false))) {
    const readme = path.join(fixtureRoot, 'README.md');
    const text = await readFile(readme, 'utf8');
    await writeFile(readme, `${text}\n[external symlink fixture](outside.md)\n`, 'utf8');
    const result = runValidator();
    assert.notEqual(result.status, 0, 'symlink escape: validator unexpectedly passed');
    assert.match(result.stderr, /escapes repository root through a symlink/);
    console.log('PASS Markdown link symlink escape');
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
