import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import {
  askExecutiveIntelligence,
} from "../api/executiveIntelligenceOrchestratorApi"; 
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
import ExecutiveRealtimeVoicePanel from "../components/executive-ai/ExecutiveRealtimeVoicePanel";


const US_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_META = {
  "01": { abbr: "AL", name: "Alabama" },
  "02": { abbr: "AK", name: "Alaska" },
  "04": { abbr: "AZ", name: "Arizona" },
  "05": { abbr: "AR", name: "Arkansas" },
  "06": { abbr: "CA", name: "California" },
  "08": { abbr: "CO", name: "Colorado" },
  "09": { abbr: "CT", name: "Connecticut" },
  "10": { abbr: "DE", name: "Delaware" },
  "11": { abbr: "DC", name: "District of Columbia" },
  "12": { abbr: "FL", name: "Florida" },
  "13": { abbr: "GA", name: "Georgia" },
  "15": { abbr: "HI", name: "Hawaii" },
  "16": { abbr: "ID", name: "Idaho" },
  "17": { abbr: "IL", name: "Illinois" },
  "18": { abbr: "IN", name: "Indiana" },
  "19": { abbr: "IA", name: "Iowa" },
  "20": { abbr: "KS", name: "Kansas" },
  "21": { abbr: "KY", name: "Kentucky" },
  "22": { abbr: "LA", name: "Louisiana" },
  "23": { abbr: "ME", name: "Maine" },
  "24": { abbr: "MD", name: "Maryland" },
  "25": { abbr: "MA", name: "Massachusetts" },
  "26": { abbr: "MI", name: "Michigan" },
  "27": { abbr: "MN", name: "Minnesota" },
  "28": { abbr: "MS", name: "Mississippi" },
  "29": { abbr: "MO", name: "Missouri" },
  "30": { abbr: "MT", name: "Montana" },
  "31": { abbr: "NE", name: "Nebraska" },
  "32": { abbr: "NV", name: "Nevada" },
  "33": { abbr: "NH", name: "New Hampshire" },
  "34": { abbr: "NJ", name: "New Jersey" },
  "35": { abbr: "NM", name: "New Mexico" },
  "36": { abbr: "NY", name: "New York" },
  "37": { abbr: "NC", name: "North Carolina" },
  "38": { abbr: "ND", name: "North Dakota" },
  "39": { abbr: "OH", name: "Ohio" },
  "40": { abbr: "OK", name: "Oklahoma" },
  "41": { abbr: "OR", name: "Oregon" },
  "42": { abbr: "PA", name: "Pennsylvania" },
  "44": { abbr: "RI", name: "Rhode Island" },
  "45": { abbr: "SC", name: "South Carolina" },
  "46": { abbr: "SD", name: "South Dakota" },
  "47": { abbr: "TN", name: "Tennessee" },
  "48": { abbr: "TX", name: "Texas" },
  "49": { abbr: "UT", name: "Utah" },
  "50": { abbr: "VT", name: "Vermont" },
  "51": { abbr: "VA", name: "Virginia" },
  "53": { abbr: "WA", name: "Washington" },
  "54": { abbr: "WV", name: "West Virginia" },
  "55": { abbr: "WI", name: "Wisconsin" },
  "56": { abbr: "WY", name: "Wyoming" },
};

const STATE_NAME_TO_ABBR = Object.values(STATE_META).reduce((acc, item) => {
  acc[item.name.toLowerCase()] = item.abbr;
  acc[item.abbr.toLowerCase()] = item.abbr;
  return acc;
}, {});

const BATTLEGROUND_STATES = new Set(["AZ", "GA", "MI", "NC", "NV", "PA", "WI"]);

function normalizeStateCode(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  return STATE_NAME_TO_ABBR[raw] || "";
}

function modeledStateMetric(abbr) {
  const index = Object.values(STATE_META).findIndex((item) => item.abbr === abbr);
  const base = index < 0 ? 1 : index + 1;
  const battleground = BATTLEGROUND_STATES.has(abbr);

  return {
    state: abbr,
    source: "modeled",
    mission_count: 0,
    event_count: 0,
    impact_percentage: battleground ? 72 + (base % 12) : 48 + (base % 24),
    confidence_percentage: battleground ? 74 + (base % 14) : 58 + (base % 22),
    risk_percentage: battleground ? 48 + (base % 28) : 20 + (base % 26),
    readiness_percentage: battleground ? 66 + (base % 20) : 55 + (base % 28),
    status: battleground ? "watch" : "monitoring",
    titles: [],
  };
}

