// Offline document-contract checks only. This is not a product state-machine engine.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'docs/product/behaviour');
const readJson = name => readFile(path.join(base, name), 'utf8').then(JSON.parse);
const roles = [
  ['customer', 'C', 'CJ-', 24, 'docs/journeys/customer-journey.md'],
  ['merchant', 'M', 'MJ-', 30, 'docs/journeys/merchant-journey.md'],
  ['technician', 'T', 'stage ', 6, 'docs/journeys/technician-journey.md'],
  ['operations', 'O', 'stage ', 7, 'docs/journeys/operations-journey.md'],
  ['super-admin', 'A', 'stage ', 16, 'docs/journeys/super-admin-journey.md'],
];
const outcomes = ['success', 'failure', 'timeout', 'cancellation', 'unauthorized', 'recovery'];
const channels = ['web', 'android', 'ios', 'official-whatsapp', 'staff-web'];
const machineIds = ['verification', 'request', 'offer', 'assignment', 'booking', 'dispute'];
const baseline = await readFile(path.join(root, 'docs/flows/state-machines.md'), 'utf8');
const sources = Object.fromEntries(await Promise.all(roles.map(async role => [role[4], await readFile(path.join(root, role[4]), 'utf8')])));
const behaviour = await readFile(path.join(base, 'behaviour-specification.md'), 'utf8');
const original = { state: await readJson('state-catalogue.json'), interaction: await readJson('interaction-catalogue.json'), notification: await readJson('notification-catalogue.json') };
const exact = (actual, expected, label) => assert.deepEqual([...actual].sort(), [...expected].sort(), label);
const requiredText = (value, label) => assert.ok(typeof value === 'string' && value.trim(), label);

