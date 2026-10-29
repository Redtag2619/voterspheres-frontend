import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildRecordingPlan, inspectRecordings, generateRecordings, hash } from '../scripts/lib/tourRecordingPlan.mjs';
import { recordingInput, recordingIdentity } from '../src/lib/tourRecordingSpec.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const data = s => `data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const player = await fs.readFile(path.join(root,'src/components/VirtualTour.jsx'),'utf8');
const client = (await fs.readFile(path.join(root,'src/lib/recordedTourAudio.js'),'utf8')).replace("import hosting from '../config/tourAudioHosting.json';", 'const hosting = { base_url: \"\" };').replace("'./tourRecordingSpec'", JSON.stringify(data(await fs.readFile(path.join(root,'src/lib/tourRecordingSpec.js'),'utf8'))));
const { loadRecordedTourAudio } = await import(data(client));
const audio = Buffer.concat([Buffer.from('ID3'),Buffer.alloc(50)]);

test('approved Marin payload is preserved and every recording ID matches its exact input', async () => {
 const plan=await buildRecordingPlan(root);
 assert.ok(plan.clips.length>400);assert.equal(new Set(plan.clips.map(c=>c.id)).size,plan.clips.length);
 for(const c of plan.clips){assert.equal(c.id,hash(JSON.stringify(c.input)));assert.equal(c.input.voice,'marin');assert.equal(c.input.model,'gpt-4o-mini-tts');assert.ok(c.input.text.length<=1700);}
 assert.equal(recordingInput(' A\n B ').text,'A B');
});
test('playback fetches only its saved MP3, never a speech-generation endpoint', async () => {
 const calls=[];const text='Approved narration.';
 const url=await loadRecordedTourAudio(text,undefined,{cryptoImpl:crypto.webcrypto,baseUrl:'/app/',createObjectURL:()=> 'blob:saved',fetchImpl:async(u,o)=>{calls.push([u,o]);return new Response(audio,{headers:{'content-type':'audio/mpeg'}});}});
 assert.equal(url,'blob:saved');assert.equal(calls.length,1);
 assert.equal(calls[0][0],`/app/tour-audio/${hash(recordingIdentity(text))}.mp3`);assert.equal(calls[0][1].method,'GET');
 assert.ok(!player.includes('/api/tour/voice'));assert.ok(!player.includes('gpt-4o-mini-tts'));assert.ok(player.includes('loadRecordedTourAudio(text, signal'));
});
test('missing/static HTML responses fail closed without a paid fallback', async () => {
 let count=0;
 await assert.rejects(loadRecordedTourAudio('Text',undefined,{cryptoImpl:crypto.webcrypto,fetchImpl:async()=>{count++;return new Response('<html>404</html>',{headers:{'content-type':'text/html'}});}}),/missing or invalid/);
 assert.equal(count,1);
});
test('recorder reuses saved clips, respects its batch bound, and resumes', async () => {
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'vs-recorded-'));
 try {
  const clips=['one','two','three'].map(text=>({id:hash(recordingIdentity(text)),input:recordingInput(text)}));const plan={clips};let calls=0;
  const options={plan,directory,key:'test-placeholder',maxNew:1,fetchImpl:async()=>{calls++;return new Response(audio,{headers:{'content-type':'audio/mpeg'}});}};
  assert.equal(await generateRecordings(options),1);assert.equal((await inspectRecordings(plan,directory)).missing.length,2);
  assert.equal(await generateRecordings({...options,maxNew:3}),2);assert.equal(calls,3);
  assert.equal(await generateRecordings(options),0);assert.equal(calls,3);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
test('quota failure stops after one request, preserves saved files, and never prints provider secrets', async () => {
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'vs-recorded-'));
 try {
  const text='one';let count=0;const plan={clips:[{id:hash(recordingIdentity(text)),input:recordingInput(text)}]};
  await assert.rejects(generateRecordings({plan,directory,key:'SECRET',maxNew:100,fetchImpl:async()=>{count++;return Response.json({error:{code:'credit_balance_exhausted',message:'SECRET'}},{status:429});}}),error=>error.message.includes('credit_balance_exhausted')&&!error.message.includes('SECRET'));
  assert.equal(count,1);assert.deepEqual(await fs.readdir(directory),[]);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
test('preview makes no recordings; apply requires the matching plan before reading API credentials', () => {
 const script=path.join(root,'scripts/recordPlatformTour.mjs');
 const preview=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.equal(preview.status,0,preview.stderr);assert.equal(JSON.parse(preview.stdout).mode,'preview');
 const apply=spawnSync(process.execPath,[script,'--apply','--plan='+'0'.repeat(64),'--key-env-file=does-not-exist'],{cwd:root,encoding:'utf8'});assert.notEqual(apply.status,0);assert.match(apply.stderr,/matching reviewed/);
});

test('recording plan covers live visibility/order/last-section wording without changing the script', async () => {
 const plan=await buildRecordingPlan(root);const ids=new Set(plan.clips.map(c=>c.id));
 const read=rel=>fs.readFile(path.join(root,rel),'utf8');
 const nav=data(await read('src/config/navigation.js'));const detail=data(await read('src/config/platformTourSections.js'));
 const expanded=(await read('src/config/platformTourSteps.js')).replace('"./navigation"',JSON.stringify(nav)).replace('"./platformTourSections"',JSON.stringify(detail));
 const pageSource=(await read('src/config/unifiedPlatformTour.js')).replace("'./platformTourSteps'",JSON.stringify(data(expanded)));
 const {getUnifiedTourPages}=await import(data(pageSource));const {sectionNarration,splitNarration}=await import(data(await read('src/lib/unifiedTourPlayback.js')));
 for(const mode of ['platform','admin'])for(const page of getUnifiedTourPages(mode)){
  for(const subset of [page.segments,[page.segments[0]], [page.segments[0],...page.segments.slice(1).reverse()],page.segments.filter((_,i)=>i===0||i%2)]){
   subset.forEach((part,index)=>{for(const text of splitNarration(sectionNarration(part,index,subset.length,page.value)))assert.ok(ids.has(hash(recordingIdentity(text))),page.route);});
  }
 }
});
