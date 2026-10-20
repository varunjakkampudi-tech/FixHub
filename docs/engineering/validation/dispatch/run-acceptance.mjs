// Isolated planning proof; no app server, existing DB, external dependency or install.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { access, mkdtemp, readFile, writeFile, unlink } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
assert.ok(args.length === 2 || (args.length === 3 && ['--simulate-interrupt', '--simulate-interrupt-during-race'].includes(args[2])), 'Usage: node run-acceptance.mjs --pg-bin <existing PostgreSQL bin directory> [--simulate-interrupt|--simulate-interrupt-during-race]');
assert.equal(args[0], '--pg-bin');
const bin = path.resolve(args[1]);
const suffix = process.platform === 'win32' ? '.exe' : '';
const executable = name => path.join(bin, name + suffix);
for (const name of ['initdb', 'pg_ctl', 'psql']) await access(executable(name));
const root = await mkdtemp(path.join(os.tmpdir(), 'fixhub24-synthetic-proof-'));
const data = path.join(root, 'cluster');
const passwordFile = path.join(root, 'bootstrap-password');
const log = path.join(root, 'postgres.log');
const password = randomBytes(32).toString('hex');
const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('PG')));
environment.PGPASSWORD = password;
environment.PGOPTIONS = '-c statement_timeout=12000 -c lock_timeout=10000';
const probe = net.createServer();
await new Promise((resolve, reject) => probe.once('error', reject).listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
const sanitize = value => String(value).replaceAll(password, '[REDACTED]').replaceAll(root, '[TEMP]');
const cases = [];
let started = false;
let cleanedUp = false;
let interrupted = false;
let summary;
const children = new Set();
function interrupt() {
  if (interrupted) return;
  interrupted = true;
  for (const child of children) child.kill();
}
function throwIfInterrupted() { if (interrupted) throw new Error('Proof interrupted; shutting down its isolated cluster'); }
process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);

function run(name, arguments_, input = '', extraEnvironment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable(name), arguments_, { windowsHide: true, env: { ...environment, ...extraEnvironment }, stdio: ['pipe', 'pipe', 'pipe'] });
    children.add(child);
    let stdout = '', stderr = '';
    let settled = false;
    const timeout = setTimeout(() => { child.kill(); }, 25000);
    const finish = code => {
      if (settled) return;
      settled = true;
      children.delete(child);
      clearTimeout(timeout);
      child.stdout.destroy();
      child.stderr.destroy();
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    };
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => { settled = true; children.delete(child); clearTimeout(timeout); reject(error); });
    child.once('close', finish);
    // Windows pg_ctl descendants can retain inherited pipe handles after its exit.
    // Drain buffered output briefly, then detach the pipes; do not await server exit.
    if (name === 'pg_ctl') child.once('exit', code => { setTimeout(() => finish(code), 100); });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
async function checked(name, arguments_, input = '', extraEnvironment = {}) {
  throwIfInterrupted();
  const output = await run(name, arguments_, input, extraEnvironment);
  assert.equal(output.code, 0, sanitize(`${name}: ${output.stderr}\n${output.stdout}`));
  return output.stdout;
}
const connection = ['-X', '--no-password', '-h', '127.0.0.1', '-p', String(port), '-U', 'fixhub24_proof', '-d', 'postgres', '-qAt', '-v', 'ON_ERROR_STOP=1'];
const sql = (text, application = 'proof_case') => checked('psql', connection, text, { PGAPPNAME: application });
const accept = (actor, request = 1, key = `k${actor}`, merchant = actor, generation = 1, application) =>
  sql(`SELECT accept_offer(${actor},${request},${merchant},${generation},'${key}');`, application);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// Attach rejection handlers immediately, including while observer SQL is running.
const settle = promise => promise.then(value => ({ value }), error => ({ error }));
function unwrap(outcome) { if (outcome.error) throw outcome.error; return outcome.value; }
async function waitFor(query, predicate, label) {
  const deadline = Date.now() + 6000;
  do {
    throwIfInterrupted();
    if (predicate(await sql(query))) return;
    await delay(30);
  } while (Date.now() < deadline);
  throw new Error(`Timed out observing ${label}; case is NOT proven`);
}
async function heldLock(statement, body, name = 'proof_holder') {
  const holder = settle(sql(`BEGIN; ${statement}; SELECT pg_sleep(3); COMMIT;`, name));
  // Observe the actual live SQL backend after the lock statement, not just a timer.
  try {
    await waitFor(`SELECT count(*) FROM pg_stat_activity WHERE application_name='${name}' AND wait_event='PgSleep';`, value => value === '1', 'held lock');
    await body();
  } finally { unwrap(await holder); }
}
async function observed(promise, query, predicate, label) {
  const outcome = settle(promise);
  try {
    await waitFor(query, predicate, label);
    if (args[2] === '--simulate-interrupt-during-race' && !interrupted) process.emit('SIGTERM');
    return unwrap(await outcome);
  } finally { await outcome; } // Join even if observation or interruption fails.
}
const reset = () => sql(`TRUNCATE outbox,result,assignment,offer,request,resource,member;
  INSERT INTO member SELECT i,i,true FROM generate_series(1,12) i;
  INSERT INTO resource VALUES(1,1,0);
  INSERT INTO request SELECT i,1,'searching',1 FROM generate_series(1,4) i;
  INSERT INTO offer SELECT r.id,m.merchant,1,1,clock_timestamp()+interval '60 seconds',true FROM request r CROSS JOIN member m;`);
