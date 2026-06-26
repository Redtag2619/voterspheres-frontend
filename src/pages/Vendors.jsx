import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import PoliticalGraphContextPanel from "../components/graph/PoliticalGraphContextPanel";

const US_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const VENDOR_GROUPS = [
  "Mail",
  "Digital",
  "Media",
  "Compliance",
  "Consulting",
  "Events",
];

const MAP_GROUPS = ["All", ...VENDOR_GROUPS];

const STATE_NAME_TO_ABBR = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

const STATE_ABBR_TO_NAME = Object.entries(STATE_NAME_TO_ABBR).reduce(
  (acc, [name, abbr]) => {
    acc[abbr] = name;
    return acc;
  },
  {}
);

const STATE_CENTROIDS = {
  AL: [-86.8, 32.8],
  AK: [-152.4, 64.2],
  AZ: [-111.7, 34.3],
  AR: [-92.4, 34.9],
  CA: [-119.5, 37.2],
  CO: [-105.5, 39.0],
  CT: [-72.7, 41.6],
  DE: [-75.5, 39.0],
  FL: [-81.7, 27.8],
  GA: [-83.4, 32.7],
  HI: [-157.5, 20.9],
  ID: [-114.1, 44.2],
  IL: [-89.2, 40.0],
  IN: [-86.1, 40.0],
  IA: [-93.5, 42.1],
  KS: [-98.3, 38.5],
  KY: [-84.8, 37.8],
  LA: [-91.9, 31.2],
  ME: [-69.0, 45.3],
  MD: [-76.7, 39.0],
  MA: [-71.8, 42.3],
  MI: [-84.6, 44.3],
  MN: [-94.2, 46.3],
  MS: [-89.7, 32.7],
  MO: [-92.6, 38.5],
  MT: [-110.0, 46.9],
  NE: [-99.8, 41.5],
  NV: [-116.6, 39.3],
  NH: [-71.6, 43.7],
  NJ: [-74.7, 40.1],
  NM: [-106.1, 34.4],
  NY: [-75.0, 43.0],
  NC: [-79.4, 35.5],
  ND: [-100.5, 47.5],
  OH: [-82.8, 40.4],
  OK: [-97.5, 35.6],
  OR: [-120.5, 44.0],
  PA: [-77.7, 40.9],
  RI: [-71.5, 41.7],
  SC: [-80.9, 33.8],
  SD: [-100.2, 44.4],
  TN: [-86.4, 35.8],
  TX: [-99.3, 31.5],
  UT: [-111.7, 39.3],
  VT: [-72.7, 44.1],
  VA: [-78.7, 37.5],
  WA: [-120.7, 47.4],
  WV: [-80.6, 38.6],
  WI: [-89.6, 44.6],
  WY: [-107.6, 43.0],
  DC: [-77.0, 38.9],
};

const BASELINE_GROUPS = {
  AK: ["Digital", "Compliance", "Consulting"],
  AL: ["Mail", "Media", "Compliance", "Consulting"],
  AR: ["Mail", "Compliance", "Consulting"],
  AZ: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  CA: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  CO: ["Digital", "Media", "Compliance", "Consulting", "Events"],
  CT: ["Digital", "Compliance", "Consulting"],
  DC: ["Digital", "Media", "Compliance", "Consulting", "Events"],
  DE: ["Digital", "Compliance", "Consulting"],
  FL: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  GA: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  HI: ["Digital", "Compliance", "Consulting", "Events"],
  IA: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  ID: ["Mail", "Digital", "Compliance", "Consulting"],
  IL: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  IN: ["Mail", "Digital", "Media", "Compliance", "Consulting"],
  KS: ["Mail", "Digital", "Compliance", "Consulting"],
  KY: ["Mail", "Digital", "Media", "Compliance", "Consulting"],
  LA: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  MA: ["Digital", "Media", "Compliance", "Consulting", "Events"],
  MD: ["Digital", "Media", "Compliance", "Consulting", "Events"],
  ME: ["Mail", "Digital", "Compliance", "Consulting"],
  MI: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  MN: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  MO: ["Mail", "Digital", "Media", "Compliance", "Consulting"],
  MS: ["Mail", "Compliance", "Consulting"],
  MT: ["Mail", "Digital", "Compliance", "Consulting"],
  NC: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  ND: ["Mail", "Compliance", "Consulting"],
  NE: ["Mail", "Digital", "Compliance", "Consulting"],
  NH: ["Mail", "Digital", "Media", "Compliance", "Consulting"],
  NJ: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  NM: ["Mail", "Digital", "Compliance", "Consulting"],
  NV: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  NY: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  OH: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  OK: ["Mail", "Digital", "Compliance", "Consulting"],
  OR: ["Digital", "Media", "Compliance", "Consulting", "Events"],
  PA: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  RI: ["Digital", "Compliance", "Consulting"],
  SC: ["Mail", "Digital", "Media", "Compliance", "Consulting"],
  SD: ["Mail", "Compliance", "Consulting"],
  TN: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  TX: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  UT: ["Mail", "Digital", "Media", "Compliance", "Consulting"],
  VA: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  VT: ["Digital", "Compliance", "Consulting"],
  WA: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  WI: ["Mail", "Digital", "Media", "Compliance", "Consulting", "Events"],
  WV: ["Mail", "Compliance", "Consulting"],
  WY: ["Mail", "Compliance", "Consulting"],
};

function fmtMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function fmtMoneyShort(value) {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return fmtMoney(amount);
}

function normalizeList(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return data?.results || data?.vendors || data?.rows || [];
}

function normalizeState(value = "") {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  if (STATE_ABBR_TO_NAME[upper]) return upper;
  return STATE_NAME_TO_ABBR[raw] || "";
}

function normalizeVendorGroup(category = "", services = "") {
  const value = `${category} ${services}`.toLowerCase();

  if (/(mail|print|postage|postcard|letter|mailer)/.test(value)) return "Mail";
  if (/(digital|data|software|text|sms|email|crm|website)/.test(value)) return "Digital";
  if (/(media|advertising|tv|radio|broadcast|ad buy|placement)/.test(value)) return "Media";
  if (/(compliance|legal|treasurer|accounting|finance)/.test(value)) return "Compliance";
  if (/(consult|strategy|poll|survey|research|field|canvass)/.test(value)) return "Consulting";
  if (/(event|venue|travel|lodging|hotel|catering)/.test(value)) return "Events";

  return "Consulting";
}

function severityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high" || v === "critical" || v === "elevated") return "danger";
  if (v === "medium" || v === "watch") return "demo";
  return "accent";
}

function performanceTone(score) {
  const next = Number(score || 0);
  if (next >= 85) return "accent";
  if (next >= 70) return "demo";
  return "danger";
}

function performanceLabel(score) {
  const next = Number(score || 0);
  if (next >= 85) return "Strong";
  if (next >= 70) return "Watch";
  return "Risk";
}

function sourceLabel(value) {
  if (value === "fec_schedule_b") return "FEC Schedule B";
  if (value === "modeled_baseline") return "Modeled Baseline";
  return value || "Database";
}

function coverageStatus(score = 0, modeled = false) {
  const value = Number(score || 0);

  if (value >= 76) {
    return { label: modeled ? "Modeled Covered" : "Covered", tone: "active", fill: "#166534", stroke: "#86efac" };
  }

  if (value >= 45) {
    return { label: modeled ? "Modeled Thin" : "Thin", tone: "demo", fill: "#92400e", stroke: "#fbbf24" };
  }

  return { label: modeled ? "Modeled Gap" : "Gap", tone: "danger", fill: "#7f1d1d", stroke: "#fca5a5" };
}

function baselineVendorForState(state, group) {
  return {
    id: `baseline-${state}-${group}`,
    vendor_id: `baseline-${state}-${group}`,
    name: `${STATE_ABBR_TO_NAME[state]} ${group} Coverage`,
    vendor_name: `${STATE_ABBR_TO_NAME[state]} ${group} Coverage`,
    state,
    primary_state: state,
    category: group,
    services: `${group} vendor coverage modeled from VoterSpheres national execution baseline.`,
    description: `${group} vendor coverage modeled from VoterSpheres national execution baseline.`,
    contract_value: 0,
    transaction_count: 0,
    committee_count: 0,
    status: "modeled",
    source: "modeled_baseline",
    committee_clients: "",
  };
}

