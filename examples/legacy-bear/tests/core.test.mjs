import test from 'node:test';import assert from 'node:assert/strict';
import {track,random,ik2,validateFilm} from '../src/core.mjs';
test('track clamps, interpolates and holds without depending on access order',()=>{const k=[[0,0],[2,100,'linear'],[4,50]];assert.equal(track(k,-1),0);assert.equal(track(k,1),50);assert.equal(track(k,99),50);const a=track(k,3);track(k,0);assert.equal(track(k,3),a);});
test('seeded effects reproduce the same samples',()=>{const a=random(42),b=random(42);assert.deepEqual(Array.from({length:100},a),Array.from({length:100},b));});
test('IK preserves segment lengths for reachable targets',()=>{const r={x:0,y:0},t={x:80,y:30},k=ik2(r,t,60,50);assert.ok(Math.abs(Math.hypot(k.x,k.y)-60)<1e-7);assert.ok(Math.abs(Math.hypot(t.x-k.x,t.y-k.y)-50)<1e-7);});
test('IK is finite for coincident and unreachable targets',()=>{for(const t of [{x:0,y:0},{x:10000,y:0}]){const k=ik2({x:0,y:0},t,50,50);assert.ok(Number.isFinite(k.x)&&Number.isFinite(k.y));}});
test('validator rejects shot gaps',()=>{assert.throws(()=>validateFilm({width:1920,height:1080,fps:24,duration:10,shots:[{start:0,end:3},{start:4,end:10}]}));});
