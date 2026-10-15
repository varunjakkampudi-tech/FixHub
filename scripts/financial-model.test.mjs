import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluate, breakEven, runModel } from './financial-model.mjs';

const config = JSON.parse(await readFile(new URL('../docs/product/feasibility/finance/model-assumptions.json', import.meta.url), 'utf8'));
const results = runModel(config);
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, a + ' differs from ' + b);
test('exact scenario inventory', () => assert.deepEqual(Object.keys(results).sort(), ['BASE', 'HIGH', 'LOW']));
for (const [name, expected] of Object.entries({
  LOW: [112, 89600, 6720, 31443, 21000, -45723, 493, null],
  BASE: [663, 795600, 79560, 49544, 21000, 9016, 1769, 838],
  HIGH: [2160, 3240000, 324000, 83315, 35500, 205185, 4640, 441]
})) {
  test(name + ' financial baseline and conservation', () => {
    const r = results[name];
    for (const [i, key] of ['completed', 'grossTransactionValue', 'platformRevenue', 'variableCost', 'fixedCost', 'operatingResult', 'whatsappCost'].entries()) near(r[key], expected[i]);
    assert.equal(r.breakEvenRequests, expected[7]);
    near(r.completed + r.acceptedNotCompleted + r.unaccepted, r.requests);
    near(r.contribution - r.fixedCost, r.operatingResult);
    assert.notEqual(r.grossTransactionValue, r.platformRevenue);
  });
}
test('break-even is minimal integer volume', () => {
  for (const name of ['BASE', 'HIGH']) {
    const s = config.scenarios[name], n = results[name].breakEvenRequests;
    assert.ok(evaluate({ ...s, requests: n }, 0).operatingResult >= 0);
    assert.ok(evaluate({ ...s, requests: n - 1 }, 0).operatingResult < 0);
  }
});
test('zero volume has no divide-by-zero', () => {
  const r = evaluate({ ...config.scenarios.BASE, requests: 0 }, 100);
  assert.equal(r.contributionPerRequest, null);
  assert.equal(r.contributionPerCompletedJob, null);
  assert.equal(r.whatsappCost, 0);
  near(r.operatingResult, -r.fixedCost);
});
test('zero completion does not fabricate realized fees', () => {
  const r = evaluate({ ...config.scenarios.BASE, completionGivenAcceptance: 0 }, 0);
  assert.equal(r.platformRevenue, 0);
  assert.equal(r.grossTransactionValue, 0);
  assert.equal(r.contributionPerCompletedJob, null);
});
test('service free-allowance boundary and no-allowance stress', () => {
  const s = { ...config.scenarios.BASE, utilityMessagesPerRequest: 0, authenticationMessagesPerRequest: 0, serviceMessagesPerRequest: 1 };
  near(evaluate({ ...s, requests: 999 }, 0).whatsappCost, 0);
  near(evaluate({ ...s, requests: 1000 }, 0).whatsappCost, 0);
  near(evaluate({ ...s, requests: 1001 }, 0).whatsappCost, 0.145);
  near(results.BASE.sensitivities.noFreeServiceAllowance, 8871);
});
test('unprofitable LOW has no manufactured break-even', () => assert.equal(breakEven(config.scenarios.LOW), null));
test('temporary profit before allowance ends is not missed', () => {
  const s = { ...config.scenarios.BASE, acceptance: 1, completionGivenAcceptance: 1,
    platformFeePerCompletion: 1, newCustomerShare: 0, newMerchantsPerRequest: 0,
    supportCaseShare: 0, disputeReservePerCompletion: 0, utilityMessagesPerRequest: 0,
    authenticationMessagesPerRequest: 0, serviceMessagesPerRequest: 1, serviceFreeAllowance: 100,
    messageRate: 10, smsPerRequest: 0, hostingDatabase: 50, storage: 0, monitoring: 0,
    bspSubscription: 0, fixedOperations: 0, maintenance: 0 };
  assert.equal(breakEven(s), 50);
  assert.ok(evaluate({ ...s, requests: 200 }, 0).operatingResult < 0);
});
test('conversion and cost sensitivities are adverse', () => {
  for (const r of Object.values(results)) {
    for (const v of Object.values(r.sensitivities)) assert.ok(v <= r.operatingResult + 1e-7);
  }
  near(results.BASE.sensitivities.lowerAcceptance, -4907);
  near(results.BASE.sensitivities.noShows, 2054.5);
  near(results.BASE.sensitivities.doubleMessagingSupport, 767);
});
test('runway is not infinite for profitable scenarios', () => {
  near(results.LOW.runwayMonths, 300000 / 45723);
  assert.equal(results.BASE.runwayMonths, null);
  assert.equal(results.HIGH.runwayMonths, null);
});
test('invalid fractions, missing, negative and nonfinite inputs reject', () => {
  for (const change of [{ acceptance: 1.1 }, { completionGivenAcceptance: -0.1 }, { requests: 1.2 },
    { messageRate: -1 }, { supportHourlyCost: NaN }, { verificationCostPerNewMerchant: undefined }, { requests: Infinity }])
    assert.throws(() => evaluate({ ...config.scenarios.BASE, ...change }, 0), /Invalid|safe integer/);
  assert.throws(() => evaluate(config.scenarios.BASE, -1), /Invalid operating cash/);
  assert.throws(() => evaluate({ ...config.scenarios.BASE, messageRate: 1e308 }, 0), /arithmetic overflow/);
});
test('metadata and scenario tampering rejected', () => {
  assert.throws(() => runModel({ ...config, evidenceClass: 2 }), /metadata/);
  assert.throws(() => runModel({ ...config, fxInrPerUsd: 0 }), /FX/);
  assert.throws(() => runModel({ ...config, scenarios: { BASE: config.scenarios.BASE } }), /inventory/);
});
console.log('Phase01 offline model regressions: ' + passed + ' passed, 0 failed, 0 skipped. No market or runtime validation implied.');