function validate({ state, interaction, notification }) {
  for (const item of [state, interaction, notification]) assert.match(item.status, /^DRAFT PREPARATION/);
  assert.equal(state.baseline, 'docs/flows/state-machines.md');
  assert.equal(state.sharedGuards.length, 5);
  assert.match(state.defaultRule, /Every unlisted state pair is forbidden/);
  exact(state.machines.map(machine => machine.id), machineIds, 'six machine inventory');
  const baselineSections = new Map([...baseline.matchAll(/## ([^\r\n]+)\r?\n[\s\S]*?```mermaid\r?\n([\s\S]*?)```/g)].map(match => [match[1], [...match[2].matchAll(/^\s*(\w+) --> (\w+): .+$/gm)].map(edge => edge[1] + '>' + edge[2])]));
  assert.equal(baselineSections.size, 6, 'six conceptual machine sources');
  let conceptual = 0, additions = 0, deniedPairs = 0;
  const transitions = [];
  for (const machine of state.machines) {
    requiredText(machine.owner, 'machine owner');
    const prior = baselineSections.get(machine.sourceHeading);
    assert.ok(prior, 'known source heading');
    assert.equal(new Set(machine.states).size, machine.states.length, 'unique state names');
    const edgePairs = machine.transitions.map(edge => edge.from + '>' + edge.to);
    assert.equal(new Set(edgePairs).size, edgePairs.length, 'duplicate state pair');
    for (const pair of prior) assert.ok(edgePairs.includes(pair), 'missing conceptual edge: ' + pair);
    for (const edge of machine.transitions) {
      transitions.push(edge.id);
      assert.ok(machine.states.includes(edge.from) && machine.states.includes(edge.to), 'unknown state');
      for (const field of ['actor', 'guard', 'event']) requiredText(edge[field], 'missing transition field ' + field);
      if (prior.includes(edge.from + '>' + edge.to)) {
        assert.equal(edge.classification, 'PHASE 00 CONCEPTUAL EDGE REFINED');
        conceptual++;
      } else {
        assert.equal(edge.classification, 'DRAFT ADDITION - OWNER/POLICY REVIEW REQUIRED', 'unreviewed edge cannot hide as baseline');
        additions++;
      }
    }
    deniedPairs += machine.states.length ** 2 - edgePairs.length;
  }
  exact(transitions, Array.from({ length: 56 }, (_, i) => 'P04-ST-' + String(i + 1).padStart(3, '0')), 'exact stable transition IDs');
  assert.equal(conceptual, 45); assert.equal(additions, 11);
  const quotedStart = state.machines.find(machine => machine.id === 'booking').transitions.find(edge => edge.from === 'QuotePending' && edge.to === 'InProgress');
  assert.equal(quotedStart.actor, 'assigned-technician', 'quote consent is not actual work start');
  assert.equal(quotedStart.event, 'booking.started', 'quoted work needs actual start event');
  assert.match(quotedStart.guard, /current unexpired customer quote consent/);
  for (const id of ['P04-ST-021', 'P04-ST-023', 'P04-ST-031', 'P04-ST-033']) {
    const edge = state.machines.flatMap(machine => machine.transitions).find(value => value.id === id);
    assert.match(edge.actor, /merchant-manager only with an approved active action-specific grant, otherwise denied/, 'manager cannot inherit owner transition authority');
  }

  const expectedInteractions = [];
  for (const [role, prefix, stagePrefix, count, source] of roles) {
    const entries = interaction.interactions.filter(entry => entry.role === role);
    assert.equal(entries.length, count, 'source role inventory');
    const stagePattern = stagePrefix === 'stage ' ? /^\| (\d{2}) /gm : new RegExp('^\\| (' + stagePrefix + '\\d{2}):', 'gm');
    assert.equal([...sources[source].matchAll(stagePattern)].length, count, 'source stage count changed');
    for (let i = 1; i <= count; i++) {
      const id = 'P04-I-' + prefix + String(i).padStart(3, '0');
      expectedInteractions.push(id);
      const entry = entries.find(value => value.id === id);
      assert.ok(entry, 'missing interaction ' + id);
      assert.equal(entry.source, source, 'unexpected source path');
      assert.equal(entry.sourceStage, stagePrefix + String(i).padStart(2, '0'), 'source stage mismatch');
      assert.match(entry.primaryFlow, /^FLOW-(0[1-9]|1[0-2])$/);
      assert.ok(behaviour.includes('| ' + entry.primaryFlow + ' ['), 'missing six-outcome flow row');
      exact(entry.outcomes, outcomes, 'six required outcome classes');
      requiredText(entry.entry, 'entry scope');
      assert.equal(entry.status, 'DRAFT');
      assert.ok(entry.channels.length > 0 && entry.channels.every(channel => channels.includes(channel)));
      if (['operations', 'super-admin'].includes(role)) exact(entry.channels, ['staff-web'], 'private staff scope');
    }
  }
  exact(interaction.interactions.map(entry => entry.id), expectedInteractions, 'exact 83 source-stage references');
  for (const id of ['P04-I-C019', 'P04-I-M026']) assert.equal(interaction.interactions.find(entry => entry.id === id).primaryFlow, 'FLOW-05', 'reviews map to service lifecycle');
  assert.match(interaction.channelRule, /only where the stage, sensitivity, authentication\/linking, recipient consent, provider\/account eligibility, approved template and applicable messaging window all permit it/);
  const entryFor = id => interaction.interactions.find(entry => entry.id === id).entry;
  assert.match(entryFor('P04-I-M001'), /Public discovery.*no account, existing tenant or membership required/);
  assert.match(entryFor('P04-I-M002'), /Authenticated applicant.*no existing tenant required/);
  assert.match(entryFor('P04-I-M003'), /enrollment or authentication can begin without active business membership/);
  assert.match(entryFor('P04-I-T001'), /Identity entry can begin unauthenticated.*current assignment/);
  exact(notification.notifications.map(entry => entry.id), Array.from({ length: 24 }, (_, i) => 'P04-N-' + String(i + 1).padStart(3, '0')), 'exact notice inventory');
  for (const entry of notification.notifications) {
    for (const field of ['event', 'recipient', 'purpose', 'expiryRule', 'consentRule', 'providerClassification']) requiredText(entry[field], 'notice field ' + field);
    requiredText(entry.copy.en, 'English candidate copy');
    assert.match(entry.copy.te, /[\u0C00-\u0C7F]/, 'Telugu candidate copy missing');
    exact(entry.payloadAllowList, ['opaqueEventReference', 'messageKey', 'language', 'safeStatusLabel'], 'notification payload must remain minimal');
    assert.ok(entry.channels.length > 0 && entry.channels.every(channel => channels.includes(channel)), 'unknown channel');
    assert.equal(entry.review, 'PENDING', 'cannot fabricate copy/provider review');
    assert.match(entry.providerClassification, /^NOT VERIFIED/);
  }
  return { conceptualEdges: conceptual, draftAdditions: additions, unlistedStatePairsDeniedBySpecification: deniedPairs, interactionReferences: 83, notificationCandidates: 24 };
}

assert.ok(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--self-test'), 'Only optional --self-test supported');
console.log('PASS draft specification inventory: ' + JSON.stringify(validate(original)));
if (process.argv[2] === '--self-test') {
  const mutations = [
    ['missing conceptual edge', v => v.state.machines[0].transitions.shift()],
    ['duplicate transition ID', v => { v.state.machines[0].transitions[1].id = v.state.machines[0].transitions[0].id; }],
    ['unknown transition state', v => { v.state.machines[0].transitions[0].to = 'Bogus'; }],
    ['draft addition cannot be called baseline', v => { v.state.machines[1].transitions.at(-1).classification = 'PHASE 00 CONCEPTUAL EDGE REFINED'; }],
    ['missing interaction', v => v.interaction.interactions.pop()],
    ['foreign source path', v => { v.interaction.interactions[0].source = '../private.md'; }],
    ['wrong stage mapping', v => { v.interaction.interactions[0].sourceStage = 'CJ-99'; }],
    ['missing recovery outcome', v => v.interaction.interactions[0].outcomes.pop()],
    ['unsupported major flow', v => { v.interaction.interactions[0].primaryFlow = 'FLOW-99'; }],
    ['staff WhatsApp privilege cannot be inferred', v => v.interaction.interactions.find(entry => entry.role === 'super-admin').channels.push('official-whatsapp')],
    ['duplicate notification ID', v => { v.notification.notifications[1].id = v.notification.notifications[0].id; }],
    ['missing Telugu candidate', v => { v.notification.notifications[0].copy.te = ''; }],
    ['PII payload field forbidden', v => v.notification.notifications[0].payloadAllowList.push('preciseAddress')],
    ['unapproved template cannot be marked approved', v => { v.notification.notifications[0].review = 'APPROVED'; }],
    ['unknown provider channel', v => v.notification.notifications[0].channels.push('unofficial-whatsapp')],
    ['onboarding cannot require existing membership', v => { v.interaction.interactions.find(entry => entry.id === 'P04-I-M002').entry = 'Active own-business membership required'; }],
    ['technician identity entry is not an assigned-job prerequisite loop', v => { v.interaction.interactions.find(entry => entry.id === 'P04-I-T001').entry = 'Already authenticated and assigned job required'; }],
    ['customer quote consent cannot claim actual work start', v => { v.state.machines.find(machine => machine.id === 'booking').transitions.find(edge => edge.from === 'QuotePending' && edge.to === 'InProgress').actor = 'customer'; }],
    ['quoted work must emit actual start event', v => { v.state.machines.find(machine => machine.id === 'booking').transitions.find(edge => edge.from === 'QuotePending' && edge.to === 'InProgress').event = 'quote.consented'; }],
    ['merchant managers cannot inherit owner transition authority', v => { v.state.machines.flatMap(machine => machine.transitions).find(edge => edge.id === 'P04-ST-021').actor = 'merchant-manager'; }],
    ['review interaction maps to lifecycle flow', v => { v.interaction.interactions.find(entry => entry.id === 'P04-I-C019').primaryFlow = 'FLOW-10'; }],
    ['WhatsApp candidates remain subject to stage and account gates', v => { v.interaction.channelRule = 'Every listed channel is approved and universally available.'; }],
  ];
  for (const [name, mutate] of mutations) {
    const fixture = structuredClone(original);
    mutate(fixture);
    assert.throws(() => validate(fixture), undefined, name);
    console.log('PASS mutation rejected: ' + name);
  }
  console.log(`Draft-contract mutation regressions: ${mutations.length} passed, 0 failed, 0 skipped. Not product behaviour, security, provider or translation tests.`);
}
