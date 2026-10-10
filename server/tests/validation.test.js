import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAIResponse, extractJSON, textFallback } from '../services/aiSchema.js';
import { validateTask, validateDeviceCode } from '../utils/validators.js';
import { to24h, to12hLabel } from '../utils/time.js';

test('accepts a well-formed plan and normalises times', () => {
  const out = validateAIResponse({ type: 'plan', title: 'Your Evening Plan', summary: 'Two things.', items: [{ time: '17:00', task: 'Assignment' }, { time: '7:00 pm', task: 'Revision' }] });
  assert.equal(out.items[0].time, '5:00 PM');
  assert.equal(out.items[1].time, '7:00 PM');
});

test('rejects a plan whose items lack times (forces text fallback)', () => {
  assert.equal(validateAIResponse({ type: 'plan', title: 'x', summary: 'y', items: [{ task: 'No time' }] }), null);
});

test('rejects unknown types and non-objects', () => {
  assert.equal(validateAIResponse({ type: 'weird', title: 'x' }), null);
  assert.equal(validateAIResponse('hello'), null);
});

test('priorities need HIGH/MEDIUM/LOW and only keep known task ids', () => {
  const ok = validateAIResponse({ type: 'priorities', title: 'P', summary: 's', items: [{ task: 'A', priority: 'high', reason: 'r', taskId: 'abc' }, { task: 'B', priority: 'LOW', taskId: 'nope' }] }, { knownTaskIds: new Set(['abc']) });
  assert.equal(ok.items[0].priority, 'HIGH');
  assert.equal(ok.items[0].taskId, 'abc');
  assert.equal(ok.items[1].taskId, undefined);
  assert.equal(validateAIResponse({ type: 'priorities', title: 'P', summary: 's', items: [{ task: 'A', priority: 'URGENT' }] }), null);
});

test('strips markup from model output', () => {
  const out = validateAIResponse({ type: 'text', title: '<b>Hi</b>', summary: 'a <script>x</script> b', items: [] });
  assert.ok(!out.title.includes('<'));
  assert.ok(!out.summary.includes('<'));
});

test('extractJSON handles code fences and chatter', () => {
  assert.deepEqual(extractJSON('Sure!\n```json\n{"a":1}\n```'), { a: 1 });
  assert.equal(extractJSON('not json'), null);
});

test('textFallback always yields a renderable response', () => {
  assert.equal(textFallback('hello').type, 'text');
  assert.equal(textFallback(undefined).type, 'text');
});

test('task validation', () => {
  assert.throws(() => validateTask({ title: '   ' }));
  assert.throws(() => validateTask({ title: 'x', priority: 'URGENT' }));
  assert.equal(validateTask({ title: ' Buy <b>milk</b> ', priority: 'low' }).priority, 'LOW');
  assert.equal(validateTask({ title: ' Buy <b>milk</b> ' }).title, 'Buy milk');
  assert.throws(() => validateTask({}, { partial: true }));
});

test('pairing code validation', () => {
  assert.equal(validateDeviceCode({ code: 'ab12cd' }).code, 'AB12CD');
  assert.throws(() => validateDeviceCode({ code: 'short' }));
});

test('time helpers', () => {
  assert.equal(to24h('5:00 PM'), '17:00');
  assert.equal(to24h('12:30 AM'), '00:30');
  assert.equal(to12hLabel('13:05'), '1:05 PM');
  assert.equal(to24h('25:00'), null);
});
