import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync(new URL('../src/pages/ExecutivePollingIntelligence.jsx',import.meta.url),'utf8');
test('dashboard presents sample cap, future exclusion and unknown survey freshness',()=>{
  for(const field of ['result_coverage.returned_answer_count','result_coverage.matching_answer_count','future_dated_answer_count','future_dated_polls','freshness_unknown_poll_count'])assert.ok(page.includes(field));
  assert.ok(page.includes('metrics describe the returned sample'));
  assert.ok(page.includes('value == null ? "Unknown"'));
  assert.ok(page.includes('poll.freshness_score == null ? "Unknown"'));
});
