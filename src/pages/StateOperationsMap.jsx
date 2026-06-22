import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const STATE_POSITIONS = {
  AK: [1, 1], ME: [11, 1],
  VT: [10, 2], NH: [11, 2], WA: [2, 2], MT: [3, 2], ND: [4, 2], MN: [5, 2], WI: [6, 2], MI: [7, 2], NY: [9, 2], MA: [11, 3],
  OR: [2, 3], ID: [3, 3], SD: [4, 3], IA: [5, 3], IL: [6, 3], IN: [7, 3], OH: [8, 3], PA: [9, 3], CT: [10, 3], RI: [11, 4],
  CA: [2, 4], NV: [3, 4], WY: [4, 4], NE: [5, 4], MO: [6, 4], KY: [7, 4], WV: [8, 4], VA: [9, 4], NJ: [10, 4],
  HI: [1, 5], AZ: [3, 5], UT: [4, 5], CO: [5, 5], KS: [6, 5], AR: [7, 5], TN: [8, 5], NC: [9, 5], DE: [10, 5],
  NM: [4, 6], OK: [5, 6], LA: [6, 6], MS: [7, 6], AL: [8, 6], SC: [9, 6], MD: [10, 6], DC: [11, 6],
  TX: [5, 7], GA: [8, 7], FL: [9, 8],
};

