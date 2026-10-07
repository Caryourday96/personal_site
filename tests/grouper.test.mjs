import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNames, reviewNames, groupCount, groupLabels, makeGroups, formatGroups, secureRandomBelow } from '../sites/adeticket/grouper/grouper.mjs';

test('blank input and invalid group settings give clear errors', () => {
  assert.deepEqual(parseNames('  \n \t').names, []);
  assert.throws(() => groupCount('groups', 2, 0), /at least one/);
  assert.throws(() => groupCount('groups', 5, 3), /no more than 3/);
  assert.throws(() => groupCount('size', 0, 3), /greater than zero/);
  assert.throws(() => groupCount('size', 1.5, 3), /whole number/);
});

test('names are trimmed, duplicates flagged, and omitted names remain available', () => {
  const { entries, duplicates } = parseNames(' Ana  Maria \n\n Bob \n ana maria ');
  assert.deepEqual(entries.map((item) => item.name), ['Ana Maria', 'Bob', 'ana maria']);
  assert.deepEqual(duplicates, [{ name: 'ana maria', firstLine: 1, line: 4 }]);
  const selected = reviewNames([entries[0], entries[1]]);
  assert.deepEqual(selected.names, ['Ana Maria', 'Bob']);
  assert.deepEqual(selected.duplicates, []);
});

test('uneven groups differ by at most one and include each entry once', () => {
  const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const groups = makeGroups(names, groupCount('groups', 3, names.length), () => 0);
  assert.deepEqual(groups.map((group) => group.length), [3, 2, 2]);
  assert.deepEqual(groups.flat().sort(), [...names].sort());
  assert.equal(groupCount('size', 3, 7), 3);
});

test('custom labels and omitted names appear in copied text', () => {
  const labels = groupLabels('Blue\nGold', 3);
  assert.deepEqual(labels, ['Blue', 'Gold', 'Group 3']);
  assert.throws(() => groupLabels('A\nB\nC', 2), /only 2 groups/);
  assert.match(formatGroups([['Ana'], ['Bob']], ['Blue', 'Gold'], ['Sam']), /Omitted from this draw \(1\)\nSam/);
});

test('secure random draw rejects out-of-range samples rather than using biased modulo', () => {
  const samples = [4294967295, 5];
  const fakeCrypto = { getRandomValues(array) { array[0] = samples.shift(); } };
  assert.equal(secureRandomBelow(3, fakeCrypto), 2);
  assert.equal(samples.length, 0);
});
