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

const VENDOR_GROUPS = [
  "Mail",
  "Digital",
  "Media",
  "Compliance",
  "Consulting",
  "Events",
];

const US_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

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

function fmtMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function fmtMoneyShort(value) {
  const amount = Number(value || 0);
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
  return value || "Database";
}

function normalizeVendorGroup(category = "", services = "") {
  const value = `${category} ${services}`.toLowerCase();

  if (
    value.includes("mail") ||
    value.includes("print") ||
    value.includes("postage") ||
    value.includes("postcard") ||
    value.includes("letter") ||
    value.includes("mailer")
  ) {
    return "Mail";
  }

  if (
    value.includes("digital") ||
    value.includes("data") ||
    value.includes("software") ||
    value.includes("text") ||
    value.includes("sms") ||
    value.includes("email") ||
    value.includes("crm") ||
    value.includes("website")
  ) {
    return "Digital";
  }

  if (
    value.includes("media") ||
    value.includes("advertising") ||
    value.includes("tv") ||
    value.includes("radio") ||
    value.includes("broadcast") ||
    value.includes("ad buy") ||
    value.includes("placement")
  ) {
    return "Media";
  }

  if (
    value.includes("compliance") ||
    value.includes("legal") ||
    value.includes("treasurer") ||
    value.includes("accounting") ||
    value.includes("finance")
  ) {
    return "Compliance";
  }

  if (
    value.includes("consult") ||
    value.includes("strategy") ||
    value.includes("poll") ||
    value.includes("survey") ||
    value.includes("research") ||
    value.includes("field") ||
    value.includes("canvass")
  ) {
    return "Consulting";
  }

  if (
    value.includes("event") ||
    value.includes("venue") ||
    value.includes("travel") ||
    value.includes("lodging") ||
    value.includes("hotel") ||
    value.includes("catering")
  ) {
    return "Events";
  }

  return "Consulting";
}


function normalizeState(value = "") {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();

  if (STATE_ABBR_TO_NAME[upper]) return upper;

  return STATE_NAME_TO_ABBR[raw] || "";
}

function coverageStatus(score = 0) {
  const value = Number(score || 0);

  if (value >= 76) {
    return {
      label: "Covered",
      tone: "active",
      fill: "#166534",
      stroke: "#86efac",
    };
  }

  if (value >= 45) {
    return {
      label: "Thin",
      tone: "demo",
      fill: "#92400e",
      stroke: "#fbbf24",
    };
  }

  if (value > 0) {
    return {
      label: "Gap",
      tone: "danger",
      fill: "#7f1d1d",
      stroke: "#fca5a5",
    };
  }

  return {
    label: "No Data",
    tone: "default",
    fill: "#111827",
    stroke: "#374151",
  };
}

function calculateCoverageScore(stateVendors = []) {
  if (!stateVendors.length) return 0;

  const vendorCount = new Set(
    stateVendors
      .map((vendor) => vendor.vendor_name || vendor.name)
      .filter(Boolean)
  ).size;

  const categoryCount = new Set(
    stateVendors.map((vendor) =>
      normalizeVendorGroup(vendor.category, vendor.services || vendor.description)
    )
  ).size;

  const totalSpend = stateVendors.reduce(
    (sum, vendor) =>
      sum + Number(vendor.contract_value || vendor.fec_contract_value || vendor.amount || 0),
    0
  );

  const transactionCount = stateVendors.reduce(
    (sum, vendor) =>
      sum + Number(vendor.transaction_count || vendor.fec_transaction_count || 1),
    0
  );

  const vendorScore = Math.min(38, vendorCount * 6);
  const categoryScore = Math.min(32, categoryCount * 6);
  const spendScore = Math.min(20, Math.round(totalSpend / 50000));
  const activityScore = Math.min(10, transactionCount);

  return Math.min(100, vendorScore + categoryScore + spendScore + activityScore);
}