const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const EXECUTION_BASELINE = {
  AL: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 1, owner: "South Desk", readiness: 71 },
  AK: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Frontier Desk", readiness: 86 },
  AZ: { status: "Escalated", tasks: 4, vendors: 3, mail: 2, escalations: 2, resolved: 1, owner: "Sun Belt Desk", readiness: 48 },
  AR: { status: "Healthy", tasks: 0, vendors: 1, mail: 0, escalations: 0, resolved: 1, owner: "South Desk", readiness: 82 },
  CA: { status: "Monitoring", tasks: 2, vendors: 2, mail: 3, escalations: 1, resolved: 3, owner: "Pacific Desk", readiness: 68 },
  CO: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 1, owner: "Mountain Desk", readiness: 74 },
  CT: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 1, owner: "Northeast Desk", readiness: 88 },
  DE: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Mid-Atlantic Desk", readiness: 90 },
  DC: { status: "Monitoring", tasks: 1, vendors: 0, mail: 1, escalations: 0, resolved: 0, owner: "Capital Desk", readiness: 76 },
  FL: { status: "Escalated", tasks: 5, vendors: 4, mail: 3, escalations: 2, resolved: 2, owner: "Sun Belt Desk", readiness: 44 },
  GA: { status: "Critical", tasks: 7, vendors: 5, mail: 4, escalations: 3, resolved: 2, owner: "Sun Belt Desk", readiness: 35 },
  HI: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Pacific Desk", readiness: 91 },
  ID: { status: "Healthy", tasks: 0, vendors: 1, mail: 0, escalations: 0, resolved: 0, owner: "Mountain Desk", readiness: 85 },
  IL: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 2, owner: "Midwest Desk", readiness: 73 },
  IN: { status: "Monitoring", tasks: 1, vendors: 1, mail: 0, escalations: 0, resolved: 1, owner: "Midwest Desk", readiness: 78 },
  IA: { status: "Escalated", tasks: 3, vendors: 2, mail: 1, escalations: 1, resolved: 1, owner: "Midwest Desk", readiness: 57 },
  KS: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 1, owner: "Plains Desk", readiness: 87 },
  KY: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 1, owner: "Upper South Desk", readiness: 75 },
  LA: { status: "Escalated", tasks: 3, vendors: 2, mail: 2, escalations: 1, resolved: 2, owner: "South Desk", readiness: 59 },
  ME: { status: "Monitoring", tasks: 1, vendors: 0, mail: 1, escalations: 0, resolved: 0, owner: "Northeast Desk", readiness: 76 },
  MD: { status: "Monitoring", tasks: 1, vendors: 0, mail: 1, escalations: 0, resolved: 1, owner: "Mid-Atlantic Desk", readiness: 79 },
  MA: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 1, owner: "Northeast Desk", readiness: 86 },
  MI: { status: "Critical", tasks: 6, vendors: 4, mail: 3, escalations: 3, resolved: 2, owner: "Blue Wall Desk", readiness: 38 },
  MN: { status: "Escalated", tasks: 3, vendors: 2, mail: 2, escalations: 1, resolved: 1, owner: "Upper Midwest Desk", readiness: 58 },
  MS: { status: "Healthy", tasks: 0, vendors: 1, mail: 0, escalations: 0, resolved: 1, owner: "South Desk", readiness: 83 },
  MO: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 2, owner: "Midwest Desk", readiness: 74 },
  MT: { status: "Escalated", tasks: 2, vendors: 1, mail: 1, escalations: 1, resolved: 0, owner: "Mountain Desk", readiness: 62 },
  NE: { status: "Monitoring", tasks: 1, vendors: 1, mail: 0, escalations: 0, resolved: 1, owner: "Plains Desk", readiness: 78 },
  NV: { status: "Critical", tasks: 5, vendors: 3, mail: 3, escalations: 2, resolved: 1, owner: "Sun Belt Desk", readiness: 41 },
  NH: { status: "Escalated", tasks: 2, vendors: 1, mail: 1, escalations: 1, resolved: 1, owner: "Northeast Desk", readiness: 63 },
  NJ: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 1, owner: "Mid-Atlantic Desk", readiness: 75 },
  NM: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 0, owner: "Southwest Desk", readiness: 77 },
  NY: { status: "Escalated", tasks: 2, vendors: 2, mail: 2, escalations: 1, resolved: 2, owner: "Northeast Desk", readiness: 65 },
  NC: { status: "Critical", tasks: 6, vendors: 4, mail: 3, escalations: 3, resolved: 2, owner: "South Atlantic Desk", readiness: 36 },
  ND: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Plains Desk", readiness: 89 },
  OH: { status: "Escalated", tasks: 3, vendors: 2, mail: 2, escalations: 1, resolved: 2, owner: "Midwest Desk", readiness: 56 },
  OK: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 1, owner: "Plains Desk", readiness: 85 },
  OR: { status: "Monitoring", tasks: 1, vendors: 0, mail: 1, escalations: 0, resolved: 1, owner: "Pacific Desk", readiness: 77 },
  PA: { status: "Critical", tasks: 8, vendors: 5, mail: 4, escalations: 4, resolved: 3, owner: "Blue Wall Desk", readiness: 32 },
  RI: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Northeast Desk", readiness: 90 },
  SC: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 1, owner: "South Atlantic Desk", readiness: 73 },
  SD: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Plains Desk", readiness: 88 },
  TN: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 2, owner: "Upper South Desk", readiness: 76 },
  TX: { status: "Critical", tasks: 6, vendors: 4, mail: 4, escalations: 3, resolved: 3, owner: "Sun Belt Desk", readiness: 40 },
  UT: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 1, owner: "Mountain Desk", readiness: 87 },
  VT: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Northeast Desk", readiness: 91 },
  VA: { status: "Escalated", tasks: 3, vendors: 2, mail: 2, escalations: 1, resolved: 2, owner: "South Atlantic Desk", readiness: 60 },
  WA: { status: "Monitoring", tasks: 1, vendors: 1, mail: 1, escalations: 0, resolved: 2, owner: "Pacific Desk", readiness: 79 },
  WV: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 1, owner: "Appalachia Desk", readiness: 84 },
  WI: { status: "Critical", tasks: 6, vendors: 4, mail: 3, escalations: 3, resolved: 2, owner: "Blue Wall Desk", readiness: 37 },
  WY: { status: "Healthy", tasks: 0, vendors: 0, mail: 0, escalations: 0, resolved: 0, owner: "Mountain Desk", readiness: 90 },
};

const EXECUTION_LAYERS = [
  ["status", "Status"],
  ["tasks", "Open Tasks"],
  ["vendors", "Vendor Gaps"],
  ["mail", "MailOps"],
  ["escalations", "Escalations"],
  ["resolved", "Resolved"],
];

