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
const printButton = document.querySelector('#print-results');
const drawNextButton = document.querySelector('#draw-next');
const revealRemainingButton = document.querySelector('#reveal-remaining');
const hatStand = document.querySelector('#draw-hat-stand');
const animationStyle = document.querySelector('#animation-style');
const drawMode = document.querySelector('#draw-mode');
const shuffleSound = document.querySelector('#shuffle-sound');
const animationHelp = document.querySelector('#animation-help');
let currentGroups = null;
let currentLabels = [];
let currentOmitted = [];
let lastInput = '';
let motionCleanup = () => {};
let motionFrame = 0;
let drawQueue = [];
let drawIndex = 0;
let drawGeneration = 0;
let activeDrawStyle = 'hat';
let stopSound = () => {};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateAnimationHelp() {
  const disabled = animationStyle.value === 'off' || reducedMotion.matches;
  shuffleSound.disabled = disabled;
  animationHelp.textContent = reducedMotion.matches
    ? drawMode.value === 'step'
      ? 'Draw next still reveals one name per tap. Your device skips motion and sound.'
      : 'Your device requests reduced motion, so names appear in groups immediately and shuffle sounds are paused.'
    : animationStyle.value === 'off'
      ? drawMode.value === 'step' ? 'Tap Draw next to reveal one name without motion or sound.' : 'Names appear in groups immediately. Shuffle sounds are paused.'
      : drawMode.value === 'step'
        ? 'Tap Draw next for each reveal (1.5 seconds). Reveal remaining finishes the draw immediately.'
        : 'Names move slowly into their groups automatically. Sound is optional and starts off.';
}
animationStyle.addEventListener('change', updateAnimationHelp);
drawMode.addEventListener('change', updateAnimationHelp);
reducedMotion.addEventListener('change', updateAnimationHelp);
updateAnimationHelp();

function playDrawSound(style) {
  stopSound();
  if (!shuffleSound.checked || style === 'off' || reducedMotion.matches) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    void context.resume();
    const start = context.currentTime + .03;
    const bursts = style === 'single' ? 1 : style.startsWith('hat') ? 7 : 4;
    const samples = Math.floor(context.sampleRate * .11);
    const buffer = context.createBuffer(1, samples, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples; i += 1) {
      const envelope = Math.sin(Math.PI * i / samples);
      channel[i] = (Math.random() * 2 - 1) * envelope;
    }
    for (let index = 0; index < bursts; index += 1) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const time = start + index * (style.startsWith('hat') ? .22 : .18);
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = 760 + index * 85;
      filter.Q.value = .55;
      gain.gain.value = .09;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(time);
    }
    const timer = window.setTimeout(() => { stopSound(); }, 3200);
    stopSound = () => {
      window.clearTimeout(timer);
      if (context.state !== 'closed') void context.close().catch(() => {});
      stopSound = () => {};
    };
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
  const duration = style === 'hat' ? 6000 : style === 'spin' ? 5000 : 4000;
  const stagger = 180;
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
      : style === 'spin' ? [
          { transform: `translate(${startX}px, ${sourceY}px) scale(.6) rotate(-110deg)`, opacity: 0 },
          { transform: `translate(${hatX - 90}px, ${hatY - 45}px) scale(1.12) rotate(90deg)`, opacity: 1, offset: .38 },
          { transform: `translate(${hatX + 80}px, ${hatY + 35}px) scale(1) rotate(270deg)`, opacity: 1, offset: .7 },
          { transform: 'translate(0, 0) scale(1) rotate(360deg)', opacity: 0 }
        ] : [
          { transform: `translate(${startX}px, ${sourceY}px) scale(.8)`, opacity: 0 },
          { transform: `translate(${startX}px, ${sourceY}px) scale(1)`, opacity: 1, offset: .15 },
          { transform: 'translate(0, 0) scale(1)', opacity: 0 }
        ];
    animations.push(pill.animate(frames, { duration, delay: index * stagger, easing: 'cubic-bezier(.25,.75,.2,1)', fill: 'both' }));
  });
  if (style === 'hat') animations.push(hat.animate([
    { transform: 'translateX(-50%) rotate(0deg)' },
    { transform: 'translateX(-50%) rotate(-12deg)', offset: .35 },
    { transform: 'translateX(-50%) rotate(11deg)', offset: .52 },
    { transform: 'translateX(-50%) rotate(-6deg)', offset: .72 },
    { transform: 'translateX(-50%) rotate(0deg)' }
  ], { duration: 5000, fill: 'both' }));
  timer = window.setTimeout(() => { if (!cancelled) motionCleanup(); }, duration + items.length * stagger + 100);
}

