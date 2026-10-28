import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = p => fs.readFile(new URL(p, root), 'utf8');
const dataUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const { collectVisiblePageSegments, sectionNarration, splitNarration, playUnifiedPage } = await import(dataUrl(await read('src/lib/unifiedTourPlayback.js')));
const nav = dataUrl(await read('src/config/navigation.js'));
const detail = dataUrl(await read('src/config/platformTourSections.js'));
const expanded = (await read('src/config/platformTourSteps.js')).replace('"./navigation"', JSON.stringify(nav)).replace('"./platformTourSections"', JSON.stringify(detail));
const { getTourSteps } = await import(dataUrl(expanded));
const unified = (await read('src/config/unifiedPlatformTour.js')).replace("'./platformTourSteps'", JSON.stringify(dataUrl(expanded)));
const { getUnifiedTourPages, groupTourPages } = await import(dataUrl(unified));

test('one page unit retains all section content, excludes separate chapters, and preserves conclusion', () => {
 for (const mode of ['platform', 'admin']) {
  const old = getTourSteps(mode);const pages = getUnifiedTourPages(mode);
  const expected = old.filter(x => x.section !== 'Introduction' && !x.sectionDetail && !x.id.endsWith('-chapter'));
  assert.deepEqual(pages.map(x => x.id), expected.map(x => x.id));
  assert.equal(pages.flatMap(x => x.segments).filter(x => x.sectionDetail).length, old.filter(x => x.sectionDetail).length);
  assert.ok(!pages.some(x => x.sectionDetail || x.id.endsWith('-chapter')));
  assert.equal(pages.at(-1).section, 'Conclusion');
  assert.ok(pages[0].segments[0].narration.startsWith(old.find(x => x.section === 'Introduction').narration));
 }
 assert.ok(!getUnifiedTourPages('platform').some(x => x.route.startsWith('/admin/') || x.section === 'Administration'));
});
test('visible sections follow actual page layout; hidden panels are excluded', () => {
 const page={segments:[{id:'intro'},{id:'lower',sectionDetail:true},{id:'hidden',sectionDetail:true},{id:'upper',sectionDetail:true}]};
 const nodes={intro:{order:0},lower:{order:2},upper:{order:1}};
 assert.deepEqual(collectVisiblePageSegments(page, x=>nodes[x.id], (a,b)=>a.order-b.order).map(x=>x.id),['intro','upper','lower']);
});
test('narration uses connected prose without page/chapter/value labels or truncation', () => {
 const text=sectionNarration({heading:'Evidence Coverage',narration:'Evidence Coverage. Inspect the sources.',value:'Judge confidence before acting.',sectionDetail:true},1,2,'Keep decisions grounded.');
 assert.match(text,/Start with Evidence Coverage/);assert.match(text,/Together, these sections/);
 assert.ok(!text.includes('Campaign and client value:'));
 const long=Array.from({length:900},(_,i)=>`word${i}`).join(' ');const chunks=splitNarration(long);
 assert.ok(chunks.length>1);assert.ok(chunks.every(x=>x.length<=1700));assert.equal(chunks.join(' '),long);
});
test('next narration prepares during current playback; next page is not completed early', async () => {
 const events=[];let finish;let entered;
 const playing=new Promise(r=>entered=r);const gate=new Promise(r=>finish=r);
 const run=playUnifiedPage({segments:[0,1,2],isCurrent:()=>true,
  prepare:async s=>{events.push(`prepare${s}`);return s;},
  present:async s=>events.push(`highlight${s}`),
  play:async (r,s)=>{events.push(`play${s}`);if(s===0){entered();await gate;}events.push(`end${s}`);},
  dispose:r=>events.push(`dispose${r}`)});
 await playing;await Promise.resolve();assert.ok(events.includes('prepare1'));assert.ok(!events.includes('highlight1'));assert.ok(!events.includes('prepare2'));
 finish();assert.equal(await run,true);
 assert.deepEqual(events.filter(x=>x.startsWith('highlight')),['highlight0','highlight1','highlight2']);
 assert.ok(events.indexOf('end2')<events.indexOf('dispose2'));
});
test('cancellation disposes pending audio and prevents stale highlights or completion', async () => {
 let current=true;let resolve;const deferred=new Promise(r=>resolve=r);const disposed=[];const highlighted=[];
 const run=playUnifiedPage({segments:[0,1],isCurrent:()=>current,prepare:()=>deferred,present:async s=>highlighted.push(s),play:async()=>{},dispose:x=>disposed.push(x)});
 current=false;resolve('late-url');assert.equal(await run,false);assert.deepEqual(disposed,['late-url']);assert.deepEqual(highlighted,[]);
});
test('playback failure rejects and disposes current and preloaded resources', async () => {
 const disposed=[];
 await assert.rejects(playUnifiedPage({segments:[0,1],isCurrent:()=>true,prepare:async s=>s,present:async()=>{},play:async()=>{throw new Error('voice failed');},dispose:r=>disposed.push(r)}),/voice failed/);
 await new Promise(r=>setTimeout(r,0));assert.deepEqual(disposed.sort(),[0,1]);
});
test('component integrates page playback, cancellation, page controls, and persistent admin mode', async () => {
 const src=await read('src/components/VirtualTour.jsx');
 assert.match(src,/getUnifiedTourPages\(mode/);assert.match(src,/playUnifiedPage\(/);
 assert.match(src,/signal,\s*headers:/);assert.match(src,/controller\.abort\(\)/);
 assert.match(src,/Next page/);assert.match(src,/Previous page/);
 assert.match(src,/search: `\?tour=\$\{mode/);
 assert.match(src,/voice: "marin"/);assert.match(src,/if \(!completed \|\| !isCurrent\(\)\) return/);
 assert.ok(!src.includes('const narration = buildNarration(step);'));
});