function fmtNumber(value) {
  return Number(value || 0).toLocaleString();
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "critical") return "danger";
  if (value === "escalated") return "demo";
  if (value === "monitoring") return "accent";
  return "active";
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "critical") return "status-critical";
  if (value === "escalated") return "status-escalated";
  if (value === "monitoring") return "status-monitoring";
  return "status-healthy";
}

function normalizeLiveState(row = {}) {
  const code = String(row.state_code || row.state || row.abbr || "").toUpperCase();
  if (!code) return null;

  const base = EXECUTION_BASELINE[code] || {
    status: "Healthy",
    tasks: 0,
    vendors: 0,
    mail: 0,
    escalations: 0,
    resolved: 0,
    owner: "Operations Desk",
    readiness: 82,
  };

  const activeTasks = Number(row.active_task_count || row.open_tasks || row.tasks || base.tasks || 0);
  const vendorGaps = Number(row.vendor_gap_count || row.vendors_scored || row.vendor_gaps || base.vendors || 0);
  const mailJobs = Number(row.mail_jobs || row.total_mail_jobs || row.mail_risk_jobs || base.mail || 0);
  const escalations = Number(row.escalations || row.active_escalations || row.mail_risk_jobs || base.escalations || 0);
  const resolved = Number(row.resolved_task_count || row.resolved_escalations || base.resolved || 0);
  const readiness = Number(row.readiness_score || row.data_coverage_score || base.readiness || 0);

  let status = row.execution_status || row.command_status || base.status;
  if (!row.execution_status && !row.command_status) {
    if (activeTasks >= 6 || escalations >= 3) status = "Critical";
    else if (activeTasks >= 3 || escalations >= 1 || vendorGaps >= 3) status = "Escalated";
    else if (activeTasks >= 1 || vendorGaps >= 1 || mailJobs >= 1) status = "Monitoring";
    else status = "Healthy";
  }

  return {
    state_code: code,
    state: code,
    state_name: row.state_name || STATE_NAMES[code] || code,
    status,
    open_tasks: activeTasks,
    vendor_gaps: vendorGaps,
    mail_jobs: mailJobs,
    escalations,
    resolved,
    owner: row.owner || row.assigned_owner || base.owner,
    readiness,
    source: "live",
    data_label: row.data_coverage_label || "Live execution data",
    recommendation: row.recommendation || buildExecutionRecommendation(code, status, activeTasks, vendorGaps, mailJobs, escalations),
  };
}

function baselineExecutionState(code) {
  const abbr = String(code || "").toUpperCase();
  const base = EXECUTION_BASELINE[abbr] || {
    status: "Healthy",
    tasks: 0,
    vendors: 0,
    mail: 0,
    escalations: 0,
    resolved: 0,
    owner: "Operations Desk",
    readiness: 82,
  };

  return {
    state_code: abbr,
    state: abbr,
    state_name: STATE_NAMES[abbr] || abbr,
    status: base.status,
    open_tasks: base.tasks,
    vendor_gaps: base.vendors,
    mail_jobs: base.mail,
    escalations: base.escalations,
    resolved: base.resolved,
    owner: base.owner,
    readiness: base.readiness,
    source: "modeled",
    data_label: "Modeled execution baseline",
    recommendation: buildExecutionRecommendation(abbr, base.status, base.tasks, base.vendors, base.mail, base.escalations),
  };
}

function buildExecutionRecommendation(code, status, tasks, vendors, mail, escalations) {
  const state = code || "state";

  if (String(status).toLowerCase() === "critical" || escalations >= 3) {
    return `Immediate execution review for ${state}: assign owner, clear escalations, verify vendors, and open Command Center.`;
  }

  if (String(status).toLowerCase() === "escalated" || tasks >= 3) {
    return `Prioritize ${state}: review open tasks, validate county readiness, and reduce vendor or MailOps bottlenecks.`;
  }

  if (vendors || mail || tasks) {
    return `Monitor ${state}: keep execution coverage active and resolve outstanding vendor, MailOps, or task items.`;
  }

  return `Maintain ${state}: no major execution blockers. Keep baseline monitoring active.`;
}

