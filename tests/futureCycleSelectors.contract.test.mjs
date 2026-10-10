import test from 'node:test';
import assert from 'node:assert/strict';
import {cycleOptions,initialCycle} from '../src/lib/electionCycleOptions.js';
test('all upcoming federal cycles are available and historic finance years remain available',()=>{
 const upcoming=cycleOptions();for(const year of [2028,2030,2032,2034])assert.ok(upcoming.includes(year));
 assert.ok(upcoming.every(year=>year>=2026&&year%2===0));
 for(const year of [2020,2022,2024])assert.ok(cycleOptions({historical:true}).includes(year));
});
test('valid selected year remains selectable beyond the normal display horizon',()=>{
 assert.ok(cycleOptions({selected:2050}).includes(2050));assert.ok(!cycleOptions({selected:2029}).includes(2029));
});
test('direct-link year takes priority over saved year',()=>{
 globalThis.window={location:{search:'?cycle=2030'}};
 globalThis.localStorage={getItem:()=> '2028'};
 try {assert.equal(initialCycle('Candidates'),2030);}finally{delete globalThis.window;delete globalThis.localStorage;}
});
test('saved year restores after refresh and invalid values use the current default',()=>{
 globalThis.window={location:{search:''}};
 globalThis.localStorage={getItem:()=> '2030'};
 try {assert.equal(initialCycle('DonorNetwork'),2030);globalThis.localStorage={getItem:()=> '2029'};assert.ok(initialCycle('DonorNetwork')%2===0);}finally{delete globalThis.window;delete globalThis.localStorage;}
});
