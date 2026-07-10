import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import {
  fetchExecutiveAiCommand,
  seedExecutiveAiCommand,
  generateExecutiveAiMission,
} from "../api/executiveAiCommandApi";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";

const US_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_META = {
  "01": { abbr: "AL", name: "Alabama", coordinates: [-86.8, 32.8] },
  "02": { abbr: "AK", name: "Alaska", coordinates: [-152.4, 64.2] },
  "04": { abbr: "AZ", name: "Arizona", coordinates: [-111.9, 34.2] },
  "05": { abbr: "AR", name: "Arkansas", coordinates: [-92.4, 34.9] },
  "06": { abbr: "CA", name: "California", coordinates: [-119.7, 37.2] },
  "08": { abbr: "CO", name: "Colorado", coordinates: [-105.5, 39.0] },
  "09": { abbr: "CT", name: "Connecticut", coordinates: [-72.7, 41.6] },
  "10": { abbr: "DE", name: "Delaware", coordinates: [-75.5, 39.0] },
  "11": { abbr: "DC", name: "District of Columbia", coordinates: [-77.0, 38.9] },
  "12": { abbr: "FL", name: "Florida", coordinates: [-81.7, 27.8] },
  "13": { abbr: "GA", name: "Georgia", coordinates: [-83.4, 32.7] },
  "15": { abbr: "HI", name: "Hawaii", coordinates: [-157.5, 20.8] },
  "16": { abbr: "ID", name: "Idaho", coordinates: [-114.6, 44.2] },
  "17": { abbr: "IL", name: "Illinois", coordinates: [-89.2, 40.0] },
  "18": { abbr: "IN", name: "Indiana", coordinates: [-86.1, 39.9] },
  "19": { abbr: "IA", name: "Iowa", coordinates: [-93.5, 42.1] },
  "20": { abbr: "KS", name: "Kansas", coordinates: [-98.2, 38.5] },
  "21": { abbr: "KY", name: "Kentucky", coordinates: [-84.7, 37.5] },
  "22": { abbr: "LA", name: "Louisiana", coordinates: [-91.9, 31.0] },
  "23": { abbr: "ME", name: "Maine", coordinates: [-69.2, 45.3] },
  "24": { abbr: "MD", name: "Maryland", coordinates: [-76.7, 39.0] },
  "25": { abbr: "MA", name: "Massachusetts", coordinates: [-71.8, 42.3] },
  "26": { abbr: "MI", name: "Michigan", coordinates: [-84.6, 44.3] },
  "27": { abbr: "MN", name: "Minnesota", coordinates: [-94.3, 46.3] },
  "28": { abbr: "MS", name: "Mississippi", coordinates: [-89.7, 32.7] },
  "29": { abbr: "MO", name: "Missouri", coordinates: [-92.6, 38.5] },
  "30": { abbr: "MT", name: "Montana", coordinates: [-110.4, 47.0] },
  "31": { abbr: "NE", name: "Nebraska", coordinates: [-99.8, 41.5] },
  "32": { abbr: "NV", name: "Nevada", coordinates: [-116.6, 39.3] },
  "33": { abbr: "NH", name: "New Hampshire", coordinates: [-71.6, 43.7] },
  "34": { abbr: "NJ", name: "New Jersey", coordinates: [-74.5, 40.1] },
  "35": { abbr: "NM", name: "New Mexico", coordinates: [-106.1, 34.4] },
  "36": { abbr: "NY", name: "New York", coordinates: [-75.5, 43.0] },
  "37": { abbr: "NC", name: "North Carolina", coordinates: [-79.4, 35.5] },
  "38": { abbr: "ND", name: "North Dakota", coordinates: [-100.5, 47.5] },
  "39": { abbr: "OH", name: "Ohio", coordinates: [-82.8, 40.3] },
  "40": { abbr: "OK", name: "Oklahoma", coordinates: [-97.5, 35.6] },
  "41": { abbr: "OR", name: "Oregon", coordinates: [-120.6, 44.0] },
  "42": { abbr: "PA", name: "Pennsylvania", coordinates: [-77.7, 40.9] },
  "44": { abbr: "RI", name: "Rhode Island", coordinates: [-71.5, 41.7] },
  "45": { abbr: "SC", name: "South Carolina", coordinates: [-80.9, 33.8] },
  "46": { abbr: "SD", name: "South Dakota", coordinates: [-100.2, 44.4] },
  "47": { abbr: "TN", name: "Tennessee", coordinates: [-86.4, 35.8] },
  "48": { abbr: "TX", name: "Texas", coordinates: [-99.3, 31.5] },
  "49": { abbr: "UT", name: "Utah", coordinates: [-111.7, 39.3] },
  "50": { abbr: "VT", name: "Vermont", coordinates: [-72.7, 44.0] },
  "51": { abbr: "VA", name: "Virginia", coordinates: [-78.7, 37.5] },
  "53": { abbr: "WA", name: "Washington", coordinates: [-120.7, 47.4] },
  "54": { abbr: "WV", name: "West Virginia", coordinates: [-80.6, 38.6] },
  "55": { abbr: "WI", name: "Wisconsin", coordinates: [-89.8, 44.5] },
  "56": { abbr: "WY", name: "Wyoming", coordinates: [-107.6, 43.0] },
};