function completeExecutionStates(liveRows = []) {
  const liveLookup = liveRows.reduce((acc, row) => {
    const item = normalizeLiveState(row);
    if (item?.state_code) acc[item.state_code] = item;
    return acc;
  }, {});

  return Object.keys(STATE_POSITIONS)
    .sort((a, b) => a.localeCompare(b))
    .map((code) => liveLookup[code] || baselineExecutionState(code));
}

function getLayerValue(item, layer) {
  if (!item) return 0;
  if (layer === "tasks") return item.open_tasks || 0;
  if (layer === "vendors") return item.vendor_gaps || 0;
  if (layer === "mail") return item.mail_jobs || 0;
  if (layer === "escalations") return item.escalations || 0;
  if (layer === "resolved") return item.resolved || 0;
  return item.status;
}

function getStatusFromLayer(item, layer) {
  if (layer === "status") return item.status;
  const value = Number(getLayerValue(item, layer) || 0);

  if (layer === "resolved") {
    if (value >= 3) return "Healthy";
    if (value >= 1) return "Monitoring";
    return "Healthy";
  }

  if (value >= 5) return "Critical";
  if (value >= 3) return "Escalated";
  if (value >= 1) return "Monitoring";
  return "Healthy";
}

function buildSummary(states = []) {
  const critical = states.filter((item) => item.status === "Critical").length;
  const escalated = states.filter((item) => item.status === "Escalated").length;
  const monitoring = states.filter((item) => item.status === "Monitoring").length;
  const healthy = states.filter((item) => item.status === "Healthy").length;

  return {
    critical,
    escalated,
    monitoring,
    healthy,
    openTasks: states.reduce((sum, item) => sum + Number(item.open_tasks || 0), 0),
    vendorGaps: states.reduce((sum, item) => sum + Number(item.vendor_gaps || 0), 0),
    mailJobs: states.reduce((sum, item) => sum + Number(item.mail_jobs || 0), 0),
    escalations: states.reduce((sum, item) => sum + Number(item.escalations || 0), 0),
    resolved: states.reduce((sum, item) => sum + Number(item.resolved || 0), 0),
    live: states.filter((item) => item.source === "live").length,
    modeled: states.filter((item) => item.source !== "live").length,
  };
}

function buildExecutionRows(states = []) {
  return states
    .filter((item) => item.status !== "Healthy" || item.open_tasks || item.vendor_gaps || item.mail_jobs || item.escalations)
    .sort((a, b) => {
      const rank = { Critical: 4, Escalated: 3, Monitoring: 2, Healthy: 1 };
      return (rank[b.status] || 0) - (rank[a.status] || 0) || Number(b.open_tasks || 0) - Number(a.open_tasks || 0);
    });
}

function buildExecutionFeed(states = []) {
  return buildExecutionRows(states).slice(0, 12).map((item, index) => ({
    id: `${item.state_code}-${index}`,
    title:
      item.status === "Critical"
        ? `${item.state_name} execution escalation requires review`
        : item.status === "Escalated"
          ? `${item.state_name} has active operational bottlenecks`
          : `${item.state_name} is under execution monitoring`,
    state: item.state_code,
    owner: item.owner,
    status: item.status,
    source: item.source === "live" ? "Live Command Center" : "Execution Baseline",
    metric: `${item.open_tasks} tasks • ${item.vendor_gaps} vendor gaps • ${item.mail_jobs} MailOps`,
  }));
}

function MapStateCell({ item, layer, selected, onSelect }) {
  const pos = STATE_POSITIONS[item.state_code] || [1, 1];
  const displayStatus = getStatusFromLayer(item, layer);
  const value = getLayerValue(item, layer);

  return (
    <button
      type="button"
      className={`ops-exec-state ${statusClass(displayStatus)} ${selected?.state_code === item.state_code ? "is-selected" : ""} ${item.source === "live" ? "is-live" : "is-modeled"}`}
      style={{ gridColumn: pos[0], gridRow: pos[1] }}
      title={`${item.state_name}: ${displayStatus}`}
      onClick={() => onSelect(item)}
    >
      <span>{item.state_code}</span>
      <b>{layer === "status" ? item.status.replace("Monitoring", "Watch") : fmtNumber(value)}</b>
      <em>{item.source === "live" ? "LIVE" : "OPS"}</em>
      {item.escalations ? <i /> : null}
    </button>
  );
}