function resetStepDraw() {
  stopSound();
  drawGeneration += 1;
  drawQueue = [];
  drawIndex = 0;
  drawNextButton.hidden = true;
  revealRemainingButton.hidden = true;
  hatStand.hidden = true;
  copyButton.disabled = false;
  printButton.disabled = false;
}

function gatherIntoHat(names) {
  drawNextButton.disabled = true;
  if (reducedMotion.matches || !Element.prototype.animate) {
    drawNextButton.disabled = false;
    return;
  }
  const stage = document.createElement('div');
  stage.className = 'draw-stage';
  stage.setAttribute('aria-hidden', 'true');
  document.body.append(stage);
  const animations = [];
  const generation = drawGeneration;
  const hat = hatStand.getBoundingClientRect();
  const hatX = hat.left + hat.width / 2;
  const hatY = hat.top + hat.height / 2;
  const startY = Math.max(25, Math.min(window.innerHeight - 45, namesField.getBoundingClientRect().top + 35));
  let timer;
  motionCleanup = () => {
    window.clearTimeout(timer);
    animations.forEach((animation) => animation.cancel());
    stage.remove();
  };
  names.slice(0, 36).forEach((name, index) => {
    const pill = document.createElement('span');
    pill.className = 'draw-name';
    pill.textContent = name;
    pill.style.left = `${hatX}px`;
    pill.style.top = `${hatY}px`;
    stage.append(pill);
    const offsetX = ((index % 7) - 3) * 42;
    animations.push(pill.animate([
      { transform: `translate(${offsetX}px, ${startY - hatY}px) scale(1)`, opacity: 0 },
      { transform: `translate(${offsetX}px, ${startY - hatY}px) scale(1)`, opacity: 1, offset: .15 },
      { transform: 'translate(0, 0) scale(.45)', opacity: 0 }
    ], { duration: 2600, delay: index * 90, easing: 'ease-in', fill: 'both' }));
  });
  timer = window.setTimeout(() => {
    if (generation !== drawGeneration) return;
    motionCleanup();
    drawNextButton.disabled = false;
  }, 2700 + Math.min(names.length, 36) * 90);
}

