import assert from 'node:assert/strict';
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