function ExecutionRow({ item, onSelect }) {
  return (
    <div className={`ops-exec-row ${statusClass(item.status)}`}>
      <ResponsiveRow
        title={`${item.state_name} Execution Status`}
        subtitle={`${item.owner} • ${item.source === "live" ? "Live data" : "Modeled baseline"} • readiness ${item.readiness}%`}
        meta={[
          { label: "Status", value: item.status },
          { label: "Open Tasks", value: item.open_tasks },
          { label: "Vendor Gaps", value: item.vendor_gaps },
          { label: "MailOps", value: item.mail_jobs },
          { label: "Escalations", value: item.escalations },
        ]}
        right={
          <div className="ops-exec-actions">
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            <button type="button" className="vs-decision-btn deploy" onClick={() => onSelect(item)}>
              Inspect
            </button>
          </div>
        }
      />
    </div>
  );
}

function FeedRow({ item, onOpen }) {
  return (
    <div className={`ops-exec-feed-row ${statusClass(item.status)}`}>
      <ResponsiveRow
        title={item.title}
        subtitle={`${item.source} • ${item.metric}`}
        meta={[
          { label: "State", value: item.state },
          { label: "Owner", value: item.owner },
          { label: "Status", value: item.status },
        ]}
        right={
          <button type="button" className="vs-button vs-button-secondary" onClick={() => onOpen(item.state)}>
            Command Center
          </button>
        }
      />
    </div>
  );
}

