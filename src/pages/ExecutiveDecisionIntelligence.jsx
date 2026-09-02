import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchDecisionIntelligence } from "../api/decisionIntelligenceApi";
import { useWorkspace } from "../context/WorkspaceContext";

import PageShell from "../components/ui/PageShell";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const MODULE_NAMES = {
  executive_workspace: "Executive Workspace",
  command_center: "Executive Command Center",
  crm: "Campaign CRM",
  political_signals: "Political Signals",
  unified_executive_intelligence: "Unified Executive Intelligence",
  executive_mission_control: "Executive Mission Control",
  strategy_recommendations: "AI Strategy Recommendations",
  strategy: "AI Strategy Recommendations",
  forecast_summary: "Executive Forecast",
  forecast_battlegrounds: "Battleground Forecast",
  forecast: "Executive Forecast",
  coalition_rankings: "Coalition Intelligence",
  coalition_actions: "Coalition Intelligence",
  coalition: "Coalition Intelligence",
  influence_rankings: "Influence Intelligence",
  influence_alerts: "Influence Intelligence",
  influence: "Influence Intelligence",
  candidates: "Candidate Intelligence",
  fec: "FEC Intelligence",
  workspaces: "Workspaces",
  tasks: "Task Operations",
  alerts: "Executive Alerts",
  clients: "Client Intelligence",
  reports: "Intelligence Reports",
  notification_events: "Notification Events",
  workspace_activity: "Workspace Activity",
  executive_ai_missions: "Executive AI Missions",
  decision_intelligence: "Legacy Decision Intelligence Source",
};

const PRIORITY_NAMES = {
  critical: "Critical Executive Alert",
  high: "High Priority Executive Alert",
  medium: "Medium Priority Executive Monitoring Alert",
  low: "Low Priority Informational Executive Signal",
  open: "Open Executive Review",
  active: "Active Executive Review",
  review: "Executive Review",
  stable: "Stable Executive Posture",
  planning: "Executive Planning Stage",
  pending: "Pending Executive Action",
  completed: "Completed Executive Action",
  complete: "Completed Executive Action",
};

const DECISION_TYPE_NAMES = {
  execution_control: "Execution Control",
  client_risk_control: "Client Risk Control",
  strategic_review: "Strategic Review",
  material_alert_review: "Material Alert Review",
  political_signal_review: "Political Signal Review",
  strategy_execution: "Strategy Execution",
  forecast_response: "Forecast Response",
  coalition_response: "Coalition Response",
  influence_response: "Influence Response",
  resource_allocation: "Executive Resource Allocation",
  coalition_activation: "Coalition Activation Strategy",
  risk_control: "Executive Risk Control",
};

const MODULE_CONTRIBUTIONS = {
  executive_workspace:
    "Workspace execution pressure, readiness, tasks, client exposure, and current operating posture contributed directly to this decision.",
  command_center:
    "Command Center execution ownership and operational follow-through are connected to this decision path.",
  crm:
    "Campaign CRM client and relationship exposure contributed to the recommended action.",
  political_signals:
    "Scoped political signals were evaluated for materiality before being allowed to influence the decision queue.",
  unified_executive_intelligence:
    "Unified Executive Intelligence supplied the scoped executive briefing, source health, and cross-workspace context.",
  executive_mission_control:
    "Mission Control supplied firm-wide portfolio pressure and operational exception context.",
  strategy_recommendations:
    "AI Strategy Recommendation intelligence was evaluated as corroborating strategic evidence.",
  strategy:
    "AI Strategy Recommendation intelligence was evaluated as corroborating strategic evidence.",
  forecast:
    "Forecast intelligence was evaluated for material battleground movement and decision relevance.",
  coalition:
    "Coalition intelligence was evaluated for material voter-bloc movement and execution opportunity.",
  influence:
    "Influence intelligence was evaluated for material network movement and strategic exposure.",
};

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

function clean(value = "") {
  return String(value ?? "").trim();
}

