import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
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

const STATE_MARKERS = {
  AL: [-86.8, 32.8], AK: [-152.4, 64.2], AZ: [-111.7, 34.2],
  AR: [-92.4, 34.9], CA: [-119.6, 37.2], CO: [-105.5, 39],
  CT: [-72.7, 41.6], DE: [-75.5, 39], DC: [-77, 38.9],
  FL: [-81.7, 27.8], GA: [-83.4, 32.7], HI: [-157.8, 20.9],
  IA: [-93.5, 42.1], ID: [-114.6, 44.2], IL: [-89.4, 40],
  IN: [-86.1, 40], KS: [-98.3, 38.5], KY: [-85.3, 37.8],
  LA: [-91.9, 31], MA: [-71.8, 42.2], MD: [-76.7, 39],
  ME: [-69.2, 45.2], MI: [-85.5, 44.3], MN: [-94.6, 46.3],
  MO: [-92.5, 38.5], MS: [-89.7, 32.7], MT: [-110.4, 46.9],
  NC: [-79, 35.5], ND: [-100.5, 47.5], NE: [-99.7, 41.5],
  NH: [-71.6, 43.8], NJ: [-74.5, 40.1], NM: [-106, 34.4],
  NV: [-116.6, 39.3], NY: [-75.5, 42.9], OH: [-82.8, 40.2],
  OK: [-97.5, 35.5], OR: [-120.5, 44], PA: [-77.8, 41],
  RI: [-71.5, 41.7], SC: [-80.9, 33.8], SD: [-100, 44.4],
  TN: [-86.4, 35.8], TX: [-99.3, 31.4], UT: [-111.7, 39.3],
  VA: [-78.7, 37.5], VT: [-72.7, 44], WA: [-120.5, 47.4],
  WI: [-89.8, 44.6], WV: [-80.6, 38.6], WY: [-107.5, 43],
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
];

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
  const state = row.state || row.state_code;

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

