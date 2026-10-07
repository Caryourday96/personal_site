export function parseNames(input) {
  const entries = String(input).split(/\r?\n/).map((line, index) => ({ name: line.trim().replace(/\s+/g, ' '), line: index + 1 })).filter((entry) => entry.name);
  return { entries, ...reviewNames(entries) };
}

export function reviewNames(entries) {
  const names = entries.map((entry) => entry.name);
  const seen = new Map();
  const duplicates = [];
  entries.forEach(({ name, line }) => {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) duplicates.push({ name, firstLine: seen.get(key), line });
    else seen.set(key, line);
  });
  return { names, duplicates };
}

export function groupLabels(input, count) {
  const labels = String(input).split(/\r?\n/).map((line) => line.trim().replace(/\s+/g, ' ')).filter(Boolean);
  if (labels.length > count) throw new Error(`You entered ${labels.length} group names, but this draw has only ${count} groups.`);
  return Array.from({ length: count }, (_, i) => labels[i] || `Group ${i + 1}`);
}

export function groupCount(mode, value, participants) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Enter a whole number greater than zero.');
  if (participants < 1) throw new Error('Add at least one participant.');
  if (mode === 'groups') {
    if (value > participants) throw new Error(`You have ${participants} participant${participants === 1 ? '' : 's'}; choose no more than ${participants} groups.`);
    return value;
  }
  if (mode === 'size') return Math.ceil(participants / value);
  throw new Error('Choose a grouping method.');
}

// Rejection sampling avoids modulo bias for any array length supported here.
export function secureRandomBelow(max, cryptoSource = globalThis.crypto) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000) throw new Error('Invalid shuffle range.');
  if (!cryptoSource?.getRandomValues) throw new Error('Secure randomization is unavailable in this browser.');
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const sample = new Uint32Array(1);
  do { cryptoSource.getRandomValues(sample); } while (sample[0] >= limit);
  return sample[0] % max;
}

export function makeGroups(names, count, randomBelow = secureRandomBelow) {
  if (!Array.isArray(names) || names.length === 0) throw new Error('Add at least one participant.');
  if (!Number.isSafeInteger(count) || count < 1 || count > names.length) throw new Error('Choose a valid number of groups.');
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    if (!Number.isSafeInteger(j) || j < 0 || j > i) throw new Error('Shuffle failed. Please try again.');
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const base = Math.floor(shuffled.length / count);
  const extra = shuffled.length % count;
  const groups = [];
  let offset = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    groups.push(shuffled.slice(offset, offset + size));
    offset += size;
  }
  return groups;
}

export function formatGroups(groups, labels = [], omitted = []) {
  const text = groups.map((members, i) => `${labels[i] || `Group ${i + 1}`} (${members.length})\n${members.join('\n')}`).join('\n\n');
  return omitted.length ? `${text}\n\nOmitted from this draw (${omitted.length})\n${omitted.join('\n')}` : text;
}