function drawNext() {
  const next = drawQueue[drawIndex];
  if (!next || drawNextButton.disabled) return;
  drawNextButton.disabled = true;
  const generation = drawGeneration;
  const reveal = () => {
    if (generation !== drawGeneration) return;
    next.item.textContent = next.name;
    next.item.classList.remove('pending-name');
    drawIndex += 1;
    if (drawIndex === drawQueue.length) {
      drawNextButton.hidden = true;
      revealRemainingButton.hidden = true;
      hatStand.hidden = true;
      copyButton.disabled = false;
      printButton.disabled = false;
      summary.textContent = `${drawQueue.length} people in ${currentGroups.length} group${currentGroups.length === 1 ? '' : 's'}. Every included name appears once.`;
      copyButton.focus({ preventScroll: true });
    } else {
      drawNextButton.disabled = false;
      summary.textContent = `${next.name} → ${next.label}. ${drawIndex} of ${drawQueue.length} names drawn. Tap Draw next to continue.`;
    }
  };
  if (activeDrawStyle === 'off' || reducedMotion.matches || !Element.prototype.animate) {
    reveal();
    return;
  }
  next.item.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  playDrawSound('single');
  const stage = document.createElement('div');
  stage.className = 'draw-stage';
  stage.setAttribute('aria-hidden', 'true');
  const pill = document.createElement('span');
  pill.className = 'draw-name';
  pill.textContent = next.name;
  const target = next.item.getBoundingClientRect();
  const hat = hatStand.getBoundingClientRect();
  const x = Math.max(8, Math.min(window.innerWidth - 150, target.left));
  const y = Math.max(8, Math.min(window.innerHeight - 42, target.top));
  pill.style.left = `${x}px`;
  pill.style.top = `${y}px`;
  stage.append(pill);
  document.body.append(stage);
  const fromHat = activeDrawStyle === 'hat';
  const startX = (fromHat ? hat.left + hat.width / 2 : window.innerWidth / 2) - x;
  const startY = Math.max(50, Math.min(window.innerHeight - 80, fromHat ? hat.top + hat.height / 2 : 100)) - y;
  const frames = activeDrawStyle === 'spin' ? [
    { transform: `translate(${startX}px, ${startY}px) scale(.6) rotate(-90deg)`, opacity: 0 },
    { transform: `translate(${startX - 60}px, ${startY + 60}px) scale(1) rotate(90deg)`, opacity: 1, offset: .35 },
    { transform: `translate(${startX + 40}px, ${startY + 110}px) scale(1) rotate(270deg)`, opacity: 1, offset: .65 },
    { transform: 'translate(0, 0) scale(1) rotate(360deg)', opacity: 1, offset: .95 },
    { transform: 'translate(0, 0) scale(1) rotate(360deg)', opacity: 0 }
  ] : activeDrawStyle === 'cascade' ? [
    { transform: `translate(${startX}px, ${startY}px) scale(.7)`, opacity: 0 },
    { transform: `translate(${startX}px, ${startY}px) scale(1)`, opacity: 1, offset: .25 },
    { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: .95 },
    { transform: 'translate(0, 0) scale(1)', opacity: 0 }
  ] : [
    { transform: `translate(${startX}px, ${startY}px) scale(.45) rotate(-18deg)`, opacity: 0 },
    { transform: `translate(${startX}px, ${startY}px) scale(.8) rotate(12deg)`, opacity: 1, offset: .2 },
    { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: .9 },
    { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 0 }
  ];
  const animation = pill.animate(frames, { duration: 1500, easing: 'cubic-bezier(.18,.7,.25,1)', fill: 'both' });
  motionCleanup = () => { animation.cancel(); stage.remove(); };
  animation.finished.then(() => { motionCleanup(); reveal(); }, () => {});
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
  resetStepDraw();
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
  resetStepDraw();
  const firstDraw = results.hidden;
  const style = animationStyle.value;
  const stepDraw = drawMode.value === 'step';
  activeDrawStyle = style;
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
      li.textContent = stepDraw ? 'Waiting to be drawn' : name;
      if (stepDraw) li.className = 'pending-name';
      list.append(li);
    });
    card.append(heading, count, list);
    cards.append(card);
  });
  currentGroups = groups;
  currentLabels = labels;
  currentOmitted = omitted;
  const total = groups.reduce((n, group) => n + group.length, 0);
  summary.textContent = stepDraw
    ? `0 of ${total} names drawn. Tap Draw next to reveal each assignment.`
    : `${total} people in ${groups.length} group${groups.length === 1 ? '' : 's'}. Every included name appears once.`;
  omittedSummary.hidden = omitted.length === 0;
  omittedSummary.textContent = omitted.length ? `Omitted from this draw (${omitted.length}): ${omitted.join(', ')}` : '';
  results.hidden = false;
  message.textContent = '';
  if (firstDraw) document.querySelector('#results-heading').focus();
  if (stepDraw) {
    const lists = [...cards.querySelectorAll('.group-card ol')];
    for (let row = 0; row < Math.max(...groups.map((group) => group.length)); row += 1) {
      groups.forEach((group, index) => {
        if (group[row] !== undefined) drawQueue.push({ name: group[row], label: labels[index], item: lists[index].children[row] });
      });
    }
    drawNextButton.hidden = false;
    revealRemainingButton.hidden = false;
    hatStand.hidden = style !== 'hat';
    drawNextButton.disabled = false;
    copyButton.disabled = true;
    printButton.disabled = true;
    results.scrollIntoView({ block: 'start', behavior: 'instant' });
    if (style === 'hat') {
      playDrawSound(style);
      motionFrame = window.requestAnimationFrame(() => { motionFrame = 0; gatherIntoHat(groups.flat()); });
    }
  } else if (style !== 'off' && !reducedMotion.matches) {
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
drawNextButton.addEventListener('click', drawNext);
revealRemainingButton.addEventListener('click', () => {
  if (!drawQueue.length) return;
  window.cancelAnimationFrame(motionFrame);
  motionCleanup();
  for (const entry of drawQueue) {
    entry.item.textContent = entry.name;
    entry.item.classList.remove('pending-name');
  }
  const total = drawQueue.length;
  resetStepDraw();
  summary.textContent = `${total} people in ${currentGroups.length} group${currentGroups.length === 1 ? '' : 's'}. Every included name appears once.`;
  copyButton.focus({ preventScroll: true });
});
shuffleSound.addEventListener('change', () => { if (!shuffleSound.checked) stopSound(); });
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
