import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(
  new URL("../src/pages/ExecutivePollingIntelligence.jsx", import.meta.url),
  "utf8"
);
const api = fs.readFileSync(
  new URL("../src/api/executivePollingIntelligenceApi.js", import.meta.url),
  "utf8"
);

test("defaults the dashboard to election polling", () => {
  assert.match(page, /temporal_scope: "election_cycle"/);
});

test("presents continuous tracking as a separate user choice", () => {
  assert.match(page, /value: "continuous_tracking"/);
  assert.match(page, /Approval & Favorability/);
  assert.match(page, /Date-bound public opinion without an election cycle/);
});

test("clears incompatible filters when scope changes", () => {
  assert.match(page, /temporal_scope: scope\.value,\s*cycle: "",\s*poll_type: ""/s);
});

test("shows election-cycle controls only in election scope", () => {
  assert.match(page, /filters\.temporal_scope === "election_cycle"/);
  assert.match(page, /data\?\.available_cycles/);
});

test("API exposes temporal-scope discovery", () => {
  assert.match(api, /executive-polling-intelligence\/scopes/);
  assert.match(api, /getExecutivePollingScopes/);
});