function buildStateCoverage(vendors = [], group = "All") {
  const stateMap = new Map();

  Object.entries(STATE_ABBR_TO_NAME).forEach(([abbr, name]) => {
    stateMap.set(abbr, {
      state: abbr,
      state_name: name,
      vendors: [],
      vendor_count: 0,
      categories: [],
      total_spend: 0,
      transaction_count: 0,
      coverage_score: 0,
      status: coverageStatus(0),
    });
  });

  vendors.forEach((vendor) => {
    const state = normalizeState(
      vendor.state || vendor.primary_state || vendor.payee_state
    );

    if (!state || !stateMap.has(state)) return;

    const vendorGroup = normalizeVendorGroup(
      vendor.category,
      vendor.services || vendor.description
    );

    if (group !== "All" && vendorGroup !== group) return;

    const item = stateMap.get(state);

    item.vendors.push({
      ...vendor,
      vendor_group: vendorGroup,
    });
  });

  stateMap.forEach((item) => {
    item.vendor_count = new Set(
      item.vendors
        .map((vendor) => vendor.vendor_name || vendor.name)
        .filter(Boolean)
    ).size;

    item.categories = [
      ...new Set(item.vendors.map((vendor) => vendor.vendor_group).filter(Boolean)),
    ];

    item.total_spend = item.vendors.reduce(
      (sum, vendor) =>
        sum + Number(vendor.contract_value || vendor.fec_contract_value || vendor.amount || 0),
      0
    );

    item.transaction_count = item.vendors.reduce(
      (sum, vendor) =>
        sum + Number(vendor.transaction_count || vendor.fec_transaction_count || 1),
      0
    );

    item.coverage_score = calculateCoverageScore(item.vendors);
    item.status = coverageStatus(item.coverage_score);
  });

  return [...stateMap.values()].sort(
    (a, b) => b.coverage_score - a.coverage_score || b.total_spend - a.total_spend
  );
}

function goToStateOperations(state, group = "All") {
  if (!state) return;
  window.location.href = `/state-operations/${state}?source=vendor-network&group=${encodeURIComponent(group)}`;
}