function coverageScoreForState(stateVendors = [], baselineGroups = [], selectedGroup = "All") {
  const liveRows = stateVendors.filter((vendor) => vendor.source !== "modeled_baseline");
  const liveVendorCount = new Set(
    liveRows.map((vendor) => vendor.vendor_name || vendor.name).filter(Boolean)
  ).size;

  const liveGroups = new Set(
    liveRows.map((vendor) => normalizeVendorGroup(vendor.category, vendor.services || vendor.description))
  );

  const totalSpend = liveRows.reduce(
    (sum, vendor) =>
      sum + Number(vendor.contract_value || vendor.fec_contract_value || vendor.amount || 0),
    0
  );

  const liveTransactions = liveRows.reduce(
    (sum, vendor) =>
      sum + Number(vendor.transaction_count || vendor.fec_transaction_count || 0),
    0
  );

  const filteredBaselineGroups =
    selectedGroup === "All"
      ? baselineGroups
      : baselineGroups.includes(selectedGroup)
      ? [selectedGroup]
      : [];

  const baselineScore =
    selectedGroup === "All"
      ? Math.min(44, filteredBaselineGroups.length * 6)
      : filteredBaselineGroups.length
      ? 42
      : 18;

  const vendorScore = Math.min(30, liveVendorCount * 6);
  const groupScore = Math.min(18, liveGroups.size * 4);
  const spendScore = Math.min(18, Math.round(totalSpend / 50000));
  const activityScore = Math.min(12, liveTransactions);

  return Math.min(100, baselineScore + vendorScore + groupScore + spendScore + activityScore);
}

function buildStateCoverage(vendors = [], selectedGroup = "All") {
  const stateMap = new Map();

  Object.entries(STATE_ABBR_TO_NAME).forEach(([abbr, name]) => {
    const baselineGroups = BASELINE_GROUPS[abbr] || ["Digital", "Compliance", "Consulting"];
    const baselineVendors =
      selectedGroup === "All"
        ? baselineGroups.map((group) => baselineVendorForState(abbr, group))
        : baselineGroups.includes(selectedGroup)
        ? [baselineVendorForState(abbr, selectedGroup)]
        : [baselineVendorForState(abbr, selectedGroup)];

    stateMap.set(abbr, {
      state: abbr,
      state_name: name,
      vendors: baselineVendors,
      baseline_groups: baselineGroups,
      vendor_count: baselineVendors.length,
      live_vendor_count: 0,
      categories: baselineVendors.map((vendor) => vendor.category),
      total_spend: 0,
      transaction_count: 0,
      coverage_score: 0,
      status: coverageStatus(0, true),
      modeled: true,
    });
  });

  vendors.forEach((vendor) => {
    const state = normalizeState(vendor.state || vendor.primary_state || vendor.payee_state);
    if (!state || !stateMap.has(state)) return;

    const vendorGroup = normalizeVendorGroup(vendor.category, vendor.services || vendor.description);
    if (selectedGroup !== "All" && vendorGroup !== selectedGroup) return;

    const item = stateMap.get(state);
    item.vendors.push({
      ...vendor,
      vendor_group: vendorGroup,
    });
  });

  stateMap.forEach((item) => {
    const liveRows = item.vendors.filter((vendor) => vendor.source !== "modeled_baseline");

    item.live_vendor_count = new Set(
      liveRows.map((vendor) => vendor.vendor_name || vendor.name).filter(Boolean)
    ).size;

    item.vendor_count = new Set(
      item.vendors.map((vendor) => vendor.vendor_name || vendor.name).filter(Boolean)
    ).size;

    item.categories = [
      ...new Set(
        item.vendors
          .map((vendor) => vendor.vendor_group || normalizeVendorGroup(vendor.category, vendor.services || vendor.description))
          .filter(Boolean)
      ),
    ];

    item.total_spend = liveRows.reduce(
      (sum, vendor) =>
        sum + Number(vendor.contract_value || vendor.fec_contract_value || vendor.amount || 0),
      0
    );

    item.transaction_count = liveRows.reduce(
      (sum, vendor) =>
        sum + Number(vendor.transaction_count || vendor.fec_transaction_count || 0),
      0
    );

    item.modeled = liveRows.length === 0;
    item.coverage_score = coverageScoreForState(
      item.vendors,
      item.baseline_groups,
      selectedGroup
    );
    item.status = coverageStatus(item.coverage_score, item.modeled);
  });

  return [...stateMap.values()].sort(
    (a, b) => b.coverage_score - a.coverage_score || b.total_spend - a.total_spend
  );
}

function getActionKey(action = {}, fallback = "") {
  return String(
    action.id ||
      `${action.state || "National"}-${action.title || fallback || "vendor-action"}`
  );
}

function getInitialUrlParams() {
  if (typeof window === "undefined") return { state: "", source: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    state: params.get("state") || "",
    source: params.get("source") || "",
  };
}

function updateUrlState(state) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (state) url.searchParams.set("state", state);
  else url.searchParams.delete("state");
  if (!url.searchParams.get("source")) url.searchParams.set("source", "vendor-network");
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function statesMatch(a, b) {
  const left = String(a || "").trim().toLowerCase();
  const right = String(b || "").trim().toLowerCase();
  return Boolean(left && right && left === right);
}

function goToCommandCenter(params = {}) {
  const query = new URLSearchParams();
  if (params.vendor) query.set("vendor", params.vendor);
  if (params.state) query.set("state", params.state);
  if (params.coverage) query.set("coverage", params.coverage);
  if (params.score) query.set("score", params.score);
  if (params.group) query.set("group", params.group);
  query.set("source", params.source || "vendor-network");
  const queryString = query.toString();
  window.location.href = queryString ? `/command-center?${queryString}` : "/command-center";
}

function goToStateOperations(state, group = "All") {
  if (!state) return;
  window.location.href = `/state-operations/${state}?source=vendor-network&group=${encodeURIComponent(group)}`;
}

function goToExecutiveMap(state, group = "All") {
  if (!state) return;
  window.location.href = `/executive-operations-map?state=${encodeURIComponent(state)}&source=vendor-network&group=${encodeURIComponent(group)}`;
}

async function loadFecVendorSpend(params = {}) {
  if (typeof api.vendorFecSpend === "function") {
    return api.vendorFecSpend(params);
  }

  if (typeof api.get === "function") {
    const response = await api.get("/vendor-fec/spend", {
      params,
      timeout: 10000,
    });
    return response?.data || response;
  }

  return null;
}

function mergeByVendorName(primaryRows = [], fecRows = []) {
  const map = new Map();

  primaryRows.forEach((row) => {
    const key = String(row.name || row.vendor_name || "").toLowerCase();
    if (key) map.set(key, row);
  });

  fecRows.forEach((row) => {
    const key = String(row.name || row.vendor_name || "").toLowerCase();
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, row);
      return;
    }

    const existing = map.get(key);
    map.set(key, {
      ...row,
      ...existing,
      fec_contract_value: row.contract_value,
      fec_transaction_count: row.transaction_count,
      committee_clients: existing.committee_clients || row.committee_clients,
      source: existing.source || row.source,
    });
  });

  return [...map.values()];
}

