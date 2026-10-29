import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = p => fs.readFile(new URL(p, root), 'utf8');
const moduleUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const navigationSource = await read('src/config/navigation.js');
const { navigationSections } = await import(moduleUrl(navigationSource));
const sectionsSource = await read('src/config/platformTourSections.js');
const { pageSectionGuides } = await import(moduleUrl(sectionsSource));
const config = (await read('src/config/platformTourSteps.js'))
  .replace('"./navigation"', JSON.stringify(moduleUrl(navigationSource)))
  .replace('"./platformTourSections"', JSON.stringify(moduleUrl(sectionsSource)));
const { getTourSteps } = await import(moduleUrl(config));

test('customer modes exclude administration by flags and group names', () => {
  const forbidden = navigationSections.filter(s => s.adminOnly).flatMap(s => s.items.map(i => i.to));
  for (const mode of ['platform', 'public', 'demo']) {
    const steps = getTourSteps(mode);
    assert.ok(!steps.some(s => forbidden.includes(s.route) || s.route.startsWith('/admin/')));
    assert.ok(!steps.some(s => s.route.startsWith('/platform-tour')));
  }
});
test('every eligible destination retains its overview and chapter order', () => {
  const steps = getTourSteps('admin');
  const expected = navigationSections.flatMap(s => s.items).filter(i => !i.to.startsWith('/platform-tour'));
  for (const item of expected) {
    assert.ok(steps.some(s => s.route === item.to && !s.sectionDetail), item.to);
  }
  assert.equal(steps.at(-1).section, 'Conclusion');
  assert.match(steps.at(-1).narration, /No technology can guarantee/);
});
test('section walkthroughs remain on their page and carry purpose and exact targets', () => {
  for (const mode of ['platform', 'admin']) {
    const steps = getTourSteps(mode);
    assert.equal(new Set(steps.map(s => s.id)).size, steps.length);
    for (const [index, step] of steps.entries()) {
      if (!step.sectionDetail) continue;
      assert.equal(step.route, steps[index - 1].route);
      assert.ok(step.narration.length > 40, step.heading);
      assert.ok(step.value.length > 30, step.heading);
      assert.equal(step.target.exactSection, true);
      assert.ok(step.target.selector || step.target.headingText?.length);
    }
  }
  assert.ok(Object.keys(pageSectionGuides).length >= 70);
});
test('financial and polling explanations preserve source and model limits', () => {
  assert.match(JSON.stringify(pageSectionGuides['/donors']), /not a verified unique person/);
  assert.match(JSON.stringify(pageSectionGuides['/donors']), /does not mean every committee/);
  assert.match(JSON.stringify(pageSectionGuides['/executive-polling-intelligence']), /continuous/);
  assert.match(JSON.stringify(pageSectionGuides['/executive-polling-intelligence']), /returned sample/);
  assert.match(JSON.stringify(pageSectionGuides['/vendors']), /not a verified vendor capability/);
  assert.match(JSON.stringify(pageSectionGuides['/mailops']), /rather than a complete file-upload/);
});
test('existing Marin playback and manual controls remain; absent sections cannot fall back to page narration', async () => {
  const player = await read('src/components/VirtualTour.jsx');
  assert.match(await read('src/lib/tourRecordingSpec.js'), /voice: 'marin'/);
  for (const control of ['togglePause', 'goBack', 'replayNonce', 'voiceEnabled', 'browserFallback']) assert.ok(player.includes(control));
  assert.match(player, /return step\.sectionDetail \? null/);
  assert.match(player, /collectVisiblePageSegments\(step/);
  assert.match(player, /if \(isCurrent\(\)\) moveToNext\(\)/);
  assert.ok(!player.includes('node.click('));
});

test('actual target resolver matches exact page headings and never narrates an absent section as the page', async () => {
  const { runInNewContext } = await import('node:vm');
  const player = await read('src/components/VirtualTour.jsx');
  const functionText = player.slice(player.indexOf('async function waitForTarget(step)'), player.indexOf('function getSpotlightRect')).trim();
  let clock = 0;
  let headings = [{ textContent: 'Donor Intelligence Filters', visible: true }];
  const main = { tagName: 'MAIN' };
  const resolver = runInNewContext(`(${functionText})`, {
    Date: { now: () => clock }, TARGET_TIMEOUT_MS: 5, TARGET_POLL_MS: 1000,
    document: { body: {}, querySelectorAll: selector => { assert.match(selector, /main h/); return headings; } },
    isVisible: node => node.visible,
    nearestTourContainer: node => node,
    findByHeadingText: () => null,
    queryFirstVisible: selector => selector ? main : null,
    sleep: async () => { clock += 1000; },
  });
  const step = { sectionDetail: true, target: { headingText: ['Donor Intelligence Filters'], exactSection: true } };
  assert.equal(await resolver(step), headings[0]);
  headings = [{ textContent: 'Donor Intelligence Filters and More', visible: true }];
  assert.equal(await resolver(step), null);
  headings = [{ textContent: 'Donor Intelligence Filters', visible: false }];
  assert.equal(await resolver(step), null);
});