function getMarkerRadius(state, layer) {
  const score = normalizedRiskScore(state, layer);
  return Math.max(4, Math.min(15, 4 + score / 10));
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
        ]}
        right={
          <button type="button" className="vs-decision-btn deploy" onClick={() => onSelect(item)}>
            Inspect
          </button>
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

export default function ExecutiveOperationsMap() {
  const [data, setData] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [layer, setLayer] = useState("operational");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const intervalRef = useRef(null);

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

  useEffect(() => {
    load();

    intervalRef.current = setInterval(() => {
      load({ quiet: true });
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const summary = data?.summary || {};
  const states = useMemo(() => data?.states || [], [data]);
  const alerts = data?.alerts || [];

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

  const rankedStates = useMemo(() => {
    return [...states].sort((a, b) => Number(b.operational_score || 0) - Number(a.operational_score || 0));
  }, [states]);

  const urgentStates = states.filter((s) => ["Critical", "High"].includes(s.risk_label));
  const criticalStates = states.filter((s) => String(s.risk_label).toLowerCase() === "critical");
  const activeEscalationStates = states.filter((s) => Number(s.active_task_count || 0) > 0);
  const vendorShortages = states.filter((s) => Number(s.vendors_scored || 0) > 0).length;
  const mailFailures = states.reduce((sum, s) => sum + Number(s.mail_risk_jobs || 0), 0);

  const nationalPressure = Math.round(
    Number(
      summary.national_heat_score ||
        (states.length
          ? states.reduce((sum, item) => sum + Number(item.operational_score || 0), 0) / states.length
          : 0)
    )
  );

  const routeLines = useMemo(() => {
    return urgentStates
      .slice(0, 5)
      .map((item) => ({
        from: STATE_MARKERS.DC,
        to: STATE_MARKERS[item.state],
        state: item.state,
        risk: item.risk_label,
      }))
      .filter((item) => item.from && item.to);
  }, [urgentStates]);

  return (
    <PageShell
      eyebrow="Executive Command"
      title="Executive Operations Map"
      description="Live national command layer wired to /api/operations/map for county heat, active escalations, resolved task relief, vendor gaps, and tactical signals."
      tickerItems={[
        { label: "National Pressure", value: `${nationalPressure || 0}%`, dotClass: nationalPressure >= 65 ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Critical", value: `${criticalStates.length}`, dotClass: criticalStates.length ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Active Tasks", value: `${activeEscalationStates.length}`, dotClass: activeEscalationStates.length ? "vs-live-dot-warning" : "vs-live-dot-success" },
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

        .ops-threat-metric:before {
          content: "";
          position: absolute;
          inset: auto -20% -65% -20%;
          height: 90px;
          background: radial-gradient(circle, rgba(96, 165, 250, 0.2), transparent 62%);
          animation: opsThreatGlow 3.8s ease-in-out infinite;
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

        @keyframes opsThreatGlow {
          0%, 100% { opacity: 0.45; transform: translateY(0); }
          50% { opacity: 0.95; transform: translateY(-12px); }
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

        .ops-map-shell:after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.055) 45%, transparent 56%);
          transform: translateX(-100%);
          animation: opsScan 7s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes opsScan {
          0% { transform: translateX(-130%); }
          45%, 100% { transform: translateX(130%); }
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
          animation: opsLivePulse 1.4s ease-in-out infinite;
        }

        @keyframes opsLivePulse {
          0%, 100% { opacity: 0.55; transform: scale(0.86); }
          50% { opacity: 1; transform: scale(1.08); }
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

        .ops-route-line {
          stroke: rgba(96, 165, 250, 0.52);
          stroke-width: 1.5;
          stroke-dasharray: 8 8;
          animation: opsRouteFlow 1.7s linear infinite;
        }

        @keyframes opsRouteFlow {
          to { stroke-dashoffset: -32; }
        }

        .ops-marker { cursor: pointer; }

        .ops-marker-core {
          fill: rgba(255, 255, 255, 0.95);
          stroke-width: 1.8;
        }

        .ops-marker-ring {
          fill: transparent;
          stroke: rgba(255, 255, 255, 0.34);
          stroke-width: 2;
          transform-origin: center;
          animation: opsPulse 1.9s ease-out infinite;
        }

        @keyframes opsPulse {
          0% { opacity: 0.9; transform: scale(0.7); }
          100% { opacity: 0; transform: scale(2.25); }
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

        .ops-action-grid button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 10px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .ops-action-grid button:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
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
          .ops-action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="ops-threat-matrix">
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

      <div className="vs-grid-4">
        <StatCard label="States Tracked" value={summary.states_tracked || states.length || 0} delta="Operational states" tone="up" />
        <StatCard label="Critical States" value={summary.critical_states || criticalStates.length || 0} delta="Immediate pressure" tone={criticalStates.length ? "down" : "up"} />
        <StatCard label="Counties Tracked" value={fmtNumber(summary.counties_tracked || 0)} delta="County/parish heat layer" tone="up" />
        <StatCard label="Executive Signals" value={summary.total_signals || alerts.length || 0} delta="Live tactical feed" tone="up" />
      </div>

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
                <p>Click any state to inspect tactical intelligence and live risk movement.</p>
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
                            fill={getStateFill(stateData, layer)}
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

                  {routeLines.map((item) => (
                    <Line
                      key={`${item.state}-${item.risk}`}
                      from={item.from}
                      to={item.to}
                      className="ops-route-line"
                    />
                  ))}

                  {states.map((item) => {
                    const coords = STATE_MARKERS[item.state];
                    if (!coords) return null;

                    const radius = getMarkerRadius(item, layer);

                    return (
                      <Marker
                        key={item.state}
                        coordinates={coords}
                        className="ops-marker"
                        onClick={() => setSelectedState(item)}
                      >
                        <circle className="ops-marker-ring" r={radius + 7} />
                        <circle
                          className="ops-marker-core"
                          r={radius}
                          stroke={getStateFill(item, layer)}
                        />
                        <text
                          textAnchor="middle"
                          y={radius + 16}
                          style={{
                            fill: "rgba(255,255,255,0.94)",
                            fontSize: 10,
                            fontWeight: 900,
                            pointerEvents: "none",
                          }}
                        >
                          {item.state}
                        </text>
                      </Marker>
                    );
                  })}
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

      <div className="vs-grid-2">
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
            </div>
          )}
        </SectionCard>

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
                <StateRiskRow key={item.state} item={item} onSelect={setSelectedState} />
              ))
            )}
          </div>
        </SectionCard>
      </div>

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
    </PageShell>
  );
}