function VendorRow({ vendor, highlighted = false, onCreateCommandTask, onInspectVendor }) {
  const name = vendor.name || vendor.vendor_name || "Unnamed Vendor";
  const category = vendor.category || "Campaign Vendor";
  const state = vendor.state || vendor.primary_state || "Unknown";
  const services =
    vendor.services ||
    vendor.capabilities ||
    vendor.description ||
    "Campaign operations and political services";
  const group = normalizeVendorGroup(category, services);
  const isModeled = vendor.source === "modeled_baseline";

  return (
    <div
      className={`vs-premium-row-card ${
        highlighted ? "is-highlighted-vendor" : ""
      }`}
    >
      <ResponsiveRow
        title={name}
        subtitle={`${state} | ${group} | ${category} | ${sourceLabel(vendor.source)}`}
        meta={[
          { label: "Coverage", value: vendor.coverage_area || state || "—" },
          { label: "Spend / Contract", value: isModeled ? "Modeled" : fmtMoney(vendor.contract_value || vendor.fec_contract_value) },
          { label: "Transactions", value: isModeled ? "Baseline" : vendor.transaction_count || vendor.fec_transaction_count || "—" },
          { label: "Services", value: services },
        ]}
        right={
          <div className="vs-inline-actions">
            {highlighted ? <Badge tone="demo">Task Match</Badge> : null}
            <Badge tone="info">{group}</Badge>
            <Badge tone={isModeled ? "demo" : "accent"}>{isModeled ? "Modeled" : vendor.status || "active"}</Badge>
          </div>
        }
      />

      <div className="vs-vendor-source-strip">
        {vendor.committee_clients ? (
          <span>
            Committee clients: {String(vendor.committee_clients).split(",").slice(0, 4).join(", ")}
          </span>
        ) : (
          <span>{isModeled ? "Modeled national coverage baseline until live FEC records are available." : "Committee clients unavailable from current record."}</span>
        )}

        <div className="vs-vendor-row-actions">
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => goToCommandCenter({ vendor: name, state })}
          >
            Open in Command Center
          </button>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => onInspectVendor?.(vendor)}
          >
            Graph
          </button>

          <button
            type="button"
            className="vs-button"
            onClick={() => onCreateCommandTask?.({
              title: `Review ${name}`,
              detail: services,
              state,
              owner: "Operations",
              priority: isModeled ? "High" : "Medium",
              vendor_name: name,
            })}
          >
            Create Command Task
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorGroupCard({ group, vendors = [], selected, onOpenGroup }) {
  const liveVendors = vendors.filter((vendor) => vendor.source !== "modeled_baseline");
  const total = liveVendors.reduce(
    (sum, vendor) => sum + Number(vendor.contract_value || vendor.fec_contract_value || 0),
    0
  );

  const stateCount = new Set(
    vendors.map((vendor) => normalizeState(vendor.state || vendor.primary_state)).filter(Boolean)
  ).size;

  const committeeCount = liveVendors.reduce(
    (sum, vendor) => sum + Number(vendor.committee_count || 0),
    0
  );

  return (
    <button
      type="button"
      className={`vs-vendor-group-card ${selected ? "is-active" : ""}`}
      onClick={() => onOpenGroup(group)}
    >
      <div>
        <div className="vs-vendor-group-title">{group}</div>
        <div className="vs-vendor-group-subtitle">
          {vendors.length} records | {stateCount} states
        </div>
      </div>

      <div className="vs-vendor-group-money">{fmtMoneyShort(total)}</div>

      <div className="vs-vendor-group-meta">
        <Badge tone={vendors.length ? "active" : "default"}>
          {vendors.length ? "Active" : "No Records"}
        </Badge>
        <Badge tone="info">{committeeCount} committee links</Badge>
      </div>
    </button>
  );
}

function StateCoverageRow({ item, selectedGroup, onCreateTask }) {
  return (
    <div className="vs-vendor-coverage-row">
      <ResponsiveRow
        title={`${item.state} - ${item.state_name}`}
        subtitle={`${item.status.label} | ${item.live_vendor_count} live vendors | ${item.vendor_count} total records`}
        meta={[
          { label: "Coverage", value: `${item.coverage_score}/100` },
          { label: "Live Spend", value: fmtMoneyShort(item.total_spend) },
          { label: "Live Transactions", value: item.transaction_count },
          { label: "Groups", value: item.categories.join(", ") || "None" },
        ]}
        right={<Badge tone={item.status.tone}>{item.status.label}</Badge>}
      />

      <div className="vs-coverage-actions">
        <button type="button" className="vs-button vs-button-secondary" onClick={() => goToStateOperations(item.state, selectedGroup)}>
          State Operations
        </button>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => goToExecutiveMap(item.state, selectedGroup)}>
          Executive Map
        </button>
        <button
          type="button"
          className="vs-button"
          onClick={() =>
            goToCommandCenter({
              state: item.state,
              coverage: item.status.label,
              score: String(item.coverage_score),
              group: selectedGroup,
              source: "vendor-network",
            })
          }
        >
          Command Center
        </button>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onCreateTask(item)}>
          Create Coverage Task
        </button>
      </div>
    </div>
  );
}

function RiskRow({ item }) {
  const severity = item.severity || item.priority || "Medium";

  return (
    <div className={`vs-premium-row-card ${severity === "High" ? "is-elevated" : ""}`}>
      <ResponsiveRow
        title={item.title || "Vendor intelligence signal"}
        subtitle={item.detail || "Review vendor coverage and operational readiness."}
        meta={[
          { label: "Severity", value: severity },
          { label: "State", value: item.state || "National" },
        ]}
        right={<Badge tone={severityTone(severity)}>{severity}</Badge>}
      />
    </div>
  );
}

function PerformanceRow({ item }) {
  const score = Number(item.overall_score || 0);
  const onTime = Number(item.on_time_score || 0);
  const reliability = Number(item.reliability_score || 0);
  const risk = Number(item.risk_score || 0);
  const totalJobs = Number(item.total_jobs || item.transaction_count || 0);

  return (
    <div className={`vs-premium-row-card ${score < 70 ? "is-elevated" : ""}`}>
      <ResponsiveRow
        title={item.vendor_name || item.name || "Unnamed Vendor"}
        subtitle={`${item.state || "National"} | ${totalJobs} FEC spend record${totalJobs === 1 ? "" : "s"}`}
        meta={[
          { label: "Overall", value: `${score}%` },
          { label: "On-Time", value: `${onTime}%` },
          { label: "Reliability", value: `${reliability}%` },
          { label: "Risk", value: `${risk}%` },
          { label: "Spend", value: fmtMoneyShort(item.contract_value || 0) },
        ]}
        right={<Badge tone={performanceTone(score)}>{performanceLabel(score)}</Badge>}
      />
    </div>
  );
}

function ResolvedGapRow({ item }) {
  return (
    <div className="vs-premium-row-card is-resolved-gap">
      <ResponsiveRow
        title={item.title || `${item.state || "State"} vendor gap resolved`}
        subtitle={item.detail || "This vendor coverage gap has been resolved by a completed task."}
        meta={[
          { label: "State", value: item.state || "National" },
          { label: "Score", value: item.coverage_score ?? "—" },
          { label: "Status", value: "Resolved" },
        ]}
        right={<Badge tone="active">Resolved by Task</Badge>}
      />
    </div>
  );
}

function ActionTaskRow({ action, onCreateTask, creating, taskExists }) {
  const severity = action.priority || action.severity || "Medium";

  return (
    <div className={`vs-premium-row-card ${severity === "High" ? "is-elevated" : "is-action"}`}>
      <ResponsiveRow
        title={action.title || "Review vendor coverage"}
        subtitle={action.detail || "Generated by vendor scoring."}
        meta={[
          { label: "Owner", value: action.owner || "Operations" },
          { label: "Due", value: action.due || "This Week" },
          { label: "State", value: action.state || "National" },
        ]}
        right={
          taskExists ? (
            <Badge tone="demo">Task Exists</Badge>
          ) : (
            <button
              type="button"
              className="vs-decision-btn deploy"
              disabled={creating}
              onClick={() => onCreateTask(action)}
            >
              {creating ? "Creating..." : "Create Task"}
            </button>
          )
        }
      />
    </div>
  );
}

