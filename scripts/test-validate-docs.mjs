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

  await expectFailure('source NFR omitted from index', async () => {
    const indexPath = path.join(fixtureRoot, 'docs/README.md');
    const indexText = await readFile(indexPath, 'utf8');
    await writeFile(indexPath, indexText.replace('`NFR-PERF-001`', ''), 'utf8');
  }, /NFR-PERF-001 from non-functional requirements is not listed/);

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
