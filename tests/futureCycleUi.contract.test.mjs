import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const polling=fs.readFileSync(new URL('../src/pages/ExecutivePollingIntelligence.jsx',import.meta.url),'utf8');
const studio=fs.readFileSync(new URL('../src/pages/CampaignOperationsStudioAI.jsx',import.meta.url),'utf8');
const loadCode=polling.slice(polling.indexOf('async function load('),polling.indexOf('  useEffect(',polling.indexOf('async function load(')));
function pollingHarness({ filters, scopes, request, ref={current:0} }) {
 const data=[],errors=[],calls=[]; const context={filters,pollingRequestRef:ref,setRefreshing(){},setLoading(){},setError:e=>errors.push(e),setData:p=>data.push(p),setFilters(){},
 getExecutivePollingScopes:async()=>scopes,getExecutivePollingDashboard:async f=>{calls.push(f);return request?request(f):{cycle:f.cycle};}};
 vm.createContext(context);vm.runInContext(loadCode+'\nglobalThis.load=load;',context);return {...context,data,errors,calls};
}
test('blank election cycle resolves current registry cycle before fetching data',async()=>{
 const h=pollingHarness({filters:{temporal_scope:'election_cycle',cycle:''},scopes:{available_cycles:[{cycle:2028,status:'current'}]}});
 await h.load();assert.equal(h.calls[0].cycle,'2028');assert.equal(h.data[0].cycle,'2028');
});
test('explicit 2030 selection is passed unchanged',async()=>{
 const h=pollingHarness({filters:{temporal_scope:'election_cycle',cycle:'2030'}});await h.load();assert.equal(h.calls[0].cycle,'2030');
});
test('missing current registry cycle fails instead of fetching all cycles',async()=>{
 const h=pollingHarness({filters:{temporal_scope:'election_cycle',cycle:''},scopes:{available_cycles:[]}});await h.load();assert.equal(h.calls.length,0);assert.ok(h.errors.some(x=>x.includes('No current')));
});
test('continuous tracking does not need a registered election cycle',async()=>{
 const h=pollingHarness({filters:{temporal_scope:'continuous_tracking',cycle:''}});await h.load();assert.equal(h.calls.length,1);
});
test('late response cannot replace newly selected cycle',async()=>{
 const ref={current:0};let resolveOld;
 const old=pollingHarness({filters:{temporal_scope:'election_cycle',cycle:'2026'},ref,request:()=>new Promise(resolve=>resolveOld=resolve)});
 const pending=old.load();
 const fresh=pollingHarness({filters:{temporal_scope:'election_cycle',cycle:'2028'},ref});await fresh.load();
 resolveOld({cycle:'2026'});await pending;assert.equal(old.data.length,0);assert.equal(fresh.data[0].cycle,'2028');
});
const askCode=studio.slice(studio.indexOf('async function ask('),studio.indexOf('  async function openThread(',studio.indexOf('async function ask(')));
function studioHarness() {
 const outputs=[],errors=[]; const ref={current:'2028'};let resolveResponse;
 const noop=()=>{};
 const context={prompt:'plan',project:{cycle:'2028',state:'TX',office:'U.S. House'},threadId:null,electionCycleError:'',activeScopeRef:ref,
 clean:x=>String(x||'').trim(),buildStudioPrompt:x=>x,agentForModule:()=> 'campaign_strategist',Date,
 setGenerationFailure:noop,setMessages:x=>outputs.push(x),setPrompt:noop,setAsking:noop,setError:e=>errors.push(e),setMessage:noop,setThreadId:noop,loadThreads:async()=>{},
 api:{askAiCampaignCopilot:()=>new Promise(resolve=>resolveResponse=resolve)}};
 vm.createContext(context);vm.runInContext(askCode+'\nglobalThis.ask=ask;',context);
 return {context,outputs,errors,ref,resolve:r=>resolveResponse(r)};
}
test('Studio rejects late briefing after selected campaign scope changes',async()=>{
 const h=studioHarness();const pending=h.context.ask('plan');h.ref.current='2030';h.resolve({answer:'2028 answer',thread_id:1});await pending;
 assert.equal(h.outputs.length,1);assert.equal(h.errors.filter(Boolean).length,0);
});
