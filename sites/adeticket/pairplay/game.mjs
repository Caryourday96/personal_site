import {shuffledDeck,createGame,flip,closeMismatch,formatTime} from './engine.mjs';
const $=id=>document.getElementById(id);
const labels={'☀':'sun','☾':'moon','★':'star','✿':'flower','◆':'diamond','♫':'music','☂':'umbrella','⚓':'anchor','✦':'sparkle','❄':'snowflake','♠':'spade','♥':'heart'};
let count=6,state,started=null,ticker=null,timeout=null,elapsed=0,paused=false,pausedAt=0;
const done=()=>state.matched.length===count*2;
function best(){try{const v=JSON.parse(localStorage.getItem(`pairplay-best-${count}`));return v&&Number.isInteger(v.moves)&&v.moves>=count&&Number.isFinite(v.time)&&v.time>=0?v:null;}catch{return null;}}
function clock(){if(started!==null&&!paused)elapsed=Math.floor((performance.now()-started)/1000);$('time').textContent=formatTime(elapsed);}
function stats(){
  $('moves').textContent=state.moves;$('pairs').textContent=`${state.matched.length/2} / ${count}`;
  const record=best();$('best').textContent=state.players===2?'—':record?record.moves:'—';$('best').title=record?`${record.moves} moves in ${formatTime(record.time)}`:'Finish a solo board to set a best';
  $('scoreboard').hidden=state.players!==2;$('scoreboard').textContent=`Player 1: ${state.scores[0]} · Player 2: ${state.scores[1]}${done()?'':` — Player ${state.turn+1}'s turn`}`;
  $('pause').disabled=state.players!==1||started===null||done()||state.open.length>0;
}
function render(){
  [...$('board').children].forEach((button,i)=>{const matched=state.matched.includes(i),visible=matched||state.open.includes(i);button.className=`card${visible?' flipped':''}${matched?' matched':''}`;button.setAttribute('aria-disabled',String(matched||state.open.includes(i)));button.setAttribute('aria-label',`Card ${i+1}: ${visible?labels[state.deck[i]]:'face down'}${matched?', matched':''}`);button.firstChild.textContent=visible?state.deck[i]:'✦';button.firstChild.className=visible?'symbol':'back';});stats();
}
function select(index){
  if(paused)return;const next=flip(state,index);if(next===state)return;
  if(started===null){started=performance.now();ticker=setInterval(clock,250);}
  const oldMatched=state.matched.length;state=next;render();
  if(done()){
    clock();clearInterval(ticker);let suffix='';
    if(state.players===1){const record=best(),improved=!record||state.moves<record.moves||(state.moves===record.moves&&elapsed<record.time);if(improved){try{localStorage.setItem(`pairplay-best-${count}`,JSON.stringify({moves:state.moves,time:elapsed}));suffix=' A new personal best!';}catch{suffix=' Browser storage is unavailable; this result was not saved.';}}}
    else suffix=state.scores[0]===state.scores[1]?' A tie — well played!':` Player ${state.scores[0]>state.scores[1]?1:2} wins!`;
    $('status').textContent='All pairs matched. Well played!';$('summary').textContent=`${count} pairs in ${state.moves} moves and ${formatTime(elapsed)}.${suffix}`;$('result').hidden=false;stats();$('again').focus();
  }else if(state.open.length===2){
    $('status').textContent='Not a match. Keep those two in mind.';
    timeout=setTimeout(()=>{state=closeMismatch(state);render();$('status').textContent=state.players===2?`Player ${state.turn+1}, your turn.`:'Choose your next pair.';timeout=null;},1100);
  }else $('status').textContent=state.matched.length>oldMatched?'A match! Take another turn.':'One more card — where is its match?';
}
function setPaused(value){
  if(value&&($('pause').disabled||paused))return;
  if(value){clock();pausedAt=performance.now();}else if(paused){started+=performance.now()-pausedAt;}
  paused=value;$('board').hidden=value;$('paused').hidden=!value;$('pause').textContent=value?'Resume':'Pause';
  $('status').textContent=value?'Game paused. Cards are hidden.':'Choose your next pair.';
  if(value)$('resume').focus();else $('board').firstChild.focus();
}
function reset(pairs=count){
  clearInterval(ticker);clearTimeout(timeout);count=pairs;state=createGame(shuffledDeck(count),Number($('mode').value));started=null;elapsed=0;paused=false;pausedAt=0;
  $('time').textContent='0:00';$('result').hidden=true;$('paused').hidden=true;$('board').hidden=false;$('pause').textContent='Pause';
  $('status').textContent=state.players===2?'Player 1 starts. Match a pair to score and play again; a miss passes the turn.':'Pick any card to begin. The clock starts with your first flip.';
  $('board').className=`board${count===12?' hard':''}`;$('board').replaceChildren();
  state.deck.forEach((_,i)=>{const button=document.createElement('button');button.type='button';button.append(document.createElement('span'));button.addEventListener('click',()=>select(i));button.addEventListener('keydown',event=>{const cols=count===12&&matchMedia('(min-width:720px)').matches?6:4;const offset={ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols}[event.key];if(offset){event.preventDefault();$('board').children[(i+offset+state.deck.length)%state.deck.length].focus();}});$('board').append(button);});
  document.querySelectorAll('[data-pairs]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.pairs)===count)));render();
}
document.querySelectorAll('[data-pairs]').forEach(button=>button.addEventListener('click',()=>reset(Number(button.dataset.pairs))));
$('mode').addEventListener('change',()=>reset());$('restart').addEventListener('click',()=>reset());$('again').addEventListener('click',()=>{reset();$('board').firstChild.focus();});$('pause').addEventListener('click',()=>setPaused(!paused));$('resume').addEventListener('click',()=>setPaused(false));reset();
