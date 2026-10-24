import test from 'node:test';
import assert from 'node:assert/strict';
import {shuffledDeck,createGame,flip,closeMismatch,formatTime} from '../sites/adeticket/pairplay/engine.mjs';
test('every difficulty has exactly two of every symbol',()=>{for(const pairs of [6,8,12]){const deck=shuffledDeck(pairs);assert.equal(deck.length,pairs*2);assert.equal(new Set(deck).size,pairs);for(const symbol of new Set(deck))assert.equal(deck.filter(s=>s===symbol).length,2);}assert.throws(()=>shuffledDeck(7));});
test('same card and invalid cards cannot count as moves',()=>{let state=createGame(['a','b','a','b']);assert.equal(flip(state,-1),state);state=flip(state,0);assert.equal(flip(state,0),state);assert.equal(state.moves,0);});
test('mismatch blocks a third flip and can be closed',()=>{let state=createGame(['a','b','a','b']);state=flip(flip(state,0),1);assert.equal(state.moves,1);assert.equal(flip(state,2),state);assert.deepEqual(closeMismatch(state).open,[]);assert.deepEqual(state.matched,[]);});
test('matched cards remain matched and the game can finish',()=>{let state=createGame(['a','b','a','b']);state=flip(flip(state,0),2);assert.deepEqual(state.matched,[0,2]);assert.equal(flip(state,0),state);state=flip(flip(state,1),3);assert.equal(state.matched.length,4);assert.equal(state.moves,2);assert.deepEqual(state.open,[]);});
test('timer displays minutes and padded seconds',()=>{assert.equal(formatTime(0),'0:00');assert.equal(formatTime(65),'1:05');});
