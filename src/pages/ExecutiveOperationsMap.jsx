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

const US_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_FIPS_TO_ABBR = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

const LAYERS = [
  { id: "operational", label: "Operational" },
  { id: "countyHeat", label: "County Heat" },
  { id: "active", label: "Active Tasks" },
  { id: "resolved", label: "Resolved" },
  { id: "vendors", label: "Vendors" },
  { id: "mailops", label: "MailOps" },
  { id: "turnout", label: "Turnout" },
  { id: "alerts", label: "Alerts" },
  { id: "signals", label: "Political Signals" },
];

const STATE_NAME_TO_ABBR = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC", florida: "FL",
  georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN",
  iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME",
  maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH",
  "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};

const STATE_COORDS = {
  AL: [-86.8, 32.8], AK: [-150.0, 63.4], AZ: [-111.7, 34.3], AR: [-92.4, 34.9], CA: [-119.7, 37.2],
  CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0], DC: [-77.0, 38.9], FL: [-81.7, 27.8],
  GA: [-83.4, 32.7], HI: [-157.7, 20.8], ID: [-114.4, 44.2], IL: [-89.4, 40.0], IN: [-86.1, 40.0],
  IA: [-93.5, 42.1], KS: [-98.4, 38.5], KY: [-84.7, 37.8], LA: [-91.9, 30.9], ME: [-69.0, 45.3],
  MD: [-76.8, 39.0], MA: [-71.8, 42.2], MI: [-84.8, 44.2], MN: [-94.3, 46.3], MS: [-89.7, 32.7],
  MO: [-92.5, 38.5], MT: [-110.0, 47.0], NE: [-99.8, 41.5], NV: [-116.6, 39.3], NH: [-71.6, 43.8],
  NJ: [-74.5, 40.1], NM: [-106.1, 34.4], NY: [-75.5, 43.0], NC: [-79.0, 35.5], ND: [-100.5, 47.5],
  OH: [-82.8, 40.3], OK: [-97.5, 35.6], OR: [-120.5, 44.0], PA: [-77.7, 41.0], RI: [-71.5, 41.7],
  SC: [-80.9, 33.8], SD: [-100.2, 44.4], TN: [-86.4, 35.8], TX: [-99.3, 31.3], UT: [-111.7, 39.3],
  VT: [-72.7, 44.1], VA: [-78.7, 37.6], WA: [-120.7, 47.4], WV: [-80.6, 38.6], WI: [-89.7, 44.6],
  WY: [-107.6, 43.0],
};

