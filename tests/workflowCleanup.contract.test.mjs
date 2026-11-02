import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cleanScope, patchScope, resolveScope, scopeIdentity, workflowHref, taskMatchesWorkflow} from '../src/lib/workflowScope.js';
import {workflowPages} from '../src/config/workflowPages.js';
import {canAccessRoute} from '../src/lib/entitlements.js';
const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('handoff retains supported context and cannot carry secrets or switch a workspace', () => {
  const url = workflowHref('/fundraising', {cycle:2028,state:'tx',candidate_id:'H2TX30178',token:'secret',workspace_id:99},4);
  const query = new URLSearchParams(url.split('?')[1]);
  assert.equal(query.get('workspace_id'),'4'); assert.equal(query.get('token'),null);
  assert.deepEqual(resolveScope(query.toString()), {cycle:'2028',state:'TX',candidate_id:'H2TX30178'});
});
test('history snapshots explicitly clear filters instead of reviving remembered values', () => {
  assert.deepEqual(resolveScope('?workflow=1&cycle=2030&state=&candidate_id=', {state:'TX',candidate_id:'H2TX30178'}),{cycle:'2030'});
  assert.deepEqual(resolveScope('?state=GA', {cycle:2028}),{cycle:'2028',state:'GA'});
});
test('invalid scopes fail closed and changing fields preserves other context', () => {
  assert.deepEqual(cleanScope({cycle:2027,state:'Texas',candidate_id:'<script>',token:'secret'}),{});
  assert.deepEqual(patchScope({cycle:'2028',state:'TX',candidate_id:'H2TX30178'},{state:''}),{cycle:'2028',candidate_id:'H2TX30178'});
});
test('remembered context is partitioned by firm, user and workspace', () => {
  const user={id:7,firm_id:2};
  assert.notEqual(scopeIdentity(user,4),scopeIdentity(user,5));
  assert.notEqual(scopeIdentity(user,4),scopeIdentity({...user,id:8},4));
  assert.notEqual(scopeIdentity(user,4),scopeIdentity({...user,firm_id:3},4));
});
test('workflow destinations are registered and no specialist page is redirected', () => {
  const app=source('src/App.jsx'); const routes=new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(m=>m[1]));
  for (const page of Object.values(workflowPages)) for (const next of page.next) assert.ok(routes.has(next),next);
  assert.match(app,/path="\/relationship-graph" element={<RelationshipGraph/);
  assert.match(app,/path="\/state-operations-map" element={<StateOperationsMap/);
});
test('finance reads and fallback requests pass selected cycle; old responses are guarded', () => {
  const finance=source('src/pages/CampaignFinanceIntelligencePlatform.jsx');
  const fundraising=source('src/pages/FundraisingDashboard.jsx');
  assert.match(finance,/limit: 1000,\s+cycle,/);
  assert.equal((fundraising.match(/params: \{ limit: 1000, cycle \}/g)||[]).length,2);
  for(const text of [finance,fundraising]) assert.match(text,/generation !== requestGeneration.current/);
});
test('detail pages collapse duplicate shell metrics and links respect entitlement and role guards', () => {
  const shell=source('src/components/AppShell.jsx'); const guide=source('src/components/WorkflowGuide.jsx');
  assert.match(shell,/location.pathname === "\/executive-workspace"/); assert.match(shell,/<details className="vs-global-context"/);
  assert.match(guide,/canAccessRoute/); assert.match(guide,/hasAllPermissions/);
  assert.equal(canAccessRoute({pathname:'/task-ownership',planTier:'starter',user:{role:'viewer'}}),false);
});

test("approved tour catalog, recording identity and player remain unchanged", () => {
  const expected = {"src/components/VirtualTour.jsx": "f97cae3eac68f5bb01f55a2ef080eb6259ca59b05cb93d9595e74eee21ad898a", "src/config/navigation.js": "3e97e2ebf10ccefca9a1fc1b3f91fd9ff561ef0f13217f5be4ee4dd3da707546", "src/config/platformTourSteps.js": "47cd150fdebd80464eb7b42b0113dca0f4a5f611149d50d101f725edfc08273d", "src/config/platformTourSections.js": "7a32258d4ca70d03cbfb1e8001c74c3661ef6f039495ec852d31b4adb5daac76", "src/lib/tourRecordingSpec.js": "83d9ff30d26bd9ee52fa2897ae2697c4f0d5b95addc6a8bf054162421b448f85", "src/config/tourAudioHosting.json": "451364ee1a518c078d8e7741ef0191d7a768687efb7cfd9f7663b5bd0107b1fe"};
  for (const [file,digest] of Object.entries(expected)) assert.equal(createHash("sha256").update(source(file).replace(/\r\n/g,"\n")).digest("hex"),digest,file);
});

test('sign-in lands in the primary workspace and workspace shortcuts use registered primary routes', () => {
  const login=source('src/pages/Login.jsx');
  assert.match(login,/requestedNext.*startsWith/);
  assert.match(login,/: "\/executive-workspace"/);
  const workspace=source('src/pages/ExecutiveWorkspace.jsx');
  assert.ok(!workspace.includes('to="/unified-executive-intelligence"'));
  for(const path of ['/executive-intelligence','/state-operations','/political-intelligence']) assert.ok(workspace.includes('to="'+path+'"'));
});

test('task lists default to the active workspace; firm-wide is explicit and state applies to either view', () => {
  const task={workspace_id:4,state:'TX'};
  assert.equal(taskMatchesWorkflow(task,{},4),true);
  assert.equal(taskMatchesWorkflow(task,{},5),false);
  assert.equal(taskMatchesWorkflow({state:'TX'},{},4),false);
  assert.equal(taskMatchesWorkflow(task,{task_scope:'firm'},5),true);
  assert.equal(taskMatchesWorkflow(task,{task_scope:'firm',state:'GA'},5),false);
});
