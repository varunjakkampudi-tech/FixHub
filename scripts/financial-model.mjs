import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function validateScenario(s) {
  const keys = ['requests', 'acceptance', 'completionGivenAcceptance', 'averageJobValue',
    'platformFeePerCompletion', 'newCustomerShare', 'customerAcquisitionCost',
    'newMerchantsPerRequest', 'merchantAcquisitionCost', 'verificationCostPerNewMerchant',
    'supportCaseShare', 'supportMinutesPerCase', 'supportHourlyCost',
    'disputeReservePerCompletion', 'utilityMessagesPerRequest', 'authenticationMessagesPerRequest',
    'serviceMessagesPerRequest', 'serviceFreeAllowance', 'messageRate', 'twilioFeeUsdPerMessage', 'smsPerRequest',
    'smsRate', 'hostingDatabase', 'storage', 'monitoring', 'bspSubscription', 'fixedOperations', 'maintenance'];
  for (const key of keys) {
    if (!Number.isFinite(s[key]) || s[key] < 0) throw new Error('Invalid nonnegative input: ' + key);
  }
  for (const key of ['acceptance', 'completionGivenAcceptance', 'newCustomerShare', 'supportCaseShare']) {
    if (s[key] > 1) throw new Error('Invalid fraction: ' + key);
  }
  if (!Number.isSafeInteger(s.requests)) throw new Error('Requests must be a safe integer');
}

export function evaluate(s, cash, fxInrPerUsd = 85) {
  validateScenario(s);
  if (!Number.isFinite(cash) || cash < 0) throw new Error('Invalid operating cash');
  if (!Number.isFinite(fxInrPerUsd) || fxInrPerUsd <= 0) throw new Error('Invalid assumed FX');
  const accepted = s.requests * s.acceptance;
  const completed = accepted * s.completionGivenAcceptance;
  const unaccepted = s.requests - accepted;
  const acceptedNotCompleted = accepted - completed;
  const serviceBillable = Math.max(0, s.requests * s.serviceMessagesPerRequest - s.serviceFreeAllowance);
  const metaBillableMessages = s.requests * (s.utilityMessagesPerRequest + s.authenticationMessagesPerRequest) + serviceBillable;
  const twilioBillableMessages = s.requests * (s.utilityMessagesPerRequest + s.authenticationMessagesPerRequest + s.serviceMessagesPerRequest);
  const whatsappMetaCost = metaBillableMessages * s.messageRate;
  const whatsappTwilioCost = twilioBillableMessages * s.twilioFeeUsdPerMessage * fxInrPerUsd;
  const whatsappCost = whatsappMetaCost + whatsappTwilioCost;
  const smsCost = s.requests * s.smsPerRequest * s.smsRate;
  const customerAcquisition = s.requests * s.newCustomerShare * s.customerAcquisitionCost;
  const merchantAcquisition = s.requests * s.newMerchantsPerRequest * s.merchantAcquisitionCost;
  const verification = s.requests * s.newMerchantsPerRequest * s.verificationCostPerNewMerchant;
  const supportHours = s.requests * s.supportCaseShare * s.supportMinutesPerCase / 60;
  const supportCost = supportHours * s.supportHourlyCost;
  const disputeReserve = completed * s.disputeReservePerCompletion;
  const variableCost = whatsappCost + smsCost + customerAcquisition + merchantAcquisition + verification + supportCost + disputeReserve;
  const fixedCost = s.hostingDatabase + s.storage + s.monitoring + s.bspSubscription + s.fixedOperations + s.maintenance;
  const grossTransactionValue = completed * s.averageJobValue;
  const platformRevenue = completed * s.platformFeePerCompletion;
  const contribution = platformRevenue - variableCost;
  const operatingResult = contribution - fixedCost;
  const cashBurn = Math.max(0, -operatingResult);
  const result = { requests: s.requests, accepted, completed, unaccepted, acceptedNotCompleted,
    acceptedCancellationRate: 1 - s.completionGivenAcceptance, grossTransactionValue,
    platformRevenue, whatsappCost, whatsappMetaCost, whatsappTwilioCost,
    whatsappMessageCount: twilioBillableMessages, smsCost, customerAcquisition, merchantAcquisition,
    verification, supportHours, supportCost, disputeReserve, variableCost, fixedCost,
    contribution, contributionPerRequest: s.requests ? contribution / s.requests : null,
    contributionPerCompletedJob: completed ? contribution / completed : null,
    operatingResult, cashBurn, runwayMonths: cashBurn > 0 ? cash / cashBurn : null };
  if (Object.values(result).some(value => value !== null && !Number.isFinite(value))) {
    throw new Error('Invalid arithmetic overflow');
  }
  return result;
}

// Search each linear segment separately: a free-message allowance can create
// a temporary profitable interval even when the later marginal result is negative.
// null means no nonnegative operating result within the explicit search bound.
export function breakEven(s, cash = 0, fxInrPerUsd = 85) {
  validateScenario(s);
  const maxVolume = 10000000;
  const boundary = s.serviceMessagesPerRequest > 0
    ? Math.min(maxVolume, Math.floor(s.serviceFreeAllowance / s.serviceMessagesPerRequest))
    : maxVolume;
  const result = n => evaluate({ ...s, requests: n }, cash, fxInrPerUsd).operatingResult;
  const segments = [[0, boundary], [boundary + 1, maxVolume]];
  for (const [start, end] of segments) {
    if (start > end) continue;
    if (result(start) >= 0) return start;
    if (result(end) < 0) continue;
    let lo = start;
    let hi = end;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (result(mid) >= 0) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }
  return null;
}

export function runModel(config) {
  if (config.version !== 1 || config.evidenceClass !== 5 || config.currency !== 'INR') throw new Error('Invalid model metadata');
  if (!Number.isFinite(config.fxInrPerUsd) || config.fxInrPerUsd <= 0) throw new Error('Invalid assumed FX');
  if (Object.keys(config.scenarios).sort().join(',') !== 'BASE,HIGH,LOW') throw new Error('Expected exact LOW/BASE/HIGH inventory');
  const results = {};
  for (const [name, s] of Object.entries(config.scenarios)) {
    results[name] = { ...evaluate(s, config.operatingCashInr, config.fxInrPerUsd), breakEvenRequests: breakEven(s, 0, config.fxInrPerUsd),
      sensitivities: {
        lowerAcceptance: evaluate({ ...s, acceptance: s.acceptance * 0.8 }, config.operatingCashInr, config.fxInrPerUsd).operatingResult,
        noShows: evaluate({ ...s, completionGivenAcceptance: s.completionGivenAcceptance * 0.9 }, config.operatingCashInr, config.fxInrPerUsd).operatingResult,
        doubleMessagingSupport: evaluate({ ...s, messageRate: s.messageRate * 2,
          twilioFeeUsdPerMessage: s.twilioFeeUsdPerMessage * 2, supportHourlyCost: s.supportHourlyCost * 2 },
        config.operatingCashInr, config.fxInrPerUsd).operatingResult,
        noFreeServiceAllowance: evaluate({ ...s, serviceFreeAllowance: 0 }, config.operatingCashInr, config.fxInrPerUsd).operatingResult
      } };
  }
  return results;
}

const modelPath = new URL('../docs/product/feasibility/finance/model-assumptions.json', import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(await readFile(modelPath, 'utf8'));
  console.log(JSON.stringify(runModel(config), null, 2));
}