const STATE_NAME_TO_ABBR = Object.values(STATE_META).reduce((acc, item) => {
  acc[item.name.toLowerCase()] = item.abbr;
  acc[item.abbr.toLowerCase()] = item.abbr;
  return acc;
}, {});

function normalizeStateCode(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  return STATE_NAME_TO_ABBR[raw] || "";
}

function stateFill(metric, selected = false) {
  if (selected) return "rgba(251,146,60,.82)";
  if (!metric) return "rgba(30,41,59,.88)";

  const risk = clamp(metric.risk_percentage);
  const confidence = clamp(metric.confidence_percentage);
  const impact = clamp(metric.impact_percentage);

  if (risk >= 70) return "rgba(239,68,68,.78)";
  if (risk >= 45) return "rgba(245,158,11,.74)";
  if (confidence >= 75 || impact >= 75) return "rgba(34,197,94,.68)";
  return "rgba(59,130,246,.62)";
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function pct(value) {
  return `${Math.round(number(value))}%`;
}

function clamp(value) {
  return Math.max(0, Math.min(100, number(value)));
}

function labelize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function tone(value = "") {
  const next = String(value || "").toLowerCase();
  if (["critical", "high", "blocked", "rejected"].includes(next)) return "danger";
  if (["medium", "monitoring", "watch", "pending_approval", "executive_review"].includes(next)) return "accent";
  if (["active", "stable", "complete", "completed", "queued", "approved"].includes(next)) return "active";
  return "info";
}

function formatTime(value) {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ScoreCard({ title, value, subtitle, inverse = false }) {
  const width = clamp(value);

  return (
    <div className="cmd-score-card">
      <div className="cmd-score-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <div className={inverse ? "cmd-score-bar inverse" : "cmd-score-bar"}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function AgentStatus({ name, status, note }) {
  return (
    <div className="cmd-agent-card">
      <div className="cmd-agent-head">
        <span className={`cmd-status-dot ${String(status || "").toLowerCase()}`} />
        <strong>{name}</strong>
      </div>
      <small>{note}</small>
      <Badge tone={tone(status)}>{labelize(status)}</Badge>
    </div>
  );
}

function MissionRow({ mission, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "cmd-row is-active" : "cmd-row"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={mission.title}
        subtitle={mission.mission_summary || "Executive AI mission requires leadership review."}
        meta={[
          { label: "Mission Type", value: labelize(mission.mission_type) },
          { label: "Geographic Scope", value: mission.state_name || mission.geographic_scope || "National Coverage" },
          { label: "Strategic Impact", value: pct(mission.impact_percentage) },
          { label: "Mission Confidence", value: pct(mission.confidence_percentage) },
          { label: "Execution Risk", value: pct(mission.risk_percentage) },
          { label: "Approval Status", value: labelize(mission.approval_status || mission.status) },
        ]}
      />
    </button>
  );
}

function TimelineRow({ event }) {
  return (
    <div className="cmd-timeline-row">
      <div className="cmd-timeline-time">{formatTime(event.created_at || event.event_time)}</div>
      <span className="cmd-dot" />
      <ResponsiveRow
        title={event.event_title}
        subtitle={event.event_description}
        meta={[
          { label: "Command Event Type", value: labelize(event.event_type) },
          { label: "Intelligence Source", value: event.source_module || "Executive AI Command Platform" },
          { label: "Geographic Scope", value: event.state_name || "National Coverage" },
          { label: "Impact", value: pct(event.impact_percentage) },
        ]}
      />
    </div>
  );
}

function ActionRow({ action }) {
  return (
    <div className="cmd-action-row">
      <div>
        <strong>{action.title || "Executive command action"}</strong>
        <p>{action.description || "Command action details unavailable."}</p>
        <div className="cmd-chip-row">
          <Badge tone="info">Owner: {action.owner || "Executive Operations"}</Badge>
          <Badge tone={tone(action.status)}>Status: {labelize(action.status || "queued")}</Badge>
          <Badge tone="accent">Due: {action.due_window || "72 hours"}</Badge>
          <Badge tone={action.approval_required ? "danger" : "active"}>
            {action.approval_required ? "Executive Approval Required" : "Approval Not Required"}
          </Badge>
        </div>
      </div>

      <div className="cmd-decision-actions">
        <button type="button">Approve</button>
        <button type="button">Delegate</button>
        <button type="button">Request Analysis</button>
      </div>
    </div>
  );
}

function NationalOperationsMap({
  missions,
  timeline,
  selectedState,
  onSelectState,
}) {
  const stateMetrics = useMemo(() => {
    const map = {};

    for (const mission of missions) {
      const abbr = normalizeStateCode(
        mission.state_code || mission.state || mission.state_name || mission.geographic_scope
      );
      if (!abbr) continue;
      const current = map[abbr] || {
        state: abbr, mission_count: 0, event_count: 0, impact_percentage: 0,
        confidence_percentage: 0, risk_percentage: 0, titles: [],
      };
      current.mission_count += 1;
      current.impact_percentage = Math.max(current.impact_percentage, number(mission.impact_percentage));
      current.confidence_percentage = Math.max(current.confidence_percentage, number(mission.confidence_percentage));
      current.risk_percentage = Math.max(current.risk_percentage, number(mission.risk_percentage));
      if (mission.title) current.titles.push(mission.title);
      map[abbr] = current;
    }

    for (const event of timeline) {
      const abbr = normalizeStateCode(event.state_code || event.state || event.state_name);
      if (!abbr) continue;
      const current = map[abbr] || {
        state: abbr, mission_count: 0, event_count: 0, impact_percentage: 0,
        confidence_percentage: 0, risk_percentage: 0, titles: [],
      };
      current.event_count += 1;
      current.impact_percentage = Math.max(current.impact_percentage, number(event.impact_percentage));
      map[abbr] = current;
    }

    return map;
  }, [missions, timeline]);

  const activeStates = Object.keys(stateMetrics);
  const selectedMetric = selectedState ? stateMetrics[selectedState] : null;

  return (
    <div className="cmd-geo-map-shell">
      <div className="cmd-geo-map-main">
        <div className="cmd-map-heading">
          <div>
            <span>Live National Geographic Layer</span>
            <strong>{selectedState ? `${selectedState} Executive Posture` : "United States Executive Mission Posture"}</strong>
          </div>
          <div className="cmd-map-summary">
            <Badge tone="active">{activeStates.length} Active States</Badge>
            <Badge tone="info">{missions.length} Missions</Badge>
            <Badge tone="accent">{timeline.length} Timeline Events</Badge>
          </div>
        </div>

        <ComposableMap
  projection="geoAlbersUsa"
  projectionConfig={{ scale: 980 }}
  width={980}
  height={560}
  style={{ width: "100%", height: "auto" }}
>
  <Geographies geography={US_TOPO_JSON}>
    {({ geographies }) =>
      geographies
        .filter((geo) => {
          const fips = String(geo.id).padStart(2, "0");
          return Boolean(STATE_META[fips]);
        })
        .map((geo) => {
          const fips = String(geo.id).padStart(2, "0");
          const meta = STATE_META[fips];
          const abbr = meta?.abbr || "";
          const metric = stateMetrics[abbr];
          const isSelected = selectedState === abbr;

          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              onClick={() => {
                if (abbr) {
                  onSelectState(isSelected ? "" : abbr);
                }
              }}
              style={{
                default: {
                  fill: stateFill(metric, isSelected),
                  stroke: "rgba(226,232,240,.34)",
                  strokeWidth: 0.7,
                  outline: "none",
                  cursor: abbr ? "pointer" : "default",
                },
                hover: {
                  fill: isSelected
                    ? "rgba(251,146,60,.92)"
                    : "rgba(96,165,250,.78)",
                  stroke: "rgba(255,255,255,.72)",
                  strokeWidth: 1,
                  outline: "none",
                  cursor: abbr ? "pointer" : "default",
                },
                pressed: {
                  fill: "rgba(251,146,60,.92)",
                  stroke: "white",
                  strokeWidth: 1,
                  outline: "none",
                },
              }}
            />
          );
        })
    }
  </Geographies>
</ComposableMap>

        <div className="cmd-map-legend-row">
          <span><i className="legend-danger" /> High Risk</span>
          <span><i className="legend-warning" /> Watch</span>
          <span><i className="legend-active" /> Strong / Operational</span>
          <span><i className="legend-neutral" /> No Active Mission Data</span>
        </div>
      </div>

      <aside className="cmd-map-detail">
        <span className="cmd-map-detail-eyebrow">Selected Geography</span>
        <strong>{selectedState || "National"}</strong>
        {selectedMetric ? (
          <>
            <div className="cmd-map-detail-grid">
              <div><span>Missions</span><strong>{selectedMetric.mission_count}</strong></div>
              <div><span>Events</span><strong>{selectedMetric.event_count}</strong></div>
              <div><span>Impact</span><strong>{pct(selectedMetric.impact_percentage)}</strong></div>
              <div><span>Confidence</span><strong>{pct(selectedMetric.confidence_percentage)}</strong></div>
              <div><span>Risk</span><strong>{pct(selectedMetric.risk_percentage)}</strong></div>
            </div>
            <div className="cmd-map-mission-list">
              <span>Mission Coverage</span>
              {selectedMetric.titles.length ? selectedMetric.titles.slice(0, 5).map((title) => <div key={title}>{title}</div>) : <p>No named missions are currently attached.</p>}
            </div>
          </>
        ) : (
          <p>Select a state with an active mission marker to review its executive posture, risk, confidence, and timeline activity.</p>
        )}
        {selectedState ? <button type="button" className="vs-button vs-button-secondary" onClick={() => onSelectState("")}>Reset National View</button> : null}
      </aside>
    </div>
  );
}

function ReasoningPanel({ brief, activeMission }) {
  const factors = [
    { label: "Political Factors", value: brief?.win_probability_percentage || 0 },
    { label: "Operational Factors", value: brief?.national_readiness_percentage || 0 },
    { label: "Financial Factors", value: activeMission?.impact_percentage || 0 },
    { label: "Media Factors", value: brief?.ai_confidence_percentage || 0 },
    { label: "Execution Factors", value: 100 - clamp(brief?.execution_risk_percentage || 0) },
  ];

  return (
    <div className="cmd-reasoning-panel">
      <div className="cmd-reasoning-copy">
        <span>Why AI made this recommendation</span>
        <strong>{brief?.recommended_action || "No active executive recommendation."}</strong>
        <p>
          The platform weighs readiness, modeled win probability, operational exposure,
          autonomous readiness, mission confidence, and execution risk before elevating a decision.
        </p>
      </div>

      <div className="cmd-reasoning-grid">
        {factors.map((factor) => (
          <div key={factor.label}>
            <span>{factor.label}</span>
            <strong>{pct(factor.value)}</strong>
            <div className="cmd-mini-bar"><i style={{ width: `${clamp(factor.value)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExecutiveAICommandPlatform() {
  const [data, setData] = useState(null);
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedMapState, setSelectedMapState] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const result = await fetchExecutiveAiCommand(1);
    setData(result);

    const missions = arr(result.missions);
    setActiveMissionId((current) => {
      if (current && missions.some((item) => String(item.id) === String(current))) return current;
      return missions[0]?.id || null;
    });

    setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setLoading(false);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const result = await seedExecutiveAiCommand(1);
    setMessage(result?.ok ? "Executive AI Command Platform seeded successfully." : "Seed endpoint unavailable. Fallback command platform remains active.");
    await loadData();
    setSeedLoading(false);
  }

  async function handleGenerateMission() {
    setGenerateLoading(true);

    const result = await generateExecutiveAiMission(
      {
        title: "Executive AI Mission Package",
        mission_type: "executive_ai_mission",
        geographic_scope: "National Coverage",
        state_name: "National Coverage",
        priority: "medium",
        impact_percentage: 78,
        confidence_percentage: 84,
        risk_percentage: 34,
        mission_summary: "Executive AI generated a new mission package for leadership review.",
      },
      1
    );

    setMessage(result?.ok ? "Executive AI mission generated." : "Generate endpoint unavailable. Fallback command platform remains active.");
    await loadData();
    setGenerateLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const brief = data?.brief;
  const missions = arr(data?.missions);
  const timeline = arr(data?.timeline);
  const summary = data?.summary || {};

  const activeMission = useMemo(() => {
    return missions.find((item) => String(item.id) === String(activeMissionId)) || missions[0] || null;
  }, [missions, activeMissionId]);

  const readiness = clamp(brief?.national_readiness_percentage || summary.aiConfidencePercentage || 0);
  const executionRisk = clamp(brief?.execution_risk_percentage || summary.executionRiskPercentage || 0);
  const missionConfidence = clamp(activeMission?.confidence_percentage || brief?.ai_confidence_percentage || 0);

  const navSections = [
    { id: "cmd-overview", label: "Overview" },
    { id: "cmd-map", label: "National Map" },
    { id: "cmd-brief", label: "Executive Brief" },
    { id: "cmd-missions", label: "Missions", badge: missions.length },
    { id: "cmd-reasoning", label: "AI Reasoning" },
    { id: "cmd-agents", label: "AI Agents" },
    { id: "cmd-timeline", label: "Command Feed", badge: timeline.length },
  ];

  const agents = [
    ["Executive Chief of Staff", "active", "Coordinating executive priorities"],
    ["Campaign Strategist", "thinking", "Modeling path-to-victory decisions"],
    ["Polling Analyst", "processing", "Reviewing trend shifts"],
    ["Fundraising Director", "active", "Tracking donor velocity"],
    ["Communications Director", "idle", "Standing by for narrative changes"],
    ["Rapid Response", "alert", "Monitoring high-risk signals"],
    ["MailOps Director", "active", "Reviewing production capacity"],
    ["Compliance Advisor", "monitoring", "Scanning approval requirements"],
  ];

  return (
    <PageShell
      eyebrow="Build 3C · Executive AI Command Platform"
      title="Executive AI Command Platform"
      description="The unified executive operating system for VoterSpheres, connecting decision intelligence, predictive simulation, national digital twin modeling, autonomous operations, forecast, command center, and political graph intelligence."
      demo={String(data?.source || "").includes("fallback")}
      demoText="Fallback executive AI command intelligence is active while the live API is unavailable."
      tickerItems={[
        { label: "Readiness", value: pct(readiness), dotClass: "vs-live-dot-success" },
        { label: "Execution Risk", value: pct(executionRisk), dotClass: executionRisk > 60 ? "vs-live-dot-danger" : "vs-live-dot-warning" },
        { label: "Mission Confidence", value: pct(missionConfidence), dotClass: "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .cmd-command-ribbon{display:grid;grid-template-columns:minmax(260px,1.2fr) repeat(4,minmax(140px,.55fr));gap:14px;align-items:stretch;border:1px solid rgba(148,163,184,.16);border-radius:28px;background:radial-gradient(circle at top right,rgba(251,146,60,.18),transparent 34%),radial-gradient(circle at bottom left,rgba(59,130,246,.12),transparent 32%),linear-gradient(135deg,rgba(15,23,42,.94),rgba(2,6,23,.86));padding:18px;box-shadow:0 28px 80px rgba(2,6,23,.32)}
        .cmd-command-ribbon>div{border:1px solid rgba(148,163,184,.12);border-radius:18px;background:rgba(2,6,23,.28);padding:14px;min-width:0}.cmd-command-ribbon .cmd-primary-ribbon{border:none;background:transparent;padding:2px}
        .cmd-command-ribbon span,.cmd-map-label,.cmd-reasoning-copy span,.cmd-reasoning-grid span,.cmd-agent-card small{display:block;color:rgba(147,197,253,.86);font-size:11px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}
        .cmd-primary-ribbon strong{display:block;margin-top:8px;color:white;font-size:clamp(28px,4vw,48px);line-height:1;font-weight:950;letter-spacing:-.07em}.cmd-primary-ribbon p{margin:10px 0 0;color:rgba(226,232,240,.76);line-height:1.6}
        .cmd-command-ribbon>div:not(.cmd-primary-ribbon) strong{display:block;margin-top:7px;color:white;font-size:21px;font-weight:950;overflow-wrap:anywhere}
        .cmd-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.cmd-toolbar-actions,.cmd-source-row,.cmd-chip-row,.cmd-map-legend,.cmd-decision-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .cmd-layout{display:grid;grid-template-columns:minmax(420px,.9fr) minmax(0,1.4fr);gap:20px;align-items:start}.cmd-stack{display:grid;gap:18px;min-width:0}
        .cmd-row,.cmd-action-row,.cmd-score-card,.cmd-agent-card,.cmd-reasoning-panel{border:1px solid var(--vs-exec-border,var(--vs-border));border-radius:18px;background:rgba(15,23,42,.52);min-width:0}
        .cmd-row{width:100%;padding:15px;text-align:left;color:inherit;cursor:pointer}.cmd-row:hover,.cmd-row.is-active{border-color:rgba(251,146,60,.46);background:rgba(251,146,60,.08)}
        .cmd-row .vs-responsive-meta,.cmd-timeline-row .vs-responsive-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px}
        .cmd-brief-panel{border:1px solid rgba(251,146,60,.30);border-radius:24px;background:radial-gradient(circle at top right,rgba(251,146,60,.14),transparent 36%),linear-gradient(135deg,rgba(15,23,42,.72),rgba(2,6,23,.55));padding:20px}.cmd-brief-panel h3{margin:8px 0 10px;font-size:clamp(24px,3vw,34px);line-height:1.18;color:var(--vs-text);letter-spacing:-.04em}
        .cmd-score-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.cmd-score-card{padding:18px;display:grid;gap:10px;min-height:132px}.cmd-score-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start}.cmd-score-head span{color:var(--vs-text-muted);font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.09em;line-height:1.45;white-space:normal;overflow-wrap:anywhere}.cmd-score-head strong{color:var(--vs-text);font-size:24px;font-weight:950;white-space:nowrap}
        .cmd-score-card p,.cmd-action-row p,.cmd-reasoning-copy p{margin:0;color:var(--vs-text-muted);font-size:12px;line-height:1.55}.cmd-score-bar,.cmd-mini-bar{height:8px;border-radius:999px;background:rgba(148,163,184,.16);overflow:hidden}.cmd-score-bar i,.cmd-mini-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#fb923c,#22c55e)}.cmd-score-bar.inverse i{background:linear-gradient(90deg,#f59e0b,#ef4444)}
        .cmd-action-row{padding:15px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center}.cmd-action-row strong{color:var(--vs-text)}.cmd-decision-actions button{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.72);color:rgba(226,232,240,.92);border-radius:14px;padding:10px 12px;font-size:12px;font-weight:850;cursor:pointer}.cmd-decision-actions button:hover{border-color:rgba(251,146,60,.5);background:rgba(251,146,60,.12)}
        .cmd-timeline-row{display:grid;grid-template-columns:56px 14px minmax(0,1fr);gap:12px;padding:15px;border:1px solid rgba(148,163,184,.14);border-radius:18px;background:rgba(15,23,42,.46)}.cmd-timeline-time{color:rgba(226,232,240,.7);font-size:11px;font-weight:800;padding-top:2px}.cmd-dot{width:10px;height:10px;margin-top:4px;border-radius:999px;background:var(--vs-brand-orange,#fb923c);box-shadow:0 0 16px rgba(251,146,60,.65)}
        .cmd-map-panel{position:relative;min-height:360px;border:1px solid rgba(96,165,250,.24);border-radius:26px;overflow:hidden;background:radial-gradient(circle at 70% 30%,rgba(59,130,246,.18),transparent 30%),radial-gradient(circle at 30% 70%,rgba(251,146,60,.12),transparent 34%),linear-gradient(145deg,rgba(2,6,23,.96),rgba(15,23,42,.88))}.cmd-map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(148,163,184,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.06) 1px,transparent 1px);background-size:34px 34px}.cmd-map-label{position:absolute;left:18px;top:16px;z-index:2}
        .cmd-map-marker{position:absolute;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:999px;display:grid;place-items:center;font-size:11px;font-weight:950;color:white;border:1px solid rgba(255,255,255,.18);box-shadow:0 0 24px rgba(59,130,246,.22)}.cmd-map-marker.high{background:rgba(239,68,68,.72);box-shadow:0 0 26px rgba(239,68,68,.42)}.cmd-map-marker.watch{background:rgba(245,158,11,.72);box-shadow:0 0 26px rgba(245,158,11,.34)}.cmd-map-marker.active{background:rgba(34,197,94,.72);box-shadow:0 0 26px rgba(34,197,94,.34)}.cmd-map-legend{position:absolute;left:18px;bottom:16px;z-index:2}
        .cmd-reasoning-panel{padding:18px;display:grid;grid-template-columns:minmax(260px,.9fr) minmax(0,1.1fr);gap:18px;background:radial-gradient(circle at top right,rgba(168,85,247,.14),transparent 34%),rgba(15,23,42,.56)}.cmd-reasoning-copy strong{display:block;margin:8px 0 10px;color:white;font-size:22px;line-height:1.25;font-weight:950}.cmd-reasoning-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cmd-reasoning-grid>div{border:1px solid rgba(148,163,184,.12);border-radius:16px;background:rgba(2,6,23,.28);padding:12px}.cmd-reasoning-grid strong{display:block;margin:6px 0 9px;color:white;font-size:18px}
        .cmd-agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.cmd-agent-card{padding:14px;display:grid;gap:9px}.cmd-agent-head{display:flex;gap:9px;align-items:center}.cmd-agent-head strong{color:white;font-size:14px}.cmd-status-dot{width:10px;height:10px;border-radius:999px;background:#64748b}.cmd-status-dot.active,.cmd-status-dot.processing{background:#22c55e;box-shadow:0 0 14px rgba(34,197,94,.5)}.cmd-status-dot.thinking,.cmd-status-dot.monitoring{background:#f59e0b;box-shadow:0 0 14px rgba(245,158,11,.45)}.cmd-status-dot.alert{background:#ef4444;box-shadow:0 0 14px rgba(239,68,68,.5)}

        .cmd-geo-map-shell { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(260px,.45fr); gap:16px; align-items:stretch; }
        .cmd-geo-map-main,.cmd-map-detail { border:1px solid rgba(96,165,250,.22); border-radius:24px; background:radial-gradient(circle at top right,rgba(59,130,246,.14),transparent 34%),linear-gradient(145deg,rgba(2,6,23,.96),rgba(15,23,42,.88)); overflow:hidden; }
        .cmd-geo-map-main { padding:16px; }
        .cmd-map-heading { display:flex; justify-content:space-between; gap:14px; align-items:flex-start; flex-wrap:wrap; margin-bottom:10px; }
        .cmd-map-heading span,.cmd-map-detail-eyebrow,.cmd-map-mission-list>span { display:block; color:rgba(147,197,253,.86); font-size:11px; font-weight:950; letter-spacing:.1em; text-transform:uppercase; }
        .cmd-map-heading strong { display:block; margin-top:5px; color:white; font-size:22px; font-weight:950; letter-spacing:-.035em; }
        .cmd-map-summary { display:flex; gap:8px; flex-wrap:wrap; }
        .cmd-geo-map-canvas { border:1px solid rgba(148,163,184,.12); border-radius:20px; background:radial-gradient(circle at center,rgba(30,64,175,.12),transparent 55%),rgba(2,6,23,.42); overflow:hidden; }
        .cmd-map-marker-group { cursor:pointer; }
        .cmd-map-pulse { fill:rgba(34,197,94,.82); stroke:rgba(255,255,255,.72); stroke-width:1.5; filter:drop-shadow(0 0 7px rgba(34,197,94,.75)); }
        .cmd-map-pulse.warning { fill:rgba(245,158,11,.88); filter:drop-shadow(0 0 7px rgba(245,158,11,.72)); }
        .cmd-map-pulse.danger { fill:rgba(239,68,68,.9); filter:drop-shadow(0 0 8px rgba(239,68,68,.78)); }
        .cmd-map-state-label { fill:white; font-size:7px; font-weight:950; pointer-events:none; }
        .cmd-map-legend-row { display:flex; gap:16px; flex-wrap:wrap; padding:12px 4px 0; color:rgba(226,232,240,.76); font-size:11px; font-weight:800; }
        .cmd-map-legend-row span { display:flex; gap:7px; align-items:center; }
        .cmd-map-legend-row i { width:10px; height:10px; border-radius:999px; display:block; }
        .legend-danger { background:#ef4444; } .legend-warning { background:#f59e0b; } .legend-active { background:#22c55e; } .legend-neutral { background:#334155; }
        .cmd-map-detail { padding:18px; display:grid; align-content:start; gap:16px; }
        .cmd-map-detail>strong { color:white; font-size:34px; font-weight:950; letter-spacing:-.06em; }
        .cmd-map-detail>p { margin:0; color:rgba(203,213,225,.76); line-height:1.65; }
        .cmd-map-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .cmd-map-detail-grid>div { border:1px solid rgba(148,163,184,.12); border-radius:15px; background:rgba(2,6,23,.3); padding:11px; }
        .cmd-map-detail-grid span { display:block; color:rgba(148,163,184,.78); font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
        .cmd-map-detail-grid strong { display:block; margin-top:5px; color:white; font-size:18px; }
        .cmd-map-mission-list { display:grid; gap:8px; }
        .cmd-map-mission-list>div { border:1px solid rgba(148,163,184,.12); border-radius:13px; background:rgba(15,23,42,.48); padding:10px; color:rgba(226,232,240,.9); font-size:12px; line-height:1.45; }
        .cmd-map-mission-list p { margin:0; color:rgba(148,163,184,.76); font-size:12px; }

        @media(max-width:1280px){.cmd-command-ribbon,.cmd-layout,.cmd-reasoning-panel,.cmd-geo-map-shell{grid-template-columns:1fr}}@media(max-width:900px){.cmd-score-grid,.cmd-row .vs-responsive-meta,.cmd-timeline-row .vs-responsive-meta,.cmd-reasoning-grid{grid-template-columns:1fr}.cmd-action-row{grid-template-columns:1fr}.cmd-timeline-row{grid-template-columns:48px 12px minmax(0,1fr)}}
      `}</style>

      <div id="cmd-overview" className="cmd-command-ribbon">
        <div className="cmd-primary-ribbon">
          <span>National Executive Status</span>
          <strong>{readiness >= 75 ? "Operational" : "Attention Required"}</strong>
          <p>
            Executive AI is coordinating readiness, risk, mission confidence,
            predictive simulation, command flow, and approval actions across the platform.
          </p>
        </div>
        <div><span>National Readiness</span><strong>{pct(readiness)}</strong></div>
        <div><span>Execution Risk</span><strong>{pct(executionRisk)}</strong></div>
        <div><span>Mission Confidence</span><strong>{pct(missionConfidence)}</strong></div>
        <div><span>Active Missions</span><strong>{summary.activeExecutiveMissions || missions.length || 0}</strong></div>
      </div>

      <ExecutivePageNav sections={navSections} />

      <div className="cmd-toolbar">
        <div className="vs-chip-row">
          <Badge tone={String(data?.source || "").includes("fallback") ? "warning" : "active"}>
            {String(data?.source || "").includes("fallback") ? "Fallback Executive AI Command" : "Live Executive AI Command API"}
          </Badge>
          <Badge tone="accent">Unified Executive Operating System</Badge>
          <Badge tone="info">AI Mission Control</Badge>
        </div>

        <div className="cmd-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>{loading ? "Refreshing..." : "Refresh Command Platform"}</button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>{seedLoading ? "Seeding..." : "Seed Command Platform"}</button>
          <button type="button" className="vs-button vs-button-secondary" onClick={handleGenerateMission} disabled={generateLoading}>{generateLoading ? "Generating..." : "Generate Mission"}</button>
          <Link className="vs-button vs-button-secondary" to="/national-political-digital-twin">Digital Twin</Link>
          <Link className="vs-button vs-button-secondary" to="/autonomous-campaign-operations">Autonomous Operations</Link>
          <Link className="vs-button vs-button-secondary" to="/command-center">Command Center</Link>
        </div>
      </div>

      {message ? <div className="vs-banner">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Active Executive Command Briefs" value={summary.activeCommandBriefs || 0} subtext="Current national executive command briefs" />
        <StatCard label="Active Executive Missions" value={summary.activeExecutiveMissions || missions.length || 0} subtext="AI-created mission packages under review" />
        <StatCard label="AI Confidence Percentage" value={pct(summary.aiConfidencePercentage)} subtext="Confidence across the active executive command brief" />
        <StatCard label="Execution Risk Percentage" value={pct(summary.executionRiskPercentage)} subtext={`${summary.queuedApprovalActions || 0} queued approval actions`} />
      </div>

      <CollapsibleSection id="cmd-map" title="National Operations Map" subtitle="Executive mission posture, attention states, and active operational zones." defaultOpen right={<Badge tone="active">National Live Layer</Badge>}>
        <NationalOperationsMap missions={missions} timeline={timeline} selectedState={selectedMapState} onSelectState={setSelectedMapState} />
      </CollapsibleSection>

      <div className="cmd-layout">
        <div className="cmd-stack">
          <CollapsibleSection id="cmd-missions" title="Executive AI Mission Queue" subtitle="AI-generated mission packages that unify decision intelligence, predictive simulation, digital twin, and autonomous operations." defaultOpen right={<Badge tone="info">{missions.length} Executive Missions</Badge>}>
            {loading ? <EmptyState text="Loading Executive AI Command Platform..." /> : missions.length ? (
              <div className="vs-stack">
                {missions.map((mission) => <MissionRow key={mission.id || mission.title} mission={mission} active={String(activeMission?.id) === String(mission.id)} onClick={() => setActiveMissionId(mission.id)} />)}
              </div>
            ) : <EmptyState text="No executive AI missions are currently available." />}
          </CollapsibleSection>

          <CollapsibleSection id="cmd-agents" title="Live AI Agents" subtitle="Specialized executive agents coordinating command recommendations." defaultOpen={false} right={<Badge tone="active">{agents.length} Agents</Badge>}>
            <div className="cmd-agent-grid">
              {agents.map(([name, status, note]) => <AgentStatus key={name} name={name} status={status} note={note} />)}
            </div>
          </CollapsibleSection>
        </div>

        <div className="cmd-stack">
          <CollapsibleSection id="cmd-brief" title="National Executive AI Command Brief" subtitle="The unified command brief for leadership, combining all major VoterSpheres intelligence systems." defaultOpen right={<Badge tone={tone(brief?.executive_priority)}>{labelize(brief?.executive_priority || "high")}</Badge>}>
            {brief ? (
              <div className="vs-stack">
                <div className="cmd-brief-panel">
                  <div className="vs-page-eyebrow">Recommended Executive Action</div>
                  <h3>{brief.recommended_action}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>{brief.strategic_summary}</p>
                  <div className="cmd-source-row">{arr(brief.source_modules).map((source) => <Badge key={source} tone="accent">{source}</Badge>)}</div>
                </div>
                <div className="cmd-score-grid">
                  <ScoreCard title="National Readiness Percentage" value={brief.national_readiness_percentage} subtitle="Overall modeled national readiness." />
                  <ScoreCard title="Win Probability Percentage" value={brief.win_probability_percentage} subtitle="Current national modeled probability." />
                  <ScoreCard title="AI Confidence Percentage" value={brief.ai_confidence_percentage} subtitle="Confidence in the executive command brief." />
                  <ScoreCard title="Autonomous Readiness Percentage" value={brief.autonomous_readiness_percentage} subtitle="Readiness for executive-approved automation." />
                  <ScoreCard title="Execution Risk Percentage" value={brief.execution_risk_percentage} subtitle="Operational downside exposure." inverse />
                </div>
              </div>
            ) : <EmptyState text="No executive command brief is currently available." />}
          </CollapsibleSection>

          <CollapsibleSection id="cmd-reasoning" title="AI Decision Reasoning" subtitle="Why Executive AI elevated this action and which factors influenced the recommendation." defaultOpen right={<Badge tone="accent">Explainable AI</Badge>}>
            <ReasoningPanel brief={brief} activeMission={activeMission} />
          </CollapsibleSection>

          <CollapsibleSection title="Selected Mission Approval Queue" subtitle="Executive approval actions attached to the selected AI mission package." defaultOpen right={<Badge tone="info">{arr(activeMission?.actions).length} Approval Actions</Badge>}>
            {arr(activeMission?.actions).length ? <div className="vs-stack">{arr(activeMission.actions).map((action) => <ActionRow key={action.id || action.title} action={action} />)}</div> : <EmptyState text="No approval actions are currently attached to this mission." />}
          </CollapsibleSection>

          <CollapsibleSection id="cmd-timeline" title="Executive AI Command Feed" subtitle="Recent events and intelligence updates absorbed into the executive command platform." defaultOpen right={<Badge tone="accent">{timeline.length} Timeline Events</Badge>}>
            {timeline.length ? <div className="vs-stack">{timeline.map((event) => <TimelineRow key={event.id || event.event_title} event={event} />)}</div> : <EmptyState text="No executive AI command timeline events are currently available." />}
          </CollapsibleSection>
        </div>
      </div>

      <BackToTopButton />
    </PageShell>
  );
}
