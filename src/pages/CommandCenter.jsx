import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom"; 
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard"; 
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState"; 
import ResponsiveRow from "../components/ui/ResponsiveRow";
import PoliticalGraphContextPanel from "../components/graph/PoliticalGraphContextPanel";

import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

const fallbackData = {
  metrics: [
    { label: "National Win Index", value: "61.8", delta: "+3.1", tone: "up" },
    { label: "Active Threats", value: "4", delta: "2 require action", tone: "down" },
    { label: "Fundraising Pulse", value: "$12.8M", delta: "+9.4%", tone: "up" },
    { label: "Persuasion Opportunity", value: "8.9", delta: "+0.8", tone: "up" },
  ],
  battlegrounds: [],
  actions: [],
  feed: [],
};

const fallbackCrossSignal = {
  summary: {
    states_tracked: 0,
    critical_states: 0,
    high_states: 0,
    vendor_gap_states: 0,
  },
  top_priorities: [],
  results: [],
};

const fallbackConsultantIntel = {
  summary: {
    fec_consultants: 0,
    total_consultants: 0,
    avg_influence: 0,
    avg_exposure: 0,
    high_exposure: 0,
    watch_closely: 0,
  },
  top_influence: [],
  top_exposure: [],
  recent_relationships: [],
};

const fallbackDarkMoneyIntel = {
  summary: {},
  top_exposure: [],
  consultant_clusters: [],
  candidate_exposure: [],
};

const fallbackExecutiveAlerts = {
  counts: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
  alerts: [],
};

