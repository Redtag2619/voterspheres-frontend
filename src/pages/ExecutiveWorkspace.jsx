import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function number(value = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compactMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number(value));
}

function activityLabel(type) {
  const value = String(type || "activity")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return value || "Activity";
}

function activityTone(type) {
  const value = String(type || "").toLowerCase();

  if (["alert", "risk", "failure", "overdue", "escalation"].some((item) => value.includes(item))) {
    return "danger";
  }

  if (["task", "approval", "pending", "invoice"].some((item) => value.includes(item))) {
    return "demo";
  }

  if (["complete", "published", "created", "success"].some((item) => value.includes(item))) {
    return "active";
  }

  return "accent";
}

function tone(value) {
  const v = String(value || "").toLowerCase();

  if (
    ["critical", "high", "blocked", "overdue", "at risk", "do not launch", "not ready", "failing"].some((x) =>
      v.includes(x)
    )
  ) {
    return "danger";
  }

  if (
    ["watch", "medium", "elevated", "open", "pending", "needs review", "launch with review", "review"].some((x) =>
      v.includes(x)
    )
  ) {
    return "demo";
  }

  if (
    ["stable", "active", "complete", "completed", "launch ready", "ready to launch", "ready"].some((x) =>
      v.includes(x)
    )
  ) {
    return "active";
  }

  return "accent";
}

function scoreTone(score) {
  const n = Number(score || 0);
  if (n >= 85) return "active";
  if (n >= 65) return "demo";
  return "danger";
}

