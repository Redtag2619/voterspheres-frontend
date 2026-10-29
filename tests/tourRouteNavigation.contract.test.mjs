import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../src/lib/tourRouteNavigation.js', import.meta.url), 'utf8');
const { tourRouteDecision: decide } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const args = { pageId: 'money', pathname: '/executive-workspace', target: '/dark-money-exposure' };
test('selected stop navigates once, then starts only on its destination', () => {
  const first = decide(null, args);
  assert.equal(first.action, 'navigate');
  assert.equal(decide(first.state, args).action, 'blocked');
  assert.equal(decide(first.state, { ...args, pathname: args.target }).action, 'play');
});
test('leaving Political Money Exposure respects manual navigation', () => {
  const arrived = decide(null, { ...args, pathname: args.target });
  for (const pathname of ['/power-rankings', '/donors', '/executive-workspace']) {
    assert.equal(decide(arrived.state, { ...args, pathname }).action, 'leave');
  }
});
test('automatic and picker page changes still request their new destination', () => {
  const arrived = decide(null, { ...args, pathname: args.target });
  assert.equal(decide(arrived.state, { pageId: 'rankings', pathname: args.target, target: '/power-rankings' }).action, 'navigate');
});
test('redirects never create repeated navigation or narrate the wrong page', () => {
  let state = decide(null, args).state;
  for (let i = 0; i < 10; i++) {
    const result = decide(state, { ...args, pathname: '/dashboard' });
    assert.equal(result.action, 'blocked'); state = result.state;
  }
});
test('Replay explicitly allows one new attempt after a blocked destination', () => {
  const pending = decide(null, args);
  const retry = decide(pending.state, { ...args, retry: 1 });
  assert.equal(retry.action, 'navigate');
  assert.equal(decide(retry.state, { ...args, retry: 1 }).action, 'blocked');
});
test('actual player ends a departed tour without routing back or requesting speech', () => {
  const player = fs.readFileSync(new URL('../src/components/VirtualTour.jsx', import.meta.url), 'utf8');
  const leave = player.split('if (routeDecision.action === "leave") {')[1].split('if (routeDecision.action === "blocked")')[0];
  assert.match(leave, /setRunning\(false\)/);
  assert.doesNotMatch(leave, /navigate\(|fetchMarinSpeech\(/);
  assert.match(player, /tourRouteDecision\(routeAttemptRef.current/);
});
