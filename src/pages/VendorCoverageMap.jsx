import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const US_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const COVERAGE_GROUPS = ["All", "Mail", "Digital", "Media", "Compliance", "Consulting", "Events"];

const STATE_NAME_TO_ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
};

const STATE_ABBR_TO_NAME = Object.entries(STATE_NAME_TO_ABBR).reduce((acc, [name, abbr]) => {
  acc[abbr] = name;
  return acc;
}, {});

const STATE_CENTROIDS = {
  AL: [-86.8, 32.8], AK: [-152.4, 64.2], AZ: [-111.7, 34.3], AR: [-92.4, 34.9], CA: [-119.5, 37.2],
  CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0], FL: [-81.7, 27.8], GA: [-83.4, 32.7],
  HI: [-157.5, 20.9], ID: [-114.1, 44.2], IL: [-89.2, 40.0], IN: [-86.1, 40.0], IA: [-93.5, 42.1],
  KS: [-98.3, 38.5], KY: [-84.8, 37.8], LA: [-91.9, 31.2], ME: [-69.0, 45.3], MD: [-76.7, 39.0],
  MA: [-71.8, 42.3], MI: [-84.6, 44.3], MN: [-94.2, 46.3], MS: [-89.7, 32.7], MO: [-92.6, 38.5],
  MT: [-110.0, 46.9], NE: [-99.8, 41.5], NV: [-116.6, 39.3], NH: [-71.6, 43.7], NJ: [-74.7, 40.1],
  NM: [-106.1, 34.4], NY: [-75.0, 43.0], NC: [-79.4, 35.5], ND: [-100.5, 47.5], OH: [-82.8, 40.4],
  OK: [-97.5, 35.6], OR: [-120.5, 44.0], PA: [-77.7, 40.9], RI: [-71.5, 41.7], SC: [-80.9, 33.8],
  SD: [-100.2, 44.4], TN: [-86.4, 35.8], TX: [-99.3, 31.5], UT: [-111.7, 39.3], VT: [-72.7, 44.1],
  VA: [-78.7, 37.5], WA: [-120.7, 47.4], WV: [-80.6, 38.6], WI: [-89.6, 44.6], WY: [-107.6, 43.0], DC: [-77.0, 38.9],
};