function riskDot(score) {
  const n = Number(score || 0);
  if (n >= 70) return "vs-live-dot";
  if (n >= 40) return "vs-live-dot-warning";
  return "vs-live-dot-success";
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

const workspaceTabs = [
  { key: "home", label: "Home" },
  { key: "launch", label: "Launch" },
  { key: "intelligence", label: "Intelligence" },
  { key: "operations", label: "Operations" },
  { key: "crm", label: "CRM" },
  { key: "revenue", label: "Revenue" },
  { key: "reports", label: "Reports" },
  { key: "tools", label: "Tools" },
];

const launchToolCards = [
  {
    title: "Launch Readiness",
    body: "Final launch gate combining QA, hardening, live feeds, KPI risk, Opportunity Engine, and workspace readiness.",
    to: "/launch-readiness",
    badge: "Launch",
    tone: "active",
  },
  {
    title: "Production Hardening",
    body: "Security, environment, billing, database, workflows, alerts, and deployment blockers.",
    to: "/production-hardening",
    badge: "Hardening",
    tone: "demo",
  },
  {
    title: "Launch QA",
    body: "Smoke-test center for backend, auth, billing, live data, reports, CRM, and core routes.",
    to: "/launch-qa",
    badge: "QA",
    tone: "info",
  },
  {
    title: "Database Stability",
    body: "Postgres connectivity, latency, pool pressure, critical tables, and infrastructure blockers.",
    to: "/database-stability",
    badge: "Database",
    tone: "accent",
  },
  {
    title: "Live Intelligence Layer",
    body: "Feed freshness and launch-readiness status across candidates, FEC, signals, vendors, alerts, reports, and revenue.",
    to: "/live-intelligence-layer",
    badge: "Feeds",
    tone: "active",
  },
  {
    title: "Opportunity Engine",
    body: "Campaign scoring, CRM conversion, follow-up tasking, and consultant revenue pipeline.",
    to: "/opportunity-engine",
    badge: "Pipeline",
    tone: "demo",
  },
];

export default function ExecutiveWorkspace() {
  const [workspaceId, setWorkspaceId] = useState(
    () => localStorage.getItem("vs_active_workspace") || ""
  );

  const [activeTab, setActiveTab] = useState("home");

  const [data, setData] = useState({
    selected_workspace: null,
    workspaces: [],
    summary: {},
    executive_actions: [],
    signals: [],
    tasks: [],
    contacts: [],
    activities: [],
    reports: [],
    vendors: [],
    clients: [],
    invoices: [],
  });

  const [launchData, setLaunchData] = useState({
    summary: {},
    gates: [],
    next_actions: [],
  });

  const [kpis, setKpis] = useState({});
  const [dbStatus, setDbStatus] = useState({});
  const [opportunitySummary, setOpportunitySummary] = useState({});
  const [liveSummary, setLiveSummary] = useState({});
  const [workspaceActivity, setWorkspaceActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      try {
        if (quiet) setRefreshing(true);
        else setLoading(true);

        setError("");

       const [
         workspaceResult,
         launchResult,
         kpiResult,
         dbResult,
         opportunityResult,
         liveResult,
         activityResult,
       ] = await Promise.allSettled([
          api.executiveWorkspaceDashboard(workspaceId || undefined),
          api.launchReadiness ? api.launchReadiness() : Promise.resolve(null),
          api.executiveKpis ? api.executiveKpis() : Promise.resolve(null),
          api.databaseStability ? api.databaseStability() : Promise.resolve(null),
          api.opportunityEngine ? api.opportunityEngine({}) : Promise.resolve(null),
          api.liveIntelligenceLayer ? api.liveIntelligenceLayer() : Promise.resolve(null),
         api.workspaceActivity ? api.workspaceActivity() : Promise.resolve(null),
        ]);

        if (workspaceResult.status === "fulfilled") {
          const result = workspaceResult.value;

          setData({
            selected_workspace: result?.selected_workspace || null,
            workspaces: arr(result?.workspaces),
            summary: result?.summary || {},
            executive_actions: arr(result?.executive_actions),
            signals: arr(result?.signals),
            tasks: arr(result?.tasks),
            contacts: arr(result?.contacts),
            activities: arr(result?.activities),
            reports: arr(result?.reports),
            vendors: arr(result?.vendors),
            clients: arr(result?.clients),
            invoices: arr(result?.invoices),
          });

          if (result?.selected_workspace?.id) {
            localStorage.setItem(
              "vs_active_workspace",
              String(result.selected_workspace.id)
            );
            setWorkspaceId(String(result.selected_workspace.id));
          }
        } else {
          throw workspaceResult.reason;
        }

        if (launchResult.status === "fulfilled" && launchResult.value) {
          setLaunchData({
            summary: launchResult.value?.summary || {},
            gates: arr(launchResult.value?.gates),
            next_actions: arr(launchResult.value?.next_actions),
          });
        }

        if (kpiResult.status === "fulfilled" && kpiResult.value) {
          setKpis(kpiResult.value?.summary || {});
        }

        if (dbResult.status === "fulfilled" && dbResult.value) {
          setDbStatus(dbResult.value?.summary || {});
        }

        if (opportunityResult.status === "fulfilled" && opportunityResult.value) {
          setOpportunitySummary(opportunityResult.value?.summary || {});
        }

        if (liveResult.status === "fulfilled" && liveResult.value) {
          setLiveSummary(liveResult.value?.summary || {});
        }

        if (activityResult.status === "fulfilled" && activityResult.value) {
          setWorkspaceActivity(
            activityResult.value?.activity || []
          );
        }

        setLastUpdated(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            err?.message ||
            "Failed to load Executive Workspace."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const selected = data.selected_workspace;
  const summary = data.summary || {};
  const actions = arr(data.executive_actions);
  const launchSummary = launchData.summary || {};
  const launchActions = arr(launchData.next_actions);
  const launchGates = arr(launchData.gates);

  const workspaceReadinessScore = number(summary.workspace_readiness_score);
  const workspaceActivityCount = number(summary.workspace_activity_count);

  const workspaceOptions = useMemo(() => arr(data.workspaces), [data.workspaces]);

  const topOpportunityLabel = useMemo(() => {
    if (number(opportunitySummary.hot)) return `${opportunitySummary.hot} hot`;
    if (number(opportunitySummary.high)) return `${opportunitySummary.high} high`;
    if (number(opportunitySummary.total)) return `${opportunitySummary.total} scored`;
    return "No pipeline";
  }, [opportunitySummary]);

  const commandDecision = useMemo(() => {
    if (launchSummary.launch_decision) return launchSummary.launch_decision;
    if (workspaceReadinessScore >= 85 && number(summary.pressure_score) < 40) {
      return "Workspace Ready";
    }
    if (number(summary.pressure_score) >= 70) return "Command Review";
    if (number(summary.pressure_score) >= 40) return "Monitor Closely";
    return "Stable";
  }, [launchSummary.launch_decision, summary.pressure_score, workspaceReadinessScore]);

  const executiveBrief = useMemo(() => {
    const primaryAction = launchActions[0] || actions[0] || null;
    const highestRisk =
      arr(data.signals)
        .slice()
        .sort(
          (a, b) =>
            number(b.signal_score || b.score) -
            number(a.signal_score || a.score)
        )[0] || null;

    const strongestOpportunity =
      number(opportunitySummary.hot) > 0
        ? `${opportunitySummary.hot} hot opportunities require follow-up`
        : number(opportunitySummary.high) > 0
          ? `${opportunitySummary.high} high-priority opportunities are active`
          : number(opportunitySummary.total) > 0
            ? `${opportunitySummary.total} opportunities are currently scored`
            : "No qualified revenue opportunity is currently visible";

    return {
      situation:
        launchSummary.launch_decision ||
        `${commandDecision} with ${number(summary.open_tasks)} open tasks`,
      risk:
        highestRisk?.title ||
        highestRisk?.summary ||
        (number(summary.pressure_score) >= 70
          ? "Workspace pressure requires executive review"
          : "No critical political risk is currently identified"),
      action:
        primaryAction?.title ||
        primaryAction?.detail ||
        "Continue monitoring launch, intelligence, and execution signals",
      outcome:
        strongestOpportunity,
    };
  }, [
    actions,
    commandDecision,
    data.signals,
    launchActions,
    launchSummary.launch_decision,
    opportunitySummary.high,
    opportunitySummary.hot,
    opportunitySummary.total,
    summary.open_tasks,
    summary.pressure_score,
  ]);

  const revenueSummary = useMemo(() => {
    const clients = arr(data.clients);
    const invoices = arr(data.invoices);

    const monthlyRevenue = clients.reduce(
      (total, client) => total + number(client.monthly_retainer),
      0
    );

    const outstanding = invoices
      .filter((invoice) =>
        ["open", "pending", "overdue", "unpaid"].includes(
          String(invoice.status || "").toLowerCase()
        )
      )
      .reduce(
        (total, invoice) =>
          total + number(invoice.amount_due ?? invoice.amount ?? invoice.total),
        0
      );

    const atRiskClients = clients.filter((client) =>
      ["risk", "at risk", "watch", "critical"].some((value) =>
        String(client.health_status || "").toLowerCase().includes(value)
      )
    ).length;

    return {
      monthlyRevenue,
      outstanding,
      clientCount: clients.length,
      atRiskClients,
    };
  }, [data.clients, data.invoices]);

  function handleWorkspaceChange(nextId) {
    setWorkspaceId(nextId);

    if (nextId) {
      localStorage.setItem("vs_active_workspace", String(nextId));
    } else {
      localStorage.removeItem("vs_active_workspace");
    }
  }

  return (
    <PageShell
      eyebrow="Executive Workspace"
      title={selected ? selected.name : "Executive Workspace"}
      description="The consolidated VoterSpheres operating home: launch readiness, live intelligence, command actions, opportunity pipeline, CRM, operations, revenue, reports, and executive tools."
      tickerItems={[
        {
          label: "Workspace",
          value: workspaceReadinessScore ? `${workspaceReadinessScore}% Ready` : "Checking",
          dotClass:
            workspaceReadinessScore >= 85
              ? "vs-live-dot-success"
              : workspaceReadinessScore >= 65
              ? "vs-live-dot-warning"
              : "vs-live-dot",
        },
        {
          label: "Launch",
          value: launchSummary.launch_decision || "Checking",
          dotClass:
            launchSummary.launch_decision === "Ready To Launch"
              ? "vs-live-dot-success"
              : launchSummary.launch_decision === "Do Not Launch"
              ? "vs-live-dot"
              : "vs-live-dot-warning",
        },
        {
          label: "Pressure",
          value: summary.pressure_status || "Stable",
          dotClass: riskDot(summary.pressure_score),
        },
        {
          label: "Tasks",
          value: `${summary.open_tasks || 0}`,
          dotClass: summary.open_tasks
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        [data-tour] {
          scroll-margin: 120px;
        }

        .workspace-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }

        .workspace-select {
          display: grid;
          grid-template-columns: 160px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
        }

        .workspace-select label {
          color: rgba(148, 163, 184, .86);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .workspace-select select {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .78);
          color: white;
          padding: 11px 12px;
        }

        .workspace-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .workspace-tab {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, .18);
          background: rgba(15, 23, 42, .72);
          color: rgba(226, 232, 240, .86);
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .workspace-tab.active {
          border-color: rgba(251, 146, 60, .42);
          background: rgba(251, 146, 60, .16);
          color: white;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(360px, .82fr);
          gap: 18px;
          align-items: start;
        }

        .workspace-stack {
          display: grid;
          gap: 14px;
        }

        .workspace-command-card {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 26px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .workspace-command-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .workspace-command-title {
          margin: 0;
          color: white;
          font-size: clamp(34px, 5vw, 58px);
          font-weight: 950;
          letter-spacing: -.075em;
          line-height: .94;
        }

        .workspace-command-sub {
          margin-top: 12px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.7;
          max-width: 860px;
        }

        .workspace-decision {
          margin-top: 18px;
          color: white;
          font-size: clamp(44px, 8vw, 92px);
          line-height: .9;
          font-weight: 950;
          letter-spacing: -.085em;
        }

        .workspace-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .workspace-mini-grid div,
        .workspace-insight-card {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, .14);
          background: rgba(2, 6, 23, .38);
          padding: 14px;
        }

        .workspace-mini-grid span,
        .workspace-insight-label {
          display: block;
          color: rgba(203, 213, 225, .62);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-weight: 900;
        }

        .workspace-mini-grid strong,
        .workspace-insight-value {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -.04em;
        }

        .workspace-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .workspace-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .workspace-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .workspace-module-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .workspace-module-card {
          display: block;
          text-decoration: none;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, .08), transparent 36%),
            rgba(15, 23, 42, .68);
          padding: 16px;
          min-height: 150px;
        }

        .workspace-module-card:hover {
          border-color: rgba(251, 146, 60, .36);
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, .13), transparent 36%),
            rgba(15, 23, 42, .82);
        }

        .workspace-module-card h3 {
          margin: 0;
          color: white;
          font-size: 15px;
          font-weight: 900;
        }

        .workspace-module-card p {
          margin: 8px 0 14px;
          color: rgba(203, 213, 225, .72);
          font-size: 12px;
          line-height: 1.55;
        }

        .workspace-status-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .workspace-brief-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .workspace-brief-card {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .15);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .09), transparent 38%),
            rgba(15, 23, 42, .66);
          padding: 16px;
          min-height: 142px;
        }

        .workspace-brief-card strong {
          display: block;
          margin-top: 10px;
          color: white;
          font-size: 17px;
          line-height: 1.35;
        }

        .workspace-brief-card p {
          margin: 8px 0 0;
          color: rgba(203, 213, 225, .7);
          font-size: 12px;
          line-height: 1.55;
        }

        .workspace-brief-kicker {
          color: rgba(251, 146, 60, .92);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .workspace-revenue-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .workspace-activity-type {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }

        @media (max-width: 1180px) {
          .workspace-brief-grid,
          .workspace-revenue-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1100px) {
          .workspace-grid,
          .workspace-toolbar,
          .workspace-select {
            grid-template-columns: 1fr;
          }

          .workspace-mini-grid,
          .workspace-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1000px) {
          .workspace-module-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .workspace-mini-grid,
          .workspace-status-grid,
          .workspace-brief-grid,
          .workspace-revenue-grid {
            grid-template-columns: 1fr;
          }

          .workspace-command-card {
            padding: 20px;
          }

          .workspace-decision {
            font-size: 42px;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <SectionCard
        title="Workspace Selector"
        subtitle="Choose the campaign workspace that should drive this command view."
      >
        <div className="workspace-toolbar">
          <div className="workspace-select">
            <label>Active workspace</label>
            <select
              value={workspaceId}
              onChange={(event) => handleWorkspaceChange(event.target.value)}
            >
              <option value="">Most recent workspace</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} • {workspace.state} • {workspace.office} •{" "}
                  {workspace.cycle}
                </option>
              ))}
            </select>
          </div>

          <button
            className="vs-button"
            type="button"
            disabled={refreshing}
            onClick={() => load({ quiet: true })}
          >
            {refreshing ? "Refreshing..." : "Refresh Workspace"}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Workspace Navigation"
        subtitle="The workspace is now the home base. Use tabs for workflow; use deep tools only when needed."
      >
        <div className="workspace-tabs" data-tour="workspace-tabs">
          {workspaceTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`workspace-tab ${
                activeTab === tab.key ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="vs-grid-4" data-tour="workspace-kpis">
        <StatCard
          label="Workspace Readiness"
          value={`${workspaceReadinessScore || 0}%`}
          delta={`${workspaceActivityCount || 0} activity signals`}
          tone={workspaceReadinessScore >= 85 ? "up" : workspaceReadinessScore >= 65 ? "neutral" : "down"}
        />
        <StatCard
          label="Launch Score"
          value={`${launchSummary.score || 0}%`}
          delta={launchSummary.launch_decision || "Checking"}
          tone={scoreTone(launchSummary.score)}
        />
        <StatCard
          label="Pressure Score"
          value={`${summary.pressure_score || 0}%`}
          delta={`${summary.open_tasks || 0} open tasks`}
          tone={summary.pressure_score >= 70 ? "down" : "up"}
        />
        <StatCard
          label="Pipeline"
          value={topOpportunityLabel}
          delta="Opportunity Engine"
          tone={number(opportunitySummary.hot) ? "down" : "neutral"}
        />
      </div>

      {!loading ? (
        <SectionCard
          title="Executive Brief"
          subtitle="A concise decision summary generated from launch, political, operational, and revenue signals."
          right={<Badge tone={tone(commandDecision)}>{commandDecision}</Badge>}
        >
          <div className="workspace-brief-grid">
            <div className="workspace-brief-card">
              <span className="workspace-brief-kicker">Today's Situation</span>
              <strong>{executiveBrief.situation}</strong>
              <p>Current posture across launch readiness and workspace execution.</p>
            </div>

            <div className="workspace-brief-card">
              <span className="workspace-brief-kicker">Highest Risk</span>
              <strong>{executiveBrief.risk}</strong>
              <p>Highest-priority signal requiring executive awareness.</p>
            </div>

            <div className="workspace-brief-card">
              <span className="workspace-brief-kicker">Recommended Action</span>
              <strong>{executiveBrief.action}</strong>
              <p>Best next move based on current blockers and priorities.</p>
            </div>

            <div className="workspace-brief-card">
              <span className="workspace-brief-kicker">Expected Outcome</span>
              <strong>{executiveBrief.outcome}</strong>
              <p>Most relevant opportunity or result visible from current data.</p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {loading ? (
        <EmptyState text="Loading Executive Workspace 3.0..." />
      ) : (
        <>
          {activeTab === "home" ? (
            <div className="workspace-grid">
              <div className="workspace-stack">
                <div className="workspace-command-card" data-tour="workspace-command">
                  <div className="workspace-command-top">
                    <div>
                      <h2 className="workspace-command-title">
                        {selected?.name || "Workspace Command View"}
                      </h2>
                      <div className="workspace-command-sub">
                        {selected?.state || "National"} •{" "}
                        {selected?.office || "Campaign"} •{" "}
                        {selected?.cycle || "Cycle"} • This is the consolidated command home for launch readiness, political intelligence, CRM, tasks, revenue, reports, alerts, and action routing.
                      </div>
                    </div>

                    <Badge tone={tone(commandDecision)}>
                      {commandDecision}
                    </Badge>
                  </div>

                  <div className="workspace-decision">{commandDecision}</div>

                  <div className="workspace-mini-grid">
                    <div>
                      <span>Workspace Ready</span>
                      <strong>{workspaceReadinessScore || 0}%</strong>
                    </div>
                    <div>
                      <span>Launch Score</span>
                      <strong>{launchSummary.score || 0}%</strong>
                    </div>
                    <div>
                      <span>National Risk</span>
                      <strong>{kpis.national_risk || 0}%</strong>
                    </div>
                    <div>
                      <span>Live Readiness</span>
                      <strong>{kpis.live_readiness || liveSummary.readiness_score || launchSummary.live_readiness || 0}%</strong>
                    </div>
                    <div>
                      <span>DB Stability</span>
                      <strong>{dbStatus.readiness_score || 0}%</strong>
                    </div>
                  </div>

                  <div className="workspace-actions" data-tour="workspace-actions">
                    <button
                      className="vs-button"
                      onClick={() => setActiveTab("launch")}
                    >
                      Review Launch Gate
                    </button>
                    <button
                      className="vs-button vs-button-secondary"
                      onClick={() => setActiveTab("intelligence")}
                    >
                      Intelligence
                    </button>
                    <button
                      className="vs-button vs-button-secondary"
                      onClick={() => setActiveTab("operations")}
                    >
                      Operations
                    </button>
                    <button
                      className="vs-button vs-button-secondary"
                      onClick={() => setActiveTab("revenue")}
                    >
                      Revenue
                    </button>
                    <Link className="vs-button vs-button-secondary" to="/search">
                      Universal Search
                    </Link>
                  </div>
                </div>

                <div data-tour="workspace-next-actions">
                  <SectionCard
                    title="What To Do Next"
                  subtitle="Priority actions generated from launch readiness and workspace pressure."
                  right={
                    <Badge tone={launchActions.length ? "demo" : "active"}>
                      {launchActions.length || actions.length}
                    </Badge>
                  }
                >
                  <div className="workspace-stack">
                    {launchActions.length ? (
                      launchActions.map((item) => (
                        <div key={item.key} className="workspace-row">
                          <ResponsiveRow
                            title={item.title}
                            subtitle={item.detail}
                            meta={[
                              { label: "Priority", value: item.priority },
                              { label: "Route", value: item.route },
                              { label: "Action", value: "Review and resolve" },
                              { label: "Launch", value: "Pre-launch" },
                            ]}
                            right={
                              <Link
                                className="vs-button vs-button-secondary"
                                to={item.route}
                              >
                                Open
                              </Link>
                            }
                          />
                        </div>
                      ))
                    ) : actions.length ? (
                      actions.slice(0, 6).map((item) => (
                        <div key={item.id} className="workspace-row">
                          <ResponsiveRow
                            title={item.title}
                            subtitle={item.detail}
                            meta={[
                              { label: "Source", value: item.source },
                              { label: "Priority", value: item.priority },
                              { label: "Path", value: item.path },
                              {
                                label: "Workspace",
                                value: selected?.name || "Current",
                              },
                            ]}
                            right={
                              <Link
                                className="vs-button vs-button-secondary"
                                to={item.path}
                              >
                                Open
                              </Link>
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <EmptyState text="No priority actions detected." />
                    )}
                  </div>
                  </SectionCard>
                </div>
              </div>
              
              <div data-tour="workspace-activity-feed">
                <SectionCard
                  title="Executive Activity Feed"
                subtitle="Recent CRM, task, report, revenue, and notification activity."
                right={<Badge tone={workspaceActivity.length ? "accent" : "active"}>{workspaceActivity.length}</Badge>}
              >
                <div className="workspace-stack">
                  {!workspaceActivity.length ? (
                    <EmptyState text="No activity found." />
                  ) : (
                    workspaceActivity.slice(0, 20).map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="workspace-row"
                      >
                        <ResponsiveRow
                          title={item.title || activityLabel(item.type)}
                          subtitle={item.detail || item.description || activityLabel(item.type)}
                          meta={[
                            {
                              label: "Activity",
                              value: activityLabel(item.type),
                            },
                            {
                              label: "Updated",
                              value: formatDate(item.activity_time),
                            },
                          ]}
                          right={
                            <div className="workspace-activity-type">
                              <Badge tone={activityTone(item.type)}>
                                {activityLabel(item.type)}
                              </Badge>
                            </div>
                          }
                        />
                      </div>
                    ))
                  )}
                </div>
                </SectionCard>
              </div>

              <div className="workspace-stack">
                <SectionCard
                  title="Operating Status"
                  subtitle="Launch, database, feeds, risk, and revenue health."
                >
                  <div className="workspace-status-grid" data-tour="workspace-operating-status">
                    <Link className="workspace-module-card" to="/launch-readiness">
                      <h3>Launch Gate</h3>
                      <p>{launchSummary.launch_decision || "Launch readiness not loaded."}</p>
                      <Badge tone={tone(launchSummary.launch_decision)}>
                        {launchSummary.score || 0}%
                      </Badge>
                    </Link>

                    <Link className="workspace-module-card" to="/campaign-operations-studio">
                      <h3>AI Studio</h3>
                      <p>{dbStatus.status || "Database stability not loaded."}</p>
                      <Badge tone={scoreTone(dbStatus.readiness_score)}>
                        {dbStatus.readiness_score || 0}%
                      </Badge>
                    </Link>

                    <Link className="workspace-module-card" to="/live-intelligence-layer">
                      <h3>Live Feeds</h3>
                      <p>Candidate, FEC, signal, vendor, alert, report, and revenue feed readiness.</p>
                      <Badge tone={scoreTone(kpis.live_readiness || liveSummary.readiness_score || launchSummary.live_readiness)}>
                        {kpis.live_readiness || liveSummary.readiness_score || launchSummary.live_readiness || 0}%
                      </Badge>
                    </Link>

                    <Link className="workspace-module-card" to="/opportunity-engine">
                      <h3>Opportunity Pipeline</h3>
                      <p>{topOpportunityLabel} opportunities currently visible.</p>
                      <Badge tone={number(opportunitySummary.hot) ? "danger" : "demo"}>
                        Pipeline
                      </Badge>
                    </Link>
                  </div>
                </SectionCard>

                <div data-tour="workspace-quick-tools">
                  <SectionCard title="Quick Tools" subtitle="Use only when deeper review is needed.">
                  <div className="workspace-status-grid">
                    <Link className="workspace-module-card" to="/notifications">
                      <h3>Notifications</h3>
                      <p>{kpis.critical_alerts || 0} critical alerts.</p>
                      <Badge tone={kpis.critical_alerts ? "danger" : "active"}>Alerts</Badge>
                    </Link>
                    <Link className="workspace-module-card" to="/command-center">
                      <h3>Command Center</h3>
                      <p>{summary.open_tasks || 0} open workspace tasks.</p>
                      <Badge tone={summary.open_tasks ? "demo" : "active"}>Tasks</Badge>
                    </Link>
                  </div>
                  </SectionCard>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "launch" ? (
            <div className="workspace-grid" data-tour="workspace-launch">
              <div className="workspace-stack">
                <SectionCard
                  title="Launch Readiness Gates"
                  subtitle="Final launch decision inputs shown inside the workspace."
                  right={<Badge tone={tone(launchSummary.launch_decision)}>{launchSummary.launch_decision || "Checking"}</Badge>}
                >
                  <div className="workspace-module-grid">
                    {launchToolCards.map((card) => (
                      <Link key={card.to} className="workspace-module-card" to={card.to}>
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                        <Badge tone={card.tone}>{card.badge}</Badge>
                      </Link>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Gate Status" subtitle="Major readiness gates from the Launch Readiness Dashboard.">
                  <div className="workspace-stack">
                    {!launchGates.length ? (
                      <EmptyState text="No launch gates returned yet." />
                    ) : (
                      launchGates.map((gate) => (
                        <div key={gate.key} className="workspace-row">
                          <ResponsiveRow
                            title={gate.label}
                            subtitle={gate.detail}
                            meta={[
                              { label: "Score", value: `${gate.score}%` },
                              { label: "Status", value: gate.status },
                              { label: "Blockers", value: gate.blockers },
                              { label: "Review", value: gate.review },
                            ]}
                            right={
                              <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                                <Badge tone={tone(gate.status)}>{gate.status}</Badge>
                                <Link className="vs-button vs-button-secondary" to={gate.route}>
                                  Open
                                </Link>
                              </div>
                            }
                          />
                        </div>
                      ))
                    )}
                  </div>
                </SectionCard>
              </div>

              <div className="workspace-stack">
                <SectionCard title="Launch Summary" subtitle="Current executive launch posture.">
                  <div className="workspace-status-grid">
                    <div className="workspace-insight-card">
                      <span className="workspace-insight-label">Decision</span>
                      <strong className="workspace-insight-value">{launchSummary.launch_decision || "Checking"}</strong>
                    </div>
                    <div className="workspace-insight-card">
                      <span className="workspace-insight-label">Blockers</span>
                      <strong className="workspace-insight-value">{launchSummary.blockers || 0}</strong>
                    </div>
                    <div className="workspace-insight-card">
                      <span className="workspace-insight-label">Workspace Ready</span>
                      <strong className="workspace-insight-value">{workspaceReadinessScore || 0}%</strong>
                    </div>
                    <div className="workspace-insight-card">
                      <span className="workspace-insight-label">Ready Gates</span>
                      <strong className="workspace-insight-value">{launchSummary.ready_gates || 0}/{launchSummary.total_gates || 0}</strong>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Next Launch Actions" subtitle="Resolve these to increase launch readiness.">
                  <div className="workspace-stack">
                    {!launchActions.length ? (
                      <EmptyState text="No launch actions detected." />
                    ) : (
                      launchActions.map((item) => (
                        <div key={item.key} className="workspace-row">
                          <ResponsiveRow
                            title={item.title}
                            subtitle={item.detail}
                            meta={[
                              { label: "Priority", value: item.priority },
                              { label: "Route", value: item.route },
                              { label: "Action", value: "Resolve" },
                              { label: "Status", value: "Pre-launch" },
                            ]}
                            right={<Link className="vs-button vs-button-secondary" to={item.route}>Open</Link>}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          ) : null}

          {activeTab === "intelligence" ? (
            <SectionCard
              title="Workspace Intelligence"
              subtitle="Political signals, graph intelligence, candidate intelligence, and AI strategy connected to this workspace."
            >
              <div className="workspace-module-grid">
                <Link className="workspace-module-card" to="/political-intelligence">
                  <h3>Political Intelligence Graph</h3>
                  <p>Relationship graph, signal clusters, consultants, donors, and influence paths.</p>
                  <Badge tone="info">Graph</Badge>
                </Link>

                <Link className="workspace-module-card" to="/campaign-copilot">
                  <h3>AI Campaign Co-Pilot</h3>
                  <p>AI strategy, guidance, and operating recommendations based on workspace context.</p>
                  <Badge tone="accent">AI</Badge>
                </Link>

                <Link className="workspace-module-card" to="/candidates">
                  <h3>Candidate Intelligence</h3>
                  <p>Candidate profiles, readiness scoring, contact intelligence, and FEC linkage.</p>
                  <Badge tone="info">Candidates</Badge>
                </Link>
              </div>

              <div className="workspace-stack" style={{ marginTop: 16 }}>
                {!data.signals.length ? (
                  <EmptyState text="No signals found." />
                ) : (
                  data.signals.slice(0, 10).map((signal) => (
                    <div key={signal.id} className="workspace-row">
                      <ResponsiveRow
                        title={signal.title || "Political Signal"}
                        subtitle={signal.summary || "Signal detail unavailable."}
                        meta={[
                          { label: "State", value: signal.state || "National" },
                          { label: "Type", value: signal.signal_type || "Signal" },
                          { label: "Risk", value: signal.risk || signal.severity || "Stable" },
                          { label: "Score", value: signal.signal_score || 0 },
                        ]}
                        right={
                          <Badge tone={tone(signal.risk || signal.severity)}>
                            {signal.risk || signal.severity || "Signal"}
                          </Badge>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "operations" ? (
            <SectionCard
              title="Workspace Operations"
              subtitle="Tasks, War Room activity, vendors, MailOps, and execution pressure."
            >
              <div className="workspace-module-grid">
                <Link className="workspace-module-card" to="/war-room">
                  <h3>War Room</h3>
                  <p>Threats, rapid response, campaign narratives, and escalation workflow.</p>
                  <Badge tone="danger">War Room</Badge>
                </Link>

                <Link className="workspace-module-card" to="/command-center">
                  <h3>Command Center</h3>
                  <p>Execution board, cross-signal priority layer, and operational tasking.</p>
                  <Badge tone="demo">Command</Badge>
                </Link>

                <Link className="workspace-module-card" to="/vendors">
                  <h3>Vendor Network</h3>
                  <p>Vendor coverage, state gaps, direct mail capacity, and partner risk.</p>
                  <Badge tone="accent">Vendors</Badge>
                </Link>
              </div>

              <div className="workspace-stack" style={{ marginTop: 16 }}>
                {!data.tasks.length ? (
                  <EmptyState text="No tasks found." />
                ) : (
                  data.tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="workspace-row">
                      <ResponsiveRow
                        title={task.title || "Task"}
                        subtitle={task.description || "No task description."}
                        meta={[
                          { label: "Status", value: task.status || "Open" },
                          { label: "Priority", value: task.priority || "Normal" },
                          { label: "State", value: task.state || "National" },
                          { label: "Updated", value: formatDate(task.updated_at || task.created_at) },
                        ]}
                        right={
                          <Badge tone={tone(task.priority || task.status)}>
                            {task.status || "Open"}
                          </Badge>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "crm" ? (
            <SectionCard
              title="Workspace CRM"
              subtitle="Contacts, organizations, activity, and relationship workflow for this campaign."
            >
              <div className="workspace-module-grid">
                <Link className="workspace-module-card" to="/campaign-crm">
                  <h3>Campaign CRM</h3>
                  <p>Manage contacts, activity, follow-ups, and campaign relationships.</p>
                  <Badge tone="info">CRM</Badge>
                </Link>

                <Link className="workspace-module-card" to="/opportunity-engine">
                  <h3>Opportunity Engine</h3>
                  <p>Score campaign opportunities and turn prospects into CRM and task workflow.</p>
                  <Badge tone="demo">Pipeline</Badge>
                </Link>

                <Link className="workspace-module-card" to="/task-ownership">
                  <h3>Task Ownership</h3>
                  <p>Assign, track, and monitor ownership across the workspace team.</p>
                  <Badge tone="demo">Ownership</Badge>
                </Link>
              </div>

              <div className="workspace-stack" style={{ marginTop: 16 }}>
                {!data.contacts.length ? (
                  <EmptyState text="No CRM contacts found." />
                ) : (
                  data.contacts.slice(0, 10).map((contact) => (
                    <div key={contact.id} className="workspace-row">
                      <ResponsiveRow
                        title={contact.full_name || "CRM Contact"}
                        subtitle={contact.organization || "No organization"}
                        meta={[
                          { label: "Role", value: contact.role_type || "Contact" },
                          { label: "State", value: contact.state || "National" },
                          { label: "Updated", value: formatDate(contact.updated_at || contact.created_at) },
                          { label: "Workspace", value: contact.workspace_id || "—" },
                        ]}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "revenue" ? (
            <SectionCard
              title="Workspace Revenue"
              subtitle="Client health, receivables, business suite, and revenue risk."
            >
              <div className="workspace-revenue-grid">
                <div className="workspace-insight-card">
                  <span className="workspace-insight-label">Monthly Retainers</span>
                  <strong className="workspace-insight-value">
                    {compactMoney(revenueSummary.monthlyRevenue)}
                  </strong>
                </div>

                <div className="workspace-insight-card">
                  <span className="workspace-insight-label">Outstanding</span>
                  <strong className="workspace-insight-value">
                    {compactMoney(revenueSummary.outstanding)}
                  </strong>
                </div>

                <div className="workspace-insight-card">
                  <span className="workspace-insight-label">Active Clients</span>
                  <strong className="workspace-insight-value">
                    {revenueSummary.clientCount}
                  </strong>
                </div>

                <div className="workspace-insight-card">
                  <span className="workspace-insight-label">Clients At Risk</span>
                  <strong className="workspace-insight-value">
                    {revenueSummary.atRiskClients}
                  </strong>
                </div>
              </div>

              <div className="workspace-module-grid">
                <Link className="workspace-module-card" to="/business-suite">
                  <h3>Consultant Business Suite</h3>
                  <p>Clients, projects, invoices, staff, and business operations.</p>
                  <Badge tone="accent">Business</Badge>
                </Link>

                <Link className="workspace-module-card" to="/revenue-intelligence">
                  <h3>Revenue Intelligence</h3>
                  <p>Client health, overdue invoices, margin watch, and revenue pressure.</p>
                  <Badge tone="demo">Revenue</Badge>
                </Link>

                <Link className="workspace-module-card" to="/billing">
                  <h3>Billing</h3>
                  <p>Subscription status, portal access, plan controls, and account billing.</p>
                  <Badge tone="info">Billing</Badge>
                </Link>
              </div>

              <div className="workspace-stack" style={{ marginTop: 16 }}>
                {!data.clients.length ? (
                  <EmptyState text="No clients found." />
                ) : (
                  data.clients.slice(0, 10).map((client) => (
                    <div key={client.id} className="workspace-row">
                      <ResponsiveRow
                        title={client.client_name || "Client"}
                        subtitle={client.organization || "Client account"}
                        meta={[
                          { label: "State", value: client.state || "National" },
                          { label: "Status", value: client.status || "Active" },
                          { label: "Health", value: client.health_status || "Stable" },
                          { label: "Retainer", value: money(client.monthly_retainer) },
                        ]}
                        right={
                          <Badge tone={tone(client.health_status)}>
                            {client.health_status || "Client"}
                          </Badge>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "reports" ? (
            <SectionCard
              title="Workspace Reports"
              subtitle="Intelligence reports, exports, and client deliverables."
            >
              <div className="workspace-module-grid">
                <Link className="workspace-module-card" to="/intelligence-reports">
                  <h3>Intelligence Reports</h3>
                  <p>Generate campaign, donor, threat, and strategic reports.</p>
                  <Badge tone="info">Reports</Badge>
                </Link>

                <Link className="workspace-module-card" to="/report-exports">
                  <h3>Report Export Center</h3>
                  <p>Create downloadable deliverables and client-ready exports.</p>
                  <Badge tone="accent">Exports</Badge>
                </Link>

                <Link className="workspace-module-card" to="/client-portal-admin">
                  <h3>Client Portal Publishing</h3>
                  <p>Push reports and updates into client-facing portals.</p>
                  <Badge tone="demo">Portal</Badge>
                </Link>
              </div>

              <div className="workspace-stack" style={{ marginTop: 16 }}>
                {!data.reports.length ? (
                  <EmptyState text="No reports found." />
                ) : (
                  data.reports.slice(0, 10).map((report) => (
                    <div key={report.id} className="workspace-row">
                      <ResponsiveRow
                        title={report.title || "Report"}
                        subtitle={report.report_type || "Intelligence report"}
                        meta={[
                          { label: "State", value: report.state || "National" },
                          { label: "Status", value: report.status || "Generated" },
                          { label: "Created", value: formatDate(report.created_at) },
                          { label: "Type", value: report.report_type || "Report" },
                        ]}
                        right={
                          <Badge tone="info">
                            {report.status || "Report"}
                          </Badge>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "tools" ? (
            <SectionCard
              title="Workspace Tools"
              subtitle="Deep links into the full VoterSpheres platform."
            >
              <div className="workspace-module-grid">
                <Link className="workspace-module-card" to="/national-command">
                  <h3>National Command</h3>
                  <p>National election operating surface.</p>
                  <Badge tone="accent">Command</Badge>
                </Link>

                <Link className="workspace-module-card" to="/notifications">
                  <h3>Notifications</h3>
                  <p>Unified alert inbox.</p>
                  <Badge tone="demo">Alerts</Badge>
                </Link>

                <Link className="workspace-module-card" to="/search">
                  <h3>Universal Search</h3>
                  <p>Find records across the platform.</p>
                  <Badge tone="info">Search</Badge>
                </Link>

                <Link className="workspace-module-card" to="/operations-map">
                  <h3>Operations Map</h3>
                  <p>State and county operational pressure.</p>
                  <Badge tone="accent">Map</Badge>
                </Link>

                <Link className="workspace-module-card" to="/donors">
                  <h3>Donor Network</h3>
                  <p>Donor relationships and funding signals.</p>
                  <Badge tone="info">Donors</Badge>
                </Link>

                <Link className="workspace-module-card" to="/mailops">
                  <h3>MailOps</h3>
                  <p>Direct mail execution tracking.</p>
                  <Badge tone="demo">Mail</Badge>
                </Link>
              </div>
            </SectionCard>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