const invariant = () => sql(`SELECT (SELECT count(*) FROM assignment)||':'||(SELECT reserved FROM resource WHERE id=1)||':'||(SELECT count(*) FROM outbox);`);
async function test(name, body) {
  throwIfInterrupted();
  await reset();
  await body();
  cases.push({ name, status: 'PASS' });
  console.log(`PASS ${name}`);
}
let failure;
try {
  await writeFile(passwordFile, password, { mode: 0o600, flag: 'wx' });
  await checked('initdb', ['-D', data, '-U', 'fixhub24_proof', '--auth=scram-sha-256', '--pwfile', passwordFile, '--no-locale', '-E', 'UTF8']);
  await unlink(passwordFile);
  await checked('pg_ctl', ['-D', data, '-l', log, '-o', `-h 127.0.0.1 -p ${port} -c max_connections=30`, '-w', '-t', '15', 'start']);
  started = true;
  if (args[2] === '--simulate-interrupt') { process.emit('SIGTERM'); throwIfInterrupted(); }
  const schema = await readFile(new URL('./acceptance.sql', import.meta.url), 'utf8');
  await sql(schema);
  const version = await sql('SHOW server_version;');
  console.log(`PostgreSQL ${version}; synthetic isolated loopback cluster`);
  await test('overlapping same-request sessions commit exactly one winner', async () => {
    let results;
    await heldLock('SELECT id FROM request WHERE id=1 FOR UPDATE', async () => {
      const contenders = Promise.all(Array.from({ length: 12 }, (_, i) => accept(i + 1, 1, `race${i}`, i + 1, 1, 'proof_contender')));
      results = await observed(contenders, "SELECT count(*) FROM pg_stat_activity WHERE application_name='proof_contender' AND wait_event_type='Lock';", value => Number(value) >= 2, 'overlapping blocked sessions');
    });
    assert.equal(results.filter(value => value.startsWith('WIN:')).length, 1);
    assert.equal(results.filter(value => value === 'CONFLICT').length, 11);
    assert.equal(await invariant(), '1:1:1');
  });
  await test('different requests sharing one technician resource cannot oversell', async () => {
    let results;
    await heldLock('SELECT id FROM resource WHERE id=1 FOR UPDATE', async () => {
      const contenders = Promise.all([accept(1, 1, 'capacity1', 1, 1, 'proof_shared_resource'), accept(2, 2, 'capacity2', 2, 1, 'proof_shared_resource')]);
      results = await observed(contenders, "SELECT count(*) FROM pg_stat_activity WHERE application_name='proof_shared_resource' AND wait_event_type='Lock';", value => value === '2', 'both shared-resource contenders blocked');
    });
    assert.equal(results.filter(value => value.startsWith('WIN:')).length, 1);
    assert.equal(results.filter(value => value === 'CAPACITY').length, 1);
    assert.equal(await invariant(), '1:1:1');
  });
  await test('same actor/key retry returns saved receipt without extra writes', async () => {
    const receipt = await accept(1);
    assert.equal(await accept(1), receipt);
    assert.equal(await invariant(), '1:1:1');
    assert.equal(await sql('SELECT count(*) FROM result;'), '1');
  });
  await test('same key with different payload is rejected', async () => {
    await accept(1);
    assert.equal(await accept(1, 2), 'KEY_REUSE');
    assert.equal(await invariant(), '1:1:1');
  });
  await test('concurrent same-key different-request payloads serialize', async () => {
    let receipts;
    await heldLock("SELECT pg_advisory_xact_lock(hashtextextended('1:shared',0))", async () => {
      const contenders = Promise.all([accept(1, 1, 'shared', 1, 1, 'proof_shared_key'), accept(1, 2, 'shared', 1, 1, 'proof_shared_key')]);
      receipts = await observed(contenders, "SELECT count(*) FROM pg_stat_activity WHERE application_name='proof_shared_key' AND wait_event_type='Lock';", value => value === '2', 'both same-key contenders blocked');
    });
    assert.equal(receipts.filter(value => value.startsWith('WIN:')).length, 1);
    assert.equal(receipts.filter(value => value === 'KEY_REUSE').length, 1);
    assert.equal(await invariant(), '1:1:1');
  });
  await test('wrong merchant tenant is denied', async () => {
    assert.equal(await accept(1, 1, 'wrong', 2), 'DENIED');
    assert.equal(await invariant(), '0:0:0');
  });
  await test('revoked membership before acceptance denies mutation', async () => {
    await sql('UPDATE member SET active=false WHERE actor=1;');
    assert.equal(await accept(1), 'DENIED');
    assert.equal(await invariant(), '0:0:0');
  });
  await test('stale generation cannot win', async () => {
    await sql('UPDATE request SET generation=2 WHERE id=1;');
    assert.equal(await accept(1), 'STALE');
    assert.equal(await invariant(), '0:0:0');
  });
  await test('expired or invalidated offers cannot win', async () => {
    await sql("UPDATE offer SET expires_at='2000-01-01Z' WHERE request_id=1 AND merchant=1; UPDATE offer SET eligible=false WHERE request_id=1 AND merchant=2;");
    assert.equal(await accept(1), 'EXPIRED');
    assert.equal(await accept(2), 'INELIGIBLE');
    assert.equal(await invariant(), '0:0:0');
  });
  await test('expiry is rechecked after observed capacity lock wait', async () => {
    await heldLock('SELECT id FROM resource WHERE id=1 FOR UPDATE', async () => {
      await sql("UPDATE offer SET expires_at=clock_timestamp()+interval '500 milliseconds' WHERE request_id=1 AND merchant=1;");
      const contender = accept(1, 1, 'expiry', 1, 1, 'proof_expiry');
      assert.equal(await observed(contender, "SELECT count(*) FROM pg_stat_activity WHERE application_name='proof_expiry' AND wait_event_type='Lock';", value => value === '1', 'capacity-waiting contender'), 'EXPIRED');
    });
    assert.equal(await invariant(), '0:0:0');
  });
  await test('cancellation holding request lock prevents late acceptance', async () => {
    await heldLock("UPDATE request SET state='cancelled',version=version+1 WHERE id=1", async () => {
      assert.equal(await accept(1), 'CONFLICT');
    });
    assert.equal(await invariant(), '0:0:0');
  });
  await test('precommit transaction error rolls back all four effect groups', async () => {
    const result = await run('psql', connection, "BEGIN; SELECT accept_offer(1,1,1,1,'rollback'); SELECT 1/0; COMMIT;");
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /division by zero/);
    assert.equal(await invariant(), '0:0:0');
    assert.equal(await sql("SELECT state||':'||version FROM request WHERE id=1;"), 'searching:1');
    assert.equal(await sql('SELECT count(*) FROM result;'), '0');
  });
  await test('discarded committed response reconciles to one saved result', async () => {
    await accept(1, 1, 'lost'); // Intentionally discard the committed receipt.
    assert.equal(await accept(1, 1, 'lost'), 'WIN:1:1');
    assert.equal(await invariant(), '1:1:1');
  });
  const runner = await readFile(fileURLToPath(import.meta.url));
  summary = { kind: 'bounded-synthetic-postgresql-proof', version, cases, passed: cases.length, failed: 0, skipped: 0,
    schemaSha256: createHash('sha256').update(schema).digest('hex'), runnerSha256: createHash('sha256').update(runner).digest('hex'),
    limitations: ['not production code or authentication proof', '12 contenders, not a load test', 'no scheduled interval-capacity proof', 'no process-kill or host-crash recovery', 'no PostGIS, provider, RLS or deployment proof'] };
} catch (error) {
  failure = error;
  console.error(sanitize(error.stack ?? error));
  process.exitCode = 1;
} finally {
  // Stop only the freshly initialized cluster; no recursive deletion or existing service access.
  const stop = await run('pg_ctl', ['-D', data, '-m', 'fast', '-w', '-t', '15', 'stop']);
  if (stop.code === 0) cleanedUp = true;
  else if (started) { failure ??= new Error('Isolated cluster shutdown failed'); console.error('FAIL isolated cluster shutdown; inspect retained local artifacts'); process.exitCode = 1; }
  await unlink(passwordFile).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await writeFile(path.join(root, 'run-status.json'), JSON.stringify({ passed: cases.length, failed: failure ? 1 : 0, clusterStopped: cleanedUp, initialized: started }, null, 2));
  if (summary) {
    summary.failed = failure ? 1 : 0;
    summary.clusterStopped = cleanedUp;
    await writeFile(path.join(root, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));
  }
  process.off('SIGINT', interrupt);
  process.off('SIGTERM', interrupt);
  console.log(`Artifacts retained outside repository; cluster stopped: ${cleanedUp}.`);
}