function fmtMoney(value) { return `$${Number(value || 0).toLocaleString()}`; }
function fmtMoneyShort(value) {
  const amount = Number(value || 0);
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return fmtMoney(amount);
}
function normalizeList(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return data?.results || data?.vendors || data?.rows || [];
}
function normalizeState(value = "") {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  if (STATE_ABBR_TO_NAME[upper]) return upper;
  return STATE_NAME_TO_ABBR[raw] || upper;
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
function coverageStatus(score = 0) {
  const value = Number(score || 0);
  if (value >= 76) return { label: "Covered", tone: "active", fill: "#166534", stroke: "#86efac" };
  if (value >= 45) return { label: "Thin", tone: "demo", fill: "#92400e", stroke: "#fbbf24" };
  if (value > 0) return { label: "Gap", tone: "danger", fill: "#7f1d1d", stroke: "#fca5a5" };
  return { label: "No Data", tone: "default", fill: "#111827", stroke: "#374151" };
}
async function loadFecVendorSpend(params = {}) {
  if (typeof api.vendorFecSpend === "function") return api.vendorFecSpend(params);
  if (typeof api.get === "function") {
    const response = await api.get("/vendor-fec/spend", { params, timeout: 10000 });
    return response?.data || response;
  }
  return null;
}
function calculateCoverageScore(stateVendors = []) {
  if (!stateVendors.length) return 0;
  const vendorCount = new Set(stateVendors.map((v) => v.vendor_name || v.name).filter(Boolean)).size;
  const categoryCount = new Set(stateVendors.map((v) => normalizeVendorGroup(v.category, v.services))).size;
  const totalSpend = stateVendors.reduce((sum, v) => sum + Number(v.contract_value || v.amount || 0), 0);
  const transactionCount = stateVendors.reduce((sum, v) => sum + Number(v.transaction_count || 1), 0);
  return Math.min(100, Math.min(38, vendorCount * 6) + Math.min(32, categoryCount * 6) + Math.min(20, Math.round(totalSpend / 50000)) + Math.min(10, transactionCount));
}
function buildStateCoverage(vendors = [], group = "All") {
  const stateMap = new Map();
  Object.entries(STATE_ABBR_TO_NAME).forEach(([abbr, name]) => {
    stateMap.set(abbr, { state: abbr, state_name: name, vendors: [], vendor_count: 0, categories: [], total_spend: 0, transaction_count: 0, coverage_score: 0, status: coverageStatus(0) });
  });
  vendors.forEach((vendor) => {
    const state = normalizeState(vendor.state || vendor.primary_state || vendor.payee_state);
    if (!state || !stateMap.has(state)) return;
    const vendorGroup = normalizeVendorGroup(vendor.category, vendor.services);
    if (group !== "All" && vendorGroup !== group) return;
    stateMap.get(state).vendors.push({ ...vendor, vendor_group: vendorGroup });
  });
  stateMap.forEach((item) => {
    item.vendor_count = new Set(item.vendors.map((v) => v.vendor_name || v.name).filter(Boolean)).size;
    item.categories = [...new Set(item.vendors.map((v) => v.vendor_group).filter(Boolean))];
    item.total_spend = item.vendors.reduce((sum, v) => sum + Number(v.contract_value || v.amount || 0), 0);
    item.transaction_count = item.vendors.reduce((sum, v) => sum + Number(v.transaction_count || 1), 0);
    item.coverage_score = calculateCoverageScore(item.vendors);
    item.status = coverageStatus(item.coverage_score);
  });
  return [...stateMap.values()].sort((a, b) => b.coverage_score - a.coverage_score || b.total_spend - a.total_spend);
}
function VendorMiniRow({ vendor }) {
  const name = vendor.vendor_name || vendor.name || "Unnamed Vendor";
  const group = vendor.vendor_group || normalizeVendorGroup(vendor.category, vendor.services);
  return (
    <ResponsiveRow
      title={name}
      subtitle={`${group} | ${vendor.category || "Campaign Operations"}`}
      meta={[
        { label: "Spend", value: fmtMoneyShort(vendor.contract_value || vendor.amount || 0) },
        { label: "Transactions", value: vendor.transaction_count || 1 },
        { label: "Committees", value: vendor.committee_count || "â€”" },
      ]}
      right={<Badge tone="info">{group}</Badge>}
    />
  );
}
function StateCoverageRow({ state, onOpenCommandCenter, onOpenStateOps, onOpenExecutiveMap }) {
  return (
    <div className="vs-vendor-coverage-row">
      <ResponsiveRow
        title={`${state.state} - ${state.state_name}`}
        subtitle={`${state.status.label} | ${state.vendor_count} vendors | ${state.categories.length} service groups`}
        meta={[
          { label: "Coverage", value: `${state.coverage_score}/100` },
          { label: "Spend", value: fmtMoneyShort(state.total_spend) },
          { label: "Transactions", value: state.transaction_count },
          { label: "Categories", value: state.categories.join(", ") || "No coverage" },
        ]}
        right={<Badge tone={state.status.tone}>{state.status.label}</Badge>}
      />
      <div className="vs-coverage-actions">
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onOpenStateOps(state)}>State Operations</button>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onOpenExecutiveMap(state)}>Executive Map</button>
        <button type="button" className="vs-button" onClick={() => onOpenCommandCenter(state)}>Command Center</button>
      </div>
    </div>
  );
}
function GroupCard({ group, vendors = [], selected, onSelect }) {
  const spend = vendors.reduce((sum, v) => sum + Number(v.contract_value || v.amount || 0), 0);
  const stateCount = new Set(vendors.map((v) => normalizeState(v.state || v.primary_state)).filter(Boolean)).size;
  return (
    <button type="button" className={`vs-group-card ${selected ? "is-selected" : ""}`} onClick={() => onSelect(group)}>
      <div><div className="vs-group-title">{group}</div><div className="vs-group-subtitle">{vendors.length} vendors | {stateCount} states</div></div>
      <div className="vs-group-spend">{fmtMoneyShort(spend)}</div>
      <Badge tone={vendors.length ? "active" : "default"}>{selected ? "Active View" : "Open"}</Badge>
    </button>
  );
}
function MapTooltip({ tooltip }) {
  if (!tooltip.visible || !tooltip.state) return null;
  const state = tooltip.state;
  return (
    <div className="vs-vendor-map-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}>
      <div className="vs-tooltip-title">{state.state} - {state.state_name}</div>
      <div className="vs-tooltip-copy">{state.status.label} coverage | {state.coverage_score}/100</div>
      <div className="vs-tooltip-grid"><span>Vendors</span><strong>{state.vendor_count}</strong><span>Spend</span><strong>{fmtMoneyShort(state.total_spend)}</strong><span>Categories</span><strong>{state.categories.length}</strong></div>
    </div>
  );
}

