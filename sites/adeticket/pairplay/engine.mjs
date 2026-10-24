export const SYMBOLS = ['☀','☾','★','✿','◆','♫','☂','⚓','✦','❄','♠','♥'];
export function shuffledDeck(pairs, random=Math.random) {
  if (![6,8,12].includes(pairs)) throw new RangeError('Choose 6, 8 or 12 pairs.');
  const deck=SYMBOLS.slice(0,pairs).flatMap((symbol)=>[symbol,symbol]);
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}
export function createGame(deck){return {deck:[...deck],open:[],matched:[],moves:0};}
export function flip(state,index){
  if(!Number.isInteger(index)||index<0||index>=state.deck.length||state.open.length===2||state.open.includes(index)||state.matched.includes(index))return state;
  const next={...state,open:[...state.open,index]};
  if(next.open.length===2){next.moves++;const [a,b]=next.open;if(next.deck[a]===next.deck[b]){next.matched=[...state.matched,a,b];next.open=[];}}
  return next;
}
export function closeMismatch(state){return state.open.length===2?{...state,open:[]}:state;}
export function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