function stateFill(metric, selected = false) {
  if (selected) return "rgba(251,146,60,.92)";
  if (!metric) return "rgba(30,41,59,.88)";

  const risk = Math.max(0, Math.min(100, Number(metric.risk_percentage || 0)));
  const readiness = Math.max(0, Math.min(100, Number(metric.readiness_percentage || 0)));
  const confidence = Math.max(0, Math.min(100, Number(metric.confidence_percentage || 0)));

  if (risk >= 70) return "rgba(239,68,68,.82)";
  if (risk >= 45) return "rgba(245,158,11,.78)";
  if (readiness >= 75 || confidence >= 80) return "rgba(34,197,94,.72)";
  return "rgba(59,130,246,.66)";
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

function AgentStatus({ agent }) {
  const status = agent.status || "idle";
  const confidence = clamp(
    agent.confidence_percentage ??
      agent.confidence ??
      agent.score ??
      0
  );

  return (
    <div className={`cmd-agent-card is-${String(status).toLowerCase()}`}>
      <div className="cmd-agent-head">
        <span className={`cmd-status-dot ${String(status).toLowerCase()}`} />

        <div className="cmd-agent-title">
          <strong>{agent.name || agent.label || "Executive AI Agent"}</strong>
          <small>{agent.role || agent.specialty || "Executive Intelligence"}</small>
        </div>

        <Badge tone={tone(status)}>{labelize(status)}</Badge>
      </div>

      <p>
        {agent.note ||
          agent.description ||
          agent.current_activity ||
          "Standing by for executive command activity."}
      </p>

      <div className="cmd-agent-mission">
        <span>Current Mission</span>
        <strong>
          {agent.current_mission ||
            agent.mission_title ||
            agent.active_task ||
            "No active mission assigned"}
        </strong>
      </div>

      <div className="cmd-agent-metrics">
        <div>
          <span>Confidence</span>
          <strong>{pct(confidence)}</strong>
        </div>
        <div>
          <span>Queue</span>
          <strong>
            {number(
              agent.queue_count ??
                agent.pending_actions ??
                agent.open_tasks ??
                0
            )}
          </strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>
            {formatTime(
              agent.last_activity_at ||
                agent.updated_at ||
                agent.last_seen_at
            )}
          </strong>
        </div>
      </div>

      <div className="cmd-agent-confidence">
        <i style={{ width: `${confidence}%` }} />
      </div>
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
  riskFilter = "all",
}) {
  const stateMetrics = useMemo(() => {
    const map = {};

    for (const meta of Object.values(STATE_META)) {
      map[meta.abbr] = modeledStateMetric(meta.abbr);
    }

    for (const mission of missions) {
      const abbr = normalizeStateCode(
        mission.state_code ||
          mission.state ||
          mission.state_name ||
          mission.geographic_scope
      );

      if (!abbr || !map[abbr]) continue;

      const current = map[abbr];
      current.source = "live";
      current.mission_count += 1;
      current.impact_percentage = Math.max(
        current.impact_percentage,
        number(mission.impact_percentage)
      );
      current.confidence_percentage = Math.max(
        current.confidence_percentage,
        number(mission.confidence_percentage)
      );
      current.risk_percentage = Math.max(
        current.risk_percentage,
        number(mission.risk_percentage)
      );
      current.readiness_percentage = Math.max(
        current.readiness_percentage,
        100 - number(mission.risk_percentage)
      );
      current.status =
        number(mission.risk_percentage) >= 70
          ? "critical"
          : number(mission.risk_percentage) >= 45
            ? "watch"
            : "active";

      if (mission.title) current.titles.push(mission.title);
    }

    for (const event of timeline) {
      const abbr = normalizeStateCode(
        event.state_code || event.state || event.state_name
      );

      if (!abbr || !map[abbr]) continue;

      const current = map[abbr];
      current.event_count += 1;
      current.impact_percentage = Math.max(
        current.impact_percentage,
        number(event.impact_percentage)
      );
    }

    return map;
  }, [missions, timeline]);

  const selectedMetric = selectedState ? stateMetrics[selectedState] : null;

  const metricMatchesFilter = (metric) => {
    if (riskFilter === "all") return true;
    if (riskFilter === "critical") return metric.risk_percentage >= 70;
    if (riskFilter === "watch") {
      return metric.risk_percentage >= 45 && metric.risk_percentage < 70;
    }
    if (riskFilter === "operational") {
      return metric.risk_percentage < 45 && metric.readiness_percentage >= 70;
    }
    return true;
  };

  const nationalSummary = useMemo(() => {
    const values = Object.values(stateMetrics);
    return {
      critical: values.filter((item) => item.risk_percentage >= 70).length,
      watch: values.filter(
        (item) => item.risk_percentage >= 45 && item.risk_percentage < 70
      ).length,
      operational: values.filter(
        (item) => item.risk_percentage < 45 && item.readiness_percentage >= 70
      ).length,
      modeled: values.filter((item) => item.source === "modeled").length,
    };
  }, [stateMetrics]);

  return (
    <div className="cmd-geo-map-shell">
      <div className="cmd-geo-map-main">
        <div className="cmd-map-heading">
          <div>
            <span>National Executive Situation Map</span>
            <strong>
              {selectedState
                ? `${selectedState} Executive Posture`
                : "All 50 States + District of Columbia"}
            </strong>
          </div>

          <div className="cmd-map-summary">
            <Badge tone="danger">{nationalSummary.critical} Critical</Badge>
            <Badge tone="accent">{nationalSummary.watch} Watch</Badge>
            <Badge tone="active">{nationalSummary.operational} Operational</Badge>
            <Badge tone="info">{nationalSummary.modeled} Modeled</Badge>
            {riskFilter !== "all" ? (
              <Badge tone="accent">Filter: {labelize(riskFilter)}</Badge>
            ) : null}
          </div>
        </div>

        <div className="cmd-geo-map-canvas">
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
                          if (abbr) onSelectState(isSelected ? "" : abbr);
                        }}
                        style={{
                          default: {
                            fill:
                              riskFilter !== "all" && !metricMatchesFilter(metric)
                                ? "rgba(30,41,59,.32)"
                                : stateFill(metric, isSelected),
                            stroke: "rgba(226,232,240,.34)",
                            strokeWidth: 0.7,
                            outline: "none",
                            cursor: abbr ? "pointer" : "default",
                          },
                          hover: {
                            fill: isSelected
                              ? "rgba(251,146,60,.96)"
                              : "rgba(96,165,250,.84)",
                            stroke: "rgba(255,255,255,.78)",
                            strokeWidth: 1,
                            outline: "none",
                            cursor: abbr ? "pointer" : "default",
                          },
                          pressed: {
                            fill: "rgba(251,146,60,.96)",
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
        </div>

        <div className="cmd-map-legend-row">
          <span><i className="legend-danger" /> Critical / High Risk</span>
          <span><i className="legend-warning" /> Watch / Elevated</span>
          <span><i className="legend-active" /> Strong / Operational</span>
          <span><i className="legend-info" /> Monitoring / Modeled</span>
        </div>
      </div>

      <aside className="cmd-map-detail">
        <span className="cmd-map-detail-eyebrow">Selected Geography</span>
        <strong>{selectedState || "National"}</strong>

        {selectedMetric ? (
          <>
            <div className="cmd-map-detail-status">
              <Badge tone={tone(selectedMetric.status)}>
                {labelize(selectedMetric.status)}
              </Badge>
              <Badge tone={selectedMetric.source === "live" ? "active" : "info"}>
                {selectedMetric.source === "live"
                  ? "Live Mission Data"
                  : "Modeled National Baseline"}
              </Badge>
            </div>

            <div className="cmd-map-detail-grid">
              <div><span>Missions</span><strong>{selectedMetric.mission_count}</strong></div>
              <div><span>Events</span><strong>{selectedMetric.event_count}</strong></div>
              <div><span>Readiness</span><strong>{pct(selectedMetric.readiness_percentage)}</strong></div>
              <div><span>Impact</span><strong>{pct(selectedMetric.impact_percentage)}</strong></div>
              <div><span>Confidence</span><strong>{pct(selectedMetric.confidence_percentage)}</strong></div>
              <div><span>Risk</span><strong>{pct(selectedMetric.risk_percentage)}</strong></div>
            </div>

            <div className="cmd-map-mission-list">
              <span>Mission Coverage</span>
              {selectedMetric.titles.length ? (
                selectedMetric.titles.slice(0, 5).map((title) => (
                  <div key={title}>{title}</div>
                ))
              ) : (
                <p>
                  No live mission is attached. This state is showing a modeled
                  executive baseline until live mission or timeline data arrives.
                </p>
              )}
            </div>
          </>
        ) : (
          <p>
            Select any state to review its modeled or live executive posture,
            readiness, confidence, impact, and risk.
          </p>
        )}

        {selectedState ? (
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => onSelectState("")}
          >
            Reset National View
          </button>
        ) : null}
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

function buildFallbackAgents({ brief, missions, timeline, summary }) {
  const baseConfidence = clamp(
    brief?.ai_confidence_percentage ||
      summary?.aiConfidencePercentage ||
      78
  );

  const openApprovals = number(summary?.queuedApprovalActions);
  const missionCount = missions.length;
  const eventCount = timeline.length;

  return [
    {
      id: "executive-chief-of-staff",
      name: "Executive Chief of Staff",
      role: "Executive Orchestration",
      status: openApprovals > 0 ? "active" : "monitoring",
      note: "Coordinating executive priorities and leadership decisions.",
      current_mission: missions[0]?.title || "National command posture review",
      confidence_percentage: baseConfidence,
      queue_count: openApprovals,
      updated_at: new Date().toISOString(),
      source: "derived",
    },
    {
      id: "campaign-strategist",
      name: "Campaign Strategist",
      role: "Path-to-Victory Modeling",
      status: missionCount > 0 ? "thinking" : "idle",
      note: "Modeling mission impact, state posture, and strategic sequencing.",
      current_mission: missions[0]?.mission_summary || "Awaiting mission package",
      confidence_percentage: Math.max(0, baseConfidence - 4),
      queue_count: missionCount,
      updated_at: new Date().toISOString(),
      source: "derived",
    },
    {
      id: "polling-analyst",
      name: "Polling & Data Analyst",
      role: "Trend Intelligence",
      status: eventCount > 0 ? "processing" : "monitoring",
      note: "Reviewing timeline events and national trend pressure.",
      current_mission: "National state posture analysis",
      confidence_percentage: Math.max(0, baseConfidence - 2),
      queue_count: eventCount,
      updated_at: new Date().toISOString(),
      source: "derived",
    },
    {
      id: "fundraising-director",
      name: "Fundraising Director",
      role: "Revenue Intelligence",
      status: "active",
      note: "Tracking financial readiness and resource pressure.",
      current_mission: "Executive revenue readiness",
      confidence_percentage: Math.max(0, baseConfidence - 6),
      queue_count: 0,
      updated_at: new Date().toISOString(),
      source: "derived",
    },
    {
      id: "communications-director",
      name: "Communications Director",
      role: "Narrative Command",
      status: eventCount > 3 ? "active" : "idle",
      note: "Monitoring narrative shifts and escalation triggers.",
      current_mission: "National narrative watch",
      confidence_percentage: Math.max(0, baseConfidence - 8),
      queue_count: Math.min(eventCount, 9),
      updated_at: new Date().toISOString(),
      source: "derived",
    },
    {
      id: "rapid-response",
      name: "Rapid Response Director",
      role: "Threat Response",
      status:
        number(brief?.execution_risk_percentage) >= 60
          ? "alert"
          : "monitoring",
      note: "Scanning high-risk signals and executive escalation conditions.",
      current_mission: "Threat and escalation watch",
      confidence_percentage: baseConfidence,
      queue_count: openApprovals,
      updated_at: new Date().toISOString(),
      source: "derived",
    },
    {
      id: "mailops-director",
      name: "MailOps Director",
      role: "Production Intelligence",
      status: "active",
      note: "Reviewing production capacity and timing dependencies.",
      current_mission: "Operational delivery readiness",
      confidence_percentage: Math.max(0, baseConfidence - 5),
      queue_count: 0,
      updated_at: new Date().toISOString(),
      source: "derived",
    },
    {
      id: "compliance-advisor",
      name: "Compliance Advisor",
      role: "Risk & Controls",
      status: openApprovals > 0 ? "monitoring" : "idle",
      note: "Scanning approval requirements, controls, and escalation points.",
      current_mission: "Executive approval review",
      confidence_percentage: Math.max(0, baseConfidence - 3),
      queue_count: openApprovals,
      updated_at: new Date().toISOString(),
      source: "derived",
    },
  ];
}


const AGENT_PROMPTS = {
  "executive-chief-of-staff": [
    "Give me today's executive briefing.",
    "What should leadership decide next?",
    "Prioritize our top three operational risks.",
  ],
  "campaign-strategist": [
    "Build a 30-day strategic plan.",
    "What is our strongest path to victory?",
    "Which states deserve immediate attention?",
  ],
  "polling-analyst": [
    "Explain the most important trend in the current data.",
    "Which voter groups should we watch?",
    "Where is turnout risk increasing?",
  ],
  "fundraising-director": [
    "Build a 30-day fundraising plan.",
    "What donor actions should we prioritize?",
    "Where is revenue risk highest?",
  ],
  "communications-director": [
    "Draft a message framework.",
    "What narrative should we lead with?",
    "Prepare a rapid press response outline.",
  ],
  "rapid-response": [
    "What threat requires immediate response?",
    "Build a 24-hour rapid response plan.",
    "How should we answer an opposition attack?",
  ],
  "mailops-director": [
    "Review MailOps readiness.",
    "What production risks should we address?",
    "Build a direct mail execution checklist.",
  ],
  "compliance-advisor": [
    "What compliance risks should we review?",
    "Create an approval and recordkeeping checklist.",
    "What should be escalated to counsel?",
  ],
};

function toRealtimeAgentKey(agent = {}) {
  const key = normalizeAgentKey(agent);
  return key.replace(/-/g, "_") || "executive_chief_of_staff";
}

function normalizeAgentKey(agent = {}) {
  return (
    agent.key ||
    agent.id ||
    String(agent.name || agent.label || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

async function askExecutiveAgent(payload = {}) {
  const question = String(
    payload.question || payload.prompt || ""
  ).trim();

  if (!question) {
    throw new Error("An executive intelligence question is required.");
  }

  const result = await askExecutiveIntelligence({
    ...payload,
    question,
    prompt: payload.prompt || question,
  });

  return result?.data || result;
}

function extractAgentAnswer(result) {
  const briefing = result?.briefing || result?.data?.briefing || {};

  return (
    result?.answer ||
    result?.executive_summary ||
    result?.strategic_summary ||
    result?.summary ||
    briefing?.answer ||
    briefing?.executive_summary ||
    briefing?.strategic_summary ||
    briefing?.summary ||
    result?.message?.content ||
    result?.message ||
    result?.data?.answer ||
    result?.data?.executive_summary ||
    result?.data?.strategic_summary ||
    result?.data?.summary ||
    result?.data?.message?.content ||
    "The Executive Intelligence Orchestrator returned no readable response."
  );
}

function extractAgentSources(result) {
  const sources =
    result?.sources ||
    result?.evidence ||
    result?.citations ||
    result?.briefing?.sources ||
    result?.briefing?.evidence ||
    result?.data?.sources ||
    result?.data?.evidence ||
    result?.data?.citations ||
    result?.data?.briefing?.sources ||
    result?.data?.briefing?.evidence ||
    [];

  return Array.isArray(sources) ? sources : [];
}

function extractAgentConfidence(result, fallback = 0) {
  const value =
    result?.confidence_percentage ??
    result?.confidence ??
    result?.briefing?.confidence_percentage ??
    result?.briefing?.confidence ??
    result?.data?.confidence_percentage ??
    result?.data?.confidence ??
    result?.data?.briefing?.confidence_percentage ??
    result?.data?.briefing?.confidence ??
    fallback;

  return clamp(value);
}


function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function chooseFemaleVoice(voices = []) {
  const preferredNames = [
    "Microsoft Aria",
    "Microsoft Jenny",
    "Samantha",
    "Victoria",
    "Karen",
    "Moira",
    "Tessa",
    "Zira",
    "Google US English",
    "Google UK English Female",
  ];

  for (const preferred of preferredNames) {
    const match = voices.find((voice) =>
      String(voice.name || "")
        .toLowerCase()
        .includes(preferred.toLowerCase())
    );
    if (match) return match;
  }

  const femaleHint = voices.find((voice) =>
    /(female|woman|aria|jenny|samantha|victoria|karen|zira|moira|tessa)/i.test(
      `${voice.name || ""} ${voice.voiceURI || ""}`
    )
  );

  if (femaleHint) return femaleHint;

  return (
    voices.find((voice) => /^en(-|_)/i.test(voice.lang || "")) ||
    voices[0] ||
    null
  );
}

function stripSpeechText(value = "") {
  return String(value || "")
    .replace(/[#*_>`~]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}


async function listExecutiveAiThreads() {
  if (typeof api?.listAiCampaignCopilotThreads === "function") {
    return api.listAiCampaignCopilotThreads();
  }

  const response = await api.get("/ai-campaign-copilot/threads");
  return response?.data || response;
}

async function readExecutiveAiThread(threadId) {
  if (typeof api?.getAiCampaignCopilotThread === "function") {
    return api.getAiCampaignCopilotThread(threadId);
  }

  const response = await api.get(`/ai-campaign-copilot/threads/${threadId}`);
  return response?.data || response;
}

function downloadConversationText({ messages, title, extension = "txt" }) {
  const body = messages
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "You"
          : message.agent || "Executive AI";
      return `${speaker}\n${message.content}\n`;
    })
    .join("\n");

  const blob = new Blob([`${title}\n\n${body}`], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function printConversation({ messages, title }) {
  const safeTitle = String(title || "Executive AI Briefing")
    .replace(/[<>&]/g, "");
  const safeBody = messages
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "You"
          : message.agent || "Executive AI";
      const content = String(message.content || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />");

      return `
        <section style="margin-bottom:20px;padding:16px;border:1px solid #dbe3ef;border-radius:12px">
          <div style="font-weight:700;margin-bottom:8px">${speaker}</div>
          <div style="line-height:1.6">${content}</div>
        </section>
      `;
    })
    .join("");

  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${safeTitle}</title>
        <meta charset="utf-8" />
      </head>
      <body style="font-family:Arial,sans-serif;margin:40px;color:#111827">
        <h1>${safeTitle}</h1>
        <p>Generated by VoterSpheres Executive AI</p>
        ${safeBody}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}


const VOICE_NAV_ROUTES = [
  { phrases: ["dashboard", "home"], path: "/dashboard", label: "Dashboard" },
  { phrases: ["command center"], path: "/command-center", label: "Command Center" },
  { phrases: ["executive operations", "executive operations map"], path: "/executive-operations-map", label: "Executive Operations" },
  { phrases: ["state operations"], path: "/state-operations", label: "State Operations" },
  { phrases: ["election map", "forecast"], path: "/election-map", label: "Election Map" },
  { phrases: ["donor network", "donors"], path: "/donor-network", label: "Donor Network" },
  { phrases: ["vendor network", "vendors"], path: "/vendors", label: "Vendor Network" },
  { phrases: ["crm", "campaign crm"], path: "/crm", label: "Campaign CRM" },
  { phrases: ["mail ops", "mailops"], path: "/mailops", label: "MailOps" },
  { phrases: ["reports", "intelligence reports"], path: "/reports", label: "Intelligence Reports" },
  { phrases: ["digital twin"], path: "/national-political-digital-twin", label: "National Political Digital Twin" },
  { phrases: ["autonomous operations"], path: "/autonomous-campaign-operations", label: "Autonomous Operations" },
];

function normalizeVoiceCommand(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findSpokenState(command = "") {
  const normalized = ` ${normalizeVoiceCommand(command)} `;

  for (const item of Object.values(STATE_META)) {
    if (
      normalized.includes(` ${item.name.toLowerCase()} `) ||
      normalized.includes(` ${item.abbr.toLowerCase()} `)
    ) {
      return item.abbr;
    }
  }

  return "";
}

function matchVoiceRoute(command = "") {
  const normalized = normalizeVoiceCommand(command);

  return (
    VOICE_NAV_ROUTES.find((route) =>
      route.phrases.some((phrase) => normalized.includes(phrase))
    ) || null
  );
}

function isVoiceNavigationCommand(command = "") {
  const normalized = normalizeVoiceCommand(command);

  return [
    "open ",
    "go to ",
    "navigate to ",
    "show ",
    "highlight ",
    "select ",
    "reset map",
    "national view",
    "new conversation",
    "clear chat",
    "team consult",
    "single agent",
    "voice off",
    "voice on",
    "stop speaking",
    "generate mission",
    "refresh command platform",
  ].some((phrase) => normalized.includes(phrase));
}

function ExecutiveAgentWorkspace({
  agents,
  missions,
  selectedAgentKey,
  setSelectedAgentKey,
  onVoiceCommand,
  executiveContext,
  textOnly = false,
}) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      agent: "Executive Chief of Staff",
      content:
        "Executive AI Team is online. Select a specialist or use Team Consult to coordinate a cross-functional response.",
      created_at: new Date().toISOString(),
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [asking, setAsking] = useState(false);
  const [teamMode, setTeamMode] = useState(false);
  const [error, setError] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [conversationTitle, setConversationTitle] = useState("Executive AI Consultation");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [pinnedThreadIds, setPinnedThreadIds] = useState([]);
  const [savedBriefings, setSavedBriefings] = useState([]);
  const [lastVoiceCommand, setLastVoiceCommand] = useState("");
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [wakePhraseEnabled, setWakePhraseEnabled] = useState(false);
  const [wakePhrase, setWakePhrase] = useState("executive");
  const [autoSubmitVoice, setAutoSubmitVoice] = useState(true);
  const [conversationStatus, setConversationStatus] = useState("ready");
  const [streamingText, setStreamingText] = useState("");




  const recognitionRef = useRef(null);
  const autoRestartTimerRef = useRef(null);
  const streamingTimerRef = useRef(null);

  useEffect(() => {
    const recognitionCtor = getSpeechRecognition();
    const speechAvailable =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance !== "undefined";

    setRecognitionSupported(Boolean(recognitionCtor));
    setVoiceSupported(Boolean(speechAvailable));

    if (speechAvailable) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices() || [];
        setVoices(available);

        const preferred = chooseFemaleVoice(available);
        if (preferred && !selectedVoiceName) {
          setSelectedVoiceName(preferred.name);
        }
      };

      loadVoices();
      window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
      };
    }

    return undefined;
  }, [selectedVoiceName]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      window.clearTimeout(autoRestartTimerRef.current);
      window.clearInterval(streamingTimerRef.current);

      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopSpeaking() {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }

  function speakAnswer(text) {
    if (!voiceEnabled || !voiceSupported) return;

    const cleaned = stripSpeechText(text);
    if (!cleaned) return;

    stopSpeaking();

    const utterance = new window.SpeechSynthesisUtterance(cleaned);
    const selectedVoice =
      voices.find((voice) => voice.name === selectedVoiceName) ||
      chooseFemaleVoice(voices);

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = selectedVoice?.lang || "en-US";
    utterance.rate = 0.96;
    utterance.pitch = 1.04;
    utterance.volume = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  function stopListening(options = {}) {
    recognitionRef.current?.stop?.();
    setListening(false);
    setConversationStatus("ready");

    if (!options.preserveHandsFree) {
      setHandsFreeMode(false);
    }
  }

  function startListening(options = {}) {
    const Recognition = getSpeechRecognition();

    if (!Recognition) {
      setError(
        "Speech recognition is not available in this browser. Use Microsoft Edge or Google Chrome."
      );
      return;
    }

    const continuous = Boolean(options.continuous || handsFreeMode);

    if (speaking) {
      stopSpeaking();
    }

    window.clearTimeout(autoRestartTimerRef.current);
    setError("");
    setLiveTranscript("");
    setConversationStatus("listening");

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setConversationStatus("listening");
      setLiveTranscript("Listening…");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const transcript = event.results[index][0]?.transcript || "";

        if (event.results[index].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      const nextTranscript = (finalText || interim).trim();
      setLiveTranscript(nextTranscript);

      if (!finalText.trim()) return;

      let spoken = finalText.trim();

      if (wakePhraseEnabled) {
        const normalizedWake = normalizeVoiceCommand(wakePhrase);
        const normalizedSpoken = normalizeVoiceCommand(spoken);

        if (!normalizedSpoken.startsWith(normalizedWake)) {
          setLiveTranscript(`Waiting for wake phrase “${wakePhrase}”…`);
          return;
        }

        spoken = spoken
          .replace(new RegExp(`^${wakePhrase}\\s*`, "i"), "")
          .trim();

        if (!spoken) return;
      }

      setLastVoiceCommand(spoken);

      if (
        typeof onVoiceCommand === "function" &&
        isVoiceNavigationCommand(spoken)
      ) {
        const handled = onVoiceCommand(spoken, {
          startNewConversation,
          clearConversationScreen,
          setTeamMode,
          setVoiceEnabled,
          stopSpeaking,
        });

        if (handled) {
          setPrompt("");
          setConversationStatus("ready");
          return;
        }
      }

      setPrompt(spoken);

      if (autoSubmitVoice) {
        window.setTimeout(() => submitQuestion(spoken), 100);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setLiveTranscript("");

      if (
        event.error !== "no-speech" &&
        event.error !== "aborted"
      ) {
        setError(
          `Microphone error: ${labelize(event.error || "unknown")}`
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
      setLiveTranscript("");

      if (handsFreeMode && !asking && !speaking) {
        autoRestartTimerRef.current = window.setTimeout(() => {
          startListening({ continuous: true });
        }, 650);
      } else if (!asking && !speaking) {
        setConversationStatus("ready");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }


  const welcomeMessage = useMemo(
    () => ({
      id: "welcome",
      role: "assistant",
      agent: "Executive Chief of Staff",
      content:
        "Executive AI Team is online. Select a specialist or use Team Consult to coordinate a cross-functional response.",
      created_at: new Date().toISOString(),
    }),
    []
  );

  const loadConversationHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const result = await listExecutiveAiThreads();
      const threads =
        result?.threads ||
        result?.results ||
        result?.data?.threads ||
        [];

      setConversationHistory(Array.isArray(threads) ? threads : []);
    } catch (historyError) {
      setError(
        historyError?.response?.data?.error ||
          historyError?.message ||
          "Failed to load conversation history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (historyOpen) {
      loadConversationHistory();
    }
  }, [historyOpen, loadConversationHistory]);

  function clearConversationScreen() {
    stopSpeaking();
    stopListening();
    setMessages([welcomeMessage]);
    setPrompt("");
    setLiveTranscript("");
    setError("");
  }

  function startNewConversation() {
    clearConversationScreen();
    setThreadId(null);
    setConversationTitle("Executive AI Consultation");
  }

  function renameConversation() {
    const nextTitle = window.prompt(
      "Rename this executive conversation:",
      conversationTitle
    );

    if (nextTitle?.trim()) {
      setConversationTitle(nextTitle.trim());
    }
  }

  function togglePinnedThread(threadIdValue) {
    setPinnedThreadIds((current) =>
      current.includes(threadIdValue)
        ? current.filter((item) => item !== threadIdValue)
        : [...current, threadIdValue]
    );
  }

  function deleteConversationFromHistory(threadIdValue) {
    const confirmed = window.confirm(
      "Remove this conversation from the visible history list?"
    );

    if (!confirmed) return;

    setConversationHistory((current) =>
      current.filter((item) => String(item.id) !== String(threadIdValue))
    );

    if (String(threadId) === String(threadIdValue)) {
      startNewConversation();
    }
  }

  function saveCurrentBriefing() {
    const saved = {
      id: `saved-${Date.now()}`,
      title: conversationTitle,
      thread_id: threadId,
      messages: [...messages],
      saved_at: new Date().toISOString(),
    };

    setSavedBriefings((current) => [saved, ...current]);
    setError("");
  }

  async function openConversation(thread) {
    try {
      setHistoryLoading(true);
      const result = await readExecutiveAiThread(thread.id);
      const threadMessages =
        result?.messages ||
        result?.data?.messages ||
        [];

      if (Array.isArray(threadMessages) && threadMessages.length) {
        setMessages(
          threadMessages.map((message, index) => ({
            id: message.id || `history-${index}`,
            role: message.role || "assistant",
            agent:
              message.agent_label ||
              message.agent ||
              (message.role === "user" ? "You" : "Executive AI"),
            content: message.content || message.message || "",
            sources: message.sources || [],
            confidence: message.confidence || 0,
            created_at:
              message.created_at ||
              message.updated_at ||
              new Date().toISOString(),
          }))
        );
      } else {
        setMessages([welcomeMessage]);
      }

      setThreadId(thread.id);
      setConversationTitle(
        thread.title ||
          thread.name ||
          `Executive AI Conversation ${thread.id}`
      );
      setHistoryOpen(false);
      stopSpeaking();
    } catch (threadError) {
      setError(
        threadError?.response?.data?.error ||
          threadError?.message ||
          "Failed to open conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  const filteredConversationHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return [...conversationHistory]
      .filter((thread) => {
        if (!query) return true;

        return String(
          thread.title ||
            thread.name ||
            thread.summary ||
            thread.id ||
            ""
        )
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const pinnedA = pinnedThreadIds.includes(a.id) ? 1 : 0;
        const pinnedB = pinnedThreadIds.includes(b.id) ? 1 : 0;

        if (pinnedA !== pinnedB) return pinnedB - pinnedA;

        return (
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime()
        );
      });
  }, [conversationHistory, historySearch, pinnedThreadIds]);

  const selectedAgent =
    agents.find((agent) => normalizeAgentKey(agent) === selectedAgentKey) ||
    agents[0] ||
    null;

  const selectedKey = normalizeAgentKey(selectedAgent);
  const suggestions =
    AGENT_PROMPTS[selectedKey] ||
    [
      "What should we do next?",
      "Summarize the biggest risk.",
      "Build an executive action plan.",
    ];

  function streamAssistantText(fullText, onComplete) {
    window.clearInterval(streamingTimerRef.current);
    setStreamingText("");
    setConversationStatus("streaming");

    const words = String(fullText || "").split(/\s+/);
    let index = 0;

    streamingTimerRef.current = window.setInterval(() => {
      index += 1;
      setStreamingText(words.slice(0, index).join(" "));

      if (index >= words.length) {
        window.clearInterval(streamingTimerRef.current);
        setStreamingText("");
        onComplete?.();
      }
    }, 24);
  }

  async function submitQuestion(value = prompt) {
    const question = String(value || "").trim();
    if (!question || asking) return;

    setError("");
    setPrompt("");
    setAsking(true);
    setConversationStatus("thinking");
    stopListening({ preserveHandsFree: handsFreeMode });

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const activeMission = missions[0] || null;
      const requestPrompt = teamMode
        ? `Coordinate an executive team consultation. Have the Executive Chief of Staff synthesize perspectives from strategy, polling, fundraising, communications, rapid response, MailOps, and compliance.\n\nQuestion: ${question}`
        : question;

      const result = await askExecutiveAgent({
        question: requestPrompt,
        prompt: requestPrompt,
        thread_id: threadId || null,
        agent: teamMode ? "executive_chief_of_staff" : selectedKey.replace(/-/g, "_"),
        workspace_id: activeMission?.workspace_id || 1,
        candidate: activeMission?.candidate_name || null,
        state:
          executiveContext?.selected_state ||
          activeMission?.state_code ||
          activeMission?.state_name ||
          null,
        office: activeMission?.office || activeMission?.office_name || null,
        cycle: activeMission?.cycle || null,
        locality: activeMission?.locality || activeMission?.county_name || null,
        limit: 12,
        executive_context: {
          mission_id: activeMission?.id || null,
          mission_title: activeMission?.title || null,
          geographic_scope:
            activeMission?.state_name ||
            activeMission?.geographic_scope ||
            "National",
          consultation_mode: teamMode ? "team" : "single_agent",
          national_readiness_percentage:
            executiveContext?.national_readiness_percentage || null,
          execution_risk_percentage:
            executiveContext?.execution_risk_percentage || null,
          selected_state:
            executiveContext?.selected_state || null,
          map_risk_filter:
            executiveContext?.map_risk_filter || "all",
        },
      });

      const nextThreadId =
        result?.thread_id ||
        result?.data?.thread_id ||
        threadId;

      if (nextThreadId) setThreadId(nextThreadId);

      const assistantAnswer = extractAgentAnswer(result);

      streamAssistantText(assistantAnswer, () => {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            agent: teamMode
              ? "Executive AI Team"
              : selectedAgent?.name ||
                selectedAgent?.label ||
                "Executive AI Agent",
            content: assistantAnswer,
            sources: extractAgentSources(result),
            confidence: extractAgentConfidence(
              result,
              selectedAgent?.confidence_percentage ?? 0
            ),
            created_at: new Date().toISOString(),
          },
        ]);

        speakAnswer(assistantAnswer);
      });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Executive AI consultation failed.";

      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          agent: "Executive AI System",
          content:
            "I could not complete the consultation. Confirm the Build 4 Executive Intelligence Orchestrator route is online, authentication is valid, and the configured intelligence providers are available.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div
      className={
        textOnly
          ? "cmd-consult-shell is-text-only"
          : "cmd-consult-shell"
      }
    >
      <aside className="cmd-consult-agents">
        <div className="cmd-consult-mode">
          <button
            type="button"
            className={!teamMode ? "is-active" : ""}
            onClick={() => setTeamMode(false)}
          >
            Single Agent
          </button>
          <button
            type="button"
            className={teamMode ? "is-active" : ""}
            onClick={() => setTeamMode(true)}
          >
            Team Consult
          </button>
        </div>

        <div className="cmd-voice-command-guide">
          <span>Voice Navigation Examples</span>
          <small>“Open Georgia”</small>
          <small>“Show high-risk states”</small>
          <small>“Go to Donor Network”</small>
          <small>“Start team consult”</small>
          <small>“Clear chat”</small>
        </div>

        <div className="cmd-consult-agent-list">
          {agents.map((agent) => {
            const key = normalizeAgentKey(agent);
            const active = key === selectedAgentKey;

            return (
              <button
                key={key}
                type="button"
                className={active ? "is-active" : ""}
                onClick={() => {
                  setSelectedAgentKey(key);
                  setTeamMode(false);
                }}
              >
                <span className={`cmd-status-dot ${String(agent.status || "idle").toLowerCase()}`} />
                <div>
                  <strong>{agent.name || agent.label}</strong>
                  <small>{agent.role || agent.specialty || "Executive Intelligence"}</small>
                </div>
              </button>
            );
          })}
        </div>

        <div className="cmd-consult-suggestions">
          <span>Suggested Questions</span>
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => submitQuestion(item)}
              disabled={asking}
            >
              {item}
            </button>
          ))}
        </div>
      </aside>

      <div className="cmd-consult-main">
        <div className="cmd-consult-header">
  <div className="cmd-conversation-heading">
    <span>
      {teamMode
        ? "Executive Team Consultation"
        : "Active AI Advisor"}
    </span>

    <strong>{conversationTitle}</strong>

    <small>
      {teamMode
        ? "Executive AI Team"
        : selectedAgent?.name ||
          selectedAgent?.label ||
          "Executive AI Agent"}
    </small>
  </div>

  <div className="cmd-consult-header-tools">
    <div className="cmd-conversation-toolbar">
      <button
        type="button"
        onClick={startNewConversation}
      >
        New Conversation
      </button>

      <button
        type="button"
        onClick={clearConversationScreen}
      >
        Clear Chat
      </button>

      <button
        type="button"
        onClick={renameConversation}
      >
        Rename
      </button>

      <button
        type="button"
        onClick={saveCurrentBriefing}
      >
        Save Briefing
      </button>

      <button
        type="button"
        onClick={() =>
          downloadConversationText({
            messages,
            title: conversationTitle,
            extension: "doc",
          })
        }
      >
        Export Word
      </button>

      <button
        type="button"
        onClick={() =>
          printConversation({
            messages,
            title: conversationTitle,
          })
        }
      >
        Export PDF
      </button>

      <button
        type="button"
        className={historyOpen ? "is-active" : ""}
        onClick={() =>
          setHistoryOpen((value) => !value)
        }
      >
        History
      </button>
    </div>

    <div className="cmd-voice-toolbar">
      <div className="vs-chip-row">
        <Badge tone="active">
          LLM Connected
        </Badge>

        <Badge tone={teamMode ? "accent" : "info"}>
          {teamMode
            ? "Multi-Agent Synthesis"
            : "Specialist Mode"}
        </Badge>

        <Badge
          tone={
            recognitionSupported
              ? "active"
              : "danger"
          }
        >
          {recognitionSupported
            ? "Microphone Ready"
            : "No Mic Support"}
        </Badge>

        <Badge
          tone={
            conversationStatus === "speaking"
              ? "accent"
              : conversationStatus === "thinking" ||
                  conversationStatus === "streaming"
                ? "warning"
                : "active"
          }
        >
          {labelize(conversationStatus)}
        </Badge>
      </div>

      <div className="cmd-voice-controls">
        <select
          value={selectedVoiceName}
          onChange={(event) =>
            setSelectedVoiceName(event.target.value)
          }
          disabled={!voiceSupported}
          aria-label="Select AI voice"
        >
          {voices.map((voice) => (
            <option
              key={`${voice.name}-${voice.lang}`}
              value={voice.name}
            >
              {voice.name} · {voice.lang}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={
            voiceEnabled ? "is-active" : ""
          }
          onClick={() => {
            setVoiceEnabled((value) => !value);

            if (voiceEnabled) {
              stopSpeaking();
            }
          }}
          disabled={!voiceSupported}
        >
          {voiceEnabled
            ? "Voice On"
            : "Voice Off"}
        </button>

        <button
          type="button"
          className={handsFreeMode ? "is-active" : ""}
          onClick={() => {
            const next = !handsFreeMode;
            setHandsFreeMode(next);

            if (next) {
              startListening({ continuous: true });
            } else {
              stopListening();
            }
          }}
          disabled={!recognitionSupported}
        >
          {handsFreeMode ? "Hands-Free On" : "Hands-Free Off"}
        </button>

        <button
          type="button"
          className={wakePhraseEnabled ? "is-active" : ""}
          onClick={() =>
            setWakePhraseEnabled((value) => !value)
          }
          disabled={!recognitionSupported}
        >
          {wakePhraseEnabled
            ? `Wake: ${wakePhrase}`
            : "Wake Phrase Off"}
        </button>

        {speaking ? (
          <button
            type="button"
            onClick={stopSpeaking}
          >
            Interrupt AI
          </button>
        ) : null}
      </div>

      <div className="cmd-v3-settings">
        <label>
          <span>Wake Phrase</span>
          <input
            value={wakePhrase}
            onChange={(event) =>
              setWakePhrase(event.target.value)
            }
            disabled={!wakePhraseEnabled}
          />
        </label>

        <label className="cmd-v3-check">
          <input
            type="checkbox"
            checked={autoSubmitVoice}
            onChange={(event) =>
              setAutoSubmitVoice(event.target.checked)
            }
          />
          Auto-send spoken questions
        </label>
      </div>
    </div>
  </div>
</div>

{historyOpen ? (
          <div className="cmd-history-drawer">
            <div className="cmd-history-head">
              <div>
                <span>Conversation History</span>
                <strong>{conversationHistory.length} Conversations</strong>
              </div>

              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
              >
                Close
              </button>
            </div>

            <input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search conversations..."
            />

            {historyLoading ? (
              <div className="cmd-history-empty">Loading conversations…</div>
            ) : filteredConversationHistory.length ? (
              <div className="cmd-history-list">
                {filteredConversationHistory.map((thread) => (
                  <div key={thread.id} className="cmd-history-item">
                    <button
                      type="button"
                      className="cmd-history-open"
                      onClick={() => openConversation(thread)}
                    >
                      <strong>
                        {thread.title ||
                          thread.name ||
                          `Conversation ${thread.id}`}
                      </strong>
                      <small>
                        {thread.updated_at || thread.created_at
                          ? new Date(
                              thread.updated_at || thread.created_at
                            ).toLocaleString()
                          : "Saved conversation"}
                      </small>
                    </button>

                    <div>
                      <button
                        type="button"
                        className={
                          pinnedThreadIds.includes(thread.id)
                            ? "is-active"
                            : ""
                        }
                        onClick={() => togglePinnedThread(thread.id)}
                      >
                        {pinnedThreadIds.includes(thread.id)
                          ? "Pinned"
                          : "Pin"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteConversationFromHistory(thread.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cmd-history-empty">
                No saved conversations found.
              </div>
            )}

            {savedBriefings.length ? (
              <div className="cmd-saved-briefings">
                <span>Saved This Session</span>
                {savedBriefings.map((briefing) => (
                  <button
                    key={briefing.id}
                    type="button"
                    onClick={() => {
                      setMessages(briefing.messages);
                      setThreadId(briefing.thread_id || null);
                      setConversationTitle(briefing.title);
                      setHistoryOpen(false);
                    }}
                  >
                    <strong>{briefing.title}</strong>
                    <small>
                      {new Date(briefing.saved_at).toLocaleString()}
                    </small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

        <div className="cmd-consult-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`cmd-consult-message is-${message.role}`}
            >
              <div className="cmd-consult-message-head">
                <strong>
                  {message.role === "user"
                    ? "You"
                    : message.agent || "Executive AI"}
                </strong>
                <span>{formatTime(message.created_at)}</span>
              </div>

              <p>{message.content}</p>

              {message.role === "assistant" ? (
                <div className="cmd-consult-message-meta">
                  {message.confidence ? (
                    <Badge tone="active">
                      Confidence {pct(message.confidence)}
                    </Badge>
                  ) : null}

                  {arr(message.sources).slice(0, 4).map((source) => (
                    <Badge key={String(source)} tone="info">
                      {typeof source === "string"
                        ? source
                        : source?.label || source?.name || "Source"}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {streamingText ? (
            <div className="cmd-consult-message is-assistant cmd-streaming-message">
              <div className="cmd-consult-message-head">
                <strong>
                  {teamMode
                    ? "Executive AI Team"
                    : selectedAgent?.name ||
                      selectedAgent?.label ||
                      "Executive AI"}
                </strong>
                <span>Streaming</span>
              </div>
              <p>{streamingText}</p>
            </div>
          ) : null}

          {asking && !streamingText ? (
            <div className="cmd-consult-thinking">
              <span className="cmd-status-dot processing" />
              Executive AI is analyzing the request…
            </div>
          ) : null}
        </div>

        <form
          className="cmd-consult-composer"
          onSubmit={(event) => {
            event.preventDefault();
            submitQuestion();
          }}
        >
          <div className="cmd-voice-capture">
            <button
              type="button"
              className={listening ? "cmd-mic-button is-listening" : "cmd-mic-button"}
              onClick={listening ? () => stopListening() : () => startListening({ continuous: handsFreeMode })}
              disabled={!recognitionSupported || (asking && !streamingText)}
              aria-label={listening ? "Stop listening" : "Start microphone"}
            >
              <span className="cmd-mic-icon">{listening ? "■" : "🎤"}</span>
              <span>
                <strong>
                  {speaking
                    ? "Tap to Interrupt and Speak"
                    : listening
                      ? "Listening…"
                      : handsFreeMode
                        ? "Hands-Free Voice Session"
                        : "Speak to Executive AI"}
                </strong>
                <small>
                  {listening
                    ? liveTranscript || "Say your political question now."
                    : "Ask political questions or say commands like “open Georgia,” “show high-risk states,” or “go to Donor Network.”"}
                </small>
              </span>
            </button>

            {lastVoiceCommand ? (
              <div className="cmd-last-voice-command">
                Last voice command: <strong>{lastVoiceCommand}</strong>
              </div>
            ) : null}
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              teamMode
                ? "Ask the executive team to collaborate on a decision…"
                : `Ask ${selectedAgent?.name || "the selected AI agent"}…`
            }
            rows={4}
          />

          <div>
            <span>
              {threadId
                ? `Conversation thread ${threadId} · Voice replies ${voiceEnabled ? "enabled" : "disabled"}`
                : `A new secure executive conversation will be created · Voice replies ${voiceEnabled ? "enabled" : "disabled"}.`}
            </span>

            <button
              type="submit"
              className="vs-button vs-button-primary"
              disabled={asking || !prompt.trim()}
            >
              {asking ? "Consulting…" : teamMode ? "Consult Executive Team" : "Ask Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UnifiedExecutiveAIConsole({
  agents,
  missions,
  selectedAgentKey,
  setSelectedAgentKey,
  onVoiceCommand,
  executiveContext,
  workspaceId = 1,
}) {
  const [mode, setMode] = useState("voice");

  const activeAgent =
    agents.find(
      (agent) => normalizeAgentKey(agent) === selectedAgentKey
    ) ||
    agents[0] ||
    {};

  return (
    <div className="cmd-unified-ai-console">
      <div className="cmd-unified-ai-header">
        <div>
          <span>Unified Executive Intelligence Workspace</span>
          <strong>Executive AI Command Center</strong>
          <p>
            Use one advisor across realtime voice, executive chat,
            team consultation, saved briefings, and conversation history.
          </p>
        </div>

        <div className="cmd-unified-ai-status">
          <Badge tone="active">AI Online</Badge>
          <Badge tone="accent">
            {activeAgent.name || "Executive Chief of Staff"}
          </Badge>
        </div>
      </div>

      <div className="cmd-unified-ai-tabs" role="tablist">
        <button
          type="button"
          className={mode === "voice" ? "is-active" : ""}
          onClick={() => setMode("voice")}
          role="tab"
          aria-selected={mode === "voice"}
        >
          <span>Realtime Voice</span>
          <small>Natural full-duplex WebRTC conversation</small>
        </button>

        <button
          type="button"
          className={mode === "chat" ? "is-active" : ""}
          onClick={() => setMode("chat")}
          role="tab"
          aria-selected={mode === "chat"}
        >
          <span>Executive Chat</span>
          <small>Long-form analysis, team consult, history, and export</small>
        </button>
      </div>

      <div className="cmd-unified-ai-body">
        {mode === "voice" ? (
          <ExecutiveRealtimeVoicePanel
            agent={toRealtimeAgentKey(activeAgent)}
            agentLabel={
              activeAgent.name || "Executive Chief of Staff"
            }
            workspaceId={workspaceId}
            executiveContext={{
              ...executiveContext,
              consultation_mode: "team",
            }}
            onUserTranscript={(payload) => {
              console.log("[Executive Voice] User:", payload);
            }}
            onAssistantTranscript={(payload) => {
              console.log("[Executive Voice] Assistant:", payload);
            }}
            onRealtimeEvent={(event) => {
              if (event?.type === "error") {
                console.error(
                  "[Executive Voice] Realtime error:",
                  event
                );
              }
            }}
          />
        ) : (
          <ExecutiveAgentWorkspace
            agents={agents}
            missions={missions}
            selectedAgentKey={selectedAgentKey}
            setSelectedAgentKey={setSelectedAgentKey}
            onVoiceCommand={onVoiceCommand}
            executiveContext={executiveContext}
            textOnly
          />
        )}
      </div>
    </div>
  );
}

export default function ExecutiveAICommandPlatform() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedMapState, setSelectedMapState] = useState("");
  const [agentRefreshTick, setAgentRefreshTick] = useState(0);
  const [selectedExecutiveAgent, setSelectedExecutiveAgent] = useState("executive-chief-of-staff");
  const [mapRiskFilter, setMapRiskFilter] = useState("all");
  const [voiceNavigationMessage, setVoiceNavigationMessage] = useState("");

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgentRefreshTick((value) => value + 1);
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (agentRefreshTick > 0) {
      loadData();
    }
  }, [agentRefreshTick]);

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
    { id: "cmd-ai-console", label: "Executive AI" },
    { id: "cmd-timeline", label: "Command Feed", badge: timeline.length },
  ];

  const liveAgents = useMemo(() => {
    const apiAgents = arr(
      data?.agents ||
        data?.ai_agents ||
        data?.agent_statuses
    );

    if (apiAgents.length) {
      return apiAgents.map((agent, index) => ({
        id: agent.id || agent.key || `agent-${index}`,
        name: agent.name || agent.label || `AI Agent ${index + 1}`,
        role: agent.role || agent.specialty || agent.focus,
        status: agent.status || agent.state || "active",
        note:
          agent.note ||
          agent.description ||
          agent.current_activity ||
          agent.summary,
        current_mission:
          agent.current_mission ||
          agent.mission_title ||
          agent.active_task,
        confidence_percentage:
          agent.confidence_percentage ??
          agent.confidence ??
          agent.score ??
          0,
        queue_count:
          agent.queue_count ??
          agent.pending_actions ??
          agent.open_tasks ??
          0,
        last_activity_at:
          agent.last_activity_at ||
          agent.updated_at ||
          agent.last_seen_at,
        source: "live",
      }));
    }

    return buildFallbackAgents({
      brief,
      missions,
      timeline,
      summary,
    });
  }, [data, brief, missions, timeline, summary]);


  const handleVoiceCommand = useCallback(
    (rawCommand, controls = {}) => {
      const command = normalizeVoiceCommand(rawCommand);
      const spokenState = findSpokenState(command);
      const route = matchVoiceRoute(command);

      const confirm = (text) => {
        setVoiceNavigationMessage(text);
        window.setTimeout(() => setVoiceNavigationMessage(""), 5000);
      };

      if (
        route &&
        (command.includes("open") ||
          command.includes("go to") ||
          command.includes("navigate"))
      ) {
        confirm(`Opening ${route.label}.`);
        navigate(route.path);
        return true;
      }

      if (
        spokenState &&
        (command.includes("open") ||
          command.includes("show") ||
          command.includes("select") ||
          command.includes("highlight"))
      ) {
        setSelectedMapState(spokenState);
        setMapRiskFilter("all");
        confirm(`Selected ${spokenState} on the national situation map.`);
        document.getElementById("cmd-map")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return true;
      }

      if (
        command.includes("show high risk") ||
        command.includes("highlight high risk") ||
        command.includes("show critical")
      ) {
        setMapRiskFilter("critical");
        setSelectedMapState("");
        confirm("Showing critical and high-risk states.");
        document.getElementById("cmd-map")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return true;
      }

      if (
        command.includes("show watch") ||
        command.includes("highlight watch") ||
        command.includes("elevated states")
      ) {
        setMapRiskFilter("watch");
        setSelectedMapState("");
        confirm("Showing states on watch.");
        return true;
      }

      if (
        command.includes("show operational") ||
        command.includes("highlight operational") ||
        command.includes("strong states")
      ) {
        setMapRiskFilter("operational");
        setSelectedMapState("");
        confirm("Showing operational states.");
        return true;
      }

      if (
        command.includes("reset map") ||
        command.includes("national view") ||
        command.includes("show all states")
      ) {
        setMapRiskFilter("all");
        setSelectedMapState("");
        confirm("National map reset.");
        return true;
      }

      if (command.includes("new conversation")) {
        controls.startNewConversation?.();
        confirm("Started a new executive AI conversation.");
        return true;
      }

      if (command.includes("clear chat")) {
        controls.clearConversationScreen?.();
        confirm("Conversation cleared.");
        return true;
      }

      if (command.includes("team consult")) {
        controls.setTeamMode?.(true);
        confirm("Executive Team Consult mode enabled.");
        return true;
      }

      if (command.includes("single agent")) {
        controls.setTeamMode?.(false);
        confirm("Single Agent mode enabled.");
        return true;
      }

      if (command.includes("voice off")) {
        controls.setVoiceEnabled?.(false);
        controls.stopSpeaking?.();
        confirm("Voice replies disabled.");
        return true;
      }

      if (command.includes("voice on")) {
        controls.setVoiceEnabled?.(true);
        confirm("Voice replies enabled.");
        return true;
      }

      if (command.includes("stop speaking")) {
        controls.stopSpeaking?.();
        confirm("Stopped speaking.");
        return true;
      }

      if (command.includes("generate mission")) {
        handleGenerateMission();
        confirm("Generating a new executive AI mission.");
        return true;
      }

      if (command.includes("refresh command platform")) {
        loadData();
        confirm("Refreshing the Executive AI Command Platform.");
        return true;
      }

      return false;
    },
    [navigate]
  );

  return (
    <PageShell
      eyebrow="Build 4B · Unified Executive AI Command Center"
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
        .cmd-agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.cmd-agent-card{padding:14px;display:grid;gap:10px;position:relative;overflow:hidden}
        .cmd-agent-card::after{content:"";position:absolute;inset:auto 0 0;height:2px;background:linear-gradient(90deg,transparent,rgba(96,165,250,.55),transparent)}
        .cmd-agent-card.is-alert{border-color:rgba(239,68,68,.36);background:radial-gradient(circle at top right,rgba(239,68,68,.12),transparent 42%),rgba(15,23,42,.56)}
        .cmd-agent-card.is-active,.cmd-agent-card.is-processing{border-color:rgba(34,197,94,.28)}
        .cmd-agent-title{min-width:0;flex:1}
        .cmd-agent-title strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cmd-agent-title small{margin-top:3px;color:rgba(148,163,184,.78);font-size:10px;letter-spacing:.07em}
        .cmd-agent-card p{margin:0;color:rgba(203,213,225,.76);font-size:12px;line-height:1.55;min-height:38px}
        .cmd-agent-mission{border:1px solid rgba(148,163,184,.12);border-radius:14px;background:rgba(2,6,23,.28);padding:10px}
        .cmd-agent-mission span,.cmd-agent-metrics span{display:block;color:rgba(148,163,184,.76);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .cmd-agent-mission strong{display:block;margin-top:5px;color:rgba(241,245,249,.94);font-size:12px;line-height:1.4}
        .cmd-agent-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .cmd-agent-metrics>div{border:1px solid rgba(148,163,184,.1);border-radius:12px;background:rgba(2,6,23,.22);padding:8px}
        .cmd-agent-metrics strong{display:block;margin-top:4px;color:white;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cmd-agent-confidence{height:5px;border-radius:999px;background:rgba(148,163,184,.14);overflow:hidden}
        .cmd-agent-confidence i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#3b82f6,#22c55e)}.cmd-agent-head{display:flex;gap:9px;align-items:center}.cmd-agent-head strong{color:white;font-size:14px}.cmd-status-dot{width:10px;height:10px;border-radius:999px;background:#64748b}.cmd-status-dot.active,.cmd-status-dot.processing{background:#22c55e;box-shadow:0 0 14px rgba(34,197,94,.5)}.cmd-status-dot.thinking,.cmd-status-dot.monitoring{background:#f59e0b;box-shadow:0 0 14px rgba(245,158,11,.45)}.cmd-status-dot.alert{background:#ef4444;box-shadow:0 0 14px rgba(239,68,68,.5)}

        .cmd-geo-map-shell{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.45fr);gap:16px;align-items:stretch}
        .cmd-geo-map-main,.cmd-map-detail{border:1px solid rgba(96,165,250,.22);border-radius:24px;background:radial-gradient(circle at top right,rgba(59,130,246,.14),transparent 34%),linear-gradient(145deg,rgba(2,6,23,.96),rgba(15,23,42,.88));overflow:hidden}
        .cmd-geo-map-main{padding:16px}.cmd-map-heading{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}.cmd-map-heading span,.cmd-map-detail-eyebrow,.cmd-map-mission-list>span{display:block;color:rgba(147,197,253,.86);font-size:11px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}
        .cmd-map-heading strong{display:block;margin-top:5px;color:white;font-size:22px;font-weight:950;letter-spacing:-.035em}.cmd-map-summary,.cmd-map-detail-status{display:flex;gap:8px;flex-wrap:wrap}
        .cmd-geo-map-canvas{border:1px solid rgba(148,163,184,.12);border-radius:20px;background:radial-gradient(circle at center,rgba(30,64,175,.12),transparent 55%),rgba(2,6,23,.42);overflow:hidden}
        .cmd-map-legend-row{display:flex;gap:16px;flex-wrap:wrap;padding:12px 4px 0;color:rgba(226,232,240,.76);font-size:11px;font-weight:800}.cmd-map-legend-row span{display:flex;gap:7px;align-items:center}.cmd-map-legend-row i{width:10px;height:10px;border-radius:999px;display:block}.legend-danger{background:#ef4444}.legend-warning{background:#f59e0b}.legend-active{background:#22c55e}.legend-info{background:#3b82f6}
        .cmd-map-detail{padding:18px;display:grid;align-content:start;gap:16px}.cmd-map-detail>strong{color:white;font-size:34px;font-weight:950;letter-spacing:-.06em}.cmd-map-detail>p{margin:0;color:rgba(203,213,225,.76);line-height:1.65}
        .cmd-map-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cmd-map-detail-grid>div{border:1px solid rgba(148,163,184,.12);border-radius:15px;background:rgba(2,6,23,.3);padding:11px}.cmd-map-detail-grid span{display:block;color:rgba(148,163,184,.78);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.cmd-map-detail-grid strong{display:block;margin-top:5px;color:white;font-size:18px}
        .cmd-map-mission-list{display:grid;gap:8px}.cmd-map-mission-list>div{border:1px solid rgba(148,163,184,.12);border-radius:13px;background:rgba(15,23,42,.48);padding:10px;color:rgba(226,232,240,.9);font-size:12px;line-height:1.45}.cmd-map-mission-list p{margin:0;color:rgba(148,163,184,.76);font-size:12px;line-height:1.55}


        .cmd-consult-shell{display:grid;grid-template-columns:minmax(300px,.34fr) minmax(0,1fr);gap:18px;min-height:760px}
        .cmd-consult-agents,.cmd-consult-main{border:1px solid rgba(148,163,184,.14);border-radius:20px;background:rgba(2,6,23,.3);min-width:0}
        .cmd-consult-agents{padding:16px;display:grid;align-content:start;gap:16px}
        .cmd-consult-mode{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cmd-consult-mode button,.cmd-consult-agent-list button,.cmd-consult-suggestions button{border:1px solid rgba(148,163,184,.14);background:rgba(15,23,42,.55);color:rgba(226,232,240,.88);border-radius:12px;cursor:pointer}
        .cmd-consult-mode button{padding:12px;font-size:12px;font-weight:900}.cmd-consult-mode button.is-active{border-color:rgba(96,165,250,.58);background:rgba(37,99,235,.2);color:white}
        .cmd-consult-agent-list{display:grid;gap:10px}.cmd-consult-agent-list button{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;padding:13px;text-align:left}.cmd-consult-agent-list button.is-active{border-color:rgba(251,146,60,.5);background:rgba(251,146,60,.1)}
        .cmd-consult-agent-list strong{display:block;color:white;font-size:13px}.cmd-consult-agent-list small{display:block;margin-top:4px;color:rgba(148,163,184,.74);font-size:10px;line-height:1.35}
        .cmd-consult-suggestions{display:grid;gap:9px}.cmd-consult-suggestions>span{color:rgba(147,197,253,.84);font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.cmd-consult-suggestions button{padding:11px;text-align:left;font-size:11px;line-height:1.45}.cmd-consult-suggestions button:hover{border-color:rgba(96,165,250,.45)}
        .cmd-consult-main{display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden;min-height:760px}.cmd-consult-header{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px 20px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.42)}.cmd-consult-header span{display:block;color:rgba(147,197,253,.84);font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.cmd-consult-header strong{display:block;margin-top:5px;color:white;font-size:21px}
        .cmd-consult-messages{padding:20px;display:grid;align-content:start;gap:16px;overflow:auto;max-height:660px}.cmd-consult-message{max-width:82%;border:1px solid rgba(148,163,184,.13);border-radius:20px;padding:16px 18px;background:rgba(15,23,42,.55)}.cmd-consult-message.is-user{margin-left:auto;background:rgba(37,99,235,.16);border-color:rgba(96,165,250,.28)}.cmd-consult-message-head{display:flex;justify-content:space-between;gap:10px}.cmd-consult-message-head strong{color:white;font-size:12px}.cmd-consult-message-head span{color:rgba(148,163,184,.68);font-size:9px}.cmd-consult-message p{margin:10px 0 0;color:rgba(226,232,240,.9);font-size:14px;line-height:1.7;white-space:pre-wrap}.cmd-consult-message-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
        .cmd-consult-thinking{display:flex;gap:9px;align-items:center;color:rgba(203,213,225,.76);font-size:11px}
        .cmd-consult-composer{border-top:1px solid rgba(148,163,184,.12);padding:16px 18px;background:rgba(15,23,42,.45)}.cmd-consult-composer textarea{width:100%;resize:vertical;border:1px solid rgba(148,163,184,.16);border-radius:16px;background:rgba(2,6,23,.45);color:white;padding:16px;outline:none;line-height:1.6;font-size:14px;min-height:130px}.cmd-consult-composer textarea:focus{border-color:rgba(96,165,250,.5);box-shadow:0 0 0 3px rgba(59,130,246,.1)}.cmd-consult-composer>div{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-top:12px}.cmd-consult-composer span{color:rgba(148,163,184,.7);font-size:9px}


        .cmd-voice-toolbar{display:grid;justify-items:end;gap:9px}
        .cmd-voice-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
        .cmd-voice-controls select,.cmd-voice-controls button{border:1px solid rgba(148,163,184,.16);border-radius:11px;background:rgba(2,6,23,.42);color:rgba(226,232,240,.9);padding:8px 10px;font-size:10px;font-weight:800}
        .cmd-voice-controls select{max-width:220px}.cmd-voice-controls button{cursor:pointer}.cmd-voice-controls button.is-active{border-color:rgba(34,197,94,.4);background:rgba(34,197,94,.12);color:#dcfce7}
        .cmd-voice-capture{margin-bottom:12px}
        .cmd-mic-button{width:100%;border:1px solid rgba(96,165,250,.26);border-radius:18px;background:radial-gradient(circle at left,rgba(59,130,246,.13),transparent 40%),rgba(2,6,23,.38);color:white;padding:14px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;text-align:left;cursor:pointer}
        .cmd-mic-button:hover{border-color:rgba(96,165,250,.55);background:rgba(37,99,235,.12)}
        .cmd-mic-button.is-listening{border-color:rgba(239,68,68,.58);background:radial-gradient(circle at left,rgba(239,68,68,.18),transparent 42%),rgba(2,6,23,.42);box-shadow:0 0 0 3px rgba(239,68,68,.08)}
        .cmd-mic-icon{width:48px;height:48px;border-radius:999px;display:grid;place-items:center;background:rgba(59,130,246,.18);border:1px solid rgba(96,165,250,.24);font-size:21px}
        .cmd-mic-button.is-listening .cmd-mic-icon{background:rgba(239,68,68,.2);border-color:rgba(248,113,113,.38);animation:cmdMicPulse 1.25s ease-in-out infinite}
        .cmd-mic-button strong{display:block;font-size:13px}.cmd-mic-button small{display:block;margin-top:4px;color:rgba(203,213,225,.72);font-size:10px;line-height:1.45}
        @keyframes cmdMicPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(239,68,68,.3)}50%{transform:scale(1.05);box-shadow:0 0 0 10px rgba(239,68,68,0)}}


        .cmd-consult-header-tools{display:grid;justify-items:end;gap:10px}
        .cmd-conversation-heading small{display:block;margin-top:5px;color:rgba(148,163,184,.74);font-size:10px}
        .cmd-conversation-toolbar{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
        .cmd-conversation-toolbar button,.cmd-history-head button,.cmd-history-item>div button{border:1px solid rgba(148,163,184,.15);border-radius:10px;background:rgba(2,6,23,.42);color:rgba(226,232,240,.88);padding:8px 10px;font-size:9px;font-weight:850;cursor:pointer}
        .cmd-conversation-toolbar button:hover,.cmd-conversation-toolbar button.is-active,.cmd-history-head button:hover,.cmd-history-item>div button:hover,.cmd-history-item>div button.is-active{border-color:rgba(96,165,250,.5);background:rgba(37,99,235,.14);color:white}
        .cmd-history-drawer{border-bottom:1px solid rgba(148,163,184,.13);background:rgba(2,6,23,.72);padding:16px;display:grid;gap:12px}
        .cmd-history-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.cmd-history-head span,.cmd-saved-briefings>span{display:block;color:rgba(147,197,253,.84);font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.cmd-history-head strong{display:block;margin-top:4px;color:white;font-size:16px}
        .cmd-history-drawer>input{width:100%;border:1px solid rgba(148,163,184,.15);border-radius:12px;background:rgba(15,23,42,.55);color:white;padding:11px;outline:none}
        .cmd-history-list,.cmd-saved-briefings{display:grid;gap:8px;max-height:320px;overflow:auto}
        .cmd-history-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid rgba(148,163,184,.12);border-radius:13px;background:rgba(15,23,42,.44);padding:8px}
        .cmd-history-open,.cmd-saved-briefings button{border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;padding:4px}.cmd-history-open strong,.cmd-saved-briefings strong{display:block;color:white;font-size:11px}.cmd-history-open small,.cmd-saved-briefings small{display:block;margin-top:4px;color:rgba(148,163,184,.7);font-size:9px}
        .cmd-history-item>div{display:flex;gap:6px;flex-wrap:wrap}
        .cmd-history-empty{border:1px dashed rgba(148,163,184,.18);border-radius:12px;padding:18px;text-align:center;color:rgba(148,163,184,.76);font-size:11px}
        .cmd-saved-briefings{border-top:1px solid rgba(148,163,184,.12);padding-top:12px}.cmd-saved-briefings button{border:1px solid rgba(148,163,184,.1);border-radius:12px;background:rgba(15,23,42,.36);padding:10px}


        .cmd-voice-command-guide{border:1px solid rgba(96,165,250,.16);border-radius:14px;background:rgba(37,99,235,.08);padding:11px;display:grid;gap:6px}
        .cmd-voice-command-guide span{color:rgba(147,197,253,.88);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .cmd-voice-command-guide small{color:rgba(203,213,225,.78);font-size:10px;line-height:1.35}
        .cmd-last-voice-command{margin-top:8px;color:rgba(148,163,184,.78);font-size:10px}
        .cmd-last-voice-command strong{color:rgba(226,232,240,.92)}
        .cmd-voice-nav-banner{border-color:rgba(96,165,250,.35);background:rgba(37,99,235,.13);color:#dbeafe}


        .cmd-v3-settings{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
        .cmd-v3-settings label{display:flex;gap:7px;align-items:center;color:rgba(203,213,225,.78);font-size:9px}
        .cmd-v3-settings input:not([type="checkbox"]){border:1px solid rgba(148,163,184,.15);border-radius:9px;background:rgba(2,6,23,.42);color:white;padding:7px 9px;max-width:120px}
        .cmd-v3-check{border:1px solid rgba(148,163,184,.12);border-radius:9px;padding:7px 9px;background:rgba(2,6,23,.28)}
        .cmd-streaming-message{border-color:rgba(96,165,250,.34);background:radial-gradient(circle at top left,rgba(59,130,246,.12),transparent 40%),rgba(15,23,42,.58)}
        .cmd-streaming-message p::after{content:"";display:inline-block;width:7px;height:14px;margin-left:4px;background:rgba(96,165,250,.9);vertical-align:-2px;animation:cmdCursorBlink .8s steps(1) infinite}
        @keyframes cmdCursorBlink{0%,50%{opacity:1}51%,100%{opacity:0}}

        .cmd-unified-ai-console{display:grid;gap:16px}
        .cmd-unified-ai-header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:20px;border:1px solid rgba(96,165,250,.2);border-radius:22px;background:radial-gradient(circle at top right,rgba(59,130,246,.13),transparent 38%),linear-gradient(145deg,rgba(2,6,23,.92),rgba(15,23,42,.82))}
        .cmd-unified-ai-header>div:first-child>span{display:block;color:rgba(147,197,253,.88);font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}
        .cmd-unified-ai-header strong{display:block;margin-top:6px;color:white;font-size:27px;font-weight:950;letter-spacing:-.04em}
        .cmd-unified-ai-header p{max-width:720px;margin:8px 0 0;color:rgba(203,213,225,.76);font-size:12px;line-height:1.6}
        .cmd-unified-ai-status{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
        .cmd-unified-ai-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .cmd-unified-ai-tabs button{border:1px solid rgba(148,163,184,.14);border-radius:17px;background:rgba(15,23,42,.48);color:rgba(226,232,240,.86);padding:15px 17px;text-align:left;cursor:pointer;transition:border-color .2s ease,background .2s ease,transform .2s ease}
        .cmd-unified-ai-tabs button:hover{transform:translateY(-1px);border-color:rgba(96,165,250,.42)}
        .cmd-unified-ai-tabs button.is-active{border-color:rgba(96,165,250,.62);background:radial-gradient(circle at top right,rgba(59,130,246,.18),transparent 48%),rgba(37,99,235,.12);box-shadow:0 0 0 3px rgba(59,130,246,.07)}
        .cmd-unified-ai-tabs span{display:block;color:white;font-size:14px;font-weight:950}
        .cmd-unified-ai-tabs small{display:block;margin-top:5px;color:rgba(148,163,184,.76);font-size:10px;line-height:1.4}
        .cmd-unified-ai-body{min-width:0}
        .cmd-consult-shell.is-text-only .cmd-voice-toolbar,.cmd-consult-shell.is-text-only .cmd-voice-capture,.cmd-consult-shell.is-text-only .cmd-voice-command-guide{display:none}

        @media(max-width:760px){
          .cmd-unified-ai-header{flex-direction:column}
          .cmd-unified-ai-status{justify-content:flex-start}
          .cmd-unified-ai-tabs{grid-template-columns:1fr}
        }

        @media(max-width:1280px){.cmd-command-ribbon,.cmd-layout,.cmd-reasoning-panel,.cmd-geo-map-shell{grid-template-columns:1fr}.cmd-consult-shell{grid-template-columns:280px minmax(0,1fr)}}@media(max-width:1050px){
          .cmd-consult-shell{grid-template-columns:1fr;min-height:auto}
          .cmd-consult-agents{grid-template-columns:1fr;gap:14px}
          .cmd-consult-agent-list{grid-template-columns:repeat(2,minmax(0,1fr))}
          .cmd-consult-suggestions{grid-template-columns:repeat(2,minmax(0,1fr))}
          .cmd-consult-main{min-height:680px}
        }
        @media(max-width:900px){.cmd-consult-header-tools{justify-items:start}.cmd-conversation-toolbar{justify-content:flex-start}.cmd-history-item{grid-template-columns:1fr}.cmd-voice-toolbar{justify-items:start}.cmd-voice-controls{justify-content:flex-start}.cmd-consult-agent-list,.cmd-consult-suggestions{grid-template-columns:1fr}.cmd-consult-message{max-width:96%}.cmd-consult-header{align-items:flex-start;flex-direction:column}.cmd-consult-composer>div{align-items:stretch;flex-direction:column}.cmd-score-grid,.cmd-row .vs-responsive-meta,.cmd-timeline-row .vs-responsive-meta,.cmd-reasoning-grid{grid-template-columns:1fr}.cmd-action-row{grid-template-columns:1fr}.cmd-timeline-row{grid-template-columns:48px 12px minmax(0,1fr)}}
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
      {voiceNavigationMessage ? (
        <div className="vs-banner cmd-voice-nav-banner">
          Voice Command: {voiceNavigationMessage}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard label="Active Executive Command Briefs" value={summary.activeCommandBriefs || 0} subtext="Current national executive command briefs" />
        <StatCard label="Active Executive Missions" value={summary.activeExecutiveMissions || missions.length || 0} subtext="AI-created mission packages under review" />
        <StatCard label="AI Confidence Percentage" value={pct(summary.aiConfidencePercentage)} subtext="Confidence across the active executive command brief" />
        <StatCard label="Execution Risk Percentage" value={pct(summary.executionRiskPercentage)} subtext={`${summary.queuedApprovalActions || 0} queued approval actions`} />
      </div>

      <CollapsibleSection id="cmd-map" title="National Operations Map" subtitle="Executive mission posture, attention states, and active operational zones." defaultOpen right={<Badge tone="active">National Live Layer</Badge>}>
        <NationalOperationsMap
          missions={missions}
          timeline={timeline}
          selectedState={selectedMapState}
          onSelectState={setSelectedMapState}
          riskFilter={mapRiskFilter}
        />
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

          <CollapsibleSection id="cmd-agents" title="Live AI Agents" subtitle="Specialized executive agents coordinating command recommendations with automatic 30-second refresh." defaultOpen={false} right={
              <div className="vs-chip-row">
                <Badge
                  tone={
                    arr(
                      data?.agents ||
                        data?.ai_agents ||
                        data?.agent_statuses
                    ).length
                      ? "active"
                      : "info"
                  }
                >
                  {arr(
                    data?.agents ||
                      data?.ai_agents ||
                      data?.agent_statuses
                  ).length
                    ? "Live API"
                    : "Derived Status"}
                </Badge>
                <Badge tone="active">{liveAgents.length} Agents</Badge>
              </div>
            }>
            <div className="cmd-agent-grid">
              {liveAgents.map((agent) => (
                <AgentStatus
                  key={agent.id || agent.name}
                  agent={agent}
                />
              ))}
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

      <CollapsibleSection
        id="cmd-ai-console"
        title="Executive AI Command Center"
        subtitle="One unified workspace for realtime voice, executive chat, specialist agents, team consultation, history, and exports."
        defaultOpen
        right={<Badge tone="active">Unified AI Workspace</Badge>}
      >
        <UnifiedExecutiveAIConsole
          agents={liveAgents}
          missions={missions}
          selectedAgentKey={selectedExecutiveAgent}
          setSelectedAgentKey={setSelectedExecutiveAgent}
          onVoiceCommand={handleVoiceCommand}
          workspaceId={1}
          executiveContext={{
            selected_state: selectedMapState,
            geographic_scope: selectedMapState || "National",
            national_readiness_percentage: readiness,
            execution_risk_percentage: executionRisk,
            map_risk_filter: mapRiskFilter,
            mission_id: activeMission?.id || null,
            mission_title: activeMission?.title || null,
          }}
        />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