function SpendCategoryRow({ item }) {
  return (
    <div className="vs-premium-row-card">
      <ResponsiveRow
        title={item.category || "Campaign Operations"}
        subtitle={`${item.vendor_count || 0} vendors | ${item.transaction_count || 0} transactions`}
        meta={[
          { label: "Total Spend", value: fmtMoney(item.total_amount || 0) },
          { label: "Source", value: "FEC Schedule B" },
        ]}
        right={<Badge tone="info">{fmtMoneyShort(item.total_amount || 0)}</Badge>}
      />
    </div>
  );
}

function VendorMiniRow({ vendor }) {
  const name = vendor.vendor_name || vendor.name || "Unnamed Vendor";
  const group = vendor.vendor_group || normalizeVendorGroup(vendor.category, vendor.services || vendor.description);
  const isModeled = vendor.source === "modeled_baseline";

  return (
    <ResponsiveRow
      title={name}
      subtitle={`${group} | ${sourceLabel(vendor.source)}`}
      meta={[
        { label: "Spend", value: isModeled ? "Modeled" : fmtMoneyShort(vendor.contract_value || vendor.fec_contract_value || vendor.amount || 0) },
        { label: "Transactions", value: isModeled ? "Baseline" : vendor.transaction_count || vendor.fec_transaction_count || 1 },
        { label: "Committees", value: vendor.committee_count || "—" },
      ]}
      right={<Badge tone={isModeled ? "demo" : "info"}>{group}</Badge>}
    />
  );
}

function MapTooltip({ tooltip }) {
  if (!tooltip.visible || !tooltip.state) return null;

  const state = tooltip.state;

  return (
    <div
      className="vs-vendor-map-tooltip"
      style={{
        left: tooltip.x + 14,
        top: tooltip.y + 14,
      }}
    >
      <div className="vs-tooltip-title">
        {state.state} - {state.state_name}
      </div>
      <div className="vs-tooltip-copy">
        {state.status.label} coverage | {state.coverage_score}/100
      </div>
      <div className="vs-tooltip-grid">
        <span>Live vendors</span>
        <strong>{state.live_vendor_count}</strong>
        <span>Total records</span>
        <strong>{state.vendor_count}</strong>
        <span>Live spend</span>
        <strong>{fmtMoneyShort(state.total_spend)}</strong>
        <span>Groups</span>
        <strong>{state.categories.length}</strong>
      </div>
    </div>
  );
}

