import { parseNames, reviewNames, groupCount, groupLabels, makeGroups, formatGroups } from './grouper.mjs';

const form = document.querySelector('#grouper-form');
const namesField = document.querySelector('#names');
const numberField = document.querySelector('#group-number');
const groupNamesField = document.querySelector('#group-names');
const picker = document.querySelector('#participant-picker');
const options = document.querySelector('#participant-options');
const participantSummary = document.querySelector('#participant-summary');
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
const animationStyle = document.querySelector('#animation-style');
const shuffleSound = document.querySelector('#shuffle-sound');
const animationHelp = document.querySelector('#animation-help');
let currentGroups = null;
let currentLabels = [];
let currentOmitted = [];
let lastInput = '';
let motionCleanup = () => {};
let motionFrame = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateAnimationHelp() {
  const disabled = animationStyle.value === 'off' || reducedMotion.matches;
  shuffleSound.disabled = disabled;
  animationHelp.textContent = reducedMotion.matches
    ? 'Your device requests reduced motion, so names appear in groups immediately and shuffle sounds are paused.'
    : animationStyle.value === 'off'
      ? 'Names appear in groups immediately. Shuffle sounds are paused.'
      : animationStyle.value === 'hat'
        ? 'Names gather into a hat before moving into groups. Sound is optional and starts off.'
        : 'Names fly directly into their groups. Sound is optional and starts off.';
}
animationStyle.addEventListener('change', updateAnimationHelp);
reducedMotion.addEventListener('change', updateAnimationHelp);
updateAnimationHelp();

function playDrawSound(style) {
  if (!shuffleSound.checked || style === 'off' || reducedMotion.matches) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    void context.resume();
    const start = context.currentTime + .03;
    const notes = style === 'hat' ? [310, 270, 235, 205, 390, 490, 610] : [290, 350, 420, 510];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const time = start + index * (style === 'hat' ? .15 : .1);
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(.0001, time);
      gain.gain.exponentialRampToValueAtTime(.035, time + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, time + .09);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + .1);
    });
    window.setTimeout(() => { void context.close(); }, 1800);
  } catch { /* Audio is optional; grouping must still work. */ }
}

