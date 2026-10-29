import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual provider callbacks with deterministic hook scheduling.
// This has no browser, React test package, or dependency installation requirement.
const original = fs.readFileSync(new URL('../src/context/ExecutiveFiltersContext.jsx', import.meta.url), 'utf8');
function provider(saved = null) {
  let slots = [], cursor = 0, dirty = false, effects = [], writes = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  function useState(init) {
    const i = cursor++;
    if (!slots[i]) {
      const slot = { value: typeof init === 'function' ? init() : init };
      slot.set = next => { const v = typeof next === 'function' ? next(slot.value) : next;
        if (!Object.is(v, slot.value)) { slot.value = v; dirty = true; } };
      slots[i] = slot;
    }
    return [slots[i].value, slots[i].set];
  }
  function useMemo(factory, deps) {
    const i = cursor++;
    if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { deps, value: factory() };
    return slots[i].value;
  }
  const useCallback = (fn, deps) => useMemo(() => fn, deps);
  function useEffect(fn, deps) {
    const i = cursor++;
    if (!slots[i] || !same(slots[i].deps, deps)) { slots[i] = { deps }; effects.push(fn); }
  }
  let source = original.replace(/^import .*?;\s*/s, '').replaceAll('export ', '');
  source = source.replace(/  return \(\s*<ExecutiveFiltersContext.Provider[\s\S]*?<\/ExecutiveFiltersContext.Provider>\s*\);/, '  return value;');
  const context = vm.createContext({ createContext: () => ({}), useContext: () => null,
    useState, useMemo, useCallback, useEffect,
    localStorage: { getItem: () => saved, setItem: () => { writes++; } } });
  vm.runInContext(source + '\nthis.renderProvider = ExecutiveFiltersProvider;', context);
  return { render() { cursor = 0; dirty = false; const value = context.renderProvider({});
      const pending = effects; effects = []; pending.forEach(fn => fn()); return value; },
    get dirty() { return dirty; }, get writes() { return writes; } };
}

test('unchanged state preserves filter and context identity without another storage write', () => {
  const p = provider(); const before = p.render(); const writes = p.writes;
  before.setFilters({ state: '' }); assert.equal(p.dirty, false);
  const after = p.render(); assert.equal(after, before); assert.equal(p.writes, writes);
});
test('real changes merge without losing unrelated filters and keep setter stable', () => {
  const p = provider(); const before = p.render(); before.setFilters({ state: 'TX', office: 'House' });
  assert.equal(p.dirty, true); const after = p.render();
  assert.equal(after.setFilters, before.setFilters); assert.equal(after.clearFilters, before.clearFilters);
  assert.equal(after.filters.state, 'TX'); assert.equal(after.filters.office, 'House'); assert.equal(after.filters.risk, '');
});
test('Political Money page effect settles instead of scheduling an endless render loop', () => {
  const p = provider(JSON.stringify({ state: 'GA', office: 'Senate', risk: 'High' }));
  let lastSetter, lastState, renders = 0;
  do {
    const value = p.render(); renders++;
    if (lastSetter !== value.setFilters || lastState !== '') {
      lastSetter = value.setFilters; lastState = ''; value.setFilters({ state: '' });
    }
  } while (p.dirty && renders < 10);
  assert.equal(renders, 2); assert.equal(p.dirty, false);
  assert.equal(p.render().filters.office, 'Senate');
});
test('clear resets changed filters and repeated clear is a no-op', () => {
  const p = provider(); const first = p.render(); first.setFilters({ state: 'TX', risk: 'High' });
  const changed = p.render(); changed.clearFilters(); assert.equal(p.dirty, true);
  const cleared = p.render(); assert.equal(cleared.filters.state, ''); assert.equal(cleared.filters.risk, '');
  cleared.clearFilters(); assert.equal(p.dirty, false); assert.equal(p.render(), cleared);
});
test('latest committed values are used across multiple partial updates', () => {
  const p = provider(); const first = p.render(); first.setFilters({ state: 'TX' }); first.setFilters({ risk: 'High' });
  const after = p.render(); assert.equal(after.filters.state, 'TX'); assert.equal(after.filters.risk, 'High');
});