export default function StateOperationsMap() {
  const navigate = useNavigate();

  const [data, setData] = useState({ states: [] });
  const [layer, setLayer] = useState("status");
  const [selectedState, setSelectedState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function load({ quiet = false } = {}) {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (typeof api.operationsMap !== "function") {
        throw new Error("Operations map API client is not available.");
      }

      const result = await api.operationsMap();
      const states = completeExecutionStates(Array.isArray(result?.states) ? result.states : []);

      setData({
        ...(result || {}),
        states,
        executionRows: buildExecutionRows(states),
        executionFeed: buildExecutionFeed(states),
        summary: buildSummary(states),
      });

      setSelectedState((current) => {
        if (!current) return states.find((item) => item.status === "Critical") || states[0] || null;
        return states.find((item) => item.state_code === current.state_code) || states[0] || null;
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      const states = completeExecutionStates([]);

      setError(err?.response?.data?.error || err?.message || "Live operations feed failed. Showing execution baseline.");

      setData({
        states,
        executionRows: buildExecutionRows(states),
        executionFeed: buildExecutionFeed(states),
        summary: buildSummary(states),
      });

      setSelectedState(states.find((item) => item.status === "Critical") || states[0] || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, []);

  const states = data?.states || [];
  const rows = data?.executionRows || [];
  const feed = data?.executionFeed || [];
  const summary = data?.summary || buildSummary(states);
  const selected = useMemo(() => {
    if (!selectedState) return rows[0] || states[0] || null;
    return states.find((item) => item.state_code === selectedState.state_code) || selectedState;
  }, [selectedState, states, rows]);

  function openCommandCenter(stateCode, action = "execution-map") {
    const code = String(stateCode || selected?.state_code || "").toUpperCase();
    const params = new URLSearchParams();
    params.set("source", "state-operations-map");
    if (code) params.set("state", code);
    params.set("action", action);
    if (selected?.status) params.set("status", selected.status);
    navigate(`/command-center?${params.toString()}`);
  }

  function openStateDrilldown(stateCode) {
    if (!stateCode) return;
    navigate(`/state-operations/${String(stateCode).toUpperCase()}`);
  }

  return (
    <PageShell
      eyebrow="Operational Execution"
      title="State Operations Map"
      description="Execution command map focused on open tasks, vendor gaps, MailOps work, escalations, resolved items, owners, and readiness."
      tickerItems={[
        { label: "Open Tasks", value: fmtNumber(summary.openTasks), dotClass: summary.openTasks ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Critical", value: fmtNumber(summary.critical), dotClass: summary.critical ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Escalated", value: fmtNumber(summary.escalated), dotClass: summary.escalated ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Vendor Gaps", value: fmtNumber(summary.vendorGaps), dotClass: summary.vendorGaps ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Live / Modeled", value: `${summary.live} / ${summary.modeled}`, dotClass: summary.modeled ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Live", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .ops-exec-summary {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .ops-exec-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.8fr);
          gap: 18px;
          align-items: start;
        }

        .ops-exec-map-stage {
          min-height: 650px;
          border-radius: 30px;
          border: 1px solid rgba(148,163,184,0.16);
          background:
            radial-gradient(circle at top left, rgba(37,99,235,0.17), transparent 34%),
            radial-gradient(circle at bottom right, rgba(14,165,233,0.1), transparent 32%),
            linear-gradient(135deg, rgba(15,23,42,0.92), rgba(2,6,23,0.84));
          padding: 18px;
          position: relative;
          overflow: hidden;
        }

        .ops-exec-map-stage:before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(96,165,250,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,165,250,0.06) 1px, transparent 1px);
          background-size: 34px 34px;
          pointer-events: none;
          opacity: 0.7;
        }

        .ops-exec-map-header {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .ops-exec-map-header strong {
          display: block;
          color: white;
          font-size: 18px;
          font-weight: 950;
        }

        .ops-exec-map-header span {
          display: block;
          color: rgba(203,213,225,0.68);
          font-size: 12px;
          margin-top: 4px;
        }

        .ops-exec-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ops-exec-tab {
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.74);
          color: rgba(226,232,240,0.88);
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .ops-exec-tab.is-active {
          border-color: rgba(96,165,250,0.62);
          background: rgba(37,99,235,0.34);
          color: white;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .ops-exec-grid-map {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(11, minmax(42px, 1fr));
          grid-template-rows: repeat(8, 58px);
          gap: 9px;
          margin-top: 20px;
        }

        .ops-exec-state {
          position: relative;
          border-radius: 17px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(15,23,42,0.82);
          color: white;
          display: grid;
          place-items: center;
          gap: 1px;
          cursor: pointer;
          min-width: 0;
          overflow: hidden;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }

        .ops-exec-state:hover,
        .ops-exec-state.is-selected {
          transform: translateY(-2px) scale(1.025);
          z-index: 5;
          border-color: rgba(255,255,255,0.72);
          box-shadow: 0 18px 46px rgba(2,6,23,0.38);
        }

        .ops-exec-state span {
          font-size: 13px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .ops-exec-state b {
          font-size: 9px;
          color: rgba(226,232,240,0.78);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 4px;
        }

        .ops-exec-state em {
          font-style: normal;
          font-size: 7px;
          color: rgba(226,232,240,0.52);
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .ops-exec-state i {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgb(248,113,113);
        }

        .ops-exec-state.status-critical {
          background: linear-gradient(135deg, rgba(127,29,29,0.92), rgba(248,113,113,0.42));
          border-color: rgba(248,113,113,0.62);
        }

        .ops-exec-state.status-escalated {
          background: linear-gradient(135deg, rgba(124,45,18,0.9), rgba(251,146,60,0.38));
          border-color: rgba(251,146,60,0.54);
        }

        .ops-exec-state.status-monitoring {
          background: linear-gradient(135deg, rgba(30,64,175,0.72), rgba(56,189,248,0.24));
          border-color: rgba(56,189,248,0.4);
        }

        .ops-exec-state.status-healthy {
          background: linear-gradient(135deg, rgba(20,83,45,0.72), rgba(34,197,94,0.24));
          border-color: rgba(34,197,94,0.38);
        }

        .ops-exec-state.is-modeled {
          opacity: 0.83;
        }

        .ops-exec-state.is-live {
          box-shadow: inset 0 0 0 1px rgba(56,189,248,0.28);
        }

        .ops-exec-legend {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .ops-exec-legend span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(226,232,240,0.82);
          font-size: 12px;
          font-weight: 800;
        }

        .ops-exec-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(34,197,94,0.9);
        }

        .ops-exec-dot.critical { background: rgba(248,113,113,0.95); }
        .ops-exec-dot.escalated { background: rgba(251,146,60,0.95); }
        .ops-exec-dot.monitoring { background: rgba(56,189,248,0.95); }
        .ops-exec-dot.modeled { background: rgba(148,163,184,0.75); }

        .ops-exec-side,
        .ops-exec-list,
        .ops-exec-feed {
          display: grid;
          gap: 14px;
        }

        .ops-selected-panel {
          border-radius: 26px;
          border: 1px solid rgba(148,163,184,0.16);
          background:
            radial-gradient(circle at top right, rgba(59,130,246,0.15), transparent 35%),
            linear-gradient(135deg, rgba(15,23,42,0.86), rgba(2,6,23,0.72));
          padding: 18px;
        }

        .ops-selected-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .ops-selected-top h3 {
          margin: 0;
          color: white;
          font-size: 21px;
          letter-spacing: -0.04em;
        }

        .ops-selected-top p {
          margin: 6px 0 0;
          color: rgba(203,213,225,0.68);
          font-size: 12px;
        }

        .ops-selected-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .ops-selected-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(2,6,23,0.32);
          padding: 12px;
        }

        .ops-selected-grid span {
          display: block;
          color: rgba(203,213,225,0.64);
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ops-selected-grid strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
          font-weight: 950;
        }

        .ops-selected-action {
          margin-top: 14px;
          border-radius: 18px;
          border: 1px solid rgba(96,165,250,0.22);
          background: rgba(37,99,235,0.14);
          padding: 14px;
        }

        .ops-selected-action span {
          display: block;
          color: rgba(147,197,253,0.95);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .ops-selected-action p {
          margin: 8px 0 0;
          color: rgba(226,232,240,0.9);
          font-size: 13px;
          line-height: 1.55;
        }

        .ops-selected-buttons,
        .ops-exec-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
          align-items: center;
          justify-content: flex-start;
        }

        .ops-selected-buttons button,
        .ops-selected-buttons a {
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.74);
          color: rgba(226,232,240,0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .ops-selected-buttons button:hover,
        .ops-selected-buttons a:hover {
          border-color: rgba(96,165,250,0.48);
          background: rgba(37,99,235,0.24);
          color: white;
        }

        .ops-exec-row,
        .ops-exec-feed-row {
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.16);
          background: linear-gradient(135deg, rgba(15,23,42,0.76), rgba(15,23,42,0.44));
          overflow: hidden;
        }

        .ops-exec-row.status-critical,
        .ops-exec-feed-row.status-critical {
          border-color: rgba(248,113,113,0.34);
        }

        .ops-exec-row.status-escalated,
        .ops-exec-feed-row.status-escalated {
          border-color: rgba(251,146,60,0.32);
        }

        .ops-exec-row.status-monitoring,
        .ops-exec-feed-row.status-monitoring {
          border-color: rgba(56,189,248,0.26);
        }

        .ops-exec-row .vs-responsive-row,
        .ops-exec-feed-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1150px) {
          .ops-exec-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .ops-exec-grid-map {
            grid-template-columns: repeat(6, minmax(40px, 1fr));
            grid-auto-rows: 54px;
          }

          .ops-exec-state {
            grid-column: auto !important;
            grid-row: auto !important;
          }

          .ops-selected-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-demo">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Open Tasks" value={fmtNumber(summary.openTasks)} delta="Execution items requiring ownership" tone={summary.openTasks ? "down" : "up"} />
        <StatCard label="Critical States" value={fmtNumber(summary.critical)} delta="Immediate operational review" tone={summary.critical ? "down" : "up"} />
        <StatCard label="Vendor Gaps" value={fmtNumber(summary.vendorGaps)} delta="Coverage blockers" tone={summary.vendorGaps ? "down" : "up"} />
        <StatCard label="Resolved Items" value={fmtNumber(summary.resolved)} delta="Closed execution pressure" tone="up" />
      </div>

      <div className="ops-exec-layout">
        <div className="ops-exec-map-stage" data-tour="state-operations-execution-map">
          <div className="ops-exec-map-header">
            <div>
              <strong>U.S. Operations Execution Command</strong>
              <span>This map is no longer political heat. It shows what needs action, ownership, vendors, MailOps, and escalation review.</span>
            </div>

            <div className="ops-exec-tabs">
              {EXECUTION_LAYERS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`ops-exec-tab ${layer === id ? "is-active" : ""}`}
                  onClick={() => setLayer(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <EmptyState text="Loading execution command map..." />
          ) : (
            <div className="ops-exec-grid-map">
              {states.map((item) => (
                <MapStateCell
                  key={item.state_code}
                  item={item}
                  layer={layer}
                  selected={selected}
                  onSelect={setSelectedState}
                />
              ))}
            </div>
          )}

          <div className="ops-exec-legend">
            <span><i className="ops-exec-dot critical" /> Critical</span>
            <span><i className="ops-exec-dot escalated" /> Escalated</span>
            <span><i className="ops-exec-dot monitoring" /> Monitoring</span>
            <span><i className="ops-exec-dot" /> Healthy</span>
            <span><i className="ops-exec-dot modeled" /> Modeled baseline</span>
          </div>
        </div>

        <div className="ops-exec-side">
          <div className="ops-selected-panel" data-tour="state-operations-selected-execution">
            {!selected ? (
              <EmptyState text="Select a state to inspect execution status." />
            ) : (
              <>
                <div className="ops-selected-top">
                  <div>
                    <h3>{selected.state_name} Execution</h3>
                    <p>{selected.owner} • {selected.data_label}</p>
                  </div>
                  <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                </div>

                <div className="ops-selected-grid">
                  <div><span>Open Tasks</span><strong>{selected.open_tasks}</strong></div>
                  <div><span>Vendor Gaps</span><strong>{selected.vendor_gaps}</strong></div>
                  <div><span>MailOps</span><strong>{selected.mail_jobs}</strong></div>
                  <div><span>Escalations</span><strong>{selected.escalations}</strong></div>
                  <div><span>Resolved</span><strong>{selected.resolved}</strong></div>
                  <div><span>Readiness</span><strong>{selected.readiness}%</strong></div>
                </div>

                <div className="ops-selected-action">
                  <span>Recommended execution action</span>
                  <p>{selected.recommendation}</p>
                </div>

                <div className="ops-selected-buttons">
                  <button type="button" onClick={() => openCommandCenter(selected.state_code, "state-execution")}>
                    Open Command Center
                  </button>
                  <button type="button" onClick={() => openStateDrilldown(selected.state_code)}>
                    County Drilldown
                  </button>
                  <Link to={`/vendors?state=${selected.state_code}&source=state-operations-map`}>
                    Vendor Coverage
                  </Link>
                  <Link to="/mailops">
                    MailOps Dashboard
                  </Link>
                </div>
              </>
            )}
          </div>

          <SectionCard
            title="Execution Queue"
            subtitle="States sorted by current operational action requirement."
            right={<Badge tone="danger">{rows.length} active</Badge>}
          >
            <div className="ops-exec-list">
              {!rows.length ? (
                <EmptyState text="No execution work is currently flagged." />
              ) : (
                rows.slice(0, 10).map((item) => (
                  <ExecutionRow key={item.state_code} item={item} onSelect={setSelectedState} />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="vs-grid-2" style={{ marginTop: 18 }}>
        <SectionCard
          title="Operational Feed"
          subtitle="Execution movement coming from tasks, vendor gaps, MailOps and escalation status."
          right={<Badge tone="accent">{feed.length} signals</Badge>}
        >
          <div className="ops-exec-feed">
            {!feed.length ? (
              <EmptyState text="No execution feed items." />
            ) : (
              feed.map((item) => <FeedRow key={item.id} item={item} onOpen={openCommandCenter} />)
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Map Actions"
          subtitle="Move from the execution layer into the pages that complete the work."
        >
          <div className="ops-selected-buttons">
            <Link to="/operations-map">Executive Strategic Map</Link>
            <Link to="/command-center">Command Center</Link>
            <Link to="/state-operations">State Operations Index</Link>
            <Link to="/mailops">MailOps Dashboard</Link>
            <Link to="/vendors">Vendor Network</Link>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