function animateDraw(style) {
  motionCleanup();
  if (style === 'off' || reducedMotion.matches || !Element.prototype.animate) return;
  const items = [...cards.querySelectorAll('.group-card li')].slice(0, 48);
  if (!items.length) return;
  const stage = document.createElement('div');
  stage.className = 'draw-stage';
  stage.setAttribute('aria-hidden', 'true');
  const hat = document.createElement('div');
  hat.className = 'draw-hat';
  hat.innerHTML = '<span class="hat-crown"></span><span class="hat-brim"></span>';
  if (style === 'hat') stage.append(hat);
  document.body.append(stage);
  const animations = [];
  let cancelled = false;
  let timer;
  motionCleanup = () => {
    cancelled = true;
    window.clearTimeout(timer);
    animations.forEach((animation) => animation.cancel());
    stage.remove();
    cards.classList.remove('is-drawing');
  };
  cards.classList.add('is-drawing');
  const centerX = window.innerWidth / 2;
  const centerY = Math.min(window.innerHeight * .42, 330);
  const startY = Math.max(24, Math.min(window.innerHeight - 70, namesField.getBoundingClientRect().top + 35));
  const duration = style === 'hat' ? 780 : 650;
  items.forEach((item, index) => {
    const box = item.getBoundingClientRect();
    const x = Math.max(8, Math.min(window.innerWidth - 150, box.left));
    const y = Math.max(8, Math.min(window.innerHeight - 42, box.top));
    const pill = document.createElement('span');
    pill.className = 'draw-name';
    pill.textContent = item.textContent;
    pill.style.left = `${x}px`;
    pill.style.top = `${y}px`;
    stage.append(pill);
    const startX = centerX - x + ((index % 5) - 2) * 34;
    const sourceY = startY - y;
    const hatX = centerX - x;
    const hatY = centerY - y;
    const frames = style === 'hat'
      ? [
          { transform: `translate(${startX}px, ${sourceY}px) scale(1) rotate(0deg)`, opacity: 0, offset: 0 },
          { transform: `translate(${startX}px, ${sourceY}px) scale(1) rotate(0deg)`, opacity: 1, offset: .08 },
          { transform: `translate(${hatX}px, ${hatY}px) scale(.55) rotate(${(index % 2 ? 1 : -1) * 22}deg)`, opacity: 1, offset: .38 },
          { transform: `translate(${hatX}px, ${hatY}px) scale(.3) rotate(0deg)`, opacity: 0, offset: .47 },
          { transform: `translate(${hatX}px, ${hatY}px) scale(.45) rotate(0deg)`, opacity: 0, offset: .58 },
          { transform: `translate(${hatX}px, ${hatY}px) scale(.75) rotate(${(index % 2 ? 1 : -1) * 14}deg)`, opacity: 1, offset: .68 },
          { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 0, offset: 1 }
        ]
      : [
          { transform: `translate(${startX}px, ${sourceY}px) scale(.8)`, opacity: 0 },
          { transform: `translate(${startX}px, ${sourceY}px) scale(1)`, opacity: 1, offset: .15 },
          { transform: 'translate(0, 0) scale(1)', opacity: 0 }
        ];
    animations.push(pill.animate(frames, { duration, delay: index * (style === 'hat' ? 38 : 42), easing: 'cubic-bezier(.25,.75,.2,1)', fill: 'both' }));
  });
  if (style === 'hat') animations.push(hat.animate([
    { transform: 'translateX(-50%) rotate(0deg)' },
    { transform: 'translateX(-50%) rotate(-12deg)', offset: .35 },
    { transform: 'translateX(-50%) rotate(11deg)', offset: .52 },
    { transform: 'translateX(-50%) rotate(-6deg)', offset: .72 },
    { transform: 'translateX(-50%) rotate(0deg)' }
  ], { duration: 1150, fill: 'both' }));
  timer = window.setTimeout(() => { if (!cancelled) motionCleanup(); }, duration + items.length * 42 + 100);
}

function mode() { return form.elements.method.value; }
function updateMode() {
  const isSize = mode() === 'size';
  document.querySelector('#number-label').textContent = isSize ? 'Maximum members per group' : 'Number of groups';
  numberField.value = isSize ? '4' : '2';
  clearResults();
}
function clearResults() {
  window.cancelAnimationFrame(motionFrame);
  motionCleanup();
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
  updateParticipantSummary();
}
function updateParticipantSummary() {
  const { chosen, omitted } = selectedParticipants();
  participantSummary.textContent = `${chosen.length} included · ${omitted.length} omitted`;
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
  window.cancelAnimationFrame(motionFrame);
  motionCleanup();
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
  const style = animationStyle.value;
  if (style !== 'off' && !reducedMotion.matches) {
    results.scrollIntoView({ block: 'start', behavior: 'instant' });
    playDrawSound(style);
    motionFrame = window.requestAnimationFrame(() => { motionFrame = 0; animateDraw(style); });
  }
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
options.addEventListener('change', () => { confirmDuplicates.checked = false; reviewDuplicates(reviewNames(selectedParticipants().chosen).duplicates); updateParticipantSummary(); clearResults(); });
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
document.querySelector('#clear-form').addEventListener('click', () => {
  if ((namesField.value.trim() || groupNamesField.value.trim()) && !window.confirm('Clear this list and start over?')) return;
  namesField.value = '';
  groupNamesField.value = '';
  form.elements.method.value = 'groups';
  numberField.value = '2';
  document.querySelector('#number-label').textContent = 'Number of groups';
  confirmDuplicates.checked = false;
  populateParticipants();
  clearResults();
  namesField.focus();
});
