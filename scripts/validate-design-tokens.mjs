// Candidate token arithmetic/metadata only, not a WCAG or native-app certification.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const original = JSON.parse(await readFile(new URL('../docs/design/design-tokens.json', import.meta.url), 'utf8'));
function luminance(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i, 'opaque six-digit RGB required');
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) { const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y); return (high + 0.05) / (low + 0.05); }
const ids = ['light-body', 'light-muted', 'light-action-label', 'light-action-hover-label', 'light-link', 'light-calm-text', 'light-warning-text', 'light-danger-text', 'light-border', 'light-focus', 'light-canvas-body', 'dark-body', 'dark-muted', 'dark-action-label', 'dark-link', 'dark-warning', 'dark-danger', 'dark-calm', 'dark-border', 'dark-focus'];
function validate(tokens) {
  assert.match(tokens.status, /^PROPOSED/);
  for (const key of ['logo', 'identity', 'colours', 'typography', 'domain', 'tagline']) assert.equal(tokens.approval[key], 'OPEN', 'no fabricated owner approval');
  assert.match(tokens.approval.phase05, /^DRAFT PREPARATION/);
  assert.deepEqual(tokens.contrastPairs.map(pair => pair.id).sort(), [...ids].sort(), 'exact contrast-pair inventory');
  return tokens.contrastPairs.map(pair => {
    const expectedMinimum = /-(border|focus)$/.test(pair.id) ? 3 : 4.5;
    assert.equal(pair.minimum, expectedMinimum, 'contrast threshold cannot be weakened');
    assert.ok(pair.mode === 'light' || pair.mode === 'dark');
    const palette = tokens.colours[pair.mode];
    const ratio = contrast(palette[pair.foreground], palette[pair.background]);
    assert.ok(ratio >= expectedMinimum, `${pair.id}: ${ratio} below ${expectedMinimum}`);
    return { id: pair.id, ratio: Number(ratio.toFixed(3)), minimum: expectedMinimum, status: 'PASS' };
  });
}
assert.ok(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--self-test'));
const results = validate(original);
for (const result of results) console.log(`PASS ${result.id}: ${result.ratio}:1 (minimum ${result.minimum}:1; comparison used unrounded value)`);
if (process.argv[2] === '--self-test') {
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.equal(contrast('#FFFFFF', '#000000'), 21);
  assert.ok(contrast('#777777', '#FFFFFF') < 4.5, 'rounding a failing threshold must not make it pass');
  const mutations = [
    ['unreadable text', value => { value.colours.light.ink = '#FFFFFF'; }],
    ['invalid hex or alpha', value => { value.colours.light.ink = '#FFFFFF00'; }],
    ['missing pair', value => value.contrastPairs.pop()],
    ['duplicate pair', value => { value.contrastPairs[1].id = value.contrastPairs[0].id; }],
    ['weakened threshold', value => { value.contrastPairs[0].minimum = 1; }],
    ['unknown token', value => { value.contrastPairs[0].foreground = 'missing'; }],
    ['invented brand approval', value => { value.approval.logo = 'APPROVED'; }],
  ];
  for (const [name, mutate] of mutations) { const fixture = structuredClone(original); mutate(fixture); assert.throws(() => validate(fixture)); console.log('PASS mutation rejected: ' + name); }
  console.log('PASS three contrast reference assertions and seven negative mutations; 0 failures, 0 skips');
}
console.log(`${results.length} candidate colour pairs passed arithmetic checks. This does not test actual UI, images, font rendering, assistive technology, translation, brand approval or full WCAG compliance.`);
