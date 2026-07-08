import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

const US_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_FIPS_TO_ABBR = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC",
  "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT",
  "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY",
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

const STATE_COORDS = {
  AL: [-86.8, 32.8], AK: [-150.2, 64.2], AZ: [-111.7, 34.2], AR: [-92.4, 34.8], CA: [-119.5, 37.2],
  CO: [-105.6, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0], DC: [-77.0, 38.9], FL: [-82.4, 28.3],
  GA: [-83.5, 32.7], HI: [-157.8, 20.8], ID: [-114.4, 44.2], IL: [-89.2, 40.0], IN: [-86.1, 40.0],
  IA: [-93.5, 42.0], KS: [-98.4, 38.5], KY: [-84.8, 37.7], LA: [-91.9, 31.1], ME: [-69.2, 45.3],
  MD: [-76.7, 39.0], MA: [-71.8, 42.2], MI: [-85.6, 44.2], MN: [-94.2, 46.0], MS: [-89.7, 32.7],
  MO: [-92.5, 38.4], MT: [-110.4, 46.9], NE: [-99.9, 41.5], NV: [-116.6, 39.4], NH: [-71.6, 43.8],
  NJ: [-74.5, 40.1], NM: [-106.1, 34.4], NY: [-75.5, 43.0], NC: [-79.3, 35.5], ND: [-100.5, 47.5],
  OH: [-82.8, 40.2], OK: [-97.5, 35.6], OR: [-120.6, 44.0], PA: [-77.7, 40.9], RI: [-71.6, 41.7],
  SC: [-80.9, 33.8], SD: [-100.0, 44.4], TN: [-86.4, 35.8], TX: [-99.3, 31.1], UT: [-111.7, 39.3],
  VT: [-72.7, 44.0], VA: [-78.2, 37.7], WA: [-120.7, 47.4], WV: [-80.6, 38.6], WI: [-89.8, 44.7], WY: [-107.6, 43.0],
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

const STATE_ORDER = Object.keys(STATE_FIPS_TO_ABBR).map((fips) => STATE_FIPS_TO_ABBR[fips]).filter(Boolean);

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

function getStateFill(status) {
  const value = String(status || "").toLowerCase();
  if (value === "critical") return "#dc2626";
  if (value === "escalated") return "#f97316";
  if (value === "monitoring") return "#0284c7";
  return "#16a34a";
}

function getLayerStatus(item, layer) {
  if (!item) return "Healthy";
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

function getLayerValue(item, layer) {
  if (!item) return 0;
  if (layer === "tasks") return item.open_tasks || 0;
  if (layer === "vendors") return item.vendor_gaps || 0;
  if (layer === "mail") return item.mail_jobs || 0;
  if (layer === "escalations") return item.escalations || 0;
  if (layer === "resolved") return item.resolved || 0;
  return item.status;
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

  return STATE_ORDER.map((code) => liveLookup[code] || baselineExecutionState(code));
}

function buildSummary(states = []) {
  return {
    critical: states.filter((item) => item.status === "Critical").length,
    escalated: states.filter((item) => item.status === "Escalated").length,
    monitoring: states.filter((item) => item.status === "Monitoring").length,
    healthy: states.filter((item) => item.status === "Healthy").length,
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

function MapMarker({ item, layer, selected, onSelect }) {
  const coords = STATE_COORDS[item.state_code];
  if (!coords) return null;

  const status = getLayerStatus(item, layer);
  const value = getLayerValue(item, layer);
  const isSelected = selected?.state_code === item.state_code;

  return (
    <Marker coordinates={coords}>
      <g
        className={`ops-real-marker ${statusClass(status)} ${isSelected ? "is-selected" : ""}`}
        onClick={() => onSelect(item)}
        role="button"
        tabIndex={0}
        aria-label={`${item.state_name} ${status}`}
      >
        <circle r={13} />
        <text y={-2} textAnchor="middle">{item.state_code}</text>
        <text y={9} textAnchor="middle">{layer === "status" ? (item.status === "Monitoring" ? "Watch" : item.status.slice(0, 4)) : fmtNumber(value)}</text>
      </g>
    </Marker>
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

function StateOperationsExecutiveHeader({
  summary,
  selected,
  layer,
  liveStates,
  modeledStates,
  rows,
  refreshing,
  loading,
  lastUpdated,
  onRefresh,
  onCommandCenter,
  onDrilldown,
}) {
  const totalStates =
    Number(summary.critical || 0) +
    Number(summary.escalated || 0) +
    Number(summary.monitoring || 0) +
    Number(summary.healthy || 0);

  const healthScore =
    totalStates > 0
      ? (
          (Number(summary.healthy || 0) * 100 +
            Number(summary.monitoring || 0) * 72 +
            Number(summary.escalated || 0) * 46 +
            Number(summary.critical || 0) * 18) /
          totalStates
        )
      : 82;

  const taskPressure = Math.min(18, Number(summary.openTasks || 0) / Math.max(1, totalStates) * 3.5);
  const vendorPressure = Math.min(12, Number(summary.vendorGaps || 0) / Math.max(1, totalStates) * 3);
  const escalationPressure = Math.min(16, Number(summary.escalations || 0) / Math.max(1, totalStates) * 5);
  const resolvedCredit = Math.min(10, Number(summary.resolved || 0) / Math.max(1, totalStates) * 2.5);
  const liveCredit = Math.min(8, liveStates / Math.max(1, totalStates) * 8);

  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        healthScore -
          taskPressure -
          vendorPressure -
          escalationPressure +
          resolvedCredit +
          liveCredit
      )
    )
  );

  return (
    <div className="stateops-exec-ribbon" id="stateops-overview">
      <div className="stateops-exec-copy">
        <span>State Operations Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive operations layer for state execution status, open tasks, vendor gaps,
          MailOps pressure, escalation coverage, resolved work, and county drilldown handoff.
        </p>

        <div className="stateops-exec-badges">
          <Badge tone={summary.critical ? "danger" : "active"}>{summary.critical || 0} Critical</Badge>
          <Badge tone={summary.escalated ? "demo" : "active"}>{summary.escalated || 0} Escalated</Badge>
          <Badge tone={summary.monitoring ? "accent" : "active"}>{summary.monitoring || 0} Monitoring</Badge>
          <Badge tone="active">{summary.healthy || 0} Healthy</Badge>
          <Badge tone="info">{liveStates} Live / {modeledStates} Modeled</Badge>
          {selected ? <Badge tone={statusTone(selected.status)}>{selected.state_code} Selected</Badge> : null}
        </div>
      </div>

      <div className="stateops-exec-grid">
        <div>
          <span>Open Tasks</span>
          <strong>{fmtNumber(summary.openTasks)}</strong>
        </div>
        <div>
          <span>Vendor Gaps</span>
          <strong>{fmtNumber(summary.vendorGaps)}</strong>
        </div>
        <div>
          <span>MailOps Jobs</span>
          <strong>{fmtNumber(summary.mailJobs)}</strong>
        </div>
        <div>
          <span>Active Queue</span>
          <strong>{fmtNumber(rows.length)}</strong>
        </div>
      </div>

      <div className="stateops-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading || refreshing}>
          {refreshing ? "Refreshing Operations..." : "Refresh Operations"}
        </button>
        <button type="button" onClick={onCommandCenter}>
          Open Command Center
        </button>
        <button type="button" onClick={onDrilldown} disabled={!selected}>
          County Drilldown
        </button>
        <Link to="/vendors">Vendor Network</Link>
        <Link to="/mailops">MailOps Dashboard</Link>
      </div>

      <div className="stateops-exec-footer">
        <span>Active Layer: {EXECUTION_LAYERS.find(([id]) => id === layer)?.[1] || "Status"}</span>
        <span>Last Updated: {lastUpdated || "Live"}</span>
      </div>
    </div>
  );
}

function StateOperationsActionCenter({ selected, openCommandCenter, openStateDrilldown }) {
  return (
    <div className="stateops-action-center">
      <Link to="/operations-map">Executive Strategic Map</Link>
      <button type="button" onClick={() => openCommandCenter(selected?.state_code, "state-operations-action-center")}>
        Open Command Center
      </button>
      <button type="button" onClick={() => openStateDrilldown(selected?.state_code)} disabled={!selected?.state_code}>
        County / Parish Drilldown
      </button>
      <Link to={selected?.state_code ? `/vendors?state=${selected.state_code}&source=state-operations-map` : "/vendors"}>
        Vendor Coverage
      </Link>
      <Link to="/mailops">MailOps Dashboard</Link>
    </div>
  );
}

export default function StateOperationsMap() {
  const navigate = useNavigate();

  const [data, setData] = useState({ states: completeExecutionStates([]) });
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

  const states = data?.states?.length ? data.states : completeExecutionStates([]);
  const rows = data?.executionRows?.length ? data.executionRows : buildExecutionRows(states);
  const feed = data?.executionFeed?.length ? data.executionFeed : buildExecutionFeed(states);
  const summary = data?.summary || buildSummary(states);
  const stateLookup = useMemo(() => {
    return states.reduce((acc, item) => {
      acc[item.state_code] = item;
      return acc;
    }, {});
  }, [states]);

  const selected = useMemo(() => {
    if (!selectedState) return rows[0] || states.find((item) => item.status === "Critical") || states[0] || null;
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

  const navSections = [
    { id: "stateops-overview", label: "Overview" },
    { id: "stateops-metrics", label: "Metrics" },
    { id: "stateops-map", label: "Map" },
    { id: "stateops-selected", label: "Selected State" },
    { id: "stateops-queue", label: "Execution Queue", badge: rows.length },
    { id: "stateops-feed", label: "Operational Feed", badge: feed.length },
    { id: "stateops-actions", label: "Actions" },
  ];

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
        .stateops-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(251, 146, 60, 0.12), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .stateops-exec-copy {
          min-width: 0;
        }

        .stateops-exec-copy span,
        .stateops-exec-grid span,
        .stateops-exec-footer span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .stateops-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .stateops-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .stateops-exec-badges,
        .stateops-exec-actions,
        .stateops-exec-footer,
        .stateops-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .stateops-exec-badges {
          margin-top: 14px;
        }

        .stateops-exec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .stateops-exec-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .stateops-exec-grid strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .stateops-exec-actions,
        .stateops-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .stateops-exec-actions button,
        .stateops-exec-actions a,
        .stateops-action-center button,
        .stateops-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .stateops-exec-actions button:hover,
        .stateops-exec-actions a:hover,
        .stateops-action-center button:hover,
        .stateops-action-center a:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .stateops-exec-actions button:disabled,
        .stateops-action-center button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .stateops-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .stateops-main-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.8fr);
          gap: 18px;
          align-items: start;
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

        .ops-real-map-shell {
          position: relative;
          z-index: 2;
          min-height: 560px;
          border-radius: 28px;
          border: 1px solid rgba(148,163,184,0.12);
          background:
            radial-gradient(circle at 50% 52%, rgba(96,165,250,0.09), transparent 40%),
            linear-gradient(135deg, rgba(15,23,42,0.34), rgba(2,6,23,0.22));
          overflow: hidden;
        }

        .ops-real-map-shell svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .ops-real-marker {
          cursor: pointer;
          outline: none;
        }

        .ops-real-marker circle {
          fill: rgba(15,23,42,0.92);
          stroke: rgba(255,255,255,0.86);
          stroke-width: 1.6;
          filter: drop-shadow(0 8px 12px rgba(2,6,23,0.62));
        }

        .ops-real-marker.status-critical circle { fill: rgba(220,38,38,0.96); }
        .ops-real-marker.status-escalated circle { fill: rgba(249,115,22,0.96); }
        .ops-real-marker.status-monitoring circle { fill: rgba(2,132,199,0.96); }
        .ops-real-marker.status-healthy circle { fill: rgba(22,163,74,0.96); }

        .ops-real-marker.is-selected circle {
          stroke: white;
          stroke-width: 2.6;
          filter: drop-shadow(0 0 14px rgba(96,165,250,0.9));
        }

        .ops-real-marker text {
          pointer-events: none;
          fill: white;
          font-weight: 950;
          font-size: 7px;
          paint-order: stroke;
          stroke: rgba(2,6,23,0.72);
          stroke-width: 1.4px;
          stroke-linejoin: round;
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
          .ops-exec-layout,
          .stateops-exec-ribbon,
          .stateops-main-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .ops-exec-map-stage {
            padding: 14px;
          }

          .ops-selected-grid,
          .stateops-exec-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-demo">{error}</div> : null}

      <div className="stateops-exec-stack">
        <StateOperationsExecutiveHeader
          summary={summary}
          selected={selected}
          layer={layer}
          liveStates={summary.live}
          modeledStates={summary.modeled}
          rows={rows}
          refreshing={refreshing}
          loading={loading}
          lastUpdated={lastUpdated}
          onRefresh={() => load({ quiet: true })}
          onCommandCenter={() => openCommandCenter(selected?.state_code, "state-operations-header")}
          onDrilldown={() => openStateDrilldown(selected?.state_code)}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      <CollapsibleSection
        id="stateops-metrics"
        title="State Operations Metrics"
        subtitle="Open tasks, critical states, vendor gaps, resolved items, MailOps pressure, and escalation count."
        defaultOpen
        right={<Badge tone={summary.critical ? "danger" : "active"}>{summary.critical || 0} Critical</Badge>}
      >
      <div className="vs-grid-4">
        <StatCard label="Open Tasks" value={fmtNumber(summary.openTasks)} delta="Execution items requiring ownership" tone={summary.openTasks ? "down" : "up"} />
        <StatCard label="Critical States" value={fmtNumber(summary.critical)} delta="Immediate operational review" tone={summary.critical ? "down" : "up"} />
        <StatCard label="Vendor Gaps" value={fmtNumber(summary.vendorGaps)} delta="Coverage blockers" tone={summary.vendorGaps ? "down" : "up"} />
        <StatCard label="Resolved Items" value={fmtNumber(summary.resolved)} delta="Closed execution pressure" tone="up" />
      </div>
      </CollapsibleSection>

      <div className="stateops-main-layout">
        <div id="stateops-map" className="ops-exec-map-stage" data-tour="state-operations-execution-map">
          <div className="ops-exec-map-header">
            <div>
              <strong>U.S. Operations Execution Command</strong>
              <span>This is a real U.S. state map. State color represents execution status for the selected layer.</span>
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
            <div className="vs-banner vs-banner-demo">Loading live execution data — showing national operations baseline.</div>
          ) : null}

          <div className="ops-real-map-shell">
            <ComposableMap projection="geoAlbersUsa" width={980} height={610}>
              <Geographies geography={US_TOPO_JSON}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const abbr = STATE_FIPS_TO_ABBR[String(geo.id).padStart(2, "0")];
                    const item = stateLookup[abbr] || baselineExecutionState(abbr);
                    const layerStatus = getLayerStatus(item, layer);
                    const selectedMatch = selected?.state_code === abbr;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => setSelectedState(item)}
                        style={{
                          default: {
                            fill: getStateFill(layerStatus),
                            stroke: selectedMatch ? "#ffffff" : "rgba(15,23,42,0.85)",
                            strokeWidth: selectedMatch ? 2.4 : 0.9,
                            outline: "none",
                          },
                          hover: {
                            fill: getStateFill(layerStatus),
                            stroke: "#ffffff",
                            strokeWidth: 2,
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: getStateFill(layerStatus),
                            stroke: "#ffffff",
                            strokeWidth: 2,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {states.map((item) => (
                <MapMarker
                  key={item.state_code}
                  item={item}
                  layer={layer}
                  selected={selected}
                  onSelect={setSelectedState}
                />
              ))}
            </ComposableMap>
          </div>

          <div className="ops-exec-legend">
            <span><i className="ops-exec-dot critical" /> Critical</span>
            <span><i className="ops-exec-dot escalated" /> Escalated</span>
            <span><i className="ops-exec-dot monitoring" /> Monitoring</span>
            <span><i className="ops-exec-dot" /> Healthy</span>
            <span><i className="ops-exec-dot modeled" /> Modeled baseline</span>
          </div>
        </div>

        <div className="ops-exec-side">
          <div id="stateops-selected" className="ops-selected-panel" data-tour="state-operations-selected-execution">
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

          <CollapsibleSection
            id="stateops-queue"
            title="Execution Queue"
            subtitle="States sorted by current operational action requirement."
            defaultOpen
            right={<Badge tone="danger">{rows.length} active</Badge>}
          >
            {!rows.length ? (
              <EmptyState text="No execution work is currently flagged." />
            ) : (
              <ShowMoreList
                items={rows}
                initialCount={10}
                showAllLabel={(count) => `Show All ${count} Execution States`}
                className="ops-exec-list"
                renderItem={(item) => (
                  <ExecutionRow item={item} onSelect={setSelectedState} />
                )}
              />
            )}
          </CollapsibleSection>
        </div>
      </div>

      <div className="vs-grid-2" style={{ marginTop: 18 }}>
        <CollapsibleSection
          id="stateops-feed"
          title="Operational Feed"
          subtitle="Execution movement coming from tasks, vendor gaps, MailOps and escalation status."
          defaultOpen={false}
          right={<Badge tone="accent">{feed.length} signals</Badge>}
        >
          {!feed.length ? (
            <EmptyState text="No execution feed items." />
          ) : (
            <ShowMoreList
              items={feed}
              initialCount={8}
              showAllLabel={(count) => `Show All ${count} Feed Items`}
              className="ops-exec-feed"
              renderItem={(item) => <FeedRow item={item} onOpen={openCommandCenter} />}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection
          id="stateops-actions"
          title="Map Actions"
          subtitle="Move from the execution layer into the pages that complete the work."
          defaultOpen={false}
          right={<Badge tone="active">Execution Handoff</Badge>}
        >
          <StateOperationsActionCenter
            selected={selected}
            openCommandCenter={openCommandCenter}
            openStateDrilldown={openStateDrilldown}
          />
        </CollapsibleSection>
      </div>

      <BackToTopButton />
    </PageShell>
  );
}