const TASK_FILTERS = [
  { id: "all", label: "All Tasks" },
  { id: "county", label: "County Escalations" },
  { id: "vendor", label: "Vendor Tasks" },
  { id: "mailops", label: "MailOps Tasks" },
  { id: "critical", label: "Critical" },
  { id: "open", label: "Open" },
  { id: "completed", label: "Completed" },
];

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function fmtDecimal(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function money(value) {
  const amount = number(value);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

function joinText(values = []) {
  return values.filter(Boolean).join(" - ");
}

function safeJson(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function getTaskId(task = null) {
  if (!task) return null;
  return task.id || task.task_id || task.uuid || null;
}

function getTaskMetadata(task = null) {
  if (!task) return {};
  return safeJson(task.metadata);
}

function getTaskStatus(task = null) {
  if (!task) return "open";
  return String(task.status || task.task_status || "open").toLowerCase();
}

function isTaskCompleted(task) {
  return ["complete", "completed", "done", "resolved"].includes(getTaskStatus(task));
}

function getTaskPriority(task = null) {
  if (!task) return "";
  return String(task.priority || task.risk || task.severity || "").toLowerCase();
}

function getTaskTitle(task = null) {
  if (!task) return "Untitled task";
  return task.title || task.name || task.subject || "Untitled task";
}

function getTaskDescription(task = null) {
  if (!task) return "";
  return task.description || task.details || task.detail || "";
}

function isCountyEscalationTask(task) {
  const metadata = getTaskMetadata(task);
  const source = String(task.source || metadata.source || "").toLowerCase();
  const type = String(task.type || task.category || metadata.tactical_source || metadata.task_kind || "").toLowerCase();

  return (
    source.includes("state_operations") ||
    source.includes("state operations") ||
    type.includes("county") ||
    type.includes("heat") ||
    type.includes("county_escalation") ||
    Boolean(metadata.county && metadata.heat_score)
  );
}

function isVendorTask(task) {
  const metadata = getTaskMetadata(task);
  const source = String(task.source || metadata.source || task.category || task.type || "").toLowerCase();
  const title = getTaskTitle(task).toLowerCase();
  return source.includes("vendor") || title.includes("vendor");
}


function getTaskStateCode(task = null) {
  if (!task) return "";
  const metadata = getTaskMetadata(task);
  return String(
    task.state ||
      task.state_code ||
      task.stateCode ||
      metadata.state ||
      metadata.state_code ||
      metadata.stateCode ||
      ""
  ).toUpperCase();
}

function getTaskCountyName(task) {
  const metadata = getTaskMetadata(task);
  return String(task.county || task.county_name || metadata.county || metadata.county_name || "");
}


function sameTask(left = null, right = null) {
  if (!left || !right) return false;
  return String(getTaskId(left) || getTaskTitle(left)) === String(getTaskId(right) || getTaskTitle(right));
}

function stateMatchesTask(task, stateCode) {
  const code = String(stateCode || "").toUpperCase();
  if (!code) return true;

  const taskState = getTaskStateCode(task);
  if (taskState === code) return true;

  const searchable = [
    getTaskTitle(task),
    getTaskDescription(task),
    task.source,
    task.category,
    task.type,
    JSON.stringify(getTaskMetadata(task)),
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return searchable.includes(` ${code} `) || searchable.includes(`${code}:`) || searchable.includes(`${code} `);
}

function buildMapReturnUrl(stateCode) {
  const code = String(stateCode || "").toUpperCase();
  return code ? `/operations-map?state=${code}&source=command-center` : "/operations-map";
}

function isMailOpsTask(task) {
  const metadata = getTaskMetadata(task);
  const source = String(task.source || metadata.source || task.category || task.type || "").toLowerCase();
  const title = getTaskTitle(task).toLowerCase();
  return source.includes("mail") || title.includes("mailops") || title.includes("mail");
}

function toneFromSeverity(value) {
  const next = String(value || "").toLowerCase();
  if (["critical", "high", "elevated", "severe"].includes(next)) return "danger";
  if (["medium", "watch", "warning"].includes(next)) return "warning";
  if (["complete", "completed", "resolved", "active", "stable"].includes(next)) return "active";
  return "default";
}

function toneFromScore(value) {
  const score = number(value);
  if (score >= 75) return "danger";
  if (score >= 50) return "warning";
  if (score >= 25) return "info";
  return "default";
}

function normalizeList(payload, key = "results") {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  return [];
}

function unwrapGraph(payload) {
  return payload?.graph || payload || null;
}

async function safeLoad(loader, fallback) {
  try {
    const result = await loader();
    return result || fallback;
  } catch {
    return fallback;
  }
}

function normalizeAlertToken(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function getExplicitAlertRoute(alert = null) {
  if (!alert) return "";

  const metadata = getTaskMetadata(alert);
  const candidates = [
    alert.route,
    alert.link,
    alert.action_route,
    alert.actionRoute,
    alert.destination,
    metadata.route,
    metadata.link,
    metadata.action_route,
    metadata.actionRoute,
    metadata.destination,
  ];

  return candidates.find((value) => String(value || "").startsWith("/")) || "";
}

function getSmartAlertRoute(alert = null) {
  if (!alert) return "/executive-decision-intelligence";

  const explicitRoute = getExplicitAlertRoute(alert);
  if (explicitRoute) return explicitRoute;

  const type = normalizeAlertToken(alert.type);
  const source = normalizeAlertToken(alert.source);
  const title = normalizeAlertToken(alert.title);
  const searchable = `${type} ${source} ${title}`;

  if (searchable.includes("dark-money") || searchable.includes("darkmoney")) {
    return "/dark-money-exposure";
  }

  if (
    searchable.includes("relationship") ||
    searchable.includes("relationship-graph") ||
    type.includes("relationship-signal")
  ) {
    return "/relationship-graph";
  }

  if (searchable.includes("consultant")) {
    return "/consultant-intel";
  }

  if (searchable.includes("vendor")) {
    return "/vendors";
  }

  if (searchable.includes("fundraising") || searchable.includes("finance")) {
    return "/fundraising-dashboard";
  }

  if (
    searchable.includes("battleground") ||
    searchable.includes("race-pressure") ||
    searchable.includes("national-command")
  ) {
    return "/national-command";
  }

  if (
    searchable.includes("political-signal") ||
    searchable.includes("news-signal") ||
    searchable.includes("news-intelligence") ||
    searchable.includes("narrative")
  ) {
    return "/political-signals";
  }

  if (searchable.includes("campaign-crm") || searchable.includes("crm")) {
    return "/campaign-crm";
  }

  if (searchable.includes("candidate")) {
    return "/candidates";
  }

  if (
    searchable.includes("county") ||
    searchable.includes("state-operations") ||
    searchable.includes("operations-map")
  ) {
    return "/operations-map";
  }

  return "/executive-decision-intelligence";
}

function getSmartAlertSourceLabel(alert = null, route = "") {
  const source = String(alert?.source || "").trim();
  if (source) return source;

  const routeLabels = {
    "/dark-money-exposure": "Dark Money Exposure",
    "/relationship-graph": "Relationship Graph",
    "/consultant-intel": "Consultant Intelligence",
    "/vendors": "Vendor Network",
    "/fundraising-dashboard": "Fundraising Dashboard",
    "/national-command": "National Command",
    "/political-signals": "Political Signals",
    "/campaign-crm": "Campaign CRM",
    "/candidates": "Candidates",
    "/operations-map": "Operations Map",
    "/executive-decision-intelligence": "Executive Decision Intelligence",
  };

  return routeLabels[route] || "Source Intelligence";
}

function getSmartAlertActions(alert = null, route = "") {
  if (route === "/relationship-graph") {
    return ["Open Relationship Graph", "Inspect source/target pathway", "Assign analyst review"];
  }

  if (route === "/dark-money-exposure") {
    return ["Open Dark Money Exposure", "Audit committee pathways", "Escalate compliance review"];
  }

  if (route === "/consultant-intel") {
    return ["Open Consultant Intelligence", "Review candidate relationships", "Assign analyst review"];
  }

  if (route === "/vendors") {
    return ["Open Vendor Network", "Review coverage gap", "Assign procurement owner"];
  }

  if (route === "/fundraising-dashboard") {
    return ["Open Fundraising Dashboard", "Review finance movement", "Assign finance review"];
  }

  if (route === "/national-command") {
    return ["Open National Command", "Review battleground pressure", "Assign race owner"];
  }

  if (route === "/political-signals") {
    return ["Open Political Signals", "Review supporting evidence", "Assign monitoring owner"];
  }

  if (route === "/campaign-crm") {
    return ["Open Campaign CRM", "Review follow-up context", "Assign relationship owner"];
  }

  if (route === "/operations-map") {
    return ["Open Operations Map", "Review geographic pressure", "Assign operations owner"];
  }

  if (route === "/candidates") {
    return ["Open Candidates", "Review candidate context", "Assign campaign review"];
  }

  return [
    alert?.recommendation || "Open Executive Decision Intelligence",
    "Review supporting intelligence",
    "Assign an owner",
  ];
}

function buildDecision(feed = [], consultantIntel = fallbackConsultantIntel, darkMoneyIntel = fallbackDarkMoneyIntel) {
  const darkMoneyExposure = arr(darkMoneyIntel?.top_exposure).find((item) => number(item.exposure_score) >= 80) || null;

  if (darkMoneyExposure) {
    return {
      level: "CRITICAL",
      title: `${darkMoneyExposure.committee_name || darkMoneyExposure.committee_id || "Committee"} shows critical dark money exposure`,
      actions: ["Open Dark Money Exposure", "Audit consultant overlap", "Escalate compliance review"],
      link: "/dark-money-exposure",
      sourceLabel: "Dark Money Exposure",
    };
  }

  const consultantExposure = normalizeList(consultantIntel, "top_exposure").find((item) => number(item.exposure_score) >= 60);

  if (consultantExposure) {
    return {
      level: "HIGH",
      title: `${consultantExposure.name || consultantExposure.firm_name || "Consultant"} consultant relationship needs review`,
      actions: ["Open Consultant Intelligence", "Review candidate relationships", "Assign analyst review"],
      link: "/consultant-intel",
      sourceLabel: "Consultant Intelligence",
    };
  }

  const urgent = arr(feed).find((item) => ["high", "critical"].includes(String(item.severity || "").toLowerCase()));

  if (urgent) {
    const link = getSmartAlertRoute(urgent);

    return {
      level: String(urgent.severity || "HIGH").toUpperCase(),
      title: urgent.title || "High-priority alert detected",
      actions: getSmartAlertActions(urgent, link),
      link,
      sourceLabel: getSmartAlertSourceLabel(urgent, link),
      alert: urgent,
    };
  }

  return {
    level: "STABLE",
    title: "No urgent executive action required",
    actions: ["Monitor recent updates", "Refresh intelligence", "Review active priorities"],
    link: "/executive-decision-intelligence",
    sourceLabel: "Executive Decision Intelligence",
  };
}


function DecisionIntelligenceCommandCard() {
  return (
    <div data-tour="command-decision-intelligence">
      <SectionCard
        title="Executive Decision Intelligence"
        subtitle="Build 2D decision center for AI recommendations, ranked options, confidence scoring, risk review, and executive action paths."
        right={<Badge tone="accent">Build 2D</Badge>}
      >
        <div className="decision-intelligence-command-card">
          <div className="decision-intelligence-command-copy">
            <span className="decision-intelligence-kicker">AI Executive Decision Layer</span>
            <h3>Turn cross-module intelligence into ranked executive decisions.</h3>
            <p>
              Review synthesized signals from Forecast, Influence, Coalitions, Strategy, Operations, Political Graph,
              vendors, alerts, and execution tasks in one decision workspace.
            </p>
          </div>

          <div className="decision-intelligence-command-grid">
            <div><span>Decision Score</span><b>Live</b></div>
            <div><span>Risk Matrix</span><b>Active</b></div>
            <div><span>Scenario Options</span><b>Ranked</b></div>
            <div><span>Action Paths</span><b>Ready</b></div>
          </div>

          <div className="decision-intelligence-command-actions">
            <Link className="vs-button" to="/executive-decision-intelligence">
              Open Decision Intelligence
            </Link>
            <Link className="vs-button vs-button-secondary" to="/strategy-recommendation-dashboard">
              Open AI Strategy Recommendation Engine
            </Link>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function MetricGrid({ metrics = [] }) {
  return (
    <div className="vs-grid-4" data-tour="command-kpis">
      {metrics.map((metric) => (
        <StatCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          subtext={metric.delta || metric.subtext}
          delta={metric.delta}
          tone={metric.tone}
        />
      ))}
    </div>
  );
}

function PremiumRow({ title, subtitle, meta = [], tone = "default", right, live = false }) {
  return (
    <div className={`vs-premium-row-card ${live ? "is-live" : ""} ${tone}`}>
      <ResponsiveRow
        title={title}
        subtitle={subtitle}
        meta={meta}
        alert={tone === "danger" ? "vs-live-dot" : "vs-live-dot-warning"}
        right={right}
      />
    </div>
  );
}

function CountyEscalationTaskCard({ task, onStatusChange, changing, selected = false, onSelectTask }) {
  const metadata = getTaskMetadata(task);
  const status = getTaskStatus(task);
  const completed = isTaskCompleted(task);
  const priority = getTaskPriority(task);
  const county = metadata.county || task.county || task.county_name || "County / Parish";
  const state = metadata.state || task.state || task.state_code || "State";
  const risk = metadata.risk || task.risk || task.severity || task.priority || "Signal";
  const heat = metadata.heat_score || task.heat_score || task.pressure || 0;
  const topDriver = metadata.top_driver || metadata.top_drivers?.[0]?.label || "Operational Heat";
  const recommendation = metadata.recommendation || getTaskDescription(task);
  const taskId = getTaskId(task);

  return (
    <div className={`county-task-card ${toneFromSeverity(risk)} ${completed ? "is-completed" : ""} ${selected ? "is-selected-graph-task" : ""}`}>
      <div className="county-task-top">
        <div className="county-task-title-wrap">
          <span className="county-task-kicker">
            {completed ? "Resolved County Escalation" : "County Escalation Task"}
          </span>
          <strong>{getTaskTitle(task)}</strong>
          <p>{county} • {state}</p>
        </div>

        <div className="county-task-badges">
          <Badge tone={toneFromSeverity(risk)}>{risk}</Badge>
          <Badge tone={completed ? "active" : "info"}>{status}</Badge>
        </div>
      </div>

      <div className="county-task-grid">
        <div><span>State</span><b>{state}</b></div>
        <div><span>County / Parish</span><b>{county}</b></div>
        <div><span>Heat Score</span><b>{fmtDecimal(heat)}</b></div>
        <div><span>Top Driver</span><b>{topDriver}</b></div>
        <div><span>Priority</span><b>{priority || "normal"}</b></div>
        <div><span>Source</span><b>State Operations</b></div>
      </div>

      {recommendation ? <div className="county-task-recommendation">{recommendation}</div> : null}

      <div className="county-task-actions">
        <Link className="vs-button vs-button-secondary" to={`/state-operations/${String(state).toUpperCase()}`}>
          Open State
        </Link>

        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onSelectTask?.(task)}
        >
          Graph Context
        </button>

        <button
          type="button"
          className={completed ? "vs-button vs-button-secondary" : "vs-button"}
          disabled={!taskId || changing}
          onClick={() => onStatusChange(task, completed ? "open" : "completed")}
        >
          {changing ? "Updating..." : completed ? "Reopen" : "Complete"}
        </button>
      </div>
    </div>
  );
}

function StandardTaskCard({ task, selected = false, onSelectTask }) {
  const metadata = getTaskMetadata(task);
  const status = getTaskStatus(task);
  const priority = getTaskPriority(task) || "normal";

  return (
    <div className={selected ? "selected-graph-task-wrap" : ""}>
      <PremiumRow
        title={getTaskTitle(task)}
        subtitle={getTaskDescription(task) || metadata.recommendation || "Task details unavailable."}
        tone={toneFromSeverity(priority || status)}
        meta={[
          { label: "Status", value: status },
          { label: "Priority", value: priority },
          { label: "State", value: task.state || metadata.state || "National" },
          { label: "Source", value: task.source || metadata.source || task.type || "Task" },
        ]}
        right={
          <div className="vs-inline-actions command-panel-actions">
            <Badge tone={toneFromSeverity(priority || status)}>{status}</Badge>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onSelectTask?.(task)}
            >
              Graph
            </button>
          </div>
        }
      />
    </div>
  );
}

function TaskFilterBar({ activeFilter, onFilter, counts }) {
  return (
    <div className="task-filter-bar">
      {TASK_FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`task-filter-btn ${activeFilter === filter.id ? "is-active" : ""}`}
          onClick={() => onFilter(filter.id)}
        >
          <span>{filter.label}</span>
          <b>{counts[filter.id] || 0}</b>
        </button>
      ))}
    </div>
  );
}

function ConsultantIntelligencePanel({ data, loading, onRefresh }) {
  const summary = data?.summary || {};
  const topInfluence = data?.top_influence || data?.topInfluencers || [];
  const topExposure = data?.top_exposure || [];
  const riskWatch = number(summary.high_exposure) + number(summary.watch_closely);

  return (
    <div data-tour="command-consultants">
      <SectionCard
        title="Consultant Intelligence"
        subtitle="Track consultants, candidate relationships, and review signals."
        right={
          <div className="vs-inline-actions command-panel-actions">
            <Badge tone={riskWatch ? "danger" : "active"}>
              {riskWatch ? `${riskWatch} risk watch` : "No urgent consultant risk"}
            </Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={onRefresh}>
              Refresh
            </button>
            <Link className="vs-button" to="/consultant-intel">
              Open Consultant Intelligence
            </Link>
          </div>
        }
      >
        {loading ? (
          <EmptyState text="Loading consultant intelligence..." />
        ) : (
          <div className="vs-stack">
            <div className="vs-grid-4">
              <StatCard label="FEC Consultants" value={summary.fec_consultants || summary.fec_imported || 0} subtext="Imported consultant records" />
              <StatCard label="Avg Influence" value={summary.avg_influence || 0} subtext="Overall influence score" />
              <StatCard label="Avg Exposure" value={summary.avg_exposure || 0} subtext="Cross-campaign risk" />
              <StatCard label="Needs Review" value={riskWatch} subtext="Consultants needing review" />
            </div>

            <div className="vs-grid-2 command-two-col">
              <div className="vs-stack">
                <div className="vs-stat-label">Top Consultants by Influence</div>
                {arr(topInfluence).length ? (
                  arr(topInfluence).slice(0, 4).map((item) => (
                    <PremiumRow
                      key={item.id || item.name || item.firm_name}
                      title={item.name || item.firm_name || "Consultant"}
                      subtitle={joinText([item.category || "Political Consulting", item.state || "National"])}
                      tone={toneFromScore(item.influence_score)}
                      meta={[
                        { label: "Influence", value: item.influence_score || 0 },
                        { label: "Battleground", value: item.battleground_score || 0 },
                        { label: "Clients", value: item.clients_count || item.mapped_candidates || 0 },
                        { label: "Spend", value: money(item.total_fec_disbursements || item.mapped_amount) },
                      ]}
                      right={<Badge tone={toneFromScore(item.influence_score)}>{item.influence_score || 0}</Badge>}
                    />
                  ))
                ) : (
                  <EmptyState text="No top consultant records loaded yet." />
                )}
              </div>

              <div className="vs-stack">
                <div className="vs-stat-label">Consultants to Review</div>
                {arr(topExposure).length ? (
                  arr(topExposure).slice(0, 4).map((item) => (
                    <PremiumRow
                      key={item.id || item.name || item.firm_name}
                      title={item.name || item.firm_name || "Consultant"}
                      subtitle={item.risk_summary || joinText([item.category || "Political Consulting", item.state || "National"])}
                      tone={toneFromScore(item.exposure_score)}
                      meta={[
                        { label: "Exposure", value: item.exposure_score || 0 },
                        { label: "Overlap", value: item.overlap_score || 0 },
                        { label: "Risk", value: item.risk_label || "Signal" },
                        { label: "Influence", value: item.influence_score || 0 },
                      ]}
                      right={<Badge tone={toneFromScore(item.exposure_score)}>{item.risk_label || "Watch"}</Badge>}
                    />
                  ))
                ) : (
                  <EmptyState text="No consultant exposure issues loaded yet." />
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function RelationshipIntelligencePanel({ graph, loading }) {
  const counts = graph?.counts || {};
  const insights = graph?.insights || {};
  const topInfluencers = insights.top_influencers || insights.topInfluencers || [];
  const strongestLinks = insights.strongest_links || insights.highStrengthLinks || [];
  const weakCoverage = insights.orphan_candidates || insights.orphanCandidates || [];
  const density = counts.nodes ? Math.round((number(counts.links) / Math.max(number(counts.nodes), 1)) * 100) : 0;

  return (
    <div data-tour="command-relationships">
      <SectionCard
        title="Relationship Intelligence"
        subtitle="Shows how candidates, consultants, and donors are connected across the platform."
        right={
          <div className="vs-inline-actions command-panel-actions">
            <Badge tone={arr(weakCoverage).length ? "warning" : "active"}>
              {arr(weakCoverage).length ? `${arr(weakCoverage).length} weak coverage` : "No urgent relationship risk"}
            </Badge>
            <Link className="vs-button vs-button-secondary" to="/relationship-graph">
              Open Graph
            </Link>
          </div>
        }
      >
        {loading ? (
          <EmptyState text="Loading relationship intelligence..." />
        ) : !graph ? (
          <EmptyState text="No relationship graph intelligence available yet." />
        ) : (
          <div className="vs-stack">
            <div className="vs-grid-4">
              <StatCard label="Candidates" value={counts.candidates || 0} subtext="Candidate records" />
              <StatCard label="Consultants" value={counts.consultants || 0} subtext="Consultant records" />
              <StatCard label="Donors" value={counts.donors || 0} subtext="Donor records" />
              <StatCard label="Density" value={`${density}%`} subtext={`${counts.links || 0} relationship paths`} />
            </div>

            <div className="vs-grid-2 command-two-col">
              <div className="vs-stack">
                <div className="vs-stat-label">Most Connected People and Groups</div>
                {arr(topInfluencers).length ? (
                  arr(topInfluencers).slice(0, 4).map((node) => (
                    <PremiumRow
                      key={node.id || node.label}
                      title={node.label || node.id || "Network record"}
                      subtitle={node.subtitle || node.type || "Network record"}
                      meta={[
                        { label: "Type", value: node.type || "Node" },
                        { label: "Influence", value: node.influence || 0 },
                      ]}
                      right={<Badge tone="info">{node.influence || 0}</Badge>}
                    />
                  ))
                ) : (
                  <EmptyState text="No connected network records available yet." />
                )}
              </div>

              <div className="vs-stack">
                <div className="vs-stat-label">Strongest Connections</div>
                {arr(strongestLinks).length ? (
                  arr(strongestLinks).slice(0, 4).map((link, index) => {
                    const source = typeof link.source === "object" ? link.source.label || link.source.id : link.source;
                    const target = typeof link.target === "object" ? link.target.label || link.target.id : link.target;

                    return (
                      <PremiumRow
                        key={`${source}-${target}-${index}`}
                        title={joinText([source, target]) || "Relationship connection"}
                        subtitle={link.label || "Relationship connection"}
                        meta={[
                          { label: "Strength", value: link.strength || 0 },
                          { label: "Type", value: link.type || "relationship" },
                        ]}
                        right={<Badge tone="active">{link.strength || 0}</Badge>}
                      />
                    );
                  })
                ) : (
                  <EmptyState text="No strong relationship connections available yet." />
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function CrossSignalPanel({ data, loading }) {
  const priorities = data?.top_priorities || data?.results || [];
  const summary = data?.summary || {};

  return (
    <div data-tour="command-cross-signal">
      <SectionCard
        title="Cross-Signal Priority Layer"
        subtitle="Combines fundraising, vendors, mail, relationships, and race pressure into one priority list."
        right={<Badge tone={number(summary.critical_states) ? "danger" : "active"}>{summary.critical_states || 0} critical</Badge>}
      >
        {loading ? (
          <EmptyState text="Loading cross-signal intelligence..." />
        ) : (
          <div className="vs-stack">
            <div className="vs-grid-4">
              <StatCard label="Tracked States" value={summary.states_tracked || 0} subtext="States being monitored" />
              <StatCard label="Critical States" value={summary.critical_states || 0} subtext="Needs action now" />
              <StatCard label="High States" value={summary.high_states || 0} subtext="Needs close watch" />
              <StatCard label="Vendor Gaps" value={summary.vendor_gap_states || 0} subtext="Vendor coverage gaps" />
            </div>

            {arr(priorities).length ? (
              arr(priorities).slice(0, 6).map((item, index) => (
                <PremiumRow
                  key={`${item.state}-${index}`}
                  title={`#${index + 1} ${item.state || "National"} - ${item.severity || "Priority"}`}
                  subtitle={(item.recommended_actions || []).join(" ") || "Multiple signals suggest this state needs review."}
                  tone={toneFromSeverity(item.severity)}
                  meta={[
                    { label: "Score", value: item.priority_score || 0 },
                    { label: "Receipts", value: money(item.finance?.receipts) },
                    { label: "Vendors", value: item.vendors?.coverage_status || "N/A" },
                    { label: "Mail Risk", value: item.mailops?.mail_risks || 0 },
                  ]}
                  right={<Badge tone={toneFromSeverity(item.severity)}>{item.risk || "Watch"}</Badge>}
                />
              ))
            ) : (
              <EmptyState text="No cross-signal priorities loaded." />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function DarkMoneyExposurePanel({ data, loading }) {
  const summary = data?.summary || {};
  const rows = data?.top_exposure || [];

  return (
    <div data-tour="command-dark-money">
      <SectionCard
        title="Dark Money Exposure Layer"
        subtitle="Committee influence chains, consultant overlap, and cross-state exposure tracking."
        right={
          <div className="vs-inline-actions command-panel-actions">
            <Badge tone={number(summary.critical_exposure) ? "danger" : "active"}>{summary.critical_exposure || 0} critical</Badge>
            <Link className="vs-button vs-button-secondary" to="/dark-money-exposure">Open Dark Money Layer</Link>
          </div>
        }
      >
        {loading ? (
          <EmptyState text="Loading dark money exposure intelligence..." />
        ) : (
          <div className="vs-stack">
            <div className="vs-grid-4">
              <StatCard label="Tracked Committees" value={summary.total_committees || 0} subtext="Mapped committees" />
              <StatCard label="Critical Exposure" value={summary.critical_exposure || 0} subtext="Immediate review" />
              <StatCard label="High Exposure" value={summary.high_exposure || 0} subtext="Elevated activity" />
              <StatCard label="Money Flow" value={money(summary.total_amount || 0)} subtext="Mapped influence flow" />
            </div>

            {arr(rows).length ? (
              arr(rows).slice(0, 5).map((item, index) => (
                <PremiumRow
                  key={`${item.committee_id || item.committee_name}-${index}`}
                  title={item.committee_name || item.committee_id || "Committee"}
                  subtitle={item.narrative || "Committee exposure signal requires review."}
                  tone={toneFromSeverity(item.severity)}
                  live={String(item.severity || "").toLowerCase() === "critical"}
                  meta={[
                    { label: "Exposure", value: item.exposure_score || 0 },
                    { label: "Consultants", value: item.consultant_count || 0 },
                    { label: "Candidates", value: item.candidate_count || 0 },
                    { label: "Money Flow", value: money(item.total_amount) },
                  ]}
                  right={<Badge tone={toneFromSeverity(item.severity)}>{item.exposure_tier || "Exposure"}</Badge>}
                />
              ))
            ) : (
              <EmptyState text="No dark money exposure records loaded yet." />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ExecutiveAlertEnginePanel({ alerts = [], counts = {}, loading }) {
  const loadedCriticalCount = arr(alerts).filter((alert) => String(alert.severity || "").toLowerCase() === "critical").length;
  const loadedHighCount = arr(alerts).filter((alert) => String(alert.severity || "").toLowerCase() === "high").length;

  const criticalCount = counts?.critical !== undefined && counts?.critical !== null
    ? number(counts.critical)
    : loadedCriticalCount;
  const highCount = counts?.high !== undefined && counts?.high !== null
    ? number(counts.high)
    : loadedHighCount;
  const totalCount = counts?.total !== undefined && counts?.total !== null
    ? number(counts.total)
    : arr(alerts).length;

  return (
    <div data-tour="command-alert-engine">
      <SectionCard
        title="Executive Alert Engine"
        subtitle="Cross-signal operational alerts generated from consultant exposure, dark money, relationship strength, and campaign intelligence."
        right={
          <div className="vs-inline-actions command-panel-actions">
            <Badge tone={criticalCount ? "danger" : "active"}>{criticalCount} critical</Badge>
            <Badge tone={highCount ? "warning" : "active"}>{highCount} high</Badge>
            <Badge tone={totalCount ? "info" : "default"}>{totalCount} active</Badge>
          </div>
        }
      >
        {loading ? (
          <EmptyState text="Loading executive alert engine..." />
        ) : (
          <div className="vs-stack">
            {arr(alerts).length ? (
              arr(alerts).slice(0, 8).map((alert) => (
                <PremiumRow
                  key={alert.id || `${alert.type}-${alert.title}`}
                  title={alert.title || "Executive alert"}
                  subtitle={alert.recommendation || alert.source || "Review and assign owner."}
                  tone={toneFromSeverity(alert.severity)}
                  live={["critical", "high"].includes(String(alert.severity || "").toLowerCase())}
                  meta={[
                    { label: "Severity", value: alert.severity || "medium" },
                    { label: "Type", value: alert.type || "signal" },
                    { label: "State", value: alert.state || "National" },
                    { label: "Risk", value: alert.risk || "Monitor" },
                  ]}
                  right={<Badge tone={toneFromSeverity(alert.severity)}>{alert.severity || "Signal"}</Badge>}
                />
              ))
            ) : (
              <EmptyState text="No executive alerts detected." />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function BattlegroundPanel({ rows = [] }) {
  return (
    <div data-tour="command-battlegrounds">
      <SectionCard title="Top Battlegrounds" subtitle="Priority races that need the most attention right now.">
        <div className="vs-stack">
          {arr(rows).length ? (
            arr(rows).map((row) => (
              <PremiumRow
                key={row.race || `${row.state}-${row.office}`}
                title={row.race || `${row.state} ${row.office}`}
                subtitle={joinText([row.state || "State", row.office || "Race"])}
                tone={toneFromSeverity(row.risk)}
                meta={[
                  { label: "Win Prob.", value: row.probability || row.win_probability || "N/A" },
                  { label: "Momentum", value: row.momentum || "N/A" },
                  { label: "Risk", value: row.risk || "Watch" },
                  { label: "Priority", value: row.priority || "Tier 2" },
                ]}
                right={<Badge tone={toneFromSeverity(row.risk)}>{row.risk || "Watch"}</Badge>}
              />
            ))
          ) : (
            <EmptyState text="No battleground races loaded." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function ActionPanel({ actions = [] }) {
  return (
    <div data-tour="command-priorities">
      <SectionCard title="Execution Priorities" subtitle="Recommended actions for the campaign team.">
        <div className="vs-stack">
          {arr(actions).length ? (
            arr(actions).slice(0, 8).map((item) => (
              <PremiumRow
                key={item.title}
                title={item.title}
                subtitle={item.detail || "Execution priority"}
                tone={toneFromSeverity(item.risk)}
                meta={[
                  { label: "Owner", value: item.owner || "Command Team" },
                  { label: "Due", value: item.due || "Today" },
                  { label: "State", value: item.state || "National" },
                  { label: "Risk", value: item.risk || "Watch" },
                ]}
                right={<Badge tone="accent">{item.due || "Today"}</Badge>}
              />
            ))
          ) : (
            <EmptyState text="No action priorities loaded." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function ExecutiveFeedPanel({ feed = [], loading }) {
  return (
    <div data-tour="command-feed">
      <SectionCard title="Executive Feed" subtitle="Recent alerts and updates from across the platform.">
        {loading ? (
          <EmptyState text="Loading recent updates..." />
        ) : (
          <div className="vs-stack">
            {arr(feed).length ? (
              arr(feed).slice(0, 8).map((item) => (
                <PremiumRow
                  key={item.id || `${item.time}-${item.title}`}
                  title={item.title}
                  subtitle={joinText([item.source || "Command Center", item.type || ""])}
                  tone={toneFromSeverity(item.severity)}
                  live={["high", "critical"].includes(String(item.severity || "").toLowerCase())}
                  meta={[
                    { label: "Time", value: item.time || "Now" },
                    { label: "Severity", value: item.severity || "Info" },
                    { label: "State", value: item.state || "National" },
                    { label: "Risk", value: item.risk || "Watch" },
                  ]}
                  right={<Badge tone={toneFromSeverity(item.severity)}>{item.severity || "Info"}</Badge>}
                />
              ))
            ) : (
              <EmptyState text="No recent command updates loaded." />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}


function ExecutiveSnapshot({ criticalAlertCount = 0, tasks, battlegrounds, executiveDecision }) {
  const openWork = arr(tasks).filter((task) => !isTaskCompleted(task)).length;
  const highestRisk = arr(battlegrounds).find((item) => ["critical", "high"].includes(String(item.risk || "").toLowerCase())) || battlegrounds?.[0];

  return (
    <div className="command-snapshot">
      <div className="command-snapshot-copy">
        <span>Today&apos;s Executive Summary</span>
        <h2>{executiveDecision?.title || "No urgent executive action required"}</h2>
        <p>Live summary generated from alerts, execution tasks, battleground pressure, consultant activity, and relationship intelligence.</p>
      </div>
      <div className="command-snapshot-grid">
        <div><span>Critical Alerts</span><strong>{criticalAlertCount}</strong></div>
        <div><span>Open Work</span><strong>{openWork}</strong></div>
        <div><span>Highest Risk</span><strong>{highestRisk?.race || highestRisk?.state || "Stable"}</strong></div>
        <div><span>Decision Level</span><strong>{executiveDecision?.level || "STABLE"}</strong></div>
      </div>
    </div>
  );
}

function LiveActivityFeed({ feed = [], tasks = [] }) {
  const taskEvents = arr(tasks).slice(0, 4).map((task) => ({
    id: `task-${getTaskId(task) || getTaskTitle(task)}`,
    time: task.updated_at ? new Date(task.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now",
    title: getTaskTitle(task),
    source: task.source || "Execution Board",
  }));

  const items = [...arr(feed).slice(0, 6), ...taskEvents].slice(0, 8);

  return (
    <div className="command-live-feed">
      {items.length ? items.map((item, index) => (
        <div className="command-live-feed-item" key={item.id || `${item.title}-${index}`}>
          <span>{item.time || "Now"}</span>
          <div>
            <strong>{item.title || "Executive activity"}</strong>
            <small>{item.source || item.type || "VoterSpheres"}</small>
          </div>
        </div>
      )) : <EmptyState text="No live activity events available." />}
    </div>
  );
}

function CommandExecutiveHeader({
  metrics,
  criticalAlertCount,
  highAlertCount,
  highSeverityCount,
  taskCounts,
  relationshipCounts,
  darkMoneySummary,
  crossSignal,
  consultantIntel,
  executiveDecision,
  loading,
  consultantLoading,
  onRefresh,
  onUpdateConsultants,
}) {
  // Alert Engine "high" signals are intentionally broader than literal critical alerts.
  // Weight critical alerts heavily, high alerts moderately, and cap aggregate alert pressure
  // so a large but non-critical monitoring queue cannot collapse readiness to zero by itself.
  const alertPressurePenalty = Math.min(
    40,
    number(criticalAlertCount) * 12 + Math.min(number(highAlertCount), 20) * 1.5
  );

  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          alertPressurePenalty -
          number(taskCounts.county * 2) -
          number(darkMoneySummary.critical_exposure * 10)
      )
    )
  );

  return (
    <div className="command-exec-header" id="command-overview">
      <div className="command-exec-copy">
        <span>Executive Command Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Unified executive operations layer for tasks, county escalations, relationship intelligence,
          consultant risk, dark-money exposure, cross-signal pressure, alerts, and campaign execution.
        </p>

        <div className="command-exec-badges">
          <Badge tone={highSeverityCount ? "danger" : "active"}>
            {highSeverityCount ? `${highSeverityCount} High-Priority Alerts` : "No Urgent Alerts"}
          </Badge>
          <Badge tone={taskCounts.county ? "danger" : "active"}>
            {taskCounts.county} County Escalations
          </Badge>
          <Badge tone={number(relationshipCounts.links) ? "accent" : "default"}>
            {relationshipCounts.links || 0} Network Connections
          </Badge>
          <Badge tone={number(darkMoneySummary.critical_exposure) ? "danger" : "active"}>
            {darkMoneySummary.critical_exposure || 0} Dark-Money Critical
          </Badge>
        </div>
      </div>

      <div className="command-exec-grid">
        <div>
          <span>Open Tasks</span>
          <strong>{taskCounts.open || 0}</strong>
        </div>
        <div>
          <span>Completed Work</span>
          <strong>{taskCounts.completed || 0}</strong>
        </div>
        <div>
          <span>Critical States</span>
          <strong>{crossSignal?.summary?.critical_states || 0}</strong>
        </div>
        <div>
          <span>Consultants To Review</span>
          <strong>
            {number(consultantIntel?.summary?.high_exposure) + number(consultantIntel?.summary?.watch_closely)}
          </strong>
        </div>
      </div>

      <div className="command-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing Dashboard..." : "Refresh All Intelligence"}
        </button>
        <button type="button" onClick={onUpdateConsultants} disabled={consultantLoading}>
          {consultantLoading ? "Updating Consultants..." : "Update Consultant Scores"}
        </button>
        <Link to="/executive-decision-intelligence">Decision Center</Link>
        <Link to="/political-graph">Political Graph</Link>
        <Link to={executiveDecision?.link || "/executive-decision-intelligence"}>Open Source System</Link>
      </div>

      <div className="command-exec-metrics">
        {arr(metrics).slice(0, 4).map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.delta || metric.subtext || "Command metric"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const [searchParams] = useSearchParams();
  const [commandData, setCommandData] = useState(fallbackData);
  const [commandLoading, setCommandLoading] = useState(true);
  const [commandError, setCommandError] = useState("");

  const [crossSignal, setCrossSignal] = useState(fallbackCrossSignal);
  const [crossLoading, setCrossLoading] = useState(true);

  const [relationshipGraph, setRelationshipGraph] = useState(null);
  const [relationshipLoading, setRelationshipLoading] = useState(true);

  const [consultantIntel, setConsultantIntel] = useState(fallbackConsultantIntel);
  const [consultantLoading, setConsultantLoading] = useState(true);

  const [darkMoneyIntel, setDarkMoneyIntel] = useState(fallbackDarkMoneyIntel);
  const [darkMoneyLoading, setDarkMoneyLoading] = useState(true);

  const [executiveAlerts, setExecutiveAlerts] = useState(fallbackExecutiveAlerts.alerts);
  const [executiveAlertCounts, setExecutiveAlertCounts] = useState(fallbackExecutiveAlerts.counts);
  const [executiveAlertsLoading, setExecutiveAlertsLoading] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState("all");
  const [changingTaskId, setChangingTaskId] = useState(null);
  const [taskSyncMessage, setTaskSyncMessage] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  const demoMode = typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  const mapBridgeState = String(searchParams.get("state") || "").toUpperCase();
  const mapBridgeSource = searchParams.get("source") || "";
  const mapBridgeAction = searchParams.get("action") || "";
  const mapBridgeRisk = searchParams.get("risk") || "";
  const mapBridgeLayer = searchParams.get("layer") || "";
  const mapBridgeRegion = searchParams.get("region") || "";
  const mapBridgeData = searchParams.get("data") || "";
  const mapBridgeCounty = searchParams.get("county") || "";
  const mapBridgeScore = searchParams.get("score") || "";
  const mapBridgeActive = searchParams.get("active") || "";
  const mapBridgeMailops = searchParams.get("mailops") || "";
  const mapBridgeVendors = searchParams.get("vendors") || "";
  const mapBridgeCountyHeat = searchParams.get("countyHeat") || "";
  const mapBridgePanel = searchParams.get("panel") || "";
  const isExecutiveMapBridge = ["executive-map", "operations-map", "state-operations-map"].includes(mapBridgeSource) && Boolean(mapBridgeState);

  async function loadCommandData() {
    if (demoMode) {
      setCommandData(fallbackData);
      setCommandLoading(false);
      return;
    }

    try {
      setCommandLoading(true);
      setCommandError("");

      const result = api.commandCenter
        ? await api.commandCenter()
        : await api.get("/intelligence/command").then((r) => r.data);

      setCommandData(result || fallbackData);
    } catch (error) {
      setCommandError(error?.response?.data?.error || error?.message || "Failed to load command center.");
      setCommandData(fallbackData);
    } finally {
      setCommandLoading(false);
    }
  }

  async function loadCrossSignal() {
    if (demoMode) {
      setCrossSignal(fallbackCrossSignal);
      setCrossLoading(false);
      return;
    }

    setCrossLoading(true);
    setCrossSignal(await safeLoad(
      () => api.crossSignalIntelligence
        ? api.crossSignalIntelligence()
        : api.get("/intelligence/cross-signal").then((r) => r.data),
      fallbackCrossSignal
    ));
    setCrossLoading(false);
  }

  async function loadRelationshipGraph() {
    if (demoMode) {
      setRelationshipGraph(null);
      setRelationshipLoading(false);
      return;
    }

    setRelationshipLoading(true);
    const result = await safeLoad(
      () => api.relationshipGraph
        ? api.relationshipGraph({ limit: 60 })
        : api.get("/relationships/graph", { params: { limit: 60 } }).then((r) => r.data),
      null
    );
    setRelationshipGraph(unwrapGraph(result));
    setRelationshipLoading(false);
  }

  async function loadConsultantIntel() {
    if (demoMode) {
      setConsultantIntel(fallbackConsultantIntel);
      setConsultantLoading(false);
      return;
    }

    setConsultantLoading(true);
    setConsultantIntel(await safeLoad(
      () => api.get("/consultants/risk/dashboard", { params: { limit: 20 } }).then((r) => r.data),
      fallbackConsultantIntel
    ));
    setConsultantLoading(false);
  }

  async function loadDarkMoneyIntel() {
    if (demoMode) {
      setDarkMoneyIntel(fallbackDarkMoneyIntel);
      setDarkMoneyLoading(false);
      return;
    }

    setDarkMoneyLoading(true);
    setDarkMoneyIntel(await safeLoad(
      () => api.darkMoneyExposure
        ? api.darkMoneyExposure({ limit: 15 })
        : api.get("/dark-money-exposure", { params: { limit: 15 } }).then((r) => r.data),
      fallbackDarkMoneyIntel
    ));
    setDarkMoneyLoading(false);
  }

  async function loadExecutiveAlerts() {
    if (demoMode) {
      setExecutiveAlerts(fallbackExecutiveAlerts.alerts);
      setExecutiveAlertCounts(fallbackExecutiveAlerts.counts);
      setExecutiveAlertsLoading(false);
      return;
    }

    setExecutiveAlertsLoading(true);

    const result = await safeLoad(
      () => api.executiveAlerts
        ? api.executiveAlerts({ limit: 50 })
        : api.get("/executive-alerts", { params: { limit: 50 } }).then((r) => r.data),
      fallbackExecutiveAlerts
    );

    const loadedAlerts = arr(result?.alerts);

    setExecutiveAlerts(loadedAlerts);
    setExecutiveAlertCounts({
      total: result?.counts?.total !== undefined && result?.counts?.total !== null
        ? number(result.counts.total)
        : loadedAlerts.length,
      critical: result?.counts?.critical !== undefined && result?.counts?.critical !== null
        ? number(result.counts.critical)
        : loadedAlerts.filter((alert) => String(alert.severity || "").toLowerCase() === "critical").length,
      high: result?.counts?.high !== undefined && result?.counts?.high !== null
        ? number(result.counts.high)
        : loadedAlerts.filter((alert) => String(alert.severity || "").toLowerCase() === "high").length,
      medium: result?.counts?.medium !== undefined && result?.counts?.medium !== null
        ? number(result.counts.medium)
        : loadedAlerts.filter((alert) => String(alert.severity || "").toLowerCase() === "medium").length,
      low: result?.counts?.low !== undefined && result?.counts?.low !== null
        ? number(result.counts.low)
        : loadedAlerts.filter((alert) => String(alert.severity || "").toLowerCase() === "low").length,
    });

    setExecutiveAlertsLoading(false);
  }

  async function loadTasks() {
  if (demoMode) {
    setTasks([]);
    setTasksLoading(false);
    return;
  }

  setTasksLoading(true);

  const result = await safeLoad(
    () =>
      api.firmWideTasks
        ? api.firmWideTasks({ limit: 100 })
        : api.get("/tasks", { params: { limit: 100 } }).then((r) => r.data),
    []
  );

  setTasks(normalizeList(result));
  setTasksLoading(false);
}

  async function refreshAll() {
    await Promise.all([
      loadCommandData(),
      loadCrossSignal(),
      loadRelationshipGraph(),
      loadConsultantIntel(),
      loadDarkMoneyIntel(),
      loadExecutiveAlerts(),
      loadTasks(),
    ]);
  }

  async function runConsultantRiskScore() {
    try {
      setConsultantLoading(true);
      await api.post("/consultants/risk/score", {});
    } catch {
      // Keep dashboard usable even if scoring endpoint is unavailable.
    } finally {
      await loadConsultantIntel();
    }
  }

  async function handleCountyTaskStatus(task, status) {
    const id = getTaskId(task);
    if (!id) return;

    try {
      setChangingTaskId(id);
      setTaskSyncMessage("");

      if (typeof api.updateCountyCommandTaskStatus === "function") {
        await api.updateCountyCommandTaskStatus(id, { status });
      } else {
        await api.put(`/operations/tasks/county/${id}/status`, { status });
      }

      setTaskSyncMessage(status === "completed" ? "County task completed." : "County task reopened.");
      await loadTasks();
    } catch (error) {
      setTaskSyncMessage(error?.response?.data?.error || error?.message || "Failed to sync county task status.");
    } finally {
      setChangingTaskId(null);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);
  useEffect(() => {
    if (!isExecutiveMapBridge) return;

    const action = String(mapBridgeAction || "").toLowerCase();
    const layerName = String(mapBridgeLayer || "").toLowerCase();

    if (mapBridgeCounty || action.includes("county")) setTaskFilter("county");
    else if (layerName.includes("vendor") || action.includes("vendor")) setTaskFilter("vendor");
    else if (layerName.includes("mail") || action.includes("mail")) setTaskFilter("mailops");
    else if (String(mapBridgeRisk || "").toLowerCase().includes("critical")) setTaskFilter("critical");
    else setTaskFilter("open");
  }, [isExecutiveMapBridge, mapBridgeAction, mapBridgeLayer, mapBridgeCounty, mapBridgeRisk, mapBridgeState]);


  const effectiveData = commandData || fallbackData;
  const metrics = effectiveData.metrics || fallbackData.metrics;
  const battlegrounds = effectiveData.battlegrounds || [];
  const actions = effectiveData.actions || [];
  const feed = effectiveData.feed || [];

  const bridgeScopedTasks = useMemo(() => {
    return isExecutiveMapBridge ? tasks.filter((task) => stateMatchesTask(task, mapBridgeState)) : tasks;
  }, [tasks, isExecutiveMapBridge, mapBridgeState]);

  const taskCounts = useMemo(() => {
    const sourceTasks = bridgeScopedTasks;

    return {
      all: sourceTasks.length,
      county: sourceTasks.filter(isCountyEscalationTask).length,
      vendor: sourceTasks.filter(isVendorTask).length,
      mailops: sourceTasks.filter(isMailOpsTask).length,
      critical: sourceTasks.filter((task) => ["critical", "high"].includes(getTaskPriority(task))).length,
      open: sourceTasks.filter((task) => !["complete", "completed", "done", "resolved", "archived"].includes(getTaskStatus(task))).length,
      completed: sourceTasks.filter((task) => ["complete", "completed", "done", "resolved"].includes(getTaskStatus(task))).length,
    };
  }, [bridgeScopedTasks]);

  const filteredTasks = useMemo(() => {
    return bridgeScopedTasks.filter((task) => {
      const status = getTaskStatus(task);
      const priority = getTaskPriority(task);

      if (taskFilter === "county") return isCountyEscalationTask(task);
      if (taskFilter === "vendor") return isVendorTask(task);
      if (taskFilter === "mailops") return isMailOpsTask(task);
      if (taskFilter === "critical") return ["critical", "high"].includes(priority);
      if (taskFilter === "open") return !["complete", "completed", "done", "resolved", "archived"].includes(status);
      if (taskFilter === "completed") return ["complete", "completed", "done", "resolved"].includes(status);

      return true;
    });
  }, [bridgeScopedTasks, taskFilter]);

  const mapBridgeTasks = bridgeScopedTasks;

  const countyEscalationTasks = useMemo(() => filteredTasks.filter(isCountyEscalationTask), [filteredTasks]);
  const standardTasks = useMemo(() => filteredTasks.filter((task) => !isCountyEscalationTask(task)), [filteredTasks]);

  useEffect(() => {
    if (!filteredTasks.length) {
      setSelectedTask(null);
      return;
    }

    setSelectedTask((current) => {
      if (current && filteredTasks.some((task) => String(getTaskId(task) || getTaskTitle(task)) === String(getTaskId(current) || getTaskTitle(current)))) {
        return current;
      }

      return filteredTasks[0];
    });
  }, [filteredTasks]);

  const stateScopedFeed = useMemo(() => {
    if (!isExecutiveMapBridge || !mapBridgeState) return feed;
    return arr(feed).filter((item) => String(item.state || "").toUpperCase() === mapBridgeState || String(item.title || "").toUpperCase().includes(mapBridgeState));
  }, [feed, isExecutiveMapBridge, mapBridgeState]);

  const stateScopedExecutiveAlerts = useMemo(() => {
    if (!isExecutiveMapBridge || !mapBridgeState) return executiveAlerts;

    return arr(executiveAlerts).filter((item) => {
      const state = String(item.state || "").toUpperCase();
      const title = String(item.title || "").toUpperCase();

      return state === mapBridgeState || title.includes(mapBridgeState);
    });
  }, [executiveAlerts, isExecutiveMapBridge, mapBridgeState]);

  const stateScopedActions = useMemo(() => {
    if (!isExecutiveMapBridge || !mapBridgeState) return actions;
    return arr(actions).filter((item) => String(item.state || "").toUpperCase() === mapBridgeState || String(item.title || item.detail || "").toUpperCase().includes(mapBridgeState));
  }, [actions, isExecutiveMapBridge, mapBridgeState]);

  const stateScopedBattlegrounds = useMemo(() => {
    if (!isExecutiveMapBridge || !mapBridgeState) return battlegrounds;
    return arr(battlegrounds).filter((item) => String(item.state || "").toUpperCase() === mapBridgeState || String(item.race || item.office || "").toUpperCase().includes(mapBridgeState));
  }, [battlegrounds, isExecutiveMapBridge, mapBridgeState]);

  const executiveDecision = useMemo(
    () => buildDecision(stateScopedExecutiveAlerts, consultantIntel, darkMoneyIntel),
    [stateScopedExecutiveAlerts, consultantIntel, darkMoneyIntel]
  );

  const scopedCriticalAlertCount = arr(stateScopedExecutiveAlerts).filter(
    (item) => String(item.severity || "").toLowerCase() === "critical"
  ).length;
  const scopedHighAlertCount = arr(stateScopedExecutiveAlerts).filter(
    (item) => String(item.severity || "").toLowerCase() === "high"
  ).length;

  const criticalAlertCount = isExecutiveMapBridge
    ? scopedCriticalAlertCount
    : number(executiveAlertCounts.critical);
  const highAlertCount = isExecutiveMapBridge
    ? scopedHighAlertCount
    : number(executiveAlertCounts.high);
  const executiveAlertTotal = isExecutiveMapBridge
    ? stateScopedExecutiveAlerts.length
    : number(executiveAlertCounts.total, executiveAlerts.length);
  const highSeverityCount = criticalAlertCount + highAlertCount;

  const relationshipCounts = relationshipGraph?.counts || {};
  const darkMoneySummary = darkMoneyIntel?.summary || {};

  const navSections = [
    { id: "command-overview", label: "Overview" },
    { id: "command-map-bridge-section", label: "Map Handoff", badge: isExecutiveMapBridge ? mapBridgeTasks.length : undefined },
    { id: "command-decision-section", label: "Decision" },
    { id: "command-execution-section", label: "Execution Board", badge: filteredTasks.length },
    { id: "command-county-section", label: "County Heat", badge: countyEscalationTasks.length },
    { id: "command-consultants-section", label: "Consultants" },
    { id: "command-relationships-section", label: "Relationships", badge: relationshipCounts.links || 0 },
    { id: "command-cross-signal-section", label: "Cross Signal", badge: crossSignal?.summary?.critical_states || 0 },
    { id: "command-dark-money-section", label: "Dark Money", badge: darkMoneySummary.critical_exposure || 0 },
    { id: "command-alerts-section", label: "Alerts", badge: executiveAlertTotal },
    { id: "command-battlegrounds-section", label: "Battlegrounds", badge: stateScopedBattlegrounds.length },
    { id: "command-live-activity-section", label: "Live Activity", badge: stateScopedFeed.length },
    { id: "command-feed-section", label: "Feed", badge: stateScopedFeed.length },
  ];

  return (
    <PageShell
      eyebrow="Executive Command Center"
      title="Manage campaign operations from one executive dashboard."
      description="Review battleground races, consultant activity, relationship networks, dark-money exposure, alerts, and county escalation tasks in one place."
      demo={demoMode}
      demoText="Demo Command Center data is active."
    >
      <style>{`


        .command-snapshot {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 16px;
          border: 1px solid rgba(96, 165, 250, 0.22);
          border-radius: 26px;
          padding: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.74));
        }
        .command-snapshot-copy span { color: rgba(125, 211, 252, 0.94); font-size: 11px; font-weight: 950; letter-spacing: 0.1em; text-transform: uppercase; }
        .command-snapshot-copy h2 { margin: 8px 0 0; color: white; font-size: 26px; line-height: 1.18; letter-spacing: -0.045em; }
        .command-snapshot-copy p { margin: 9px 0 0; color: rgba(203, 213, 225, 0.74); line-height: 1.55; }
        .command-snapshot-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .command-snapshot-grid div { border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.13); background: rgba(2, 6, 23, 0.32); padding: 12px; min-width: 0; }
        .command-snapshot-grid span { display: block; color: rgba(203, 213, 225, 0.62); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
        .command-snapshot-grid strong { display: block; margin-top: 6px; color: white; font-size: 18px; overflow-wrap: anywhere; }

        .command-live-feed { display: grid; gap: 10px; }
        .command-live-feed-item { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 12px; align-items: start; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.13); background: rgba(15, 23, 42, 0.54); padding: 12px; }
        .command-live-feed-item > span { color: rgba(125, 211, 252, 0.9); font-size: 11px; font-weight: 900; }
        .command-live-feed-item strong { display: block; color: white; font-size: 13px; }
        .command-live-feed-item small { display: block; margin-top: 4px; color: rgba(203, 213, 225, 0.64); }

        .map-bridge-banner {
          border: 1px solid rgba(96, 165, 250, 0.28);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 32%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.68));
          border-radius: 24px;
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.18);
        }

        .map-bridge-banner h3 {
          margin: 0;
          color: var(--vs-text);
          font-size: 20px;
          letter-spacing: -0.04em;
        }

        .map-bridge-banner p {
          margin: 7px 0 0;
          color: var(--vs-muted);
          line-height: 1.5;
          max-width: 920px;
        }

        .map-bridge-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .map-bridge-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        @media (max-width: 900px) {
  
        .map-bridge-banner {
            grid-template-columns: 1fr;
          }

          .map-bridge-actions {
            justify-content: flex-start;
          }
        }


        [data-tour] {
          scroll-margin: 120px;
        }

        .command-panel-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
          min-width: 0;
        }

        .command-two-col {
          align-items: start;
        }

        .command-bottom-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }

        .command-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .task-filter-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: stretch;
          margin-bottom: 16px;
        }

        .task-filter-btn {
          max-width: 100%;
          min-height: 42px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.84);
          border-radius: 16px;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.2;
          white-space: normal;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .task-filter-btn span {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .task-filter-btn b {
          flex: 0 0 auto;
          color: white;
          background: rgba(59, 130, 246, 0.22);
          border: 1px solid rgba(96, 165, 250, 0.22);
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 11px;
        }

        .task-filter-btn.is-active {
          border-color: rgba(96, 165, 250, 0.62);
          color: white;
          background: rgba(37, 99, 235, 0.32);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .vs-premium-row-card,
        .county-task-card,
        .task-sync-message {
          min-width: 0;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .vs-premium-row-card {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.54);
          overflow: hidden;
        }

        .vs-premium-row-card.is-live,
        .vs-premium-row-card.danger {
          border-color: rgba(248, 113, 113, 0.3);
          box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.08);
        }

        .county-task-grid-wrap {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .county-task-card {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.68));
          padding: 18px;
          box-shadow: 0 18px 45px rgba(2, 6, 23, 0.18);
          opacity: 1;
        }

        .county-task-card.is-completed {
          opacity: 0.72;
          border-color: rgba(34, 197, 94, 0.34);
        }

        .county-task-card.is-selected-graph-task,
        .selected-graph-task-wrap .vs-premium-row-card {
          border-color: rgba(96, 165, 250, 0.66);
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.28), 0 18px 45px rgba(37, 99, 235, 0.14);
        }

        .county-task-card.danger {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .county-task-card.warning {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .county-task-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          min-width: 0;
        }

        .county-task-title-wrap {
          min-width: 0;
          flex: 1 1 auto;
        }

        .county-task-kicker {
          display: block;
          color: rgba(96, 165, 250, 0.92);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .county-task-card.is-completed .county-task-kicker {
          color: rgba(74, 222, 128, 0.95);
        }

        .county-task-top strong {
          display: block;
          color: white;
          font-size: 17px;
          font-weight: 950;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .county-task-top p {
          margin: 6px 0 0;
          color: rgba(203, 213, 225, 0.68);
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .county-task-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
          min-width: 0;
          flex: 0 1 auto;
        }

        .county-task-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .county-task-grid div {
          min-width: 0;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(15, 23, 42, 0.54);
          padding: 11px;
        }

        .county-task-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
        }

        .county-task-grid b {
          display: block;
          color: white;
          font-size: 14px;
          margin-top: 4px;
          overflow-wrap: anywhere;
        }

        .county-task-recommendation {
          margin-top: 14px;
          border-radius: 18px;
          border: 1px solid rgba(96, 165, 250, 0.22);
          background: rgba(37, 99, 235, 0.12);
          padding: 13px;
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .county-task-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
          min-width: 0;
        }

        .task-sync-message {
          margin-bottom: 14px;
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.22);
          background: rgba(37, 99, 235, 0.12);
          color: rgba(226, 232, 240, 0.9);
          padding: 12px 14px;
          font-size: 13px;
        }



        .decision-intelligence-command-card {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 32%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.72));
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.9fr) auto;
          gap: 18px;
          align-items: center;
          box-shadow: 0 22px 55px rgba(2, 6, 23, 0.22);
          min-width: 0;
        }

        .decision-intelligence-command-copy {
          min-width: 0;
        }

        .decision-intelligence-kicker {
          display: inline-flex;
          color: rgba(125, 211, 252, 0.96);
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 8px;
        }

        .decision-intelligence-command-copy h3 {
          margin: 0;
          color: white;
          font-size: 22px;
          line-height: 1.18;
          letter-spacing: -0.04em;
          overflow-wrap: anywhere;
        }

        .decision-intelligence-command-copy p {
          margin: 8px 0 0;
          color: rgba(203, 213, 225, 0.76);
          line-height: 1.5;
          max-width: 820px;
          overflow-wrap: anywhere;
        }

        .decision-intelligence-command-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          min-width: 0;
        }

        .decision-intelligence-command-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.58);
          padding: 12px;
          min-width: 0;
        }

        .decision-intelligence-command-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .decision-intelligence-command-grid b {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .decision-intelligence-command-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
          justify-content: center;
          min-width: 220px;
        }


        .command-exec-header {
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

        .command-exec-copy {
          min-width: 0;
        }

        .command-exec-copy span,
        .command-exec-grid span,
        .command-exec-metrics span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .command-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .command-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .command-exec-badges,
        .command-exec-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .command-exec-badges {
          margin-top: 14px;
        }

        .command-exec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .command-exec-grid div,
        .command-exec-metrics div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .command-exec-grid strong,
        .command-exec-metrics strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .command-exec-metrics small {
          display: block;
          margin-top: 6px;
          color: rgba(226, 232, 240, 0.66);
          font-size: 12px;
          line-height: 1.4;
        }

        .command-exec-actions {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .command-exec-actions button,
        .command-exec-actions a {
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

        .command-exec-actions button:hover,
        .command-exec-actions a:hover {
          border-color: rgba(251, 146, 60, 0.48);
          background: rgba(251, 146, 60, 0.14);
          color: white;
        }

        .command-exec-actions button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .command-exec-metrics {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .command-section-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .command-executive-actions-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
        }

        @media (max-width: 1100px) {
          .command-snapshot,
          .county-task-grid-wrap,
          .command-bottom-grid,
          .command-two-col,
          .decision-intelligence-command-card,
          .command-exec-header,
          .command-exec-metrics {
            grid-template-columns: 1fr;
          }

          .decision-intelligence-command-actions {
            min-width: 0;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: flex-start;
          }
        }

        @media (max-width: 760px) {
          .county-task-grid,
          .command-exec-grid,
          .command-snapshot-grid {
            grid-template-columns: 1fr;
          }

          .county-task-top {
            flex-direction: column;
          }

          .county-task-badges {
            justify-content: flex-start;
          }
        }
      `}</style>

      {commandError ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {commandError}
        </div>
      ) : null}

      {isExecutiveMapBridge ? (
        <div className="map-bridge-banner" data-tour="command-map-bridge">
          <div>
            <h3>{mapBridgeState} Executive Map Handoff</h3>
            <p>
              This Command Center view is filtered from the Executive Operations Map. Review related execution tasks,
              county escalations, vendor gaps, alerts, and recommended follow-up for the selected state.
            </p>
            <div className="map-bridge-meta">
              <Badge tone={mapBridgeRisk ? "danger" : "accent"}>{mapBridgeRisk || "Operational Review"}</Badge>
              <Badge tone="accent">{mapBridgeAction || "map-handoff"}</Badge>
              {mapBridgePanel ? <Badge tone="info">Panel: {mapBridgePanel}</Badge> : null}
              {mapBridgeLayer ? <Badge tone="info">Layer: {mapBridgeLayer}</Badge> : null}
              {mapBridgeRegion ? <Badge tone="default">{mapBridgeRegion}</Badge> : null}
              {mapBridgeData ? <Badge tone={mapBridgeData === "live" ? "active" : "warning"}>{mapBridgeData} data</Badge> : null}
              {mapBridgeCounty ? <Badge tone="warning">County: {mapBridgeCounty}</Badge> : null}
              {mapBridgeScore ? <Badge tone="accent">Score: {mapBridgeScore}</Badge> : null}
              {mapBridgeCountyHeat ? <Badge tone="warning">County heat: {mapBridgeCountyHeat}</Badge> : null}
              {mapBridgeActive ? <Badge tone={Number(mapBridgeActive) ? "danger" : "active"}>Active: {mapBridgeActive}</Badge> : null}
              {mapBridgeVendors ? <Badge tone={Number(mapBridgeVendors) ? "warning" : "active"}>Vendors: {mapBridgeVendors}</Badge> : null}
              {mapBridgeMailops ? <Badge tone={Number(mapBridgeMailops) ? "warning" : "active"}>MailOps: {mapBridgeMailops}</Badge> : null}
              <Badge tone={mapBridgeTasks.length ? "active" : "default"}>{mapBridgeTasks.length} matching tasks</Badge>
            </div>
          </div>

          <div className="map-bridge-actions">
            <Link className="vs-button vs-button-secondary" to={buildMapReturnUrl(mapBridgeState)}>
              Back to Executive Map
            </Link>
            <Link className="vs-button vs-button-secondary" to={`/state-operations/${mapBridgeState}`}>
              County Drilldown
            </Link>
            <Link className="vs-button" to={`/vendors?state=${mapBridgeState}&source=command-center`}>
              Vendor Coverage
            </Link>
          </div>
        </div>
      ) : null}

      <CollapsibleSection
        id="command-task-graph-section"
        title="Task Relationship Graph"
        subtitle="Selected task context connected to candidates, donors, vendors, endorsements, states, and related actions."
        defaultOpen={false}
        right={selectedTask ? <Badge tone="accent">{getTaskTitle(selectedTask)}</Badge> : <Badge tone="default">No Task Selected</Badge>}
      >
        {selectedTask ? (
          <PoliticalGraphContextPanel
            entityType="task"
            entityId={getTaskId(selectedTask)}
            entityName={getTaskTitle(selectedTask)}
            state={getTaskStateCode(selectedTask)}
            title="Task Relationship Graph"
            subtitle="Click any Command Center task to load its candidates, donors, vendors, endorsements, states, and related actions."
            compact
          />
        ) : (
          <EmptyState text="Select a task from the execution board to view relationship graph context." />
        )}

        <div className="vs-inline-actions command-panel-actions" style={{ marginTop: 12 }}>
          <Link
            className="vs-button vs-button-secondary"
            to={
              selectedTask
                ? `/political-graph?search=${encodeURIComponent(getTaskTitle(selectedTask))}`
                : "/political-graph"
            }
          >
            Open Political Graph
          </Link>
        </div>
      </CollapsibleSection>

      {isExecutiveMapBridge ? (
        <CollapsibleSection
          id="command-map-bridge-section"
          title={`${mapBridgeState} Executive Map Handoff Summary`}
          subtitle="Task and priority summary from the Executive Operations Map handoff."
          defaultOpen
          right={<Badge tone={mapBridgeTasks.length ? "active" : "default"}>{mapBridgeTasks.length} Matching Tasks</Badge>}
        >
          <div className="vs-grid-4" data-tour="command-map-filter-summary">
            <StatCard label="State Filter" value={mapBridgeState} subtext={mapBridgeRegion || "Executive map handoff"} tone="up" />
            <StatCard label="Matching Tasks" value={mapBridgeTasks.length} subtext={`${taskCounts.open || 0} open • ${taskCounts.completed || 0} completed`} tone={mapBridgeTasks.length ? "up" : "neutral"} />
            <StatCard label="Auto Filter" value={TASK_FILTERS.find((item) => item.id === taskFilter)?.label || taskFilter} subtext="Selected from map layer/action" tone="up" />
            <StatCard label="Priority" value={mapBridgeRisk || "Review"} subtext={mapBridgeLayer ? `Layer: ${mapBridgeLayer}` : "Executive review"} tone={mapBridgeRisk ? "down" : "neutral"} />
          </div>
        </CollapsibleSection>
      ) : null}

      <div className="command-section-stack">
        <ExecutiveSnapshot
          criticalAlertCount={criticalAlertCount}
          tasks={bridgeScopedTasks}
          battlegrounds={stateScopedBattlegrounds}
          executiveDecision={executiveDecision}
        />

        <CommandExecutiveHeader
          metrics={metrics}
          criticalAlertCount={criticalAlertCount}
          highAlertCount={highAlertCount}
          highSeverityCount={highSeverityCount}
          taskCounts={taskCounts}
          relationshipCounts={relationshipCounts}
          darkMoneySummary={darkMoneySummary}
          crossSignal={crossSignal}
          consultantIntel={consultantIntel}
          executiveDecision={executiveDecision}
          loading={commandLoading || crossLoading || relationshipLoading || consultantLoading || darkMoneyLoading || executiveAlertsLoading || tasksLoading}
          consultantLoading={consultantLoading}
          onRefresh={refreshAll}
          onUpdateConsultants={runConsultantRiskScore}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      <CollapsibleSection
        id="command-overview-metrics"
        title="Executive Command Metrics"
        subtitle="Primary campaign command metrics from the live intelligence command layer."
        defaultOpen
        right={<Badge tone={highSeverityCount ? "danger" : "active"}>{highSeverityCount ? `${highSeverityCount} High-Priority Alerts` : "Stable"}</Badge>}
      >
        <MetricGrid metrics={metrics} />
      </CollapsibleSection>

      <CollapsibleSection
        id="command-decision-section"
        title="Executive Decision Intelligence"
        subtitle="AI decision layer, ranked options, confidence scoring, risk review, and executive action paths."
        defaultOpen
        right={<Badge tone={executiveDecision?.level === "STABLE" ? "active" : "danger"}>{executiveDecision?.level || "Stable"}</Badge>}
      >
        <DecisionIntelligenceCommandCard />
      </CollapsibleSection>

      <CollapsibleSection
        id="command-recommended-action-section"
        title="Recommended Executive Action"
        subtitle="Top action based on alerts, consultant activity, relationship data, and dark-money exposure."
        defaultOpen
        right={<Badge tone={executiveDecision?.level === "STABLE" ? "active" : "danger"}>{executiveDecision?.level || "STABLE"}</Badge>}
      >
        <div data-tour="command-recommended-action">
        <SectionCard
          title="Recommended Executive Action"
          subtitle="The top action to review based on alerts, consultant activity, relationship data, and dark-money exposure."
          right={<Badge tone={executiveDecision?.level === "STABLE" ? "active" : "danger"}>{executiveDecision?.level || "STABLE"}</Badge>}
        >
          <div className="vs-card-muted" style={{ padding: 16, display: "grid", gap: 12, minWidth: 0 }}>
            <div style={{ color: "var(--vs-text)", fontSize: 18, fontWeight: 900, overflowWrap: "anywhere" }}>
              {executiveDecision?.title}
            </div>
            <div style={{ color: "var(--vs-text-muted)", fontSize: 12, fontWeight: 800 }}>
              Source system: {executiveDecision?.sourceLabel || "Executive Decision Intelligence"}
            </div>

            <div className="vs-grid-3">
              {(executiveDecision?.actions || []).map((action) => (
                <div key={action} className="vs-banner" style={{ margin: 0, overflowWrap: "anywhere" }}>
                  {action}
                </div>
              ))}
            </div>

            <div>
              <Link className="vs-button vs-button-secondary" to={executiveDecision?.link || "/executive-decision-intelligence"}>
                Open Source System
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="command-execution-section"
        title="Executive Execution Board"
        subtitle={isExecutiveMapBridge ? `Tasks filtered from Executive Operations Map for ${mapBridgeState}.` : "Tasks connected to campaign intelligence, county heat, vendors, MailOps, and operations."}
        defaultOpen
        right={<Badge tone={filteredTasks.length ? "info" : "default"}>{isExecutiveMapBridge ? `${filteredTasks.length} ${mapBridgeState} shown` : `${filteredTasks.length} shown`}</Badge>}
      >
      <div data-tour="command-execution-board">
        <SectionCard
          title="Executive Execution Board"
          subtitle={isExecutiveMapBridge ? `Tasks filtered from Executive Operations Map for ${mapBridgeState}.` : "Tasks connected to campaign intelligence, county heat, vendors, MailOps, and operations."}
          right={<Badge tone={filteredTasks.length ? "info" : "default"}>{isExecutiveMapBridge ? `${filteredTasks.length} ${mapBridgeState} shown` : `${filteredTasks.length} shown`}</Badge>}
        >
          {tasksLoading ? (
            <EmptyState text="Loading execution board..." />
          ) : (
            <>
              <TaskFilterBar activeFilter={taskFilter} onFilter={setTaskFilter} counts={taskCounts} />

              {taskSyncMessage ? <div className="task-sync-message">{taskSyncMessage}</div> : null}

              {countyEscalationTasks.length ? (
                <div id="command-county-section">
                  <ShowMoreList
                    items={countyEscalationTasks}
                    initialCount={8}
                    showAllLabel={(count) => `Show All ${count} County Escalations`}
                    className="county-task-grid-wrap"
                    renderItem={(task) => (
                      <CountyEscalationTaskCard
                        task={task}
                        selected={sameTask(task, selectedTask)}
                        onSelectTask={setSelectedTask}
                        onStatusChange={handleCountyTaskStatus}
                        changing={changingTaskId === getTaskId(task)}
                      />
                    )}
                  />
                </div>
              ) : null}

              {standardTasks.length ? (
                <ShowMoreList
                  items={standardTasks}
                  initialCount={12}
                  showAllLabel={(count) => `Show All ${count} Standard Tasks`}
                  className="vs-stack"
                  renderItem={(task) => (
                    <StandardTaskCard
                      task={task}
                      selected={sameTask(task, selectedTask)}
                      onSelectTask={setSelectedTask}
                    />
                  )}
                />
              ) : countyEscalationTasks.length ? null : (
                <EmptyState text={isExecutiveMapBridge ? `No ${mapBridgeState} tasks match the selected filter yet.` : "No tasks match the selected filter."} />
              )}
            </>
          )}
        </SectionCard>
      </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="command-consultants-section"
        title="Consultant Intelligence"
        subtitle="Track consultants, candidate relationships, and review signals."
        defaultOpen={false}
        right={<Badge tone={(number(consultantIntel?.summary?.high_exposure) + number(consultantIntel?.summary?.watch_closely)) ? "danger" : "active"}>{(number(consultantIntel?.summary?.high_exposure) + number(consultantIntel?.summary?.watch_closely)) || 0} Risk Watch</Badge>}
      >
        <ConsultantIntelligencePanel data={consultantIntel} loading={consultantLoading} onRefresh={loadConsultantIntel} />
      </CollapsibleSection>

      <CollapsibleSection
        id="command-relationships-section"
        title="Relationship Intelligence"
        subtitle="Candidates, consultants, donors, and strongest graph relationships."
        defaultOpen={false}
        right={<Badge tone={number(relationshipCounts.links) ? "accent" : "default"}>{relationshipCounts.links || 0} Links</Badge>}
      >
        <RelationshipIntelligencePanel graph={relationshipGraph} loading={relationshipLoading} />
      </CollapsibleSection>

      <CollapsibleSection
        id="command-cross-signal-section"
        title="Cross-Signal Priority Layer"
        subtitle="Fundraising, vendors, mail, relationships, and race pressure in one priority view."
        defaultOpen={false}
        right={<Badge tone={number(crossSignal?.summary?.critical_states) ? "danger" : "active"}>{crossSignal?.summary?.critical_states || 0} Critical</Badge>}
      >
        <CrossSignalPanel data={crossSignal} loading={crossLoading} />
      </CollapsibleSection>

      <CollapsibleSection
        id="command-dark-money-section"
        title="Dark Money Exposure Layer"
        subtitle="Committee influence chains, consultant overlap, and cross-state exposure tracking."
        defaultOpen={false}
        right={<Badge tone={number(darkMoneySummary.critical_exposure) ? "danger" : "active"}>{darkMoneySummary.critical_exposure || 0} Critical</Badge>}
      >
        <DarkMoneyExposurePanel data={darkMoneyIntel} loading={darkMoneyLoading} />
      </CollapsibleSection>

      <CollapsibleSection
        id="command-alerts-section"
        title="Executive Alert Engine"
        subtitle="Cross-signal operational alerts from consultant exposure, dark money, relationships, and campaign intelligence."
        defaultOpen={false}
        right={<Badge tone={executiveAlertTotal ? "info" : "default"}>{executiveAlertTotal} Alerts</Badge>}
      >
        <ExecutiveAlertEnginePanel
          alerts={stateScopedExecutiveAlerts}
          counts={
            isExecutiveMapBridge
              ? {
                  total: executiveAlertTotal,
                  critical: criticalAlertCount,
                  high: highAlertCount,
                  medium: stateScopedExecutiveAlerts.filter((alert) => String(alert.severity || "").toLowerCase() === "medium").length,
                  low: stateScopedExecutiveAlerts.filter((alert) => String(alert.severity || "").toLowerCase() === "low").length,
                }
              : executiveAlertCounts
          }
          loading={executiveAlertsLoading}
        />
      </CollapsibleSection>



      <CollapsibleSection
        id="command-battlegrounds-section"
        title="Battlegrounds and Execution Priorities"
        subtitle="Priority races and recommended campaign actions."
        defaultOpen={false}
        right={<Badge tone="accent">{stateScopedBattlegrounds.length} Battlegrounds</Badge>}
      >
        <div className="command-bottom-grid">
          <BattlegroundPanel rows={stateScopedBattlegrounds} />
          <ActionPanel actions={stateScopedActions} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="command-live-activity-section"
        title="Live Activity Feed"
        subtitle="Recent execution, alert, and campaign activity across the platform."
        defaultOpen={false}
        right={<Badge tone="active">Live</Badge>}
      >
        <LiveActivityFeed feed={stateScopedFeed} tasks={bridgeScopedTasks} />
      </CollapsibleSection>

      <CollapsibleSection
        id="command-feed-section"
        title="Executive Feed"
        subtitle="Recent alerts and updates from across the platform."
        defaultOpen={false}
        right={<Badge tone="info">{stateScopedFeed.length} Updates</Badge>}
      >
        <ExecutiveFeedPanel feed={stateScopedFeed} loading={commandLoading} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
