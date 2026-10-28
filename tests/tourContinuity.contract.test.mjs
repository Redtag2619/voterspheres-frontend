import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = p => fs.readFile(new URL(p, root), 'utf8');
const url = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const { nextTourSessionMode } = await import(url(await read('src/lib/tourSessionMode.js')));

test('Candidates removing tour query and next page restoring it does not restart a running tour', () => {
  for (const startingMode of ['platform', 'admin']) {
    let mode = startingMode; let pageIndex = 22; let resets = 0;
    // Exactly the trigger previously used by the component: mode changes restart.
    const visit = queryMode => { const next = nextTourSessionMode(mode, queryMode); if (next !== mode) { pageIndex = 0; resets++; } mode = next; };
    visit(''); // Candidates owns and rewrites its filter query string.
    assert.equal(pageIndex, 22); assert.equal(mode, startingMode);
    pageIndex++; visit(startingMode); // Finance destination receives tour mode again.
    assert.equal(pageIndex, 23); assert.equal(resets, 0);
  }
});
test('all page transitions survive alternating missing and restored query parameters', () => {
  let mode = 'platform';
  for (let page = 0; page < 75; page++) {
    const next = nextTourSessionMode(mode, page % 2 ? '' : 'platform');
    assert.equal(next, mode); mode = next;
  }
  assert.equal(nextTourSessionMode('platform','admin'),'admin');
  assert.equal(nextTourSessionMode('','platform'),'platform');
  assert.equal(nextTourSessionMode('admin','unexpected'),'admin');
});
test('actual component latches query launch mode instead of binding the session to filters', async () => {
  const src = await read('src/components/VirtualTour.jsx');
  assert.match(src,/const \[mode, setMode\] = useState\(queryMode\)/);
  assert.match(src,/setMode\(current => nextTourSessionMode\(current, queryMode\)\)/);
  assert.ok(!src.includes('const mode = getTourMode(location.search)'));
  // Tour restart is attached to session mode, not pathname or filter changes.
  const reset = src.slice(src.indexOf('    if (!mode) return;'), src.indexOf('    function updateSpotlight()'));
  assert.match(reset,/\}, \[mode\]\)/);
  assert.ok(!reset.includes('queryMode'));
  assert.match(src,/if \(queryMode && !running\)/); // A fresh start after Exit remains possible.
});
test('hide narration removes the large panel but retains show, pause, and exit controls', async () => {
  const src = await read('src/components/VirtualTour.jsx');
  assert.match(src,/!dockHidden && <aside/);
  assert.match(src,/onClick=\{\(\) => setDockHidden\(true\)\}/);
  assert.match(src,/Show narration/); assert.match(src,/Hide narration/);
  const compact = src.slice(src.indexOf('{dockHidden && ('), src.indexOf('{dockHidden && (') + 1900);
  assert.match(compact,/setDockHidden\(false\)/); assert.match(compact,/onClick=\{togglePause\}/); assert.match(compact,/stopTour\(\)/);
  const playback = src.slice(src.indexOf('    async function runStep()'), src.indexOf('  const displayStep ='));
  assert.ok(!playback.includes('dockHidden')); // Visibility cannot restart audio or change page.
});
