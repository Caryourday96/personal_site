import { parseNames, reviewNames, groupCount, groupLabels, makeGroups, formatGroups } from './grouper.mjs';

const form = document.querySelector('#grouper-form');
const namesField = document.querySelector('#names');
const numberField = document.querySelector('#group-number');
const groupNamesField = document.querySelector('#group-names');
const picker = document.querySelector('#participant-picker');
const options = document.querySelector('#participant-options');
const duplicateBox = document.querySelector('#duplicate-review');
const duplicateList = document.querySelector('#duplicate-list');
const confirmDuplicates = document.querySelector('#confirm-duplicates');
const message = document.querySelector('#message');
const results = document.querySelector('#results');
const cards = document.querySelector('#group-cards');
const summary = document.querySelector('#result-summary');
const omittedSummary = document.querySelector('#omitted-summary');
const shuffleButton = document.querySelector('#shuffle-again');
const copyButton = document.querySelector('#copy-results');
let currentGroups = null;
let currentLabels = [];
let currentOmitted = [];
let lastInput = '';

function mode() { return form.elements.method.value; }
function updateMode() {
  const isSize = mode() === 'size';
  document.querySelector('#number-label').textContent = isSize ? 'Maximum members per group' : 'Number of groups';
  numberField.value = isSize ? '4' : '2';
  clearResults();
}
function clearResults() {
  currentGroups = null;
  results.hidden = true;
  message.textContent = '';
}
function populateParticipants() {
  const { entries } = parseNames(namesField.value);
  options.replaceChildren();
  picker.hidden = entries.length === 0;
  entries.forEach(({ name, line }, index) => {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = true;
    box.dataset.index = String(index);
    const nameText = document.createElement('span');
    nameText.textContent = `${name} (line ${line})`;
    label.append(box, nameText);
    options.append(label);
  });
  reviewDuplicates(parseNames(namesField.value).duplicates);
}
function selectedParticipants() {
  const { entries } = parseNames(namesField.value);
  const chosen = [];
  const omitted = [];
  options.querySelectorAll('input').forEach((box, index) => {
    (box.checked ? chosen : omitted).push(entries[index]);
  });
  return { chosen, omitted };
}
function reviewDuplicates(duplicates) {
  duplicateBox.hidden = duplicates.length === 0;
  duplicateList.replaceChildren();
  for (const item of duplicates) {
    const li = document.createElement('li');
    li.textContent = `“${item.name}” appears on lines ${item.firstLine} and ${item.line}.`;
    duplicateList.append(li);
  }
}
function render(groups, labels, omitted) {
  const firstDraw = results.hidden;
  cards.replaceChildren();
  groups.forEach((members, index) => {
    const card = document.createElement('section');
    card.className = 'group-card';
    const heading = document.createElement('h3');
    heading.textContent = labels[index];
    const count = document.createElement('p');
    count.className = 'member-count';
    count.textContent = `${members.length} member${members.length === 1 ? '' : 's'}`;
    const list = document.createElement('ol');
    members.forEach((name) => {
      const li = document.createElement('li');
      li.textContent = name;
      list.append(li);
    });
    card.append(heading, count, list);
    cards.append(card);
  });
  currentGroups = groups;
  currentLabels = labels;
  currentOmitted = omitted;
  summary.textContent = `${groups.reduce((n, group) => n + group.length, 0)} people in ${groups.length} group${groups.length === 1 ? '' : 's'}. Every included name appears once.`;
  omittedSummary.hidden = omitted.length === 0;
  omittedSummary.textContent = omitted.length ? `Omitted from this draw (${omitted.length}): ${omitted.join(', ')}` : '';
  results.hidden = false;
  message.textContent = '';
  if (firstDraw) document.querySelector('#results-heading').focus();
}
function randomize() {
  const { chosen, omitted } = selectedParticipants();
  const parsed = reviewNames(chosen);
  reviewDuplicates(parsed.duplicates);
  if (parsed.duplicates.length && !confirmDuplicates.checked) {
    clearResults();
    message.textContent = 'Review the repeated names below. Correct them, or confirm they represent separate participants.';
    duplicateBox.scrollIntoView({ block: 'nearest' });
    return;
  }
  try {
    const count = groupCount(mode(), Number(numberField.value), parsed.names.length);
    const labels = groupLabels(groupNamesField.value, count);
    render(makeGroups(parsed.names, count), labels, omitted.map((entry) => entry.name));
    lastInput = namesField.value;
  } catch (error) {
    clearResults();
    message.textContent = error.message;
  }
}
form.addEventListener('submit', (event) => { event.preventDefault(); randomize(); });
form.elements.method.forEach((radio) => radio.addEventListener('change', updateMode));
namesField.addEventListener('input', () => { confirmDuplicates.checked = false; populateParticipants(); clearResults(); });
options.addEventListener('change', () => { confirmDuplicates.checked = false; reviewDuplicates(reviewNames(selectedParticipants().chosen).duplicates); clearResults(); });
numberField.addEventListener('input', clearResults);
groupNamesField.addEventListener('input', clearResults);
confirmDuplicates.addEventListener('change', clearResults);
shuffleButton.addEventListener('click', () => {
  if (!currentGroups || namesField.value !== lastInput) return;
  randomize();
});
copyButton.addEventListener('click', async () => {
  if (!currentGroups) return;
  try {
    await navigator.clipboard.writeText(formatGroups(currentGroups, currentLabels, currentOmitted));
    message.textContent = 'Groups copied.';
  } catch {
    message.textContent = 'Copy was blocked by your browser. Select and copy the group cards instead.';
  }
});
document.querySelector('#print-results').addEventListener('click', () => window.print());