function goToExecutiveMap(state, group = "All") {
  if (!state) return;
  window.location.href = `/executive-operations-map?state=${encodeURIComponent(state)}&source=vendor-network&group=${encodeURIComponent(group)}`;
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

  if (!url.searchParams.get("source")) {
    url.searchParams.set("source", "vendor-network");
  }

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
  if (params.group) query.set("group", params.group);
  if (params.coverage) query.set("coverage", params.coverage);
  if (params.score) query.set("score", params.score);
  query.set("source", params.source || "vendor-network");

  const queryString = query.toString();
  window.location.href = queryString ? `/command-center?${queryString}` : "/command-center";
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

function VendorRow({ vendor, highlighted = false, onCreateCommandTask }) {
  const name = vendor.name || vendor.vendor_name || "Unnamed Vendor";
  const category = vendor.category || "Campaign Vendor";
  const state = vendor.state || vendor.primary_state || "Unknown";
  const services =
    vendor.services ||
    vendor.capabilities ||
    vendor.description ||
    "Campaign operations and political services";
  const group = normalizeVendorGroup(category, services);

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
          { label: "Spend / Contract", value: fmtMoney(vendor.contract_value || vendor.fec_contract_value) },
          { label: "Transactions", value: vendor.transaction_count || vendor.fec_transaction_count || "—" },
          { label: "Services", value: services },
        ]}
        right={
          <div className="vs-inline-actions">
            {highlighted ? <Badge tone="demo">Task Match</Badge> : null}
            <Badge tone="info">{group}</Badge>
            <Badge tone="accent">{vendor.status || "active"}</Badge>
          </div>
        }
      />

      <div className="vs-vendor-source-strip">
        {vendor.committee_clients ? (
          <span>
            Committee clients: {String(vendor.committee_clients).split(",").slice(0, 4).join(", ")}
          </span>
        ) : (
          <span>Committee clients unavailable from current record.</span>
        )}

        <div className="vs-vendor-row-actions">
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() =>
              goToCommandCenter({
                vendor: name,
                state,
              })
            }
          >
            Open in Command Center
          </button>

          <button
            type="button"
            className="vs-button"
            onClick={() => onCreateCommandTask?.({
              title: `Review ${name}`,
              detail: services,
              state,
              owner: "Operations",
              priority: "Medium",
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

function VendorGroupCard({ group, vendors = [], onOpenGroup }) {
  const total = vendors.reduce(
    (sum, vendor) => sum + Number(vendor.contract_value || vendor.fec_contract_value || 0),
    0
  );

  const stateCount = new Set(
    vendors.map((vendor) => vendor.state || vendor.primary_state).filter(Boolean)
  ).size;

  const committeeCount = vendors.reduce(
    (sum, vendor) => sum + Number(vendor.committee_count || 0),
    0
  );

  return (
    <button
      type="button"
      className="vs-vendor-group-card"
      onClick={() => onOpenGroup(group)}
    >
      <div>
        <div className="vs-vendor-group-title">{group}</div>
        <div className="vs-vendor-group-subtitle">
          {vendors.length} vendors | {stateCount} states
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

function RiskRow({ item }) {
  const severity = item.severity || item.priority || "Medium";

  return (
    <div
      className={`vs-premium-row-card ${
        severity === "High" ? "is-elevated" : ""
      }`}
    >
      <ResponsiveRow
        title={item.title || "Vendor intelligence signal"}
        subtitle={
          item.detail || "Review vendor coverage and operational readiness."
        }
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
        subtitle={`${item.state || "National"} | ${totalJobs} FEC spend record${
          totalJobs === 1 ? "" : "s"
        }`}
        meta={[
          { label: "Overall", value: `${score}%` },
          { label: "On-Time", value: `${onTime}%` },
          { label: "Reliability", value: `${reliability}%` },
          { label: "Risk", value: `${risk}%` },
          { label: "Spend", value: fmtMoneyShort(item.contract_value || 0) },
        ]}
        right={
          <Badge tone={performanceTone(score)}>{performanceLabel(score)}</Badge>
        }
      />
    </div>
  );
}

function ResolvedGapRow({ item }) {
  return (
    <div className="vs-premium-row-card is-resolved-gap">
      <ResponsiveRow
        title={item.title || `${item.state || "State"} vendor gap resolved`}
        subtitle={
          item.detail ||
          "This vendor coverage gap has been resolved by a completed task."
        }
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
    <div
      className={`vs-premium-row-card ${
        severity === "High" ? "is-elevated" : "is-action"
      }`}
    >
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


function StateCoverageRow({ item, selectedGroup, onCreateTask }) {
  return (
    <div className="vs-vendor-coverage-row">
      <ResponsiveRow
        title={`${item.state} - ${item.state_name}`}
        subtitle={`${item.status.label} | ${item.vendor_count} vendors | ${item.categories.length} groups`}
        meta={[
          { label: "Coverage", value: `${item.coverage_score}/100` },
          { label: "Spend", value: fmtMoneyShort(item.total_spend) },
          { label: "Transactions", value: item.transaction_count },
          { label: "Categories", value: item.categories.join(", ") || "None" },
        ]}
        right={<Badge tone={item.status.tone}>{item.status.label}</Badge>}
      />

      <div className="vs-coverage-actions">
        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => goToStateOperations(item.state, selectedGroup)}
        >
          State Operations
        </button>
        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => goToExecutiveMap(item.state, selectedGroup)}
        >
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
        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onCreateTask(item)}
        >
          Create Coverage Task
        </button>
      </div>
    </div>
  );
}

function VendorMiniRow({ vendor }) {
  const name = vendor.vendor_name || vendor.name || "Unnamed Vendor";
  const group = vendor.vendor_group || normalizeVendorGroup(vendor.category, vendor.services || vendor.description);

  return (
    <ResponsiveRow
      title={name}
      subtitle={`${group} | ${vendor.category || "Campaign Operations"}`}
      meta={[
        { label: "Spend", value: fmtMoneyShort(vendor.contract_value || vendor.fec_contract_value || vendor.amount || 0) },
        { label: "Transactions", value: vendor.transaction_count || vendor.fec_transaction_count || 1 },
        { label: "Committees", value: vendor.committee_count || "—" },
      ]}
      right={<Badge tone="info">{group}</Badge>}
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
        <span>Vendors</span>
        <strong>{state.vendor_count}</strong>
        <span>Spend</span>
        <strong>{fmtMoneyShort(state.total_spend)}</strong>
        <span>Groups</span>
        <strong>{state.categories.length}</strong>
      </div>
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
  const [statuses, setStatuses] = useState([]);
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
        const [stateData, categoryData, statusData] = await Promise.all([
          api.vendorStates?.(),
          api.vendorCategories?.(),
          api.vendorStatuses?.(),
        ]);

        if (!active) return;

        setStates(normalizeList(stateData, ["states", "results"]));
        setCategories(normalizeList(categoryData, ["categories", "results"]));
        setStatuses(normalizeList(statusData, ["statuses", "results"]));
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
          limit: 100,
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

  const groupedVendors = useMemo(() => {
    const grouped = {};

    MAP_GROUPS.forEach((group) => {
      grouped[group] = [];
    });

    displayRows.forEach((vendor) => {
      const group = normalizeVendorGroup(vendor.category, vendor.services || vendor.description);
      grouped.All.push(vendor);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(vendor);
    });

    return grouped;
  }, [displayRows]);

  const visibleRows = useMemo(() => {
    if (!selectedGroup || selectedGroup === "All") return displayRows;

    return displayRows.filter(
      (vendor) =>
        normalizeVendorGroup(vendor.category, vendor.services || vendor.description) === selectedGroup
    );
  }, [displayRows, selectedGroup]);

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
      detail: `${state.state_name} has ${state.status.label.toLowerCase()} vendor coverage for ${selectedGroup}. Coverage score: ${state.coverage_score}/100. Vendors: ${state.vendor_count}. Categories: ${state.categories.join(", ") || "none"}.`,
      state: state.state,
      owner: "Operations",
      priority: state.coverage_score < 45 ? "High" : "Medium",
      due: state.coverage_score < 45 ? "Today" : "This Week",
      vendor_group: selectedGroup,
    });
  }

  const fallbackIntel = useMemo(() => {
    const activeStates = fecStates.filter((row) => Number(row.vendor_count || 0) < 3);
    const gaps = activeStates.slice(0, 8).map((row) => ({
      title: `${row.state || "State"} vendor coverage requires review`,
      detail: `${row.vendor_count || 0} FEC-derived vendors and ${row.transaction_count || 0} spending records are visible.`,
      state: row.state || "National",
      severity: Number(row.vendor_count || 0) < 2 ? "High" : "Medium",
      coverage_score: Math.min(100, Number(row.vendor_count || 0) * 20),
    }));

    return {
      summary: {
        total_vendors: displayRows.length,
        active_vendors: displayRows.filter((row) => String(row.status || "").toLowerCase() === "active").length,
        states_covered: new Set(displayRows.map((row) => row.state).filter(Boolean)).size,
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
  }, [displayRows, fecStates]);

  const effectiveIntel = intel || fallbackIntel;

  const summary = useMemo(() => {
    return (
      effectiveIntel?.summary || {
        total_vendors: displayRows.length,
        active_vendors: displayRows.filter(
          (row) => String(row.status || "").toLowerCase() === "active"
        ).length,
        states_covered: new Set(displayRows.map((row) => row.state).filter(Boolean)).size,
        categories_covered: new Set(
          displayRows.map((row) => row.category).filter(Boolean)
        ).size,
        high_gap_states: 0,
        medium_gap_states: 0,
        resolved_gap_states: 0,
      }
    );
  }, [effectiveIntel, displayRows]);

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
  const values = new Set();

  function addState(item) {
    if (!item) return;

    if (typeof item === "string") {
      values.add(item);
      return;
    }

    const value =
      item.state ||
      item.name ||
      item.primary_state ||
      item.payee_state ||
      item.abbr ||
      "";

    if (value) values.add(String(value));
  }

  states.forEach(addState);
  fecStates.forEach(addState);

  return [...values].filter(Boolean).sort();
}, [states, fecStates]);

  const mergedCategories = useMemo(() => {
  const values = new Set();

  function addCategory(item) {
    if (!item) return;

    if (typeof item === "string") {
      values.add(item);
      return;
    }

    const value =
      item.category ||
      item.name ||
      item.service ||
      item.vendor_group ||
      "";

    if (value) values.add(String(value));
  }

  categories.forEach(addCategory);
  fecCategories.forEach(addCategory);

  return [...values].filter(Boolean).sort();
}, [categories, fecCategories]);

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
      description="Live campaign vendor coverage, FEC spending intelligence, performance scoring, operational readiness, and execution tasking."
      tickerItems={[
        {
          label: "Vendors",
          value: `${summary.total_vendors || displayRows.length || 0} live`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Coverage",
          value: `${summary.states_covered || 0} states`,
          dotClass: "vs-live-dot-warning",
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
          grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr);
          gap: 16px;
          align-items: start;
        }

        .vs-vendor-map-frame {
          height: 490px;
          min-height: 490px;
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

        @media (max-width: 1100px) {
          .vs-vendor-map-shell {
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
          delta="Database + FEC vendor records"
          tone="up"
        />
        <StatCard
          label="FEC Vendors"
          value={fecRows.length}
          delta="Schedule B payee intelligence"
          tone="up"
        />
        <StatCard
          label="Active Gaps"
          value={gapCount}
          delta="Open coverage pressure"
          tone={gapCount ? "down" : "up"}
        />
        <StatCard
          label="Risk Vendors"
          value={riskPerformanceCount}
          delta="Spend-linked performance risk"
          tone={riskPerformanceCount ? "down" : "up"}
        />
      </div>

      <SectionCard
        title="Vendor Controls"
        subtitle="Filter the live vendor network and FEC operating expenditure vendor intelligence."
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
              setFilters((prev) => ({
                ...prev,
                state: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All states</option>
            {mergedStates.map((value, index) => (
              <option key={`${value}-${index}`} value={value}>
                {value}
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
        subtitle={`${selectedGroup} vendor coverage by state. Click a state to connect Vendor Network into State Operations, Executive Operations, and Command Center.`}
        right={
          <div className="vs-map-legend">
            <span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#166534" }} /> Covered</span>
            <span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#92400e" }} /> Thin</span>
            <span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#7f1d1d" }} /> Gap</span>
            <span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#111827" }} /> No Data</span>
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
                  height: "470px",
                }}
              >
                <Geographies geography={US_TOPO_JSON}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateName = geo.properties?.name;
                      const abbr = STATE_NAME_TO_ABBR[stateName];
                      const state = abbr ? stateCoverageByAbbr[abbr] : null;
                      const status = state?.status || coverageStatus(0);
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
                  .filter((state) => state.coverage_score > 0 && STATE_CENTROIDS[state.state])
                  .map((state) => {
                    const isActive = selectedState === state.state;
                    const coords = STATE_CENTROIDS[state.state];

                    return (
                      <Marker key={state.state} coordinates={coords}>
                        <circle
                          r={isActive ? 8 : 5}
                          fill="#f8fafc"
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

          <div className="vs-stack">
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
                      label="Vendors"
                      value={selectedStateCoverage.vendor_count}
                      delta="Unique vendors"
                      tone="up"
                    />
                    <StatCard
                      label="Spend"
                      value={fmtMoneyShort(selectedStateCoverage.total_spend)}
                      delta="FEC / vendor mapped spend"
                      tone="up"
                    />
                    <StatCard
                      label="Groups"
                      value={selectedStateCoverage.categories.length}
                      delta={selectedStateCoverage.categories.join(", ") || "No groups"}
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
              subtitle="Vendors driving current state coverage."
              right={<Badge tone="accent">{selectedStateCoverage?.vendors?.length || 0} vendors</Badge>}
            >
              <div className="vs-stack">
                {!selectedStateCoverage?.vendors?.length ? (
                  <EmptyState text="No vendor records available for this state/group." />
                ) : (
                  selectedStateCoverage.vendors
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
          </div>
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
              />
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Vendor Spend Groups"
        subtitle="FEC-imported vendors organized by Mail, Digital, Media, Compliance, Consulting, and Events."
        right={
          selectedGroup && selectedGroup !== "All" ? (
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => setSelectedGroup("All")}
            >
              Show All Groups
            </button>
          ) : (
            <Badge tone="info">6 groups</Badge>
          )
        }
      >
        <div className="vs-grid-3">
          {VENDOR_GROUPS.map((group) => (
            <VendorGroupCard
              key={group}
              group={group}
              vendors={groupedVendors[group] || []}
              onOpenGroup={setSelectedGroup}
            />
          ))}
        </div>
      </SectionCard>


      <div className="vs-grid-2">
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

      <div className="vs-grid-2">
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

      <div className="vs-grid-2">
        <div ref={vendorDirectoryRef}>
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
                <EmptyState text="No vendors found." />
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