function labelize(value = "") {
  return clean(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function fullModuleName(value = "") {
  const key = clean(value).toLowerCase();
  return MODULE_NAMES[key] || labelize(value || "Cross-Module Intelligence");
}

function fullPriorityLabel(value = "") {
  const key = clean(value).toLowerCase();
  return PRIORITY_NAMES[key] || labelize(value || "Executive Monitoring Priority");
}

function fullDecisionType(value = "") {
  const key = clean(value).toLowerCase();
  return DECISION_TYPE_NAMES[key] || labelize(value || "Strategic Executive Decision");
}

function toneFromPriority(value = "") {
  const next = clean(value).toLowerCase();
  if (["critical", "high", "danger", "unavailable", "error"].includes(next)) return "danger";
  if (["medium", "watch", "warning", "planning", "degraded"].includes(next)) return "accent";
  if (["open", "active", "stable", "complete", "completed", "available", "live"].includes(next)) return "active";
  return "default";
}

function safeRoute(value, fallback = "/executive-decision-intelligence") {
  const route = clean(value);
  if (route.startsWith("/") && !route.startsWith("//")) return route;
  return fallback;
}

function executiveRoute(item = {}, fallback = "/executive-decision-intelligence") {
  const explicit = clean(item.route);
  if (explicit.startsWith("/") && !explicit.startsWith("//")) return explicit;

  const haystack = [
    item.title,
    item.action_label,
    item.recommendation,
    item.rationale,
    item.decision_type,
    item.source,
    item.source_module,
    ...arr(item.source_modules),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes("relationship") || haystack.includes("influence graph")) return "/relationship-graph";
  if (haystack.includes("dark money") || haystack.includes("fec") || haystack.includes("pac")) return "/dark-money-exposure";
  if (haystack.includes("consultant")) return "/consultant-intel";
  if (haystack.includes("vendor") || haystack.includes("media buy") || haystack.includes("direct mail")) return "/vendors";
  if (haystack.includes("fundrais") || haystack.includes("donor") || haystack.includes("finance")) return "/fundraising-dashboard";
  if (haystack.includes("crm") || haystack.includes("client") || haystack.includes("follow-up") || haystack.includes("contact")) return "/campaign-crm";
  if (haystack.includes("county") || haystack.includes("field") || haystack.includes("gotv") || haystack.includes("operations")) return "/operations-map";
  if (haystack.includes("coalition") || haystack.includes("strategy") || haystack.includes("path to victory")) return "/strategy";
  if (haystack.includes("battleground") || haystack.includes("race pressure") || haystack.includes("forecast")) return "/national-command";
  if (haystack.includes("political signal") || haystack.includes("narrative") || haystack.includes("news")) return "/political-signals";
  if (haystack.includes("candidate") || haystack.includes("opponent")) return "/candidates";
  if (haystack.includes("task") || haystack.includes("execution") || haystack.includes("command center")) return "/command-center";

  return safeRoute(fallback);
}

function formatTime(value) {
  if (!value) return "Awaiting refresh";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Awaiting refresh";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function workspaceTitle(workspace = {}) {
  return clean(workspace.name) || clean(workspace.candidate_name) || `Workspace ${workspace.id || ""}`.trim();
}

function FieldBlock({ label, value, tone = "default" }) {
  return (
    <div className="edi-field-block">
      <span>{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}

function ScoreBar({ value = 0, inverse = false }) {
  const width = Math.max(0, Math.min(100, number(value)));
  return (
    <div className={inverse ? "edi-score-bar inverse" : "edi-score-bar"}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

function ExecutivePercentCard({ title, value, subtitle, inverse = false }) {
  return (
    <div className="edi-score-card">
      <div className="edi-score-card-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <ScoreBar value={value} inverse={inverse} />
    </div>
  );
}

function DecisionRow({ decision, active, onClick }) {
  return (
    <button type="button" className={active ? "edi-decision-row is-active" : "edi-decision-row"} onClick={onClick}>
      <div className="edi-row-header">
        <div>
          <div className="edi-kicker">Executive Decision Brief</div>
          <h3>{decision.title || "Executive decision"}</h3>
          <p>{decision.rationale || decision.recommendation || "Executive decision requires review."}</p>
        </div>
      </div>
      <div className="edi-field-grid">
        <FieldBlock label="Decision Category" value={fullDecisionType(decision.decision_type)} tone="info" />
        <FieldBlock label="Executive Priority" value={fullPriorityLabel(decision.priority)} tone={toneFromPriority(decision.priority)} />
        <FieldBlock label="Projected Strategic Impact Percentage" value={pct(decision.impact_score)} tone="active" />
        <FieldBlock label="Projected Execution Risk Percentage" value={pct(decision.risk_score)} tone="danger" />
      </div>
    </button>
  );
}

function DecisionOption({ option }) {
  return (
    <div className="edi-option-card">
      <div className="edi-row-header">
        <div>
          <div className="edi-kicker">Executive Decision Option</div>
          <h3>{option.label || "Executive decision option"}</h3>
          <p>{option.description || "Scenario path requires executive review."}</p>
        </div>
      </div>
      <div className="edi-field-grid option-fields">
        <FieldBlock label="Projected Strategic Impact Percentage" value={pct(option.projected_impact)} tone="active" />
        <FieldBlock label="Projected Execution Risk Percentage" value={pct(option.projected_risk)} tone="danger" />
        <FieldBlock label="Option Confidence Percentage" value={pct(option.confidence)} tone="info" />
        <FieldBlock label="Execution Timeline" value={option.timeline || "Not specified"} tone="accent" />
        <FieldBlock label="Resource Cost Level" value={labelize(option.cost_level || "Context dependent")} tone="default" />
      </div>
    </div>
  );
}

function EvidenceRow({ evidence }) {
  const route = executiveRoute(evidence, evidence.route || "/executive-decision-intelligence");
  return (
    <div className="edi-evidence-card">
      <div>
        <div className="edi-kicker">{fullModuleName(evidence.source)}</div>
        <strong>{evidence.title || "Decision evidence"}</strong>
        <p>{evidence.detail || "Evidence detail is not available."}</p>
      </div>
      <div className="edi-evidence-actions">
        {evidence.priority ? <Badge tone={toneFromPriority(evidence.priority)}>{fullPriorityLabel(evidence.priority)}</Badge> : null}
        <Link className="vs-button vs-button-secondary" to={route}>Open Source</Link>
      </div>
    </div>
  );
}

function ExecutiveAction({ action, decision }) {
  const route = executiveRoute({ ...decision, ...action }, action.route || decision?.route || "/command-center");
  return (
    <div className="edi-action-card">
      <div className="edi-action-left">
        <span className="edi-live-dot" />
        <div>
          <strong>{action.action_label || "Executive action"}</strong>
          <p>{action.owner || "Executive Team"} · {action.due_window || "Next review cycle"}</p>
        </div>
      </div>
      <div className="edi-action-controls">
        <Badge tone={toneFromPriority(action.status || "pending")}>{fullPriorityLabel(action.status || "pending")}</Badge>
        <Link className="vs-button vs-button-primary" to={route}>Open Action</Link>
      </div>
    </div>
  );
}

function TimelineStep({ label, active }) {
  return (
    <div className={active ? "edi-timeline-step active" : "edi-timeline-step"}>
      <span />
      <strong>{label}</strong>
    </div>
  );
}

function ModuleContribution({ source }) {
  const key = clean(source).toLowerCase();
  return (
    <div className="edi-module-card">
      <strong>{fullModuleName(source)}</strong>
      <p>{MODULE_CONTRIBUTIONS[key] || "This intelligence system supplied corroborating evidence or operating context to the executive synthesis."}</p>
    </div>
  );
}

function SourceHealthRow({ source }) {
  const status = clean(source.status || (source.ok ? "available" : "unavailable")).toLowerCase();
  return (
    <div className="edi-source-row">
      <div>
        <strong>{fullModuleName(source.key)}</strong>
        <p>
          {labelize(source.freshness || "unknown freshness")}
          {source.duration_ms != null ? ` · ${number(source.duration_ms)} ms` : ""}
          {source.origin ? ` · ${labelize(source.origin)}` : ""}
        </p>
      </div>
      <Badge tone={toneFromPriority(status)}>{labelize(status)}</Badge>
    </div>
  );
}

export default function ExecutiveDecisionIntelligence() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, loadingWorkspaces } = useWorkspace();

  const [data, setData] = useState(null);
  const [activeDecisionId, setActiveDecisionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const selectedWorkspace = useMemo(
    () => arr(workspaces).find((item) => String(item.id) === String(activeWorkspaceId)) || null,
    [workspaces, activeWorkspaceId]
  );

  const loadData = useCallback(async ({ quiet = false } = {}) => {
    if (loadingWorkspaces) return;
    try {
      quiet ? setRefreshing(true) : setLoading(true);
      setError("");
      const result = await fetchDecisionIntelligence({ workspaceId: activeWorkspaceId || null });
      setData(result);
      setActiveDecisionId((current) => {
        const decisions = arr(result.decisions);
        if (current && decisions.some((item) => String(item.id) === String(current))) return current;
        return decisions[0]?.id || null;
      });
    } catch (loadError) {
      setData(null);
      setActiveDecisionId(null);
      setError(loadError?.message || "Unable to load live Executive Decision Intelligence.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeWorkspaceId, loadingWorkspaces]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const decisions = arr(data?.decisions);
  const signals = arr(data?.signals);
  const summary = data?.summary || {};
  const evidence = data?.evidence || {};
  const sourceStatus = arr(evidence.source_status);

  const activeDecision = useMemo(
    () => decisions.find((item) => String(item.id) === String(activeDecisionId)) || decisions[0] || null,
    [decisions, activeDecisionId]
  );

  const availableSources = number(summary.availableSources, sourceStatus.filter((item) => clean(item.status).toLowerCase() === "available").length);
  const degradedSources = number(summary.degradedSources, sourceStatus.filter((item) => clean(item.status).toLowerCase() === "degraded").length);
  const unavailableSources = number(summary.unavailableSources, sourceStatus.filter((item) => clean(item.status).toLowerCase() === "unavailable").length);

  const scope = data?.scope || {};
  const scopeName =
    clean(scope.workspace_name) ||
    (selectedWorkspace ? workspaceTitle(selectedWorkspace) : "") ||
    (activeWorkspaceId ? `Workspace ${activeWorkspaceId}` : "Executive Scope");

  const activeRoute = activeDecision ? executiveRoute(activeDecision, activeDecision.route || "/command-center") : "/command-center";

  const executiveNavSections = [
    { id: "edi-overview", label: "Overview" },
    { id: "edi-decision-queue", label: "Decision Queue", badge: decisions.length },
    { id: "edi-ai-recommendation", label: "AI Recommendation" },
    { id: "edi-workflow", label: "Workflow" },
    { id: "edi-options", label: "Options", badge: arr(activeDecision?.options).length },
    { id: "edi-evidence", label: "Evidence", badge: arr(activeDecision?.evidence).length },
    { id: "edi-modules", label: "Intelligence", badge: arr(activeDecision?.source_modules).length },
    { id: "edi-actions", label: "Actions", badge: arr(activeDecision?.actions).length },
    { id: "edi-signals", label: "Signals", badge: signals.length },
    { id: "edi-health", label: "Source Health", badge: sourceStatus.length },
  ];

  return (
    <PageShell
      eyebrow="Executive Decision Intelligence"
      title="Executive Decision Intelligence"
      description="Live evidence-backed executive decision synthesis for ranking strategic choices, comparing decision paths, scoring operational risk, and routing accountable action across VoterSpheres."
      demo={false}
    >
      <style>{`
        .edi-enterprise-shell { display: grid; gap: 24px; }
        .edi-toolbar, .edi-toolbar-actions, .edi-action-controls, .edi-evidence-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .edi-toolbar { justify-content: space-between; align-items: flex-start; }
        .edi-toolbar-actions { justify-content: flex-end; }
        .edi-scope-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); gap: 16px; align-items: end; border: 1px solid var(--vs-exec-border, var(--vs-border)); border-radius: 20px; padding: 16px; background: rgba(15, 23, 42, 0.54); }
        .edi-scope-copy span, .edi-field-block span, .edi-score-card-head span { color: var(--vs-text-muted); font-size: 10px; line-height: 1.35; font-weight: 950; text-transform: uppercase; letter-spacing: 0.10em; }
        .edi-scope-copy strong { display: block; margin-top: 6px; color: var(--vs-text); font-size: 18px; }
        .edi-scope-copy p { margin: 6px 0 0; color: var(--vs-text-muted); font-size: 12px; line-height: 1.55; }
        .edi-workspace-select { width: 100%; border: 1px solid var(--vs-exec-border, var(--vs-border)); border-radius: 14px; background: rgba(2, 6, 23, 0.68); color: var(--vs-text); padding: 11px 12px; font: inherit; }
        .edi-section-stack { display: grid; gap: 18px; }
        .edi-section-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr); gap: 18px; align-items: start; }
        .edi-decision-row, .edi-option-card, .edi-action-card, .edi-score-card, .edi-module-card, .edi-evidence-card, .edi-source-row, .edi-timeline-panel, .edi-recommendation-panel { border: 1px solid var(--vs-exec-border, var(--vs-border)); border-radius: 20px; background: rgba(15, 23, 42, 0.54); min-width: 0; }
        .edi-decision-row { width: 100%; color: inherit; padding: 18px; text-align: left; cursor: pointer; transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease; }
        .edi-decision-row:hover, .edi-decision-row.is-active { border-color: rgba(251, 146, 60, 0.50); background: rgba(251, 146, 60, 0.085); transform: translateY(-1px); }
        .edi-row-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .edi-kicker { color: var(--vs-brand-orange, #fb923c); font-size: 10px; font-weight: 950; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 7px; }
        .edi-row-header h3, .edi-recommendation-panel h3 { margin: 0; color: var(--vs-text); line-height: 1.3; overflow-wrap: anywhere; }
        .edi-row-header h3 { font-size: 16px; }
        .edi-row-header p, .edi-module-card p, .edi-evidence-card p, .edi-source-row p, .edi-score-card p { margin: 7px 0 0; color: var(--vs-text-muted); font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }
        .edi-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
        .option-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .edi-field-block { border: 1px solid rgba(148, 163, 184, 0.13); background: rgba(2, 6, 23, 0.28); border-radius: 16px; padding: 12px; display: grid; gap: 8px; min-width: 0; }
        .edi-field-block .vs-badge { width: fit-content; max-width: 100%; white-space: normal; text-align: left; }
        .edi-recommendation-panel { padding: 22px; border-color: rgba(251, 146, 60, 0.30); background: radial-gradient(circle at top right, rgba(251, 146, 60, 0.16), transparent 36%), linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.58)); }
        .edi-recommendation-panel h3 { margin-top: 8px; font-size: clamp(20px, 2vw, 28px); font-weight: 950; letter-spacing: -0.045em; }
        .edi-recommendation-panel p { color: var(--vs-text-muted); line-height: 1.65; }
        .edi-module-row { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 16px; }
        .edi-score-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
        .edi-score-card { padding: 16px; display: grid; gap: 10px; }
        .edi-score-card-head { display: grid; gap: 8px; }
        .edi-score-card-head strong { color: var(--vs-text); font-size: 34px; font-weight: 950; letter-spacing: -0.06em; white-space: nowrap; }
        .edi-score-bar { height: 9px; border-radius: 999px; background: rgba(148, 163, 184, 0.16); overflow: hidden; }
        .edi-score-bar span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #fb923c, #22c55e); }
        .edi-score-bar.inverse span { background: linear-gradient(90deg, #f59e0b, #ef4444); }
        .edi-option-card, .edi-module-card { padding: 17px; }
        .edi-action-card, .edi-evidence-card, .edi-source-row { padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .edi-action-left { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
        .edi-action-left strong, .edi-evidence-card strong, .edi-source-row strong, .edi-module-card strong { color: var(--vs-text); font-size: 14px; line-height: 1.4; }
        .edi-live-dot { width: 10px; height: 10px; margin-top: 5px; border-radius: 999px; background: var(--vs-brand-orange, #fb923c); box-shadow: 0 0 16px rgba(251, 146, 60, 0.65); flex: 0 0 auto; }
        .edi-timeline-panel { padding: 18px; }
        .edi-timeline-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
        .edi-timeline-step { border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 16px; padding: 12px; background: rgba(2, 6, 23, 0.24); }
        .edi-timeline-step span { display: block; width: 10px; height: 10px; border-radius: 999px; background: rgba(148, 163, 184, 0.8); margin-bottom: 10px; }
        .edi-timeline-step.active span { background: var(--vs-brand-orange, #fb923c); box-shadow: 0 0 16px rgba(251, 146, 60, 0.72); }
        .edi-timeline-step strong { color: var(--vs-text); font-size: 12px; line-height: 1.4; }
        .edi-module-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .edi-health-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
        .edi-health-card { border: 1px solid var(--vs-exec-border, var(--vs-border)); border-radius: 16px; background: rgba(2, 6, 23, 0.28); padding: 14px; }
        .edi-health-card span { display: block; color: var(--vs-text-muted); font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .09em; }
        .edi-health-card strong { display: block; margin-top: 7px; color: var(--vs-text); font-size: 24px; }
        @media (max-width: 1280px) { .edi-section-grid, .edi-scope-panel { grid-template-columns: 1fr; } .edi-score-grid, .edi-timeline-grid, .edi-health-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 760px) { .edi-field-grid, .option-fields, .edi-score-grid, .edi-timeline-grid, .edi-module-grid, .edi-health-grid { grid-template-columns: 1fr; } .edi-action-card, .edi-evidence-card, .edi-source-row { align-items: flex-start; flex-direction: column; } }
      `}</style>

      <div className="edi-enterprise-shell">
        <div className="edi-toolbar">
          <div className="vs-chip-row">
            <Badge tone="active">Live Authoritative Synthesis</Badge>
            <Badge tone="accent">{data?.build || "Decision Intelligence 2.0"}</Badge>
            <Badge tone="info">{data?.mode ? labelize(data.mode) : "Live Decision Intelligence"}</Badge>
          </div>
          <div className="edi-toolbar-actions">
            <button type="button" className="vs-button vs-button-secondary" onClick={() => loadData({ quiet: true })} disabled={loading || refreshing || loadingWorkspaces}>
              {refreshing ? "Refreshing..." : "Refresh Executive Intelligence"}
            </button>
            <Link className="vs-button vs-button-secondary" to="/command-center">Open Executive Command Center</Link>
            <Link className="vs-button vs-button-secondary" to="/executive-intelligence">Open Unified Intelligence</Link>
          </div>
        </div>

        <div className="edi-scope-panel">
          <div className="edi-scope-copy">
            <span>Authoritative Decision Scope</span>
            <strong>{scopeName}</strong>
            <p>
              {scope.effective_state || scope.workspace_state || selectedWorkspace?.state || "National"} ·{" "}
              {scope.effective_office || scope.workspace_office || selectedWorkspace?.office || "Campaign"} ·{" "}
              {scope.workspace_cycle || selectedWorkspace?.cycle || "Current cycle"} ·{" "}
              {scope.workspace_scope_mode ? labelize(scope.workspace_scope_mode) : "Workspace scoped"}
            </p>
          </div>
          <select
            className="edi-workspace-select"
            value={activeWorkspaceId || ""}
            onChange={(event) => setActiveWorkspaceId(event.target.value || null)}
            disabled={loadingWorkspaces}
            aria-label="Executive Decision Intelligence workspace"
          >
            {arr(workspaces).length === 0 ? <option value="">No workspace available</option> : null}
            {arr(workspaces).map((workspace) => (
              <option key={workspace.id} value={workspace.id}>{workspaceTitle(workspace)}</option>
            ))}
          </select>
        </div>

        {error ? <div className="vs-banner vs-banner-danger">{error} No fallback or demo decisions were substituted.</div> : null}

        <ExecutivePageNav sections={executiveNavSections} />

        <CollapsibleSection
          id="edi-overview"
          title="Executive Decision Overview"
          subtitle="Authoritative readout for material decisions, confidence, risk, scoped signals, and source coverage."
          defaultOpen
          right={<Badge tone={error ? "danger" : "active"}>{error ? "Live API Error" : "Live Mode"}</Badge>}
        >
          <div className="vs-grid-4" data-tour="decision-intelligence-kpis">
            <StatCard label="Open Executive Decisions" value={number(summary.openDecisions, decisions.length)} subtext="Material decisions requiring leadership review" />
            <StatCard label="High Priority Executive Alerts" value={number(summary.highPriority)} subtext={`${number(summary.criticalDecisions)} critical decisions`} />
            <StatCard label="Average Recommendation Confidence Percentage" value={pct(summary.avgConfidence)} subtext="Average confidence across active live decisions" />
            <StatCard label="Average Operational Risk Percentage" value={pct(summary.avgRisk)} subtext={`${number(summary.materialSignals)} material signals from ${number(summary.scopedSignals)} scoped signals`} />
          </div>
        </CollapsibleSection>

        <div className="edi-section-stack">
          <CollapsibleSection
            id="edi-decision-queue"
            title="Executive Decision Queue"
            subtitle="Ranked live decisions generated only when retrieved evidence crosses the materiality threshold."
            defaultOpen
            right={<Badge tone="info">{decisions.length} Active Executive Decisions</Badge>}
          >
            {loading ? (
              <EmptyState text="Loading live Executive Decision Intelligence..." />
            ) : error ? (
              <EmptyState text="Live Decision Intelligence could not be loaded. No fallback decisions are being shown." />
            ) : decisions.length ? (
              <ShowMoreList
                items={decisions}
                initialCount={8}
                showAllLabel={(count) => `Show All ${count} Executive Decisions`}
                renderItem={(decision) => (
                  <DecisionRow
                    decision={decision}
                    active={String(activeDecision?.id) === String(decision.id)}
                    onClick={() => setActiveDecisionId(decision.id)}
                  />
                )}
              />
            ) : (
              <EmptyState text="No material executive decisions currently cross the live synthesis threshold. This authoritative zero is preserved." />
            )}
          </CollapsibleSection>

          <CollapsibleSection
            id="edi-ai-recommendation"
            title="AI Executive Recommendation"
            subtitle="Primary evidence-backed decision path with scoring, rationale, route, and source traceability."
            defaultOpen
            right={
              activeDecision ? (
                <Badge tone={toneFromPriority(activeDecision.priority)}>{fullPriorityLabel(activeDecision.priority)}</Badge>
              ) : (
                <Badge tone="active">No Material Decision</Badge>
              )
            }
          >
            {activeDecision ? (
              <>
                <div className="edi-recommendation-panel">
                  <div className="vs-page-eyebrow">Recommended Executive Decision Path</div>
                  <h3>{activeDecision.recommendation || activeDecision.title}</h3>
                  <p>{activeDecision.rationale || "No additional executive rationale is available."}</p>
                  <div className="edi-module-row">
                    {arr(activeDecision.source_modules).map((source) => (
                      <Badge key={source} tone="accent">{fullModuleName(source)}</Badge>
                    ))}
                  </div>
                  <div className="edi-toolbar-actions" style={{ marginTop: 18 }}>
                    <Link className="vs-button vs-button-primary" to={activeRoute}>Open Recommended Workflow</Link>
                    <Link className="vs-button vs-button-secondary" to="/command-center">Open Command Center</Link>
                  </div>
                </div>

                <div className="edi-score-grid">
                  <ExecutivePercentCard title="Recommendation Confidence Percentage" value={activeDecision.confidence_score} subtitle="Reliability level for this live executive recommendation." />
                  <ExecutivePercentCard title="Strategic Impact Percentage" value={activeDecision.impact_score} subtitle="Projected strategic value if this path is executed." />
                  <ExecutivePercentCard title="Executive Urgency Percentage" value={activeDecision.urgency_score} subtitle="How quickly leadership should act on this decision." />
                  <ExecutivePercentCard title="Operational Risk Percentage" value={activeDecision.risk_score} subtitle="Downside exposure or operational execution risk." inverse />
                </div>
              </>
            ) : (
              <EmptyState text="No material executive recommendation is active for the selected workspace." />
            )}
          </CollapsibleSection>

          <CollapsibleSection
            id="edi-workflow"
            title="Executive Decision Workflow Timeline"
            subtitle="Where the selected live decision sits inside the VoterSpheres executive operating model."
            defaultOpen={false}
            right={<Badge tone="accent">Live Workflow</Badge>}
          >
            <div className="edi-timeline-panel">
              <div className="edi-timeline-grid">
                <TimelineStep label="Authoritative Evidence Retrieved" active={Boolean(data)} />
                <TimelineStep label="Materiality Analysis Complete" active={Boolean(data)} />
                <TimelineStep label="Executive Review Active" active={Boolean(activeDecision)} />
                <TimelineStep label="Action Routing Available" active={arr(activeDecision?.actions).length > 0 || Boolean(activeDecision?.route)} />
                <TimelineStep label="Operational Execution Monitoring" active={["active", "completed", "complete"].includes(clean(activeDecision?.status).toLowerCase())} />
              </div>
            </div>
          </CollapsibleSection>

          <div className="edi-section-grid">
            <div className="edi-section-stack">
              <CollapsibleSection
                id="edi-options"
                title="Executive Decision Options"
                subtitle="Alternative live decision paths with impact, risk, confidence, timeline, and cost."
                defaultOpen={false}
                right={<Badge tone="accent">{arr(activeDecision?.options).length} Executive Options</Badge>}
              >
                {arr(activeDecision?.options).length ? (
                  <ShowMoreList
                    items={arr(activeDecision.options)}
                    initialCount={4}
                    showAllLabel={(count) => `Show All ${count} Executive Options`}
                    renderItem={(option) => <DecisionOption option={option} />}
                  />
                ) : (
                  <EmptyState text="No alternative decision options are available for the selected decision." />
                )}
              </CollapsibleSection>

              <CollapsibleSection
                id="edi-evidence"
                title="Decision Evidence Trace"
                subtitle="Retrieved evidence supporting the selected decision, with direct routing back to the operating source."
                defaultOpen={false}
                right={<Badge tone="info">{arr(activeDecision?.evidence).length} Evidence Items</Badge>}
              >
                {arr(activeDecision?.evidence).length ? (
                  <ShowMoreList
                    items={arr(activeDecision.evidence)}
                    initialCount={8}
                    showAllLabel={(count) => `Show All ${count} Evidence Items`}
                    renderItem={(item) => <EvidenceRow evidence={item} />}
                  />
                ) : (
                  <EmptyState text="No evidence trace is attached to the selected decision." />
                )}
              </CollapsibleSection>

              <CollapsibleSection
                id="edi-modules"
                title="Cross-Module Intelligence Contribution"
                subtitle="Authoritative VoterSpheres systems that contributed to the selected decision."
                defaultOpen={false}
                right={<Badge tone="info">{arr(activeDecision?.source_modules).length} Modules</Badge>}
              >
                {arr(activeDecision?.source_modules).length ? (
                  <ShowMoreList
                    items={arr(activeDecision.source_modules)}
                    initialCount={6}
                    showAllLabel={(count) => `Show All ${count} Intelligence Modules`}
                    className="edi-module-grid"
                    renderItem={(source) => <ModuleContribution source={source} />}
                  />
                ) : (
                  <EmptyState text="No source-module contribution is attached to the selected decision." />
                )}
              </CollapsibleSection>

              <CollapsibleSection
                id="edi-actions"
                title="Executive Action Path"
                subtitle="Accountable operational follow-through connected to the selected decision."
                defaultOpen={false}
                right={<Badge tone="info">{arr(activeDecision?.actions).length} Executive Actions</Badge>}
              >
                {arr(activeDecision?.actions).length ? (
                  <ShowMoreList
                    items={arr(activeDecision.actions)}
                    initialCount={5}
                    showAllLabel={(count) => `Show All ${count} Executive Actions`}
                    renderItem={(action) => <ExecutiveAction action={action} decision={activeDecision} />}
                  />
                ) : (
                  <EmptyState text="No action path has been generated for the selected decision." />
                )}
              </CollapsibleSection>
            </div>

            <div className="edi-section-stack">
              <CollapsibleSection
                id="edi-signals"
                title="Material Executive Decision Signals"
                subtitle="Only signals that crossed the backend materiality threshold. Authoritative zero values are preserved."
                defaultOpen={false}
                right={<Badge tone="accent">{signals.length} Material Signals</Badge>}
              >
                {signals.length ? (
                  <ShowMoreList
                    items={signals}
                    initialCount={8}
                    showAllLabel={(count) => `Show All ${count} Material Signals`}
                    renderItem={(signal) => (
                      <EvidenceRow
                        evidence={{
                          ...signal,
                          source: signal.source_module || signal.signal_type,
                          detail: signal.description || signal.summary,
                        }}
                      />
                    )}
                  />
                ) : (
                  <EmptyState text={`No material decision signals are active. ${number(summary.scopedSignals)} scoped signals were evaluated without manufacturing fallback signals.`} />
                )}
              </CollapsibleSection>

              <CollapsibleSection
                id="edi-health"
                title="Decision Intelligence Source Health"
                subtitle="Live source coverage used by Decision Intelligence 2.0."
                defaultOpen
                right={<Badge tone={unavailableSources > 0 ? "accent" : "active"}>{availableSources}/{number(summary.sourceCount, sourceStatus.length)} Available</Badge>}
              >
                <div className="edi-health-grid">
                  <div className="edi-health-card"><span>Available Sources</span><strong>{availableSources}</strong></div>
                  <div className="edi-health-card"><span>Degraded Sources</span><strong>{degradedSources}</strong></div>
                  <div className="edi-health-card"><span>Unavailable Sources</span><strong>{unavailableSources}</strong></div>
                  <div className="edi-health-card"><span>Materiality Threshold</span><strong>{number(evidence.materiality_threshold)}%</strong></div>
                </div>

                {sourceStatus.length ? (
                  <ShowMoreList
                    items={sourceStatus}
                    initialCount={14}
                    showAllLabel={(count) => `Show All ${count} Intelligence Sources`}
                    renderItem={(source) => <SourceHealthRow source={source} />}
                  />
                ) : (
                  <EmptyState text="Source-health detail is not currently available." />
                )}
              </CollapsibleSection>
            </div>
          </div>
        </div>

        <div className="vs-chip-row">
          <Badge tone="active">{evidence.authoritative_zero_preserved ? "Authoritative Zero Preserved" : "Authoritative Live Data"}</Badge>
          <Badge tone="info">Auto Seed {evidence.auto_seed_enabled ? "Enabled" : "Disabled"}</Badge>
          <Badge tone="info">Fallback Decisions {evidence.fallback_decisions_enabled ? "Enabled" : "Disabled"}</Badge>
          <Badge tone="accent">Updated {formatTime(data?.generated_at)}</Badge>
        </div>
      </div>

      <BackToTopButton />
    </PageShell>
  );
}