function resolveStateCode(row = {}) {
  const raw = String(row.state || row.state_code || row.state_name || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  return STATE_NAME_TO_ABBR[raw.toLowerCase()] || upper.slice(0, 2);
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString();
}

function fmtDecimal(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function riskTone(label) {
  const value = String(label || "").toLowerCase();
  if (value === "critical" || value === "high") return "danger";
  if (value === "elevated") return "demo";
  return "accent";
}

function riskClass(label) {
  const value = String(label || "").toLowerCase();
  if (value === "critical") return "risk-critical";
  if (value === "high") return "risk-high";
  if (value === "elevated") return "risk-elevated";
  return "risk-stable";
}

function normalizeRisk(value) {
  return value || "Stable";
}

function normalizeState(row = {}) {
  const state = resolveStateCode(row);

  return {
    ...row,
    state,
    state_code: state,
    state_name: row.state_name || state,
    operational_score: Number(row.heat_score || row.pressure || row.operational_score || 0),
    risk_label: normalizeRisk(row.risk || row.risk_label),
    mail_risk_jobs: Number(row.total_alerts || row.mail_risk_jobs || 0),
    mail_jobs: Number(row.total_mail_jobs || row.mail_jobs || 0),
    avg_vendor_score: Number(100 - Number(row.vendor_gap_count || 0)),
    vendors_scored: Number(row.vendor_gap_count || row.vendors_scored || 0),
    high_signals: Number(row.active_task_count || row.total_alerts || row.high_signals || 0),
    active_task_count: Number(row.active_task_count || 0),
    resolved_task_count: Number(row.resolved_task_count || 0),
    max_county_heat_score: Number(row.max_county_heat_score || row.heat_score || 0),
    average_heat_score: Number(row.average_heat_score || row.heat_score || 0),
    data_coverage_label: row.data_coverage_label || "Sparse Live",
    data_coverage_score: Number(row.data_coverage_score || 0),
    pressure_breakdown: {
      mail_pressure: Number(row.total_mail_jobs || 0),
      vendor_pressure: Number(row.vendor_gap_count || 0),
      signal_pressure: Number(row.active_task_count || row.total_alerts || 0),
    },
  };
}

function normalizedRiskScore(state, layer) {
  if (!state) return 0;

  if (layer === "active") return Number(state.active_task_count || 0) > 0 ? 90 : 0;
  if (layer === "resolved") return Number(state.resolved_task_count || 0) > 0 ? 68 : 0;
  if (layer === "mailops") return Number(state.mail_jobs || 0) * 8;
  if (layer === "vendors") return Math.max(0, 100 - Number(state.avg_vendor_score || 0));
  if (layer === "alerts") return Number(state.high_signals || 0) * 22;
  if (layer === "turnout") return Number(state.turnout_pressure || state.operational_score || 0);
  if (layer === "countyHeat") return Number(state.max_county_heat_score || state.operational_score || 0);

  return Number(state.operational_score || 0);
}

function getStateFill(state, layer) {
  if (!state) return "rgba(30, 41, 59, 0.78)";

  const score = normalizedRiskScore(state, layer);
  const label = String(state.risk_label || "").toLowerCase();

  if (state.active_task_count > 0 && layer === "active") return "rgba(220, 38, 38, 0.96)";
  if (state.resolved_task_count > 0 && layer === "resolved") return "rgba(34, 197, 94, 0.84)";

  if (label === "critical" || score >= 82) return "rgba(220, 38, 38, 0.92)";
  if (label === "high" || score >= 65) return "rgba(234, 88, 12, 0.9)";
  if (label === "elevated" || score >= 42) return "rgba(202, 138, 4, 0.86)";
  return "rgba(22, 163, 74, 0.72)";
}


function getSignalStateFill(overlay) {
  if (!overlay || !Number(overlay.total_signals || 0)) return "rgba(30, 41, 59, 0.78)";

  const risk = String(overlay.overlay_risk || "Stable").toLowerCase();
  const score = Number(overlay.average_score || 0);

  if (risk === "critical" || score >= 82) return "rgba(220, 38, 38, 0.96)";
  if (risk === "high" || score >= 65) return "rgba(234, 88, 12, 0.94)";
  if (risk === "elevated" || score >= 42) return "rgba(202, 138, 4, 0.9)";
  return "rgba(37, 99, 235, 0.74)";
}

function cleanSignalText(value = "") {
  return String(value || "")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getLayerValue(state, layer) {
  if (!state) return 0;
  if (layer === "active") return state.active_task_count || 0;
  if (layer === "resolved") return state.resolved_task_count || 0;
  if (layer === "mailops") return state.mail_jobs || 0;
  if (layer === "vendors") return Math.round(Number(state.avg_vendor_score || 0));
  if (layer === "alerts") return state.high_signals || 0;
  if (layer === "turnout") return fmtDecimal(state.turnout_pressure || state.operational_score || 0);
  if (layer === "countyHeat") return fmtDecimal(state.max_county_heat_score || state.operational_score || 0);
  return fmtDecimal(state.operational_score || 0);
}

function getRecommendation(state) {
  if (!state) return "Select a state to generate an executive recommendation.";

  const label = String(state.risk_label || "").toLowerCase();

  if (state.active_task_count > 0) {
    return `${state.state} has active county escalation tasking. Open State Operations to inspect county pressure and Command Center task status.`;
  }

  if (label === "critical") {
    return `Immediate escalation recommended in ${state.state}. Deploy executive resources, inspect vendor readiness, and open Command Center tasking.`;
  }

  if (label === "high") {
    return `${state.state} is showing high operational pressure. Review county heat, MailOps risk, vendor gaps, and active executive signals.`;
  }

  if (label === "elevated") {
    return `${state.state} should be monitored closely. Maintain readiness and review signal movement before the next refresh.`;
  }

  return `${state.state} is currently stable. Continue monitoring live operational indicators.`;
}

function openPath(path) {
  window.location.href = path;
}

function ThreatMetric({ label, value, tone = "neutral", subtext }) {
  return (
    <div className={`ops-threat-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {subtext ? <small>{subtext}</small> : null}
    </div>
  );
}

function StateRiskRow({ item, onSelect }) {
  return (
    <div className={`ops-row ${riskClass(item.risk_label)}`}>
      <ResponsiveRow
        title={`${item.state} Operational Pressure`}
        subtitle={`County heat ${fmtDecimal(item.max_county_heat_score)} • Active tasks ${item.active_task_count || 0} • Coverage ${item.data_coverage_label}`}
        meta={[
          { label: "Risk", value: item.risk_label },
          { label: "Score", value: fmtDecimal(item.operational_score) },
          { label: "Max County", value: fmtDecimal(item.max_county_heat_score) },
          { label: "Resolved", value: item.resolved_task_count || 0 },
          { label: "Signals", value: item.signal_count || 0 },
        ]}
        right={
          <div className="ops-state-actions">
            {item.signal_count ? (
              <Badge tone={riskTone(item.signal_risk)}>{item.signal_count} signals</Badge>
            ) : null}
            <button type="button" className="vs-decision-btn deploy" onClick={() => onSelect(item)}>
              Inspect
            </button>
          </div>
        }
      />
    </div>
  );
}

function AlertRow({ item }) {
  return (
    <div className="ops-alert-row">
      <ResponsiveRow
        title={item.title || "Executive signal"}
        subtitle={`${item.source || "Executive Feed"} • ${item.layer || "National"}`}
        meta={[
          { label: "State", value: item.state || "National" },
          { label: "County", value: item.county || "—" },
          { label: "Severity", value: item.severity || item.risk || "Medium" },
          { label: "Heat", value: fmtDecimal(item.heat_score || 0) },
        ]}
        right={<Badge tone={riskTone(item.severity || item.risk)}>{item.severity || item.risk || "Signal"}</Badge>}
      />
    </div>
  );
}

function CountyIntelRow({ item, onCreateTask }) {
  const heat = item.heat_score || item.pressure || 0;
  const isActive = item.task_active || item.command_status === "Task Active";
  const isResolved = item.task_resolved || item.command_status === "Resolved";

  return (
    <div className={`county-intel-row ${riskClass(item.risk)} ${isActive ? "task-active" : ""} ${isResolved ? "task-resolved" : ""}`}>
      <div className="county-intel-top">
        <div>
          <strong>{item.name}</strong>
          <span>{item.type || "County"} • {item.dma || "Regional DMA"}</span>
        </div>
        <div className="county-intel-badges">
          <Badge tone={riskTone(item.risk)}>{item.risk || "Stable"}</Badge>
          <Badge tone={isActive ? "danger" : isResolved ? "active" : "accent"}>
            {item.command_status || (isActive ? "Task Active" : isResolved ? "Resolved" : "No Task")}
          </Badge>
        </div>
      </div>

      <div className="county-intel-meter">
        <i style={{ width: `${Math.min(100, Number(heat || 0))}%` }} />
      </div>

      <div className="county-intel-grid">
        <div><span>Heat</span><b>{fmtDecimal(heat)}</b></div>
        <div><span>Vendor Gap</span><b>{fmtDecimal(item.vendor_gap_score || 0)}</b></div>
        <div><span>MailOps</span><b>{fmtDecimal(item.mailops_score || 0)}</b></div>
        <div><span>Turnout</span><b>{fmtDecimal(item.turnout_pressure || 0)}</b></div>
      </div>

      <div className="county-driver-row">
        {(item.top_drivers || []).slice(0, 3).map((driver) => (
          <span key={driver.label}>
            {driver.label}: <b>{fmtDecimal(driver.value)}</b>
          </span>
        ))}
        {!item.top_drivers?.length ? <span>No driver breakdown</span> : null}
      </div>

      <div className="county-intel-actions">
        <button type="button" onClick={() => openPath(`/state-operations/${item.state_code || item.state}`)}>
          Open Drilldown
        </button>
        <button type="button" onClick={() => onCreateTask(item)} disabled={isActive}>
          {isActive ? "Task Active" : "Create Task"}
        </button>
      </div>
    </div>
  );
}

function CountyIntelligenceDrawer({
  selected,
  counties,
  activeCounties,
  resolvedCounties,
  onCreateTask,
  creatingCountyKey,
  taskMessage,
}) {
  const [tab, setTab] = useState("top");

  const topCounties = useMemo(() => {
    return counties
      .filter((item) => item.state_code === selected?.state || item.state === selected?.state)
      .sort((a, b) => Number(b.heat_score || b.pressure || 0) - Number(a.heat_score || a.pressure || 0))
      .slice(0, 8);
  }, [counties, selected]);

  const active = useMemo(() => {
    return activeCounties
      .filter((item) => item.state_code === selected?.state || item.state === selected?.state)
      .slice(0, 8);
  }, [activeCounties, selected]);

  const resolved = useMemo(() => {
    return resolvedCounties
      .filter((item) => item.state_code === selected?.state || item.state === selected?.state)
      .slice(0, 8);
  }, [resolvedCounties, selected]);

  const visible = tab === "active" ? active : tab === "resolved" ? resolved : topCounties;

  return (
    <SectionCard
      title="County Intelligence Drawer"
      subtitle={selected ? `${selected.state} county heat, escalations, resolved pressure, and driver intelligence.` : "Select a state to inspect county intelligence."}
      right={selected ? <Badge tone={riskTone(selected.risk_label)}>{selected.risk_label}</Badge> : null}
    >
      {!selected ? (
        <EmptyState text="Select a state from the executive map." />
      ) : (
        <div className="county-drawer">
          <div className="county-drawer-summary">
            <div><span>Top County Heat</span><strong>{fmtDecimal(selected.max_county_heat_score || 0)}</strong></div>
            <div><span>Active</span><strong>{selected.active_task_count || 0}</strong></div>
            <div><span>Resolved</span><strong>{selected.resolved_task_count || 0}</strong></div>
            <div><span>Coverage</span><strong>{selected.data_coverage_label || "Sparse Live"}</strong></div>
          </div>

          <div className="county-drawer-tabs">
            {[
              ["top", "Top Heat"],
              ["active", "Active"],
              ["resolved", "Resolved"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "is-active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {taskMessage ? <div className="county-task-message">{taskMessage}</div> : null}

          <div className="county-drawer-list">
            {!visible.length ? (
              <EmptyState text="No counties found for this drawer tab." />
            ) : (
              visible.map((item) => {
                const key = item.full_fips || item.id || `${item.state_code}-${item.name}`;
                return (
                  <CountyIntelRow
                    key={key}
                    item={item}
                    creating={creatingCountyKey === key}
                    onCreateTask={onCreateTask}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function ExecutiveIntelPanel({ selected, layer, alerts = [], lastUpdated, onRefresh }) {
  const stateAlerts = alerts.filter((item) => !selected?.state || item.state === selected.state).slice(0, 4);

  return (
    <aside className="ops-intel-panel">
      <div className="ops-panel-top">
        <div>
          <span className="ops-kicker">Executive Intel Panel</span>
          <h3>{selected ? `${selected.state} Live Command` : "National Command"}</h3>
        </div>
        {selected ? <Badge tone={riskTone(selected.risk_label)}>{selected.risk_label}</Badge> : null}
      </div>

      <div className="ops-panel-score">
        <div>
          <span>Active Layer</span>
          <strong>{LAYERS.find((item) => item.id === layer)?.label || "Operational"}</strong>
        </div>
        <div>
          <span>Layer Value</span>
          <strong>{selected ? getLayerValue(selected, layer) : "—"}</strong>
        </div>
      </div>

      {selected ? (
        <>
          <div className="ops-panel-grid">
            <div><span>State Heat</span><strong>{fmtDecimal(selected.operational_score)}</strong></div>
            <div><span>Max County</span><strong>{fmtDecimal(selected.max_county_heat_score)}</strong></div>
            <div><span>Active Tasks</span><strong>{selected.active_task_count || 0}</strong></div>
            <div><span>Resolved</span><strong>{selected.resolved_task_count || 0}</strong></div>
            <div><span>Vendor Gap</span><strong>{selected.vendors_scored || 0}</strong></div>
            <div><span>MailOps</span><strong>{selected.mail_jobs || 0}</strong></div>
          </div>

          <div className="ops-ai-card">
            <span>AI Recommendation</span>
            <p>{getRecommendation(selected)}</p>
          </div>

          <div className="ops-action-grid">
            <button type="button" onClick={() => openPath("/command-center")}>Open Command Center</button>
            <button type="button" onClick={() => openPath(`/vendors?state=${selected.state}&source=executive-map`)}>View Vendors</button>
            <button type="button" onClick={() => openPath("/warroom")}>Escalate War Room</button>
            <button type="button" onClick={onRefresh}>Refresh Intel</button>
            <button type="button" onClick={() => openPath(`/state-operations/${selected.state}`)}>County Drilldown</button>
          </div>
        </>
      ) : (
        <EmptyState text="Select a state to inspect tactical intelligence." />
      )}

      <div className="ops-panel-section">
        <div className="ops-panel-section-head">
          <strong>Related Signals</strong>
          <small>{lastUpdated ? `Updated ${lastUpdated}` : "Live"}</small>
        </div>

        <div className="ops-panel-alerts">
          {!stateAlerts.length ? (
            <EmptyState text="No related executive signals." />
          ) : (
            stateAlerts.map((item) => (
              <div key={item.id || `${item.title}-${item.state}`} className="ops-mini-alert">
                <strong>{item.title || "Executive Signal"}</strong>
                <span>{item.source || "Executive Feed"} • {item.severity || item.risk || "Signal"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}



function getMarkerColor(tone) {
  if (tone === "critical") return "#dc2626";
  if (tone === "high") return "#ea580c";
  if (tone === "elevated") return "#ca8a04";
  if (tone === "signal") return "#2563eb";
  if (tone === "stable") return "#16a34a";
  return "#334155";
}

function MapStateMarker({ abbr, coords, state, overlay, layer, selected, onSelectState }) {
  const value = getIndicatorValue(state, overlay, layer);
  const tone = getIndicatorTone(state, overlay, layer);
  const color = getMarkerColor(tone);
  const isSelected = selected?.state === abbr;
  const hasLiveData = Boolean(state || overlay);
  const layerLabel = getIndicatorLabel(layer);

  return (
    <Marker coordinates={coords}>
      <g
        className={`ops-map-state-marker ${tone} ${isSelected ? "is-selected" : ""} ${hasLiveData ? "has-data" : "no-data"}`}
        onClick={() => onSelectState?.(abbr)}
        role="button"
        tabIndex={0}
        aria-label={`${abbr} ${layerLabel} ${value || 0}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onSelectState?.(abbr);
        }}
      >
        <circle className="ops-map-state-marker-pulse" r={16} fill={color} opacity={0.22} />
        <circle r={12.5} fill={color} stroke="rgba(255,255,255,0.86)" strokeWidth={1.25} />
        <text className="ops-map-state-marker-abbr" textAnchor="middle" y={-2.8}>{abbr}</text>
        <text className="ops-map-state-marker-value" textAnchor="middle" y={7.2}>{value || 0}</text>
      </g>
    </Marker>
  );
}

function SignalBadgeOverlay({ states = [], onSelectState }) {
  const positions = {
    WA: { left: "13%", top: "25%" }, OR: { left: "10%", top: "37%" }, CA: { left: "11%", top: "55%" },
    NV: { left: "18%", top: "48%" }, AZ: { left: "25%", top: "63%" }, UT: { left: "29%", top: "48%" },
    CO: { left: "39%", top: "50%" }, NM: { left: "36%", top: "64%" }, TX: { left: "50%", top: "72%" },
    OK: { left: "51%", top: "58%" }, KS: { left: "51%", top: "48%" }, NE: { left: "50%", top: "40%" },
    SD: { left: "49%", top: "31%" }, ND: { left: "48%", top: "23%" }, MN: { left: "58%", top: "24%" },
    IA: { left: "59%", top: "40%" }, MO: { left: "61%", top: "50%" }, AR: { left: "60%", top: "61%" },
    LA: { left: "60%", top: "72%" }, WI: { left: "64%", top: "30%" }, IL: { left: "66%", top: "45%" },
    MI: { left: "72%", top: "33%" }, IN: { left: "71%", top: "45%" }, OH: { left: "76%", top: "44%" },
    KY: { left: "72%", top: "53%" }, TN: { left: "70%", top: "60%" }, MS: { left: "65%", top: "69%" },
    AL: { left: "70%", top: "69%" }, GA: { left: "76%", top: "69%" }, FL: { left: "82%", top: "80%" },
    SC: { left: "80%", top: "63%" }, NC: { left: "82%", top: "58%" }, VA: { left: "84%", top: "52%" },
    WV: { left: "79%", top: "50%" }, PA: { left: "84%", top: "43%" }, NY: { left: "88%", top: "34%" },
    ME: { left: "94%", top: "20%" }, VT: { left: "90%", top: "28%" }, NH: { left: "92%", top: "28%" },
    MA: { left: "93%", top: "34%" }, CT: { left: "91%", top: "38%" }, RI: { left: "94%", top: "38%" },
    NJ: { left: "88%", top: "43%" }, DE: { left: "88%", top: "48%" }, MD: { left: "86%", top: "49%" },
    AK: { left: "9%", top: "82%" }, HI: { left: "28%", top: "84%" }, MT: { left: "36%", top: "24%" },
    ID: { left: "25%", top: "31%" }, WY: { left: "37%", top: "36%" }
  };

  const visible = states
    .filter((item) => item?.state && Number(item.total_signals || 0) > 0 && positions[item.state])
    .sort((a, b) => Number(b.average_score || 0) - Number(a.average_score || 0))
    .slice(0, 18);

  return (
    <div className="ops-signal-badges" aria-hidden="false">
      {visible.map((item) => (
        <button
          key={item.state}
          type="button"
          className={`ops-signal-badge ${String(item.overlay_risk || "stable").toLowerCase()}`}
          style={positions[item.state]}
          onClick={() => onSelectState?.(item.state)}
          title={`${item.state}: ${item.total_signals} signals • ${item.overlay_risk}`}
        >
          <strong>{item.state}</strong>
          <span>{item.total_signals}</span>
        </button>
      ))}
    </div>
  );
}

function SignalOverlayPanel({ summary = {}, states = [], onSelectState }) {
  return (
    <SectionCard
      title="Political Signal Overlay"
      subtitle="Live state-level narrative, FEC, fundraising, news, and political signal pressure layered on top of the Executive Operations Map."
      right={<Badge tone={states.length ? "demo" : "active"}>{states.length} states</Badge>}
    >
      <div className="ops-signal-summary">
        <div><span>Total Signals</span><strong>{fmtNumber(summary.total_signals || 0)}</strong></div>
        <div><span>News</span><strong>{fmtNumber(summary.news_signals || 0)}</strong></div>
        <div><span>FEC / Fundraising</span><strong>{fmtNumber(summary.fec_signals || 0)}</strong></div>
        <div><span>National Risk</span><strong>{summary.national_signal_risk || "Stable"}</strong></div>
      </div>

      {!states.length ? (
        <EmptyState text="No state-level political signal overlay data available yet." />
      ) : (
        <div className="ops-signal-stack">
          {states.slice(0, 10).map((item) => (
            <div key={item.state} className={`ops-signal-row ${String(item.overlay_risk || "stable").toLowerCase()}`}>
              <ResponsiveRow
                title={`${item.state} Political Signal Pressure`}
                subtitle={`${item.total_signals || 0} signals • ${item.news_signals || 0} news • ${item.fec_signals || 0} FEC/fundraising`}
                meta={[
                  { label: "Risk", value: item.overlay_risk || "Stable" },
                  { label: "Avg Score", value: item.average_score || 0 },
                  { label: "Critical", value: item.critical || 0 },
                  { label: "High", value: item.high || 0 },
                  { label: "News", value: item.news_signals || 0 },
                  { label: "FEC", value: item.fec_signals || 0 },
                ]}
                right={
                  <div className="ops-state-actions">
                    <Badge tone={riskTone(item.overlay_risk)}>{item.overlay_risk || "Stable"}</Badge>
                    <button type="button" className="vs-decision-btn deploy" onClick={() => onSelectState?.(item.state)}>
                      Inspect
                    </button>
                  </div>
                }
              />
              {item.top_signals?.length ? (
                <div className="ops-signal-toplines">
                  {item.top_signals.slice(0, 2).map((signal) => (
                    <div key={signal.id || `${item.state}-${signal.title}`}>
                      <strong>{cleanSignalText(signal.title || "Political signal")}</strong>
                      <span>{signal.source || "Signal"} • {signal.risk || "Signal"}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default function ExecutiveOperationsMap() {
  const [data, setData] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [layer, setLayer] = useState("operational");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingCountyKey, setCreatingCountyKey] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [signalOverlay, setSignalOverlay] = useState({ summary: {}, states: [] });
  const [signalOverlayError, setSignalOverlayError] = useState("");
  const intervalRef = useRef(null);

  async function loadSignalOverlay() {
    try {
      setSignalOverlayError("");

      if (typeof api.executiveMapSignalOverlay !== "function") {
        return;
      }

      const result = await api.executiveMapSignalOverlay();
      setSignalOverlay(result || { summary: {}, states: [] });
    } catch (err) {
      setSignalOverlayError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load executive map signal overlay."
      );
      setSignalOverlay({ summary: {}, states: [] });
    }
  }

  async function load({ quiet = false } = {}) {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (typeof api.operationsMap !== "function") {
        throw new Error("Missing api.operationsMap. Add operationsMap: () => tryGet([\"/operations/map\"]) to src/services/api.js.");
      }

      const result = await api.operationsMap();
      const normalizedStates = (result?.states || []).map(normalizeState);

      const normalizedData = {
        ...(result || {}),
        states: normalizedStates,
        alerts: result?.tacticalFeed || result?.alerts || [],
        counties: result?.counties || [],
        activeEscalations: result?.activeEscalations || [],
        resolvedEscalations: result?.resolvedEscalations || [],
      };

      setData(normalizedData);

      setSelectedState((current) => {
        if (!normalizedStates.length) return null;
        if (!current) return normalizedStates[0];
        return normalizedStates.find((item) => item.state === current.state) || normalizedStates[0];
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load Executive Operations Map");
      if (!quiet) setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCreateCountyTask(county) {
    try {
      const key = county.full_fips || county.id || `${county.state_code}-${county.name}`;
      setCreatingCountyKey(key);
      setTaskMessage("");

      if (typeof api.createCountyCommandTask !== "function") {
        throw new Error("Missing api.createCountyCommandTask.");
      }

      const topDriver = county.top_drivers?.[0]?.label || "Operational Heat";

      await api.createCountyCommandTask({
        state: county.state_code || county.state,
        state_code: county.state_code || county.state,
        county: county.name,
        county_name: county.name,
        county_fips: county.county_fips,
        full_fips: county.full_fips,
        risk: county.risk,
        heat_score: county.heat_score || county.pressure || 0,
        pressure: county.pressure || county.heat_score || 0,
        top_driver: topDriver,
        top_drivers: county.top_drivers || [],
        scoring_breakdown: county.scoring_breakdown || {},
        live_signal_counts: county.live_signal_counts || {},
        recommendation: `Executive Map escalation for ${county.name}, ${county.state_code || county.state}. Top driver: ${topDriver}.`,
      });

      setTaskMessage(`Command task created for ${county.name}.`);
      await load({ quiet: true });
    } catch (err) {
      setTaskMessage(err?.response?.data?.error || err?.message || "Failed to create county command task.");
    } finally {
      setCreatingCountyKey("");
    }
  }

  useEffect(() => {
    load();
    loadSignalOverlay();

    intervalRef.current = setInterval(() => {
      load({ quiet: true });
      loadSignalOverlay();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const summary = data?.summary || {};
  const states = useMemo(() => data?.states || [], [data]);
  const counties = data?.counties || [];
  const activeEscalations = data?.activeEscalations || [];
  const resolvedEscalations = data?.resolvedEscalations || [];
  const alerts = data?.alerts || [];
  const overlaySummary = signalOverlay?.summary || {};
  const overlayStates = signalOverlay?.states || [];

  const overlayLookup = useMemo(() => {
    return overlayStates.reduce((acc, item) => {
      const key = String(item.state || "").toUpperCase();
      if (key) acc[key] = item;
      return acc;
    }, {});
  }, [overlayStates]);

  const stateLookup = useMemo(() => {
    return states.reduce((acc, item) => {
      acc[item.state] = item;
      return acc;
    }, {});
  }, [states]);

  const selected = useMemo(() => {
    if (!selectedState) return states[0] || null;
    return states.find((item) => item.state === selectedState.state) || selectedState;
  }, [selectedState, states]);

  function selectStateFromOverlay(stateCode) {
    const match = states.find((item) => item.state === stateCode || item.state_code === stateCode);
    if (match) setSelectedState(match);
  }

  const rankedStates = useMemo(() => {
    return [...states].sort((a, b) => Number(b.operational_score || 0) - Number(a.operational_score || 0));
  }, [states]);

  const urgentStates = states.filter((s) => ["Critical", "High"].includes(s.risk_label));
  const criticalStates = states.filter((s) => String(s.risk_label).toLowerCase() === "critical");
  const activeEscalationStates = states.filter((s) => Number(s.active_task_count || 0) > 0);
  const mailFailures = states.reduce((sum, s) => sum + Number(s.mail_risk_jobs || 0), 0);

  const nationalPressure = Math.round(
    Number(
      summary.national_heat_score ||
        (states.length
          ? states.reduce((sum, item) => sum + Number(item.operational_score || 0), 0) / states.length
          : 0)
    )
  );

  return (
    <PageShell
      eyebrow="Executive Command"
      title="Executive Operations Map"
      description="Live national command layer wired to county heat, active escalations, resolved task relief, political signal overlays, and county intelligence drawer."
      tickerItems={[
        { label: "National Pressure", value: `${nationalPressure || 0}%`, dotClass: nationalPressure >= 65 ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Critical", value: `${criticalStates.length}`, dotClass: criticalStates.length ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Active Tasks", value: `${activeEscalationStates.length}`, dotClass: activeEscalationStates.length ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Political Signals", value: `${overlaySummary.total_signals || 0}`, dotClass: overlaySummary.total_signals ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Live", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .ops-threat-matrix {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .ops-threat-metric {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 35%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.78));
          padding: 16px;
          min-height: 104px;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.22);
        }

        .ops-threat-metric.danger { border-color: rgba(248, 113, 113, 0.32); }
        .ops-threat-metric.warning { border-color: rgba(251, 191, 36, 0.3); }
        .ops-threat-metric.success { border-color: rgba(74, 222, 128, 0.24); }

        .ops-threat-metric span,
        .ops-threat-metric small,
        .ops-threat-metric strong {
          position: relative;
          z-index: 2;
        }

        .ops-threat-metric span {
          display: block;
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ops-threat-metric strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: 32px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .ops-threat-metric small {
          display: block;
          margin-top: 4px;
          color: rgba(203, 213, 225, 0.74);
          font-size: 12px;
        }

        .ops-command-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(340px, 0.75fr);
          gap: 18px;
          align-items: stretch;
        }

        .ops-map-shell {
          position: relative;
          min-height: 642px;
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.22), transparent 28%),
            radial-gradient(circle at 78% 28%, rgba(239, 68, 68, 0.17), transparent 26%),
            radial-gradient(circle at 52% 75%, rgba(14, 165, 233, 0.13), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(2, 6, 23, 0.94));
          overflow: hidden;
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
        }

        .ops-map-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black, transparent 80%);
        }

        .ops-map-label {
          position: absolute;
          left: 28px;
          top: 24px;
          z-index: 6;
        }

        .ops-map-label h3 {
          margin: 0;
          font-size: 20px;
          color: #fff;
          letter-spacing: -0.03em;
        }

        .ops-map-label p {
          margin: 7px 0 0;
          color: rgba(203, 213, 225, 0.78);
          font-size: 13px;
        }

        .ops-live-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.32);
          background: rgba(15, 23, 42, 0.72);
          color: rgba(226, 232, 240, 0.88);
          font-size: 11px;
          font-weight: 800;
        }

        .ops-live-chip i {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 7px rgba(34,197,94,0.1);
        }

        .ops-map-inner {
          position: relative;
          z-index: 2;
          min-height: 642px;
          padding: 92px 18px 54px;
        }

        .ops-geo-map {
          width: 100%;
          height: auto;
          filter: drop-shadow(0 28px 38px rgba(0,0,0,0.3));
        }

        .ops-geography {
          outline: none;
          stroke: rgba(226, 232, 240, 0.42);
          stroke-width: 0.55;
          cursor: pointer;
          transition: opacity 160ms ease, filter 160ms ease, stroke-width 160ms ease;
        }

        .ops-geography:hover {
          opacity: 0.94;
          filter: brightness(1.18);
        }

        .ops-geography.is-selected {
          stroke: rgba(255,255,255,0.98);
          stroke-width: 1.45;
          filter: brightness(1.26);
        }

        .ops-map-state-marker {
          cursor: pointer;
          pointer-events: auto;
          filter: drop-shadow(0 10px 14px rgba(2, 6, 23, 0.42));
          transition: transform 160ms ease, filter 160ms ease, opacity 160ms ease;
        }

        .ops-map-state-marker:hover,
        .ops-map-state-marker.is-selected {
          transform: scale(1.18);
          filter: drop-shadow(0 14px 18px rgba(2, 6, 23, 0.54)) brightness(1.12);
        }

        .ops-map-state-marker.no-data {
          opacity: 0.58;
        }

        .ops-map-state-marker-pulse {
          animation: opsMarkerPulse 1.9s ease-in-out infinite;
        }

        .ops-map-state-marker.is-selected .ops-map-state-marker-pulse {
          opacity: 0.38;
        }

        .ops-map-state-marker-abbr {
          fill: white;
          font-size: 7.6px;
          font-weight: 950;
          paint-order: stroke;
          stroke: rgba(2, 6, 23, 0.75);
          stroke-width: 2px;
          letter-spacing: -0.02em;
          pointer-events: none;
        }

        .ops-map-state-marker-value {
          fill: rgba(255, 255, 255, 0.96);
          font-size: 7px;
          font-weight: 950;
          paint-order: stroke;
          stroke: rgba(2, 6, 23, 0.75);
          stroke-width: 2px;
          pointer-events: none;
        }

        @keyframes opsMarkerPulse {
          0%, 100% { opacity: 0.18; r: 17; }
          50% { opacity: 0.34; r: 22; }
        }

        .ops-layer-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ops-layer-btn {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.86);
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 12px;
          cursor: pointer;
        }

        .ops-layer-btn.is-active {
          border-color: rgba(96, 165, 250, 0.62);
          color: white;
          background: rgba(37, 99, 235, 0.32);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .ops-map-legend {
          position: absolute;
          right: 22px;
          bottom: 20px;
          z-index: 7;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(2, 6, 23, 0.62);
          backdrop-filter: blur(14px);
        }

        .ops-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(226, 232, 240, 0.84);
          font-size: 11px;
          font-weight: 800;
        }

        .ops-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
        }

        .ops-legend-dot.critical { background: rgba(220, 38, 38, 0.95); }
        .ops-legend-dot.high { background: rgba(234, 88, 12, 0.95); }
        .ops-legend-dot.elevated { background: rgba(202, 138, 4, 0.95); }
        .ops-legend-dot.stable { background: rgba(22, 163, 74, 0.92); }

        .ops-intel-panel {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 34%),
            linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.28);
          padding: 18px;
          min-height: 642px;
        }

        .ops-panel-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .ops-kicker {
          display: block;
          color: rgba(96, 165, 250, 0.88);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .ops-panel-top h3 {
          margin: 6px 0 0;
          color: white;
          font-size: 20px;
          letter-spacing: -0.04em;
        }

        .ops-panel-score {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }

        .ops-panel-score div,
        .ops-panel-grid div {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.35);
          padding: 13px;
        }

        .ops-panel-score span,
        .ops-panel-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.65);
          font-size: 11px;
          font-weight: 800;
        }

        .ops-panel-score strong,
        .ops-panel-grid strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
          font-weight: 950;
        }

        .ops-panel-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .ops-ai-card {
          margin-top: 14px;
          border-radius: 20px;
          border: 1px solid rgba(96, 165, 250, 0.22);
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(15, 23, 42, 0.44));
          padding: 15px;
        }

        .ops-ai-card span {
          display: block;
          color: rgba(147, 197, 253, 0.9);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .ops-ai-card p {
          margin: 8px 0 0;
          color: rgba(226, 232, 240, 0.9);
          font-size: 13px;
          line-height: 1.55;
        }

        .ops-action-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .ops-action-grid button,
        .county-intel-actions button,
        .county-drawer-tabs button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 10px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .ops-action-grid button:hover,
        .county-intel-actions button:hover,
        .county-drawer-tabs button:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .county-intel-actions button:disabled {
          opacity: 0.58;
          cursor: not-allowed;
        }

        .ops-panel-section {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
        }

        .ops-panel-section-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 10px;
        }

        .ops-panel-section-head strong {
          color: white;
          font-size: 14px;
        }

        .ops-panel-section-head small {
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
        }

        .ops-panel-alerts {
          display: grid;
          gap: 10px;
        }

        .ops-mini-alert {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .ops-mini-alert strong {
          display: block;
          color: white;
          font-size: 13px;
        }

        .ops-mini-alert span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
        }

        .ops-detail-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 22px;
          background: rgba(15, 23, 42, 0.72);
          padding: 18px;
        }

        .ops-detail-score {
          font-size: 48px;
          font-weight: 950;
          letter-spacing: -0.06em;
          color: white;
        }

        .ops-breakdown {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .ops-breakdown-item {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .ops-breakdown-item span {
          display: block;
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
        }

        .ops-breakdown-item strong {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 18px;
        }

        .ops-row,
        .ops-alert-row {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.44));
          overflow: hidden;
        }

        .ops-row.risk-critical,
        .ops-row.risk-high {
          border-color: rgba(248, 113, 113, 0.32);
        }

        .ops-row.risk-elevated {
          border-color: rgba(251, 191, 36, 0.28);
        }

        .ops-row .vs-responsive-row,
        .ops-alert-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .county-drawer {
          display: grid;
          gap: 14px;
        }

        .county-drawer-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .county-drawer-summary div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.62);
          padding: 12px;
        }

        .county-drawer-summary span,
        .county-intel-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
        }

        .county-drawer-summary strong,
        .county-intel-grid b {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 17px;
        }

        .county-drawer-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .county-drawer-tabs button.is-active {
          border-color: rgba(96, 165, 250, 0.62);
          color: white;
          background: rgba(37, 99, 235, 0.32);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .county-task-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          padding: 12px;
          color: rgba(226, 232, 240, 0.9);
          font-size: 13px;
        }

        .county-drawer-list {
          display: grid;
          gap: 12px;
        }

        .county-intel-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.62));
          padding: 14px;
        }

        .county-intel-row.task-active {
          border-color: rgba(248, 113, 113, 0.36);
        }

        .county-intel-row.task-resolved {
          border-color: rgba(34, 197, 94, 0.34);
        }

        .county-intel-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .county-intel-top strong {
          display: block;
          color: white;
          font-size: 15px;
          font-weight: 950;
        }

        .county-intel-top span {
          display: block;
          margin-top: 4px;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
        }

        .county-intel-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .county-intel-meter {
          margin-top: 12px;
          height: 8px;
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.72);
          overflow: hidden;
        }

        .county-intel-meter i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(96,165,250,0.95), rgba(248,113,113,0.95));
        }

        .county-intel-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .county-intel-grid div {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(2, 6, 23, 0.28);
          padding: 10px;
        }

        .county-driver-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .county-driver-row span {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.64);
          color: rgba(226, 232, 240, 0.84);
          padding: 7px 9px;
          font-size: 11px;
        }

        .county-driver-row b {
          color: white;
        }

        .county-intel-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .ops-state-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ops-signal-badges {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
        }

        .ops-signal-badge {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          min-width: 42px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.38);
          background: rgba(15,23,42,0.82);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(2,6,23,0.45), 0 0 0 6px rgba(59,130,246,0.08);
          backdrop-filter: blur(12px);
        }

        .ops-signal-badge span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 17px;
          height: 17px;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
          font-size: 9px;
        }

        .ops-signal-badge.critical,
        .ops-signal-badge.high {
          background: rgba(185,28,28,0.9);
          box-shadow: 0 12px 28px rgba(127,29,29,0.45), 0 0 0 7px rgba(248,113,113,0.12);
        }

        .ops-signal-badge.elevated {
          background: rgba(146,64,14,0.9);
          box-shadow: 0 12px 28px rgba(120,53,15,0.42), 0 0 0 7px rgba(251,191,36,0.11);
        }

        [data-tour] { scroll-margin: 120px; }

          .ops-signal-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .ops-signal-summary div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.58);
          padding: 12px;
        }

        .ops-signal-summary span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .ops-signal-summary strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
        }

        .ops-signal-stack {
          display: grid;
          gap: 12px;
        }

        .ops-signal-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .ops-signal-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .ops-signal-row.critical,
        .ops-signal-row.high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .ops-signal-row.elevated {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .ops-signal-toplines {
          display: grid;
          gap: 8px;
          padding: 0 16px 16px;
        }

        .ops-signal-toplines div {
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(2,6,23,0.28);
          padding: 10px;
        }

        .ops-signal-toplines strong {
          display: block;
          color: white;
          font-size: 12px;
        }

        .ops-signal-toplines span {
          display: block;
          margin-top: 4px;
          color: rgba(203,213,225,0.64);
          font-size: 11px;
        }

        @media (max-width: 1150px) {
          .ops-command-layout,
          .ops-threat-matrix {
            grid-template-columns: 1fr;
          }

          .ops-intel-panel {
            min-height: auto;
          }
        }

        @media (max-width: 900px) {
          .ops-map-shell {
            overflow-x: auto;
          }

          .ops-map-inner {
            min-width: 860px;
          }

          .ops-breakdown,
          .ops-panel-score,
          .ops-panel-grid,
          .ops-action-grid,
          .county-drawer-summary,
          .county-intel-grid,
          .ops-signal-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {signalOverlayError ? <div className="vs-banner vs-banner-warning">{signalOverlayError}</div> : null}

      <div className="ops-threat-matrix" data-tour="operations-map-summaries">
        <ThreatMetric
          label="National Pressure"
          value={`${nationalPressure || 0}%`}
          tone={nationalPressure >= 65 ? "danger" : nationalPressure >= 42 ? "warning" : "success"}
          subtext="Average state execution risk"
        />
        <ThreatMetric
          label="Critical States"
          value={criticalStates.length}
          tone={criticalStates.length ? "danger" : "success"}
          subtext="Immediate executive action"
        />
        <ThreatMetric
          label="Urgent States"
          value={urgentStates.length}
          tone={urgentStates.length ? "warning" : "success"}
          subtext="Critical or high risk"
        />
        <ThreatMetric
          label="Active Tasks"
          value={activeEscalationStates.length}
          tone={activeEscalationStates.length ? "danger" : "success"}
          subtext="Open county escalations"
        />
        <ThreatMetric
          label="MailOps Signals"
          value={mailFailures}
          tone={mailFailures ? "warning" : "success"}
          subtext="Tracked operational jobs"
        />
      </div>

      <div className="vs-grid-4" data-tour="operations-map-kpis">
        <StatCard label="States Tracked" value={summary.states_tracked || states.length || 0} delta="Operational states" tone="up" />
        <StatCard label="Critical States" value={summary.critical_states || criticalStates.length || 0} delta="Immediate pressure" tone={criticalStates.length ? "down" : "up"} />
        <StatCard label="Counties Tracked" value={fmtNumber(summary.counties_tracked || 0)} delta="County/parish heat layer" tone="up" />
        <StatCard label="Executive Signals" value={summary.total_signals || alerts.length || 0} delta="Live tactical feed" tone="up" />
      </div>

      <div data-tour="operations-map">
        <SectionCard
          title="Live Tactical Operations Layer"
        subtitle="Animated national command surface with county heat, active escalations, resolved task relief, and tactical signal overlays."
        right={
          <div className="ops-layer-controls">
            {LAYERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ops-layer-btn ${layer === item.id ? "is-active" : ""}`}
                onClick={() => setLayer(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <EmptyState text="Loading live operations map..." />
        ) : (
          <div className="ops-command-layout">
            <div className="ops-map-shell">
              <div className="ops-map-grid" />

              <div className="ops-map-label">
                <h3>U.S. Executive Geo Command</h3>
                <p>Click any state to inspect tactical intelligence and live county movement.</p>
                <span className="ops-live-chip">
                  <i />
                  {refreshing ? "Refreshing live intelligence" : `Live refresh active • ${lastUpdated || "now"}`}
                </span>
              </div>

              <div className="ops-map-inner">
                <ComposableMap projection="geoAlbersUsa" className="ops-geo-map" width={980} height={560}>
                  <Geographies geography={US_TOPO_JSON}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const abbr = STATE_FIPS_TO_ABBR[String(geo.id).padStart(2, "0")];
                        const stateData = stateLookup[abbr];
                        const isSelected = selected?.state === abbr;

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            className={`ops-geography ${isSelected ? "is-selected" : ""}`}
                            fill={layer === "signals" ? getSignalStateFill(overlayLookup[abbr]) : getStateFill(stateData, layer)}
                            onClick={() => {
                              if (stateData) setSelectedState(stateData);
                            }}
                            style={{
                              default: { outline: "none" },
                              hover: { outline: "none" },
                              pressed: { outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {Object.entries(STATE_COORDS).map(([abbr, coords]) => (
                    <MapStateMarker
                      key={abbr}
                      abbr={abbr}
                      coords={coords}
                      state={stateLookup[abbr]}
                      overlay={overlayLookup[abbr]}
                      layer={layer}
                      selected={selected}
                      onSelectState={selectStateFromOverlay}
                    />
                  ))}
                </ComposableMap>
              </div>


              <div className="ops-map-legend">
                <span className="ops-legend-item"><span className="ops-legend-dot critical" /> Critical</span>
                <span className="ops-legend-item"><span className="ops-legend-dot high" /> High</span>
                <span className="ops-legend-item"><span className="ops-legend-dot elevated" /> Elevated</span>
                <span className="ops-legend-item"><span className="ops-legend-dot stable" /> Stable</span>
              </div>
            </div>

            <ExecutiveIntelPanel
              selected={selected}
              layer={layer}
              alerts={alerts}
              lastUpdated={lastUpdated}
              onRefresh={() => load({ quiet: true })}
            />
          </div>
        )}
        </SectionCard>
      </div>

      <div data-tour="operations-county-drawer">
        <CountyIntelligenceDrawer
        selected={selected}
        counties={counties}
        activeCounties={activeEscalations}
        resolvedCounties={resolvedEscalations}
        onCreateTask={handleCreateCountyTask}
        creatingCountyKey={creatingCountyKey}
        taskMessage={taskMessage}
        />
      </div>

      <div className="vs-grid-2">
        <div data-tour="operations-command-detail">
          <SectionCard
            title={selected ? `${selected.state} Command Detail` : "Command Detail"}
          subtitle="Breakdown of operational pressure by live State Operations signals."
          right={selected ? <Badge tone={riskTone(selected.risk_label)}>{selected.risk_label}</Badge> : null}
        >
          {!selected ? (
            <EmptyState text="Select a state on the map." />
          ) : (
            <div className="ops-detail-card">
              <div className="ops-detail-score">{fmtDecimal(selected.operational_score)}</div>
              <Badge tone={riskTone(selected.risk_label)}>{selected.risk_label}</Badge>

              <div className="ops-breakdown">
                <div className="ops-breakdown-item">
                  <span>Average Heat</span>
                  <strong>{fmtDecimal(selected.average_heat_score || 0)}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Max County Heat</span>
                  <strong>{fmtDecimal(selected.max_county_heat_score || 0)}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Coverage</span>
                  <strong>{selected.data_coverage_label || "Sparse Live"}</strong>
                </div>
              </div>

              <div className="ops-breakdown">
                <div className="ops-breakdown-item">
                  <span>Mail Jobs</span>
                  <strong>{selected.mail_jobs || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Active Tasks</span>
                  <strong>{selected.active_task_count || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Resolved Tasks</span>
                  <strong>{selected.resolved_task_count || 0}</strong>
                </div>
              </div>

              <div className="ops-breakdown">
                <div className="ops-breakdown-item">
                  <span>Political Signals</span>
                  <strong>{overlayLookup[selected.state]?.total_signals || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>News Signals</span>
                  <strong>{overlayLookup[selected.state]?.news_signals || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>FEC Signals</span>
                  <strong>{overlayLookup[selected.state]?.fec_signals || 0}</strong>
                </div>
              </div>
            </div>
          )}
          </SectionCard>
        </div>

        <div data-tour="operations-pressure-states">
          <SectionCard
            title="Highest Pressure States"
          subtitle="Ranked operational pressure across the current map."
          right={<Badge tone="danger">{urgentStates.length} urgent</Badge>}
        >
          <div className="vs-stack">
            {!rankedStates.length ? (
              <EmptyState text="No state pressure detected yet." />
            ) : (
              rankedStates.slice(0, 8).map((item) => (
                <StateRiskRow
                  key={item.state}
                  item={{
                    ...item,
                    signal_count: overlayLookup[item.state]?.total_signals || 0,
                    signal_risk: overlayLookup[item.state]?.overlay_risk || "Stable",
                  }}
                  onSelect={setSelectedState}
                />
              ))
            )}
          </div>
          </SectionCard>
        </div>
      </div>

      <div data-tour="operations-signal-overlay">
        <SignalOverlayPanel
        summary={overlaySummary}
        states={overlayStates}
        onSelectState={selectStateFromOverlay}
        />
      </div>

      <div data-tour="operations-executive-signals">
        <SectionCard
          title="Executive Signal Layer"
        subtitle="Most recent tactical alerts contributing to the operations map."
        right={<Badge tone="accent">{alerts.length || 0} signals</Badge>}
      >
        <div className="vs-stack">
          {!alerts.length ? (
            <EmptyState text="No executive signals available." />
          ) : (
            alerts.slice(0, 10).map((item) => (
              <AlertRow key={item.id || `${item.title}-${item.state}`} item={item} />
            ))
          )}
        </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
