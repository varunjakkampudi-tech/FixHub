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
assert.ok(args.length === 2 || (args.length === 3 && ['--simulate-interrupt', '--simulate-interrupt-during-race'].includes(args[2])), 'Usage: node run-scheduled.mjs --pg-bin <existing PostgreSQL bin directory> [--simulate-interrupt|--simulate-interrupt-during-race]');
assert.equal(args[0], '--pg-bin');
const bin = path.resolve(args[1]);
const suffix = process.platform === 'win32' ? '.exe' : '';
const executable = name => path.join(bin, name + suffix);
for (const name of ['initdb', 'pg_ctl', 'psql']) await access(executable(name));
const root = await mkdtemp(path.join(os.tmpdir(), 'fixhub24-scheduled-proof-'));
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
const reserve = (request, merchant = 1, unit = 1, start = '2026-10-20T08:00:00Z', end = '2026-10-20T09:00:00Z', key = `job${request}`, application) =>
  sql(`SELECT reserve_interval(${merchant},${request},${unit},'${key}','${start}','${end}');`, application);
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
const reset = () => sql('TRUNCATE schedule_outbox,reservation,capacity_unit; INSERT INTO capacity_unit VALUES(1),(2);');
const invariant = () => sql("SELECT (SELECT count(*) FROM reservation WHERE active)||':'||(SELECT count(*) FROM reservation)||':'||(SELECT count(*) FROM schedule_outbox);");
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
  const schema = await readFile(new URL('./scheduled.sql', import.meta.url), 'utf8');
  await sql(schema);
  const version = await sql('SHOW server_version;');
  console.log(`PostgreSQL ${version}; synthetic isolated loopback cluster`);

  await test('adjacent half-open intervals can share one unit', async () => {
    assert.equal(await reserve(1), 'RESERVED:1');
    assert.equal(await reserve(2,1,1,'2026-10-20T09:00:00Z','2026-10-20T10:00:00Z'), 'RESERVED:2');
    assert.equal(await invariant(), '2:2:2');
  });
  await test('observed concurrent overlaps across businesses yield one reservation', async () => {
    let receipts;
    await heldLock('SELECT id FROM capacity_unit WHERE id=1 FOR UPDATE', async () => {
      const contenders = Promise.all([reserve(1,1,1,undefined,undefined,'a','proof_shared_resource'),reserve(2,2,1,undefined,undefined,'b','proof_shared_resource')]);
      receipts = await observed(contenders,"SELECT count(*) FROM pg_stat_activity WHERE application_name='proof_shared_resource' AND wait_event_type='Lock';",v=>v==='2','both scheduled contenders blocked');
    });
    assert.equal(receipts.filter(v=>v.startsWith('RESERVED:')).length,1);
    assert.equal(receipts.filter(v=>v==='CAPACITY').length,1);
    assert.equal(await invariant(),'1:1:1');
  });
  await test('merchant aliases using the same physical unit cannot double book', async () => {
    await reserve(1,1);
    assert.equal(await reserve(2,2),'CAPACITY');
    assert.equal(await invariant(),'1:1:1');
  });
  await test('distinct physical units permit overlapping jobs', async () => {
    const receipts = await Promise.all([reserve(1,1,1),reserve(2,2,2)]);
    assert.deepEqual(receipts,['RESERVED:1','RESERVED:2']);
    assert.equal(await invariant(),'2:2:2');
  });
  await test('pre-expanded travel buffers cause overlap rejection', async () => {
    await reserve(1,1,1,'2026-10-20T07:45:00Z','2026-10-20T09:15:00Z');
    assert.equal(await reserve(2,1,1,'2026-10-20T09:00:00Z','2026-10-20T10:00:00Z'),'CAPACITY');
  });
  await test('empty reversed null or infinite windows reject', async () => {
    assert.equal(await reserve(1,1,1,'2026-10-20T08:00:00Z','2026-10-20T08:00:00Z'),'INVALID');
    assert.equal(await reserve(2,1,1,'2026-10-20T09:00:00Z','2026-10-20T08:00:00Z'),'INVALID');
    assert.equal(await reserve(3,1,1,'2026-10-20T08:00:00Z','infinity'),'INVALID');
    assert.equal(await sql("SELECT reserve_interval(1,4,1,'null',NULL,'2026-10-20T09:00:00Z');"),'INVALID');
    assert.equal(await invariant(),'0:0:0');
  });
  await test('repeat-safe release emits once and permits new reservation', async () => {
    await reserve(1);
    assert.equal(await sql('SELECT release_interval(1,1);'),'RELEASED:1');
    assert.equal(await sql('SELECT release_interval(1,1);'),'RELEASED:1');
    assert.equal(await invariant(),'0:1:2');
    assert.equal(await reserve(2,2),'RESERVED:2');
    assert.equal(await invariant(),'1:2:3');
  });
  await test('reservation and outbox roll back on transaction error', async () => {
    const r=await run('psql',connection,"BEGIN; DO $$ DECLARE receipt text; BEGIN receipt:=reserve_interval(1,1,1,'rollback','2026-10-20T08:00:00Z','2026-10-20T09:00:00Z'); IF receipt IS DISTINCT FROM 'RESERVED:1' THEN RAISE EXCEPTION 'pending reserve receipt missing'; END IF; IF (SELECT count(*) FROM reservation WHERE active)<>1 OR (SELECT count(*) FROM schedule_outbox WHERE event='reserved')<>1 THEN RAISE EXCEPTION 'pending reserve effects missing'; END IF; END $$; SELECT 1/0; COMMIT;");
    assert.notEqual(r.code,0); assert.match(r.stderr,/division by zero/);
    assert.equal(await invariant(),'0:0:0');
  });
  await test('successful key replay is payload bound', async () => {
    assert.equal(await reserve(1),'RESERVED:1');
    assert.equal(await reserve(1),'RESERVED:1');
    assert.equal(await reserve(2,1,1,undefined,undefined,'job1'),'KEY_REUSE');
    assert.equal(await invariant(),'1:1:1');
  });
  await test('historical receipt replay after release cannot reactivate capacity', async () => {
    await reserve(1); await sql('SELECT release_interval(1,1);');
    assert.equal(await reserve(1),'RESERVED:1');
    assert.equal(await invariant(),'0:1:2');
  });
  await test('database exclusion constraint rejects an overlapping bypass write', async () => {
    await reserve(1);
    const r=await run('psql',[...connection,'-v','VERBOSITY=verbose'],"INSERT INTO reservation VALUES(2,2,'bypass',1,tstzrange('2026-10-20T08:15:00Z','2026-10-20T09:15:00Z','[)'),true);");
    assert.notEqual(r.code,0); assert.match(r.stderr,/23P01/);
    assert.equal(await invariant(),'1:1:1');
  });
  await test('failed release transaction leaves original reservation active', async () => {
    await reserve(1);
    const r=await run('psql',connection,"BEGIN; DO $$ DECLARE receipt text; BEGIN receipt:=release_interval(1,1); IF receipt IS DISTINCT FROM 'RELEASED:1' THEN RAISE EXCEPTION 'pending release receipt missing'; END IF; IF (SELECT count(*) FROM reservation WHERE active)<>0 OR (SELECT count(*) FROM schedule_outbox WHERE event='released')<>1 THEN RAISE EXCEPTION 'pending release effects missing'; END IF; END $$; SELECT 1/0; COMMIT;");
    assert.notEqual(r.code,0); assert.match(r.stderr,/division by zero/);
    assert.equal(await invariant(),'1:1:1');
    assert.equal(await reserve(2,2),'CAPACITY');
  });
  await test('equivalent explicit timezone offsets cannot double book an instant', async () => {
    await reserve(1);
    assert.equal(await reserve(2,2,1,'2026-10-20T13:30:00+05:30','2026-10-20T14:30:00+05:30'),'CAPACITY');
    assert.equal(await invariant(),'1:1:1');
  });
  await test('foreign merchant cannot release another reservation', async () => {
    await reserve(1);
    assert.equal(await sql('SELECT release_interval(2,1);'),'DENIED');
    assert.equal(await invariant(),'1:1:1');
  });
  await test('null scopes nonpositive identities and blank keys reject', async () => {
    await reserve(1);
    const result=await sql("SELECT reserve_interval(NULL,2,1,'bad','2026-10-20T08:00:00Z','2026-10-20T09:00:00Z'),reserve_interval(1,NULL,1,'bad','2026-10-20T08:00:00Z','2026-10-20T09:00:00Z'),reserve_interval(1,2,NULL,'bad','2026-10-20T08:00:00Z','2026-10-20T09:00:00Z'),reserve_interval(0,2,1,'bad','2026-10-20T08:00:00Z','2026-10-20T09:00:00Z'),reserve_interval(1,2,1,' ','2026-10-20T08:00:00Z','2026-10-20T09:00:00Z'),release_interval(NULL,1);");
    assert.equal(result,Array(6).fill('INVALID').join('|'));
    assert.equal(await invariant(),'1:1:1');
  });
  await test('terminating an observed uncommitted client backend rolls back its effects', async () => {
    const pending=settle(sql("BEGIN; DO $$ DECLARE receipt text; BEGIN receipt:=reserve_interval(1,1,1,'terminate','2026-10-20T08:00:00Z','2026-10-20T09:00:00Z'); IF receipt IS DISTINCT FROM 'RESERVED:1' THEN RAISE EXCEPTION 'pending reserve receipt missing'; END IF; IF (SELECT count(*) FROM reservation WHERE request_id=1 AND active)<>1 OR (SELECT count(*) FROM schedule_outbox WHERE request_id=1 AND event='reserved')<>1 THEN RAISE EXCEPTION 'pending reserve effects missing'; END IF; END $$; SELECT pg_sleep(8); COMMIT;",'proof_terminate'));
    try {
      await waitFor("SELECT count(*) FROM pg_stat_activity WHERE application_name='proof_terminate' AND wait_event='PgSleep';",v=>v==='1','uncommitted backend holding reservation');
      assert.equal(await sql("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='proof_terminate' AND wait_event='PgSleep';"),'t');
      const outcome=await pending;
      assert.ok(outcome.error,'terminated backend must not return a successful receipt');
      assert.match(outcome.error.message,/terminating connection|server closed|FATAL|connection.*closed/i);
    } finally { await pending; }
    assert.equal(await invariant(),'0:0:0');
  });
  await test('normal isolated server restart preserves committed reservation and outbox', async () => {
    assert.equal(await reserve(1),'RESERVED:1');
    assert.equal(await invariant(),'1:1:1');
    await checked('pg_ctl',['-D',data,'-m','fast','-w','-t','15','stop']);
    await checked('pg_ctl',['-D',data,'-l',log,'-o',`-h 127.0.0.1 -p ${port} -c max_connections=30`,'-w','-t','15','start']);
    assert.equal(await invariant(),'1:1:1');
    assert.equal(await reserve(1),'RESERVED:1');
    assert.equal(await invariant(),'1:1:1');
  });
  const runner = await readFile(fileURLToPath(import.meta.url));
  summary = { kind: 'bounded-synthetic-scheduled-postgresql-proof', version, cases, passed: cases.length, failed: 0, skipped: 0,
    schemaSha256: createHash('sha256').update(schema).digest('hex'), runnerSha256: createHash('sha256').update(runner).digest('hex'),
    limitations: ['synthetic unit mapping, not real shared-staff identity verification', 'two contending reservations, not load or production schema proof', 'caller supplies buffered interval; no route-time or IANA schedule policy proof', 'no full request generation/reassignment, provider, RLS, host-crash or off-device restore proof', 'only successful reserve receipt is replayed; terminal denial outcome caching is not modeled'] };
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
