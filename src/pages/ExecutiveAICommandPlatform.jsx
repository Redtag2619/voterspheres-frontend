import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
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
                            fill: stateFill(metric, isSelected),
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

async function askExecutiveAgent(payload) {
  if (typeof api?.askAiCampaignCopilot === "function") {
    return api.askAiCampaignCopilot(payload);
  }

  const response = await api.post("/ai-campaign-copilot/ask", payload);
  return response?.data || response;
}

function extractAgentAnswer(result) {
  return (
    result?.answer ||
    result?.message?.content ||
    result?.message ||
    result?.data?.answer ||
    result?.data?.message?.content ||
    "The AI agent returned no readable response."
  );
}

function ExecutiveAgentWorkspace({
  agents,
  missions,
  selectedAgentKey,
  setSelectedAgentKey,
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

  async function submitQuestion(value = prompt) {
    const question = String(value || "").trim();
    if (!question || asking) return;

    setError("");
    setPrompt("");
    setAsking(true);

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
        prompt: requestPrompt,
        thread_id: threadId || null,
        agent: teamMode ? "executive_chief_of_staff" : selectedKey.replace(/-/g, "_"),
        workspace_id: activeMission?.workspace_id || 1,
        executive_context: {
          mission_id: activeMission?.id || null,
          mission_title: activeMission?.title || null,
          geographic_scope:
            activeMission?.state_name ||
            activeMission?.geographic_scope ||
            "National",
          consultation_mode: teamMode ? "team" : "single_agent",
        },
      });

      const nextThreadId =
        result?.thread_id ||
        result?.data?.thread_id ||
        threadId;

      if (nextThreadId) setThreadId(nextThreadId);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          agent: teamMode
            ? "Executive AI Team"
            : selectedAgent?.name || selectedAgent?.label || "Executive AI Agent",
          content: extractAgentAnswer(result),
          sources: result?.sources || result?.data?.sources || [],
          confidence:
            result?.confidence ??
            result?.data?.confidence ??
            selectedAgent?.confidence_percentage ??
            0,
          created_at: new Date().toISOString(),
        },
      ]);
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
            "I could not complete the consultation. Confirm the AI Campaign Co-Pilot backend is online and that your OpenAI key is configured.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="cmd-consult-shell">
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
          <div>
            <span>{teamMode ? "Executive Team Consultation" : "Active AI Advisor"}</span>
            <strong>
              {teamMode
                ? "Executive AI Team"
                : selectedAgent?.name || selectedAgent?.label || "Executive AI Agent"}
            </strong>
          </div>

          <div className="vs-chip-row">
            <Badge tone="active">LLM Connected</Badge>
            <Badge tone={teamMode ? "accent" : "info"}>
              {teamMode ? "Multi-Agent Synthesis" : "Specialist Mode"}
            </Badge>
          </div>
        </div>

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

          {asking ? (
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
                ? `Conversation thread ${threadId}`
                : "A new secure executive conversation will be created."}
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

export default function ExecutiveAICommandPlatform() {
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
    { id: "cmd-consult", label: "Consult AI Team" },
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

        @media(max-width:1280px){.cmd-command-ribbon,.cmd-layout,.cmd-reasoning-panel,.cmd-geo-map-shell{grid-template-columns:1fr}.cmd-consult-shell{grid-template-columns:280px minmax(0,1fr)}}@media(max-width:1050px){
          .cmd-consult-shell{grid-template-columns:1fr;min-height:auto}
          .cmd-consult-agents{grid-template-columns:1fr;gap:14px}
          .cmd-consult-agent-list{grid-template-columns:repeat(2,minmax(0,1fr))}
          .cmd-consult-suggestions{grid-template-columns:repeat(2,minmax(0,1fr))}
          .cmd-consult-main{min-height:680px}
        }
        @media(max-width:900px){.cmd-consult-agent-list,.cmd-consult-suggestions{grid-template-columns:1fr}.cmd-consult-message{max-width:96%}.cmd-consult-header{align-items:flex-start;flex-direction:column}.cmd-consult-composer>div{align-items:stretch;flex-direction:column}.cmd-score-grid,.cmd-row .vs-responsive-meta,.cmd-timeline-row .vs-responsive-meta,.cmd-reasoning-grid{grid-template-columns:1fr}.cmd-action-row{grid-template-columns:1fr}.cmd-timeline-row{grid-template-columns:48px 12px minmax(0,1fr)}}
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
        <NationalOperationsMap
          missions={missions}
          timeline={timeline}
          selectedState={selectedMapState}
          onSelectState={setSelectedMapState}
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
        id="cmd-consult"
        title="Consult the Executive AI Team"
        subtitle="Ask specialist agents questions, continue a conversation, or coordinate a cross-functional team consultation."
        defaultOpen
        right={<Badge tone="active">Interactive AI</Badge>}
      >
        <ExecutiveAgentWorkspace
          agents={liveAgents}
          missions={missions}
          selectedAgentKey={selectedExecutiveAgent}
          setSelectedAgentKey={setSelectedExecutiveAgent}
        />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