export default function Vendors() {
  const initialUrl = getInitialUrlParams();
  const vendorDirectoryRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [fecRows, setFecRows] = useState([]);
  const [fecCategories, setFecCategories] = useState([]);
  const [fecStates, setFecStates] = useState([]);
  const [fecLoading, setFecLoading] = useState(true);
  const [fecError, setFecError] = useState("");

  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [intel, setIntel] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [performanceSummary, setPerformanceSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispatchMessage, setDispatchMessage] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [resolutionMessage, setResolutionMessage] = useState("");
  const [creatingTaskId, setCreatingTaskId] = useState("");
  const [existingTaskIds, setExistingTaskIds] = useState(() => new Set());
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [sourceContext] = useState(initialUrl.source);

  const [filters, setFilters] = useState({
    q: "",
    state: initialUrl.state,
    category: "",
    status: "",
    page: 1,
    limit: 12,
    cycle: "2026",
  });

  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedState, setSelectedState] = useState(normalizeState(initialUrl.state) || "PA");
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    state: null,
  });

  const isFromExecutionBoard = sourceContext === "execution-board";
  const highlightedState = isFromExecutionBoard ? filters.state : "";

  useEffect(() => {
    updateUrlState(filters.state);
  }, [filters.state]);

  useEffect(() => {
    let active = true;

    async function loadFilters() {
      try {
        const [stateData, categoryData] = await Promise.all([
          api.vendorStates?.(),
          api.vendorCategories?.(),
        ]);

        if (!active) return;

        setStates(normalizeList(stateData, ["states", "results"]));
        setCategories(normalizeList(categoryData, ["categories", "results"]));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load vendor filters");
      }
    }

    loadFilters();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadVendors() {
      try {
        setLoading(true);
        setError("");

        const data = await api.vendors(filters);

        if (!active) return;

        setRows(normalizeList(data, ["results", "vendors", "rows"]));
      } catch (err) {
        if (!active) return;

        setError(err?.message || "Failed to load vendors");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVendors();

    return () => {
      active = false;
    };
  }, [filters]);

  useEffect(() => {
    let active = true;

    async function loadFec() {
      try {
        setFecLoading(true);
        setFecError("");

        const data = await loadFecVendorSpend({
          q: filters.q || undefined,
          state: filters.state || undefined,
          category: filters.category || undefined,
          cycle: filters.cycle || "2026",
          limit: 250,
          live: 1,
        });

        if (!active) return;

        setFecRows(normalizeList(data, ["results", "vendors", "rows"]));
        setFecCategories(normalizeList(data?.categories, ["categories", "results"]));
        setFecStates(normalizeList(data?.states, ["states", "results"]));

        if (data?.intel) {
          setIntel((current) => current || data.intel);
        }

        if (data?.performance?.length) {
          setPerformance((current) => current.length ? current : data.performance);
          setPerformanceSummary((current) => current || data.performanceSummary || null);
        }
      } catch (err) {
        if (!active) return;

        setFecError(err?.response?.data?.error || err?.message || "FEC vendor spend unavailable.");
        setFecRows([]);
        setFecCategories([]);
        setFecStates([]);
      } finally {
        if (active) setFecLoading(false);
      }
    }

    loadFec();

    return () => {
      active = false;
    };
  }, [filters.q, filters.state, filters.category, filters.cycle]);

  async function loadIntel() {
    setIntelLoading(true);

    try {
      const data = await api.vendorScoring?.();

      setIntel(data || null);

      const resolvedCount = data?.resolved_gaps?.length || 0;

      if (resolvedCount) {
        setResolutionMessage(
          `${resolvedCount} vendor gap${
            resolvedCount === 1 ? "" : "s"
          } resolved by completed task.`
        );
      } else {
        setResolutionMessage("");
      }
    } catch {
      setIntel(null);
      setResolutionMessage("");
    } finally {
      setIntelLoading(false);
    }
  }

  useEffect(() => {
    loadIntel();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPerformance() {
      try {
        setPerformanceLoading(true);

        const data = await api.vendorPerformance?.({
          state: filters.state,
          limit: 25,
        });

        if (!active) return;

        const apiPerformance = data?.results || [];
        setPerformance(apiPerformance.length ? apiPerformance : []);
        setPerformanceSummary(data?.summary || null);
      } catch {
        if (!active) return;

        setPerformance([]);
        setPerformanceSummary(null);
      } finally {
        if (active) setPerformanceLoading(false);
      }
    }

    loadPerformance();

    return () => {
      active = false;
    };
  }, [filters.state]);

  const displayRows = useMemo(() => {
    return mergeByVendorName(rows, fecRows);
  }, [rows, fecRows]);

  const stateCoverage = useMemo(() => {
    return buildStateCoverage(displayRows, selectedGroup || "All");
  }, [displayRows, selectedGroup]);

  const stateCoverageByAbbr = useMemo(() => {
    const map = {};
    stateCoverage.forEach((item) => {
      map[item.state] = item;
    });
    return map;
  }, [stateCoverage]);

  const selectedStateCoverage = useMemo(() => {
    return (
      stateCoverage.find((state) => state.state === selectedState) ||
      stateCoverage.find((state) => state.coverage_score > 0) ||
      stateCoverage[0] ||
      null
    );
  }, [stateCoverage, selectedState]);

  const displayRowsWithBaseline = useMemo(() => {
    if (!selectedStateCoverage?.vendors?.length) return displayRows;
    return displayRows;
  }, [displayRows, selectedStateCoverage]);

  const groupedVendors = useMemo(() => {
    const grouped = {};
    MAP_GROUPS.forEach((group) => {
      grouped[group] = [];
    });

    displayRowsWithBaseline.forEach((vendor) => {
      const group = normalizeVendorGroup(vendor.category, vendor.services || vendor.description);
      grouped.All.push(vendor);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(vendor);
    });

    stateCoverage.forEach((state) => {
      state.vendors
        .filter((vendor) => vendor.source === "modeled_baseline")
        .forEach((vendor) => {
          const group = normalizeVendorGroup(vendor.category, vendor.services || vendor.description);
          if (!grouped.All.some((row) => row.id === vendor.id)) grouped.All.push(vendor);
          if (!grouped[group]) grouped[group] = [];
          if (!grouped[group].some((row) => row.id === vendor.id)) grouped[group].push(vendor);
        });
    });

    return grouped;
  }, [displayRowsWithBaseline, stateCoverage]);

  const visibleRows = useMemo(() => {
    const rowsForGroup =
      !selectedGroup || selectedGroup === "All"
        ? displayRows
        : displayRows.filter(
            (vendor) =>
              normalizeVendorGroup(vendor.category, vendor.services || vendor.description) === selectedGroup
          );

    if (rowsForGroup.length) return rowsForGroup;

    return selectedStateCoverage?.vendors || [];
  }, [displayRows, selectedGroup, selectedStateCoverage]);

  const activeVendor =
    selectedVendor ||
    visibleRows?.find((vendor) => vendor.source !== "modeled_baseline") ||
    visibleRows?.[0] ||
    selectedStateCoverage?.vendors?.find((vendor) => vendor.source !== "modeled_baseline") ||
    selectedStateCoverage?.vendors?.[0] ||
    null;

  useEffect(() => {
    if (!selectedVendor && visibleRows?.length) {
      setSelectedVendor(visibleRows[0]);
    }
  }, [selectedVendor, visibleRows]);

  const coveredStates = useMemo(
    () => stateCoverage.filter((state) => state.coverage_score >= 76),
    [stateCoverage]
  );

  const thinStates = useMemo(
    () =>
      stateCoverage
        .filter((state) => state.coverage_score >= 45 && state.coverage_score < 76)
        .slice(0, 8),
    [stateCoverage]
  );

  const gapStates = useMemo(
    () =>
      stateCoverage
        .filter((state) => state.coverage_score > 0 && state.coverage_score < 45)
        .slice(0, 8),
    [stateCoverage]
  );

  useEffect(() => {
    if (!isFromExecutionBoard || loading || !displayRows.length) return;

    const timer = setTimeout(() => {
      vendorDirectoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [isFromExecutionBoard, loading, displayRows.length]);

  async function dispatchVendorAlerts() {
    try {
      setDispatchMessage("Dispatching vendor alerts...");

      const result = await api.dispatchVendorAlerts?.();

      setDispatchMessage(
        `Dispatched ${result?.dispatched || 0} vendor intelligence alerts.`
      );
    } catch (err) {
      setDispatchMessage(err?.message || "Failed to dispatch vendor alerts.");
    }
  }

  async function createVendorTask(action = {}) {
    const taskKey = getActionKey(action);

    try {
      setCreatingTaskId(taskKey);
      setTaskMessage(
        `Creating task: ${action.title || "Review vendor coverage"}`
      );

      const result = await api.createTask?.({
        title: action.title || "Review vendor coverage",
        description:
          action.detail || "Generated from Vendor Network intelligence.",
        source: "vendor_network",
        state: action.state || "National",
        office: "Statewide",
        priority: action.priority === "High" ? "high" : "medium",
        status: "open",
        assigned_to: action.owner || "Operations",
        due_label: action.priority === "High" ? "Today" : action.due || "This Week",
        metadata: {
          vendor_action_id: taskKey,
          vendor_action: action,
        },
      });

      setExistingTaskIds((prev) => {
        const next = new Set(prev);
        next.add(taskKey);
        return next;
      });

      if (result?.duplicate) {
        setTaskMessage(`Task exists: ${action.title || "Review vendor coverage"}`);
        return;
      }

      setTaskMessage(`Task created: ${action.title || "Review vendor coverage"}`);
    } catch (err) {
      setTaskMessage(err?.message || "Failed to create vendor task.");
    } finally {
      setCreatingTaskId("");
    }
  }

  async function createCoverageTask(state = selectedStateCoverage) {
    if (!state) return;

    await createVendorTask({
      title: `${state.state} ${selectedGroup} vendor coverage review`,
      detail: `${state.state_name} has ${state.status.label.toLowerCase()} vendor coverage for ${selectedGroup}. Coverage score: ${state.coverage_score}/100. Live vendors: ${state.live_vendor_count}. Total records: ${state.vendor_count}. Groups: ${state.categories.join(", ") || "none"}.`,
      state: state.state,
      owner: "Operations",
      priority: state.coverage_score < 45 ? "High" : "Medium",
      due: state.coverage_score < 45 ? "Today" : "This Week",
      vendor_group: selectedGroup,
    });
  }

  const fallbackIntel = useMemo(() => {
    const gaps = gapStates.slice(0, 8).map((row) => ({
      title: `${row.state} vendor coverage requires review`,
      detail: `${row.live_vendor_count} live vendors and ${row.vendor_count} total coverage records are visible for ${row.state_name}.`,
      state: row.state,
      severity: row.coverage_score < 45 ? "High" : "Medium",
      coverage_score: row.coverage_score,
    }));

    return {
      summary: {
        total_vendors: displayRows.length,
        active_vendors: displayRows.filter((row) => String(row.status || "").toLowerCase() === "active").length,
        states_covered: coveredStates.length,
        categories_covered: new Set(displayRows.map((row) => row.category).filter(Boolean)).size,
        high_gap_states: gaps.filter((row) => row.severity === "High").length,
        medium_gap_states: gaps.filter((row) => row.severity !== "High").length,
        resolved_gap_states: 0,
      },
      gaps,
      resolved_gaps: [],
      recommended_actions: gaps.slice(0, 6).map((gap) => ({
        title: `Expand vendor coverage in ${gap.state}`,
        detail: gap.detail,
        state: gap.state,
        priority: gap.severity === "High" ? "High" : "Medium",
        owner: "Operations",
        due: gap.severity === "High" ? "Today" : "This Week",
      })),
    };
  }, [displayRows, gapStates, coveredStates.length]);

  const effectiveIntel = intel || fallbackIntel;

  const summary = useMemo(() => {
    return (
      effectiveIntel?.summary || {
        total_vendors: displayRows.length,
        active_vendors: displayRows.filter(
          (row) => String(row.status || "").toLowerCase() === "active"
        ).length,
        states_covered: coveredStates.length,
        categories_covered: new Set(
          displayRows.map((row) => row.category).filter(Boolean)
        ).size,
        high_gap_states: 0,
        medium_gap_states: 0,
        resolved_gap_states: 0,
      }
    );
  }, [effectiveIntel, displayRows, coveredStates.length]);

  const gapCount =
    Number(summary.high_gap_states || 0) + Number(summary.medium_gap_states || 0);

  const resolvedGapCount = Number(
    summary.resolved_gap_states || effectiveIntel?.resolved_gaps?.length || 0
  );

  const effectivePerformance = performance.length ? performance : fecRows;
  const strongPerformanceCount = Number(
    performanceSummary?.strong_vendors ||
      effectivePerformance.filter((row) => Number(row.overall_score || 0) >= 85).length
  );
  const riskPerformanceCount = Number(
    performanceSummary?.risk_vendors ||
      effectivePerformance.filter((row) => Number(row.overall_score || 0) < 70).length
  );

  const highlightedRowsCount = useMemo(() => {
    if (!highlightedState) return 0;

    return displayRows.filter((row) =>
      statesMatch(row.state || row.primary_state, highlightedState)
    ).length;
  }, [displayRows, highlightedState]);

  const mergedStates = useMemo(() => {
    const values = new Set(Object.keys(STATE_ABBR_TO_NAME));

    function addState(item) {
      if (!item) return;

      if (typeof item === "string") {
        const state = normalizeState(item);
        if (state) values.add(state);
        return;
      }

      const value =
        item.state ||
        item.name ||
        item.primary_state ||
        item.payee_state ||
        item.abbr ||
        "";

      const state = normalizeState(value);
      if (state) values.add(state);
    }

    states.forEach(addState);
    fecStates.forEach(addState);

    return [...values].filter(Boolean).sort();
  }, [states, fecStates]);

  const totalFecSpend = fecRows.reduce(
    (sum, row) => sum + Number(row.contract_value || row.amount || 0),
    0
  );

  function showTooltip(event, state) {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      state,
    });
  }

  function hideTooltip() {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }

  return (
    <PageShell
      eyebrow="Vendor Intelligence"
      title="Vendor Network"
      description="Live campaign vendor coverage, FEC spending intelligence, U.S. coverage mapping, performance scoring, operational readiness, and execution tasking."
      tickerItems={[
        {
          label: "Vendors",
          value: `${summary.total_vendors || displayRows.length || 0} live`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Covered States",
          value: `${coveredStates.length}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "FEC Spend",
          value: fmtMoneyShort(totalFecSpend),
          dotClass: fecRows.length ? "vs-live-dot-success" : "vs-live-dot-warning",
        },
        {
          label: "Performance",
          value: `${strongPerformanceCount} strong / ${riskPerformanceCount} risk`,
          dotClass: riskPerformanceCount ? "vs-live-dot" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .vs-premium-row-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.48));
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.18);
          overflow: hidden;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, opacity 220ms ease;
          animation: vsGapIn 260ms ease both;
        }

        .vs-premium-row-card:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.32);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.24);
        }

        .vs-premium-row-card.is-elevated {
          border-color: rgba(248, 113, 113, 0.32);
          background: linear-gradient(135deg, rgba(127, 29, 29, 0.22), rgba(15, 23, 42, 0.68));
        }

        .vs-premium-row-card.is-action {
          border-color: rgba(34, 197, 94, 0.18);
        }

        .vs-premium-row-card.is-highlighted-vendor {
          border-color: rgba(34, 197, 94, 0.55);
          background: linear-gradient(135deg, rgba(22, 101, 52, 0.26), rgba(15, 23, 42, 0.72));
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.28), 0 18px 46px rgba(22, 163, 74, 0.14);
        }

        .vs-premium-row-card.is-resolved-gap {
          border-color: rgba(34, 197, 94, 0.42);
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.28), rgba(15, 23, 42, 0.62));
          animation: vsResolvedPulse 680ms ease both;
        }

        .vs-premium-row-card .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .vs-vendor-source-strip {
          padding: 0 16px 14px;
          color: rgba(203, 213, 225, 0.72);
          font-size: 12px;
          line-height: 1.45;
        }

        .vs-vendor-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .vs-vendor-group-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 32%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.48));
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.18);
          color: var(--vs-text);
          cursor: pointer;
          display: grid;
          gap: 14px;
          min-height: 154px;
          padding: 16px;
          text-align: left;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .vs-vendor-group-card:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.42);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.28);
        }

        .vs-vendor-group-card.is-active {
          border-color: rgba(96, 165, 250, 0.58);
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.18), 0 18px 42px rgba(2, 6, 23, 0.28);
        }

        .vs-vendor-group-title {
          color: var(--vs-text);
          font-size: 17px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .vs-vendor-group-subtitle {
          color: rgba(203, 213, 225, 0.72);
          font-size: 12px;
          margin-top: 5px;
        }

        .vs-vendor-group-money {
          color: var(--vs-text);
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .vs-vendor-group-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .vs-execution-filter-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .vs-execution-filter-banner-copy {
          min-width: 220px;
          flex: 1;
        }

        .vs-vendor-map-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
          align-items: stretch;
        }

        .vs-vendor-map-side {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          align-items: stretch;
        }

        .vs-vendor-map-frame {
          height: 540px;
          min-height: 540px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 22px;
          background:
            radial-gradient(circle at 20% 0%, rgba(59, 130, 246, 0.14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.72));
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .vs-vendor-map-tooltip {
          position: fixed;
          z-index: 90;
          width: 260px;
          pointer-events: none;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(2, 6, 23, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.38);
          color: var(--vs-text);
        }

        .vs-tooltip-title {
          font-weight: 900;
          font-size: 14px;
        }

        .vs-tooltip-copy {
          margin-top: 5px;
          font-size: 12px;
          color: var(--vs-text-muted);
        }

        .vs-tooltip-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 5px 10px;
          margin-top: 10px;
          font-size: 12px;
        }

        .vs-tooltip-grid span {
          color: var(--vs-text-muted);
        }

        .vs-map-legend {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .vs-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--vs-text-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .vs-legend-swatch {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
        }

        .vs-vendor-coverage-row {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.48));
          overflow: hidden;
        }

        .vs-vendor-coverage-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .vs-coverage-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 0 16px 16px;
        }

        .vs-vendor-map-side .vs-card,
        .vs-vendor-map-side section {
          height: auto;
        }

        .vs-vendor-map-side .vs-responsive-row {
          min-height: auto;
        }

        .vs-vendor-map-side > section,
        .vs-vendor-map-side > .vs-card {
          min-height: 100%;
        }

        .vs-vendor-balanced-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          align-items: start;
        }

        .vs-vendor-balanced-grid > * {
          min-width: 0;
        }

        .vs-vendor-compact-list .vs-stack {
          gap: 10px;
        }

        @media (max-width: 1100px) {
          .vs-vendor-balanced-grid {
            grid-template-columns: 1fr;
          }
        }

        @keyframes vsGapIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vsResolvedPulse {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.0);
          }
          45% {
            opacity: 1;
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.22), 0 18px 46px rgba(22, 163, 74, 0.10);
          }
        }

        @media (max-width: 1280px) {
          .vs-vendor-map-side {
            grid-template-columns: 1fr;
          }

          .vs-vendor-map-frame {
            height: 500px;
            min-height: 500px;
          }
        }

        @media (max-width: 760px) {
          .vs-vendor-map-frame {
            height: 390px;
            min-height: 390px;
          }
        }
      `}</style>

      {isFromExecutionBoard ? (
        <div className="vs-banner vs-live-banner-pulse vs-execution-filter-banner">
          <div className="vs-execution-filter-banner-copy">
            Filtered from Execution Board — highlighting vendor coverage connected
            to this task{filters.state ? ` in ${filters.state}` : ""}.
            {highlightedRowsCount
              ? ` ${highlightedRowsCount} matching vendor${
                  highlightedRowsCount === 1 ? "" : "s"
                } highlighted.`
              : ""}
          </div>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={goToCommandCenter}
          >
            Back to Command Center
          </button>
        </div>
      ) : null}

      {resolutionMessage ? (
        <div className="vs-banner vs-live-banner-pulse">
          {resolutionMessage}
        </div>
      ) : null}

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {fecError ? <div className="vs-banner vs-banner-danger">{fecError}</div> : null}
      {dispatchMessage ? <div className="vs-banner">{dispatchMessage}</div> : null}

      {taskMessage ? (
        <div className="vs-banner vs-live-banner-pulse">{taskMessage}</div>
      ) : null}

      <MapTooltip tooltip={tooltip} />

      <div className="vs-grid-4">
        <StatCard
          label="Total Vendors"
          value={summary.total_vendors || displayRows.length || 0}
          delta="Live database records"
          tone="up"
        />
        <StatCard
          label="All States Covered"
          value="51"
          delta="Live plus modeled baseline"
          tone="up"
        />
        <StatCard
          label="Live FEC Vendors"
          value={fecRows.length}
          delta="Schedule B payee intelligence"
          tone="up"
        />
        <StatCard
          label="FEC Spend"
          value={fmtMoneyShort(totalFecSpend)}
          delta="Imported live spending"
          tone="up"
        />
      </div>

      <SectionCard
        title="Vendor Controls"
        subtitle="Filter the live vendor network and modeled national coverage baseline."
        right={
          <button
            type="button"
            className="vs-decision-btn deploy"
            onClick={dispatchVendorAlerts}
          >
            Dispatch Vendor Alerts
          </button>
        }
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            placeholder="Search vendors"
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                q: e.target.value,
                page: 1,
              }))
            }
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(e) =>
              setFilters((prev) => {
                const state = e.target.value;
                if (state) setSelectedState(state);
                return {
                  ...prev,
                  state,
                  page: 1,
                };
              })
            }
          >
            <option value="">All states</option>
            {mergedStates.map((value) => (
              <option key={value} value={value}>
                {value} - {STATE_ABBR_TO_NAME[value] || value}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {MAP_GROUPS.map((value) => (
              <option key={value} value={value}>
                {value === "All" ? "All service groups" : value}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.cycle}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                cycle: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="2026">2026 Cycle</option>
            <option value="2024">2024 Cycle</option>
            <option value="2022">2022 Cycle</option>
            <option value="2020">2020 Cycle</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="U.S. Vendor Coverage Map"
        subtitle={`${selectedGroup} vendor coverage by state. Every state is visible using VoterSpheres modeled baseline, with live FEC data layered on top where available.`}
        right={
          <div className="vs-map-legend">
            <span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#166534" }} /> Covered</span>
            <span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#92400e" }} /> Thin</span>
            <span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#7f1d1d" }} /> Gap</span>
          </div>
        }
      >
        <div className="vs-vendor-map-shell">
          <div className="vs-vendor-map-frame">
            {loading && fecLoading ? (
              <EmptyState text="Loading vendor coverage map..." />
            ) : (
              <ComposableMap
                projection="geoAlbersUsa"
                projectionConfig={{ scale: 1040 }}
                style={{
                  width: "100%",
                  maxWidth: "980px",
                  height: "515px",
                }}
              >
                <Geographies geography={US_TOPO_JSON}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateName = geo.properties?.name;
                      const abbr = STATE_NAME_TO_ABBR[stateName];
                      const state = abbr ? stateCoverageByAbbr[abbr] : null;
                      const status = state?.status || coverageStatus(1, true);
                      const isActive = selectedState === abbr;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={(event) => {
                            if (state) showTooltip(event, state);
                          }}
                          onMouseMove={(event) => {
                            if (state) showTooltip(event, state);
                          }}
                          onMouseLeave={hideTooltip}
                          onClick={() => {
                            if (abbr) setSelectedState(abbr);
                          }}
                          style={{
                            default: {
                              fill: status.fill,
                              stroke: isActive ? "#f8fafc" : status.stroke,
                              strokeWidth: isActive ? 1.8 : 0.85,
                              outline: "none",
                              cursor: "pointer",
                            },
                            hover: {
                              fill: status.fill,
                              stroke: "#f8fafc",
                              strokeWidth: 1.6,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: status.fill,
                              stroke: "#f8fafc",
                              strokeWidth: 1.4,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {stateCoverage
                  .filter((state) => STATE_CENTROIDS[state.state])
                  .map((state) => {
                    const isActive = selectedState === state.state;
                    const coords = STATE_CENTROIDS[state.state];

                    return (
                      <Marker key={state.state} coordinates={coords}>
                        <circle
                          r={isActive ? 8 : 4.8}
                          fill={state.modeled ? "#cbd5e1" : "#f8fafc"}
                          stroke="#020617"
                          strokeWidth={2}
                          onMouseEnter={(event) => showTooltip(event, state)}
                          onMouseMove={(event) => showTooltip(event, state)}
                          onMouseLeave={hideTooltip}
                          onClick={() => setSelectedState(state.state)}
                          style={{ cursor: "pointer" }}
                        />
                        <text
                          textAnchor="middle"
                          y={-10}
                          style={{
                            fontFamily: "inherit",
                            fill: "#e5e7eb",
                            fontSize: 9,
                            fontWeight: 800,
                            pointerEvents: "none",
                          }}
                        >
                          {state.state}
                        </text>
                      </Marker>
                    );
                  })}
              </ComposableMap>
            )}
          </div>

          <div className="vs-vendor-map-side">
            <SectionCard
              title={
                selectedStateCoverage
                  ? `${selectedStateCoverage.state} Vendor Coverage`
                  : "State Coverage Detail"
              }
              subtitle={
                selectedStateCoverage
                  ? `${selectedStateCoverage.state_name} | ${selectedGroup} | ${selectedStateCoverage.status.label}`
                  : "Select a state on the map."
              }
              right={
                selectedStateCoverage ? (
                  <Badge tone={selectedStateCoverage.status.tone}>
                    {selectedStateCoverage.coverage_score}/100
                  </Badge>
                ) : null
              }
            >
              {!selectedStateCoverage ? (
                <EmptyState text="Select a state to inspect vendor coverage." />
              ) : (
                <div className="vs-stack">
                  <div className="vs-grid-3">
                    <StatCard
                      label="Live Vendors"
                      value={selectedStateCoverage.live_vendor_count}
                      delta="Imported / database"
                      tone="up"
                    />
                    <StatCard
                      label="Total Records"
                      value={selectedStateCoverage.vendor_count}
                      delta="Live + modeled"
                      tone="up"
                    />
                    <StatCard
                      label="Live Spend"
                      value={fmtMoneyShort(selectedStateCoverage.total_spend)}
                      delta="FEC spend layer"
                      tone="up"
                    />
                  </div>

                  <div className="vs-grid-2">
                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() => goToStateOperations(selectedStateCoverage.state, selectedGroup)}
                    >
                      State Operations
                    </button>
                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() => goToExecutiveMap(selectedStateCoverage.state, selectedGroup)}
                    >
                      Executive Map
                    </button>
                  </div>

                  <button
                    type="button"
                    className="vs-button"
                    onClick={() =>
                      goToCommandCenter({
                        state: selectedStateCoverage.state,
                        coverage: selectedStateCoverage.status.label,
                        score: String(selectedStateCoverage.coverage_score),
                        group: selectedGroup,
                        source: "vendor-network",
                      })
                    }
                  >
                    Send State to Command Center
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => createCoverageTask(selectedStateCoverage)}
                  >
                    Create Coverage Task
                  </button>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Top Vendors in Selected State"
              subtitle="Live records appear first; modeled records fill state coverage until live vendor data is available."
              right={<Badge tone="accent">{selectedStateCoverage?.vendors?.length || 0} records</Badge>}
            >
              <div className="vs-stack">
                {!selectedStateCoverage?.vendors?.length ? (
                  <EmptyState text="No vendor records available for this state/group." />
                ) : (
                  selectedStateCoverage.vendors
                    .slice()
                    .sort((a, b) => {
                      if (a.source === "modeled_baseline" && b.source !== "modeled_baseline") return 1;
                      if (a.source !== "modeled_baseline" && b.source === "modeled_baseline") return -1;
                      return Number(b.contract_value || b.fec_contract_value || 0) - Number(a.contract_value || a.fec_contract_value || 0);
                    })
                    .slice(0, 6)
                    .map((vendor, index) => (
                      <VendorMiniRow
                        key={vendor.id || vendor.vendor_id || `${vendor.vendor_name}-${index}`}
                        vendor={vendor}
                      />
                    ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Coverage Workflow"
              subtitle="Use this state coverage signal to move directly into the operational workflow."
              right={<Badge tone={selectedStateCoverage?.modeled ? "demo" : "active"}>{selectedStateCoverage?.modeled ? "Modeled" : "Live"}</Badge>}
            >
              {!selectedStateCoverage ? (
                <EmptyState text="Select a state to see workflow actions." />
              ) : (
                <div className="vs-stack">
                  <ResponsiveRow
                    title={`${selectedStateCoverage.state} execution readiness`}
                    subtitle={`${selectedStateCoverage.status.label} vendor coverage for ${selectedGroup}`}
                    meta={[
                      { label: "Coverage Score", value: `${selectedStateCoverage.coverage_score}/100` },
                      { label: "Live Vendors", value: selectedStateCoverage.live_vendor_count },
                      { label: "Total Records", value: selectedStateCoverage.vendor_count },
                      { label: "Groups", value: selectedStateCoverage.categories.join(", ") || "None" },
                    ]}
                    right={<Badge tone={selectedStateCoverage.status.tone}>{selectedStateCoverage.status.label}</Badge>}
                  />

                  <div className="vs-grid-2">
                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          state: selectedStateCoverage.state,
                          page: 1,
                        }))
                      }
                    >
                      Filter Directory
                    </button>
                    <button
                      type="button"
                      className="vs-button"
                      onClick={() => createCoverageTask(selectedStateCoverage)}
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </SectionCard>
      
      <SectionCard
        title="Vendor Spend Groups"
        subtitle="FEC-imported vendors and modeled baseline coverage organized by Mail, Digital, Media, Compliance, Consulting, and Events."
        right={<Badge tone="info">6 groups</Badge>}
      >
        <div className="vs-grid-3">
          {VENDOR_GROUPS.map((group) => (
            <VendorGroupCard
              key={group}
              group={group}
              vendors={groupedVendors[group] || []}
              selected={selectedGroup === group}
              onOpenGroup={setSelectedGroup}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="FEC Vendor Spend Intelligence"
        subtitle="Campaign operating expenditure payees grouped into vendor, service, state, committee, and spend signals."
        right={<Badge tone={fecRows.length ? "active" : "demo"}>{fecLoading ? "Loading" : `${fecRows.length} FEC vendors`}</Badge>}
      >
        <div className="vs-stack">
          {fecLoading ? (
            <EmptyState text="Loading FEC vendor spend intelligence..." />
          ) : !fecRows.length ? (
            <EmptyState text="No FEC vendor spending found for the selected filters." />
          ) : (
            fecRows.slice(0, 8).map((vendor, index) => (
              <VendorRow
                key={vendor.id || vendor.vendor_id || `${vendor.vendor_name}-${index}`}
                vendor={vendor}
                onCreateCommandTask={createVendorTask}
                onInspectVendor={setSelectedVendor}
              />
            ))
          )}
        </div>
      </SectionCard>

      <div className="vs-vendor-balanced-grid">
        <SectionCard
          title="Coverage Gaps"
          subtitle="States with vendor coverage detected but not enough depth for operational readiness."
          right={<Badge tone={gapStates.length ? "danger" : "active"}>{gapStates.length} gaps</Badge>}
        >
          <div className="vs-stack">
            {!gapStates.length ? (
              <EmptyState text="No coverage gaps detected for this group." />
            ) : (
              gapStates.map((state) => (
                <StateCoverageRow
                  key={state.state}
                  item={state}
                  selectedGroup={selectedGroup}
                  onCreateTask={createCoverageTask}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Thin Coverage"
          subtitle="States with some coverage that should be reinforced before execution pressure increases."
          right={<Badge tone={thinStates.length ? "demo" : "active"}>{thinStates.length} watch</Badge>}
        >
          <div className="vs-stack">
            {!thinStates.length ? (
              <EmptyState text="No thin coverage states detected for this group." />
            ) : (
              thinStates.map((state) => (
                <StateCoverageRow
                  key={state.state}
                  item={state}
                  selectedGroup={selectedGroup}
                  onCreateTask={createCoverageTask}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="vs-vendor-balanced-grid">
        <SectionCard
          title="FEC Spend Categories"
          subtitle="Vendor services inferred from reported operating expenditure purposes."
          right={<Badge tone="info">{fecCategories.length} categories</Badge>}
        >
          <div className="vs-stack">
            {!fecCategories.length ? (
              <EmptyState text="No FEC spend categories available." />
            ) : (
              fecCategories.slice(0, 8).map((item) => (
                <SpendCategoryRow key={item.category} item={item} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Top Vendor Performance"
          subtitle="Vendor reliability modeled from internal MailOps history or FEC spend activity."
          right={<Badge tone="accent">{effectivePerformance.length} scored</Badge>}
        >
          <div className="vs-stack">
            {performanceLoading && !fecRows.length ? (
              <EmptyState text="Loading vendor performance..." />
            ) : !effectivePerformance.length ? (
              <EmptyState text="No vendor performance history yet." />
            ) : (
              effectivePerformance.slice(0, 8).map((item) => (
                <PerformanceRow
                  key={item.id || item.vendor_id || item.vendor_name}
                  item={item}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="vs-vendor-balanced-grid">
        <div ref={vendorDirectoryRef}>
          {activeVendor ? (
            <PoliticalGraphContextPanel
              entityType="vendor"
              entityId={activeVendor.id || activeVendor.vendor_id}
              entityName={activeVendor.vendor_name || activeVendor.name}
              state={activeVendor.state || activeVendor.primary_state || activeVendor.payee_state}
              title="Vendor Relationship Graph"
              subtitle="Political relationships connected to the selected vendor."
              compact
            />
          ) : null}

          <SectionCard
            title={selectedGroup && selectedGroup !== "All" ? `${selectedGroup} Vendor Directory` : "Live Vendor Directory"}
            subtitle={
              filters.state
                ? `Database and FEC-backed vendor network filtered to ${filters.state}.`
                : "Database and FEC-backed vendor network with operating coverage and status."
            }
            right={<Badge tone="accent">{visibleRows.length} shown</Badge>}
          >
            <div className="vs-stack">
              {loading && fecLoading ? (
                <EmptyState text="Loading vendors..." />
              ) : visibleRows.length === 0 ? (
                <EmptyState text="No live vendors found; select a state on the map to inspect modeled coverage." />
              ) : (
                visibleRows.map((vendor, index) => {
                  const highlighted =
                    isFromExecutionBoard &&
                    filters.state &&
                    statesMatch(vendor.state || vendor.primary_state, filters.state);

                  return (
                    <VendorRow
                      key={
                        vendor.id ??
                        vendor.vendor_id ??
                        `${vendor.name || vendor.vendor_name}-${index}`
                      }
                      vendor={vendor}
                      highlighted={highlighted}
                      onCreateCommandTask={createVendorTask}
                      onInspectVendor={setSelectedVendor}
                    />
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="vs-stack">
          <SectionCard
            title="Active Coverage Gaps"
            subtitle="Open vendor coverage gaps that still require operational action."
            right={
              <Badge tone={gapCount ? "danger" : "accent"}>
                {gapCount} active
              </Badge>
            }
          >
            <div className="vs-stack">
              {intelLoading && fecLoading ? (
                <EmptyState text="Loading vendor intelligence..." />
              ) : !effectiveIntel?.gaps?.length ? (
                <EmptyState text="No active vendor coverage gaps." />
              ) : (
                effectiveIntel.gaps
                  .slice(0, 6)
                  .map((gap, index) => (
                    <RiskRow key={`${gap.state}-${index}`} item={gap} />
                  ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Resolved Gap History"
            subtitle="Vendor coverage gaps closed through completed execution tasks."
            right={<Badge tone="active">{resolvedGapCount} resolved</Badge>}
          >
            <div className="vs-stack">
              {intelLoading ? (
                <EmptyState text="Loading resolved vendor history..." />
              ) : !effectiveIntel?.resolved_gaps?.length ? (
                <EmptyState text="No resolved vendor gaps yet." />
              ) : (
                effectiveIntel.resolved_gaps
                  .slice(0, 6)
                  .map((gap, index) => (
                    <ResolvedGapRow key={`${gap.state}-${index}`} item={gap} />
                  ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Recommended Actions"
            subtitle="Create execution tasks directly from active vendor intelligence."
            right={
              <Badge tone="demo">
                {effectiveIntel?.recommended_actions?.length || 0} actions
              </Badge>
            }
          >
            <div className="vs-stack">
              {!effectiveIntel?.recommended_actions?.length ? (
                <EmptyState text="No recommended vendor actions." />
              ) : (
                effectiveIntel.recommended_actions.slice(0, 6).map((action, index) => {
                  const taskKey = getActionKey(action, index);

                  return (
                    <ActionTaskRow
                      key={taskKey}
                      action={action}
                      creating={creatingTaskId === taskKey}
                      taskExists={existingTaskIds.has(taskKey)}
                      onCreateTask={createVendorTask}
                    />
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}