export default function VendorCoverageMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fecRows, setFecRows] = useState([]);
  const [vendorRows, setVendorRows] = useState([]);
  const [error, setError] = useState("");
  const [cycle, setCycle] = useState("2026");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedState, setSelectedState] = useState("PA");
  const [creating, setCreating] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, state: null });

  useEffect(() => {
    let active = true;
    async function loadCoverage() {
      try {
        setLoading(true);
        setError("");
        const [fecResult, vendorResult] = await Promise.allSettled([
          loadFecVendorSpend({ cycle, limit: 250, live: 1 }),
          typeof api.vendors === "function" ? api.vendors({ limit: 250 }) : Promise.resolve([]),
        ]);
        if (!active) return;
        setFecRows(fecResult.status === "fulfilled" ? normalizeList(fecResult.value, ["results", "vendors", "rows"]) : []);
        setVendorRows(vendorResult.status === "fulfilled" ? normalizeList(vendorResult.value, ["results", "vendors", "rows"]) : []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load vendor coverage map.");
        setFecRows([]);
        setVendorRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCoverage();
    return () => { active = false; };
  }, [cycle]);

  const allVendors = useMemo(() => {
    const map = new Map();
    vendorRows.forEach((v) => { const key = String(v.vendor_name || v.name || "").toLowerCase(); if (key) map.set(key, v); });
    fecRows.forEach((v) => {
      const key = String(v.vendor_name || v.name || "").toLowerCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, v);
      else {
        const existing = map.get(key);
        map.set(key, { ...v, ...existing, contract_value: existing.contract_value || v.contract_value, transaction_count: existing.transaction_count || v.transaction_count, committee_clients: existing.committee_clients || v.committee_clients });
      }
    });
    return [...map.values()];
  }, [fecRows, vendorRows]);

  const groupedVendorRows = useMemo(() => {
    const grouped = {};
    COVERAGE_GROUPS.forEach((group) => { grouped[group] = []; });
    allVendors.forEach((vendor) => {
      const group = normalizeVendorGroup(vendor.category, vendor.services);
      grouped.All.push(vendor);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(vendor);
    });
    return grouped;
  }, [allVendors]);

  const stateCoverage = useMemo(() => buildStateCoverage(allVendors, selectedGroup), [allVendors, selectedGroup]);
  const stateCoverageByAbbr = useMemo(() => Object.fromEntries(stateCoverage.map((state) => [state.state, state])), [stateCoverage]);
  const selectedStateCoverage = useMemo(() => stateCoverage.find((state) => state.state === selectedState) || stateCoverage[0] || null, [stateCoverage, selectedState]);
  const gapStates = useMemo(() => stateCoverage.filter((state) => state.coverage_score > 0 && state.coverage_score < 45).slice(0, 12), [stateCoverage]);
  const thinStates = useMemo(() => stateCoverage.filter((state) => state.coverage_score >= 45 && state.coverage_score < 76).slice(0, 12), [stateCoverage]);
  const coveredStates = useMemo(() => stateCoverage.filter((state) => state.coverage_score >= 76), [stateCoverage]);
  const totalSpend = allVendors.reduce((sum, vendor) => sum + Number(vendor.contract_value || vendor.amount || 0), 0);

  function showTooltip(event, state) { setTooltip({ visible: true, x: event.clientX, y: event.clientY, state }); }
  function hideTooltip() { setTooltip((prev) => ({ ...prev, visible: false })); }
  function openCommandCenter(state = selectedStateCoverage) {
    if (!state) return;
    const params = new URLSearchParams({ state: state.state, source: "vendor-coverage-map", coverage: state.status.label, score: String(state.coverage_score), group: selectedGroup });
    navigate(`/command-center?${params.toString()}`);
  }
  function openStateOperations(state = selectedStateCoverage) {
    if (!state) return;
    navigate(`/state-operations/${state.state}?source=vendor-coverage-map&group=${encodeURIComponent(selectedGroup)}`);
  }
  function openExecutiveMap(state = selectedStateCoverage) {
    if (!state) return;
    navigate(`/executive-operations-map?state=${state.state}&source=vendor-coverage-map&group=${encodeURIComponent(selectedGroup)}`);
  }
  async function createCoverageTask(state = selectedStateCoverage) {
    if (!state) return;
    try {
      setCreating(true);
      setTaskMessage(`Creating Command Center task for ${state.state} vendor coverage...`);
      if (typeof api.createTask === "function") {
        await api.createTask({
          title: `${state.state} ${selectedGroup} vendor coverage review`,
          description: `${state.state_name} has ${state.status.label.toLowerCase()} vendor coverage for ${selectedGroup}. Coverage score: ${state.coverage_score}/100. Vendors: ${state.vendor_count}. Categories: ${state.categories.join(", ") || "none"}.`,
          source: "vendor_coverage_map",
          state: state.state,
          office: "Statewide",
          priority: state.coverage_score < 45 ? "high" : "medium",
          status: "open",
          assigned_to: "Operations",
          due_label: state.coverage_score < 45 ? "Today" : "This Week",
          metadata: { vendor_coverage_state: state, vendor_group: selectedGroup },
        });
      }
      setTaskMessage(`Command Center task created for ${state.state} vendor coverage.`);
    } catch (err) {
      setTaskMessage(err?.message || "Failed to create vendor coverage task.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageShell
      eyebrow="Vendor Coverage Map"
      title="National Vendor Coverage Command"
      description="Connect Vendor Network, State Operations, Executive Operations, and Command Center into one operational coverage workflow."
      tickerItems={[
        { label: "Vendors", value: `${allVendors.length}`, dotClass: "vs-live-dot-success" },
        { label: "Covered States", value: `${coveredStates.length}`, dotClass: "vs-live-dot-success" },
        { label: "Thin / Gaps", value: `${thinStates.length + gapStates.length}`, dotClass: thinStates.length + gapStates.length ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "FEC Spend", value: fmtMoneyShort(totalSpend), dotClass: "vs-live-dot-warning" },
      ]}
    >
      <style>{`
        .vs-vendor-map-shell { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr); gap: 18px; align-items: start; }
        .vs-map-frame { height: 500px; min-height: 500px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 22px; background: radial-gradient(circle at 20% 0%, rgba(59,130,246,.14), transparent 34%), linear-gradient(135deg, rgba(15,23,42,.88), rgba(2,6,23,.72)); border: 1px solid rgba(148,163,184,.14); }
        .vs-group-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .vs-group-card { border: 1px solid rgba(148,163,184,.16); border-radius: 20px; padding: 14px; background: linear-gradient(135deg, rgba(15,23,42,.82), rgba(15,23,42,.52)); color: var(--vs-text); cursor: pointer; text-align: left; display: grid; gap: 12px; min-height: 138px; transition: all 160ms ease; }
        .vs-group-card:hover, .vs-group-card.is-selected { border-color: rgba(96,165,250,.5); box-shadow: 0 0 0 1px rgba(96,165,250,.18), 0 18px 40px rgba(2,6,23,.25); transform: translateY(-1px); }
        .vs-group-title { font-size: 16px; font-weight: 900; letter-spacing: -.02em; }
        .vs-group-subtitle { margin-top: 5px; color: var(--vs-text-muted); font-size: 12px; }
        .vs-group-spend { font-size: 21px; font-weight: 950; letter-spacing: -.04em; }
        .vs-vendor-map-tooltip { position: fixed; z-index: 90; width: 260px; pointer-events: none; padding: 12px 14px; border-radius: 16px; background: rgba(2,6,23,.96); border: 1px solid rgba(148,163,184,.2); box-shadow: 0 18px 42px rgba(0,0,0,.38); color: var(--vs-text); }
        .vs-tooltip-title { font-weight: 900; font-size: 14px; }
        .vs-tooltip-copy { margin-top: 5px; font-size: 12px; color: var(--vs-text-muted); }
        .vs-tooltip-grid { display: grid; grid-template-columns: 1fr auto; gap: 5px 10px; margin-top: 10px; font-size: 12px; }
        .vs-tooltip-grid span { color: var(--vs-text-muted); }
        .vs-vendor-coverage-row { border: 1px solid rgba(148,163,184,.16); border-radius: 18px; background: linear-gradient(135deg, rgba(15,23,42,.78), rgba(15,23,42,.48)); overflow: hidden; }
        .vs-vendor-coverage-row .vs-responsive-row { border: 0; background: transparent; }
        .vs-coverage-actions { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 16px 16px; }
        .vs-map-legend { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .vs-legend-item { display: inline-flex; align-items: center; gap: 7px; color: var(--vs-text-muted); font-size: 12px; font-weight: 800; }
        .vs-legend-swatch { width: 12px; height: 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); }
        @media (max-width: 1100px) { .vs-vendor-map-shell { grid-template-columns: 1fr; } .vs-group-grid { grid-template-columns: 1fr; } }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {taskMessage ? <div className="vs-banner vs-live-banner-pulse">{taskMessage}</div> : null}
      <MapTooltip tooltip={tooltip} />

      <div className="vs-grid-4">
        <StatCard label="Tracked Vendors" value={allVendors.length} delta="Database + FEC Schedule B" tone="up" />
        <StatCard label="Covered States" value={coveredStates.length} delta="Coverage score above 75" tone="up" />
        <StatCard label="Thin / Gap States" value={thinStates.length + gapStates.length} delta="Needs operational review" tone={thinStates.length + gapStates.length ? "down" : "up"} />
        <StatCard label="Mapped Spend" value={fmtMoneyShort(totalSpend)} delta={`${cycle} cycle vendor spend`} tone="up" />
      </div>

      <SectionCard title="Coverage Controls" subtitle="Switch service group views and campaign cycle. Selecting a state connects the workflow into State Operations, Executive Operations, and Command Center." right={<div className="vs-map-legend"><span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#166534" }} /> Covered</span><span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#92400e" }} /> Thin</span><span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#7f1d1d" }} /> Gap</span><span className="vs-legend-item"><span className="vs-legend-swatch" style={{ background: "#111827" }} /> No Data</span></div>}>
        <div className="vs-grid-3">
          <select className="vs-input" value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>{COVERAGE_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}</select>
          <select className="vs-input" value={selectedState} onChange={(event) => setSelectedState(event.target.value)}>{Object.entries(STATE_ABBR_TO_NAME).map(([abbr, name]) => <option key={abbr} value={abbr}>{abbr} - {name}</option>)}</select>
          <select className="vs-input" value={cycle} onChange={(event) => setCycle(event.target.value)}><option value="2026">2026 Cycle</option><option value="2024">2024 Cycle</option><option value="2022">2022 Cycle</option><option value="2020">2020 Cycle</option></select>
        </div>
      </SectionCard>

      <SectionCard title="Vendor Spend Groups" subtitle="FEC-imported vendors grouped by operational function.">
        <div className="vs-group-grid">{COVERAGE_GROUPS.map((group) => <GroupCard key={group} group={group} vendors={groupedVendorRows[group] || []} selected={selectedGroup === group} onSelect={setSelectedGroup} />)}</div>
      </SectionCard>

      <div className="vs-vendor-map-shell">
        <SectionCard title="U.S. Vendor Coverage Map" subtitle={`${selectedGroup} vendor coverage by state. Click a state to inspect actions and vendor records.`} right={<Badge tone="info">{selectedGroup}</Badge>}>
          <div className="vs-map-frame">
            {loading ? <EmptyState text="Loading vendor coverage map..." /> : (
              <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1040 }} style={{ width: "100%", maxWidth: "980px", height: "470px" }}>
                <Geographies geography={US_TOPO_JSON}>{({ geographies }) => geographies.map((geo) => {
                  const stateName = geo.properties?.name;
                  const abbr = STATE_NAME_TO_ABBR[stateName];
                  const state = abbr ? stateCoverageByAbbr[abbr] : null;
                  const status = state?.status || coverageStatus(0);
                  const isActive = selectedState === abbr;
                  return <Geography key={geo.rsmKey} geography={geo} onMouseEnter={(event) => { if (state) showTooltip(event, state); }} onMouseMove={(event) => { if (state) showTooltip(event, state); }} onMouseLeave={hideTooltip} onClick={() => { if (abbr) setSelectedState(abbr); }} style={{ default: { fill: status.fill, stroke: isActive ? "#f8fafc" : status.stroke, strokeWidth: isActive ? 1.8 : 0.85, outline: "none", cursor: "pointer" }, hover: { fill: status.fill, stroke: "#f8fafc", strokeWidth: 1.6, outline: "none", cursor: "pointer" }, pressed: { fill: status.fill, stroke: "#f8fafc", strokeWidth: 1.4, outline: "none" } }} />;
                })}</Geographies>
                {stateCoverage.filter((state) => state.coverage_score > 0 && STATE_CENTROIDS[state.state]).map((state) => {
                  const isActive = selectedState === state.state;
                  const coords = STATE_CENTROIDS[state.state];
                  return <Marker key={state.state} coordinates={coords}><circle r={isActive ? 8 : 5} fill="#f8fafc" stroke="#020617" strokeWidth={2} onMouseEnter={(event) => showTooltip(event, state)} onMouseMove={(event) => showTooltip(event, state)} onMouseLeave={hideTooltip} onClick={() => setSelectedState(state.state)} style={{ cursor: "pointer" }} /><text textAnchor="middle" y={-10} style={{ fontFamily: "inherit", fill: "#e5e7eb", fontSize: 9, fontWeight: 800, pointerEvents: "none" }}>{state.state}</text></Marker>;
                })}
              </ComposableMap>
            )}
          </div>
        </SectionCard>

        <div className="vs-stack">
          <SectionCard title={selectedStateCoverage ? `${selectedStateCoverage.state} Vendor Coverage` : "State Coverage Detail"} subtitle={selectedStateCoverage ? `${selectedStateCoverage.state_name} | ${selectedGroup} | ${selectedStateCoverage.status.label}` : "Select a state on the map."} right={selectedStateCoverage ? <Badge tone={selectedStateCoverage.status.tone}>{selectedStateCoverage.coverage_score}/100</Badge> : null}>
            {!selectedStateCoverage ? <EmptyState text="Select a state to inspect vendor coverage." /> : <div className="vs-stack"><div className="vs-grid-3"><StatCard label="Vendors" value={selectedStateCoverage.vendor_count} delta="Unique vendors" tone="up" /><StatCard label="Spend" value={fmtMoneyShort(selectedStateCoverage.total_spend)} delta="FEC / vendor mapped spend" tone="up" /><StatCard label="Categories" value={selectedStateCoverage.categories.length} delta={selectedStateCoverage.categories.join(", ") || "No categories"} tone="up" /></div><div className="vs-grid-2"><button type="button" className="vs-button vs-button-secondary" onClick={() => openStateOperations(selectedStateCoverage)}>Open State Operations</button><button type="button" className="vs-button vs-button-secondary" onClick={() => openExecutiveMap(selectedStateCoverage)}>Open Executive Map</button></div><button type="button" className="vs-button" onClick={() => openCommandCenter(selectedStateCoverage)}>Send State to Command Center</button><button type="button" className="vs-button vs-button-secondary" disabled={creating} onClick={() => createCoverageTask(selectedStateCoverage)}>{creating ? "Creating Task..." : "Create Coverage Task"}</button></div>}
          </SectionCard>
          <SectionCard title="Top Vendors in Selected State" subtitle="Vendors driving current state coverage." right={<Badge tone="accent">{selectedStateCoverage?.vendors?.length || 0} vendors</Badge>}>
            <div className="vs-stack">{!selectedStateCoverage?.vendors?.length ? <EmptyState text="No vendor records available for this state/group." /> : selectedStateCoverage.vendors.slice(0, 8).map((vendor, index) => <VendorMiniRow key={vendor.id || vendor.vendor_id || `${vendor.vendor_name}-${index}`} vendor={vendor} />)}</div>
          </SectionCard>
        </div>
      </div>

      <div className="vs-grid-2">
        <SectionCard title="Coverage Gaps" subtitle="States with vendor coverage detected but not enough depth for operational readiness." right={<Badge tone={gapStates.length ? "danger" : "active"}>{gapStates.length} gaps</Badge>}>
          <div className="vs-stack">{!gapStates.length ? <EmptyState text="No coverage gaps detected for this group." /> : gapStates.map((state) => <StateCoverageRow key={state.state} state={state} onOpenCommandCenter={openCommandCenter} onOpenStateOps={openStateOperations} onOpenExecutiveMap={openExecutiveMap} />)}</div>
        </SectionCard>
        <SectionCard title="Thin Coverage" subtitle="States with some coverage that should be reinforced before execution pressure increases." right={<Badge tone={thinStates.length ? "demo" : "active"}>{thinStates.length} watch</Badge>}>
          <div className="vs-stack">{!thinStates.length ? <EmptyState text="No thin coverage states detected for this group." /> : thinStates.map((state) => <StateCoverageRow key={state.state} state={state} onOpenCommandCenter={openCommandCenter} onOpenStateOps={openStateOperations} onOpenExecutiveMap={openExecutiveMap} />)}</div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

