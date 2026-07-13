import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard"; 
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

import { useWorkspace } from "../context/WorkspaceContext";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext";
import { useUnifiedExecutiveIntelligence } from "../context/UnifiedExecutiveIntelligenceContext";

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function pct(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function tone(value = "") {
  const next = String(value || "").toLowerCase();

  if (["critical", "high", "danger", "intervention required"].some((item) => next.includes(item))) {
    return "danger";
  }

  if (["elevated", "watch", "medium", "degraded"].some((item) => next.includes(item))) {
    return "demo";
  }

  if (["stable", "operational", "available", "active", "live", "fresh"].some((item) => next.includes(item))) {
    return "active";
  }

  return "accent";
}

function dotClass(value = "") {
  const next = String(value || "").toLowerCase();

  if (next.includes("critical") || next.includes("intervention")) {
    return "vs-live-dot-danger";
  }

  if (next.includes("watch") || next.includes("degraded")) {
    return "vs-live-dot-warning";
  }

  return "vs-live-dot-success";
}

function formatTime(value) {
  if (!value) return "Ready";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ready";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WorkspaceRow({ item }) {
  return (
    <div className={`uei-row is-${String(item.risk || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={item.name || "Campaign Workspace"}
        subtitle={`${item.state || "National"} • ${item.office || "Campaign"} • ${item.cycle || "2026"}`}
        meta={[
          { label: "Pressure", value: pct(item.pressure_score) },
          { label: "Open", value: fmt(item.open_task_count) },
          { label: "Blocked", value: fmt(item.blocked_task_count) },
          { label: "High Priority", value: fmt(item.high_priority_task_count) },
          { label: "Complete", value: pct(item.completion_rate) },
        ]}
        right={
          <div className="uei-row-actions">
            <Badge tone={tone(item.risk)}>{item.risk || "Stable"}</Badge>
            <Link
              className="vs-button vs-button-secondary"
              to={`/campaign-workspace/${item.id}`}
            >
              Open
            </Link>
          </div>
        }
      />
    </div>
  );
}

export default function CrossWorkspaceExecutiveDashboard() {
  const {
    health,
    briefing,
    kpis,
    summary,
    workspaces,
    urgentWorkspaces,
    tasks,
    signals,
    alerts,
    recommendations,
    sourceStatus,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
    createAction,
  } = useUnifiedExecutiveIntelligence();

  const {
    workspaces: workspaceOptions,
    activeWorkspaceId,
    setActiveWorkspaceId,
  } = useWorkspace();

  const { filters, setFilters, clearFilters } = useExecutiveFilters();

  const [creatingActionId, setCreatingActionId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const degradedSources = useMemo(
    () => sourceStatus.filter((item) => item.status === "degraded"),
    [sourceStatus]
  );

  const urgent = useMemo(
    () =>
      urgentWorkspaces.length
        ? urgentWorkspaces
        : workspaces.filter((item) => ["Critical", "High"].includes(item.risk)),
    [urgentWorkspaces, workspaces]
  );

  async function handleCreateAction(item) {
    try {
      setCreatingActionId(String(item.id));
      setActionMessage("");

      await createAction({
        recommendation_id: item.id,
        title: item.title,
        description: item.detail,
        priority: item.priority,
        workspace_id: item.workspace_id || activeWorkspaceId || null,
        route: item.route,
      });

      setActionMessage("Executive action created in Mission Control.");
    } catch (actionError) {
      setActionMessage(
        actionError?.response?.data?.error ||
          actionError?.message ||
          "Failed to create executive action."
      );
    } finally {
      setCreatingActionId("");
    }
  }

  return (
    <PageShell
      eyebrow="Unified Executive Intelligence Layer · Build 1"
      title="Unified Executive Intelligence"
      description="One executive operating picture across campaign workspaces, tasks, political signals, alerts, strategy recommendations, missions, source freshness, and execution risk."
      tickerItems={[
        {
          label: "Executive Health",
          value: pct(health.overall_score),
          dotClass: dotClass(health.status),
        },
        {
          label: "Readiness",
          value: pct(health.readiness_score),
          dotClass:
            Number(health.readiness_score || 0) >= 75
              ? "vs-live-dot-success"
              : "vs-live-dot-warning",
        },
        {
          label: "Risk",
          value: pct(health.national_risk),
          dotClass:
            Number(health.national_risk || 0) >= 60
              ? "vs-live-dot-danger"
              : "vs-live-dot-warning",
        },
        {
          label: "Sources",
          value: `${sourceStatus.length - degradedSources.length}/${sourceStatus.length || 0}`,
          dotClass: degradedSources.length
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : formatTime(lastUpdated),
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .uei-command {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) repeat(3, minmax(150px, .45fr));
          gap: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          border-radius: 30px;
          padding: 20px;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, .2), transparent 34%),
            radial-gradient(circle at bottom right, rgba(251, 146, 60, .14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .88));
          box-shadow: 0 24px 80px rgba(2, 6, 23, .34);
        }

        .uei-command-primary span,
        .uei-command-metric span,
        .uei-source-card span {
          display: block;
          color: rgba(147, 197, 253, .84);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .uei-command-primary strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(32px, 5vw, 58px);
          line-height: .95;
          letter-spacing: -.075em;
        }

        .uei-command-primary p {
          max-width: 850px;
          margin: 12px 0 0;
          color: rgba(203, 213, 225, .76);
          line-height: 1.7;
        }

        .uei-command-metric {
          border: 1px solid rgba(148, 163, 184, .12);
          border-radius: 18px;
          background: rgba(2, 6, 23, .3);
          padding: 14px;
        }

        .uei-command-metric strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 24px;
          font-weight: 950;
        }

        .uei-toolbar,
        .uei-toolbar-actions,
        .uei-filter-grid,
        .uei-row-actions,
        .uei-source-status {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .uei-toolbar {
          justify-content: space-between;
        }

        .uei-filter-grid select {
          min-width: 170px;
          border: 1px solid rgba(148, 163, 184, .16);
          border-radius: 13px;
          background: rgba(15, 23, 42, .78);
          color: white;
          padding: 10px 12px;
        }

        .uei-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(360px, .8fr);
          gap: 18px;
          align-items: start;
        }

        .uei-stack {
          display: grid;
          gap: 14px;
        }

        .uei-row {
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, .15);
          border-radius: 19px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .09), transparent 35%),
            rgba(15, 23, 42, .5);
        }

        .uei-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .uei-row.is-critical,
        .uei-row.is-high {
          border-color: rgba(248, 113, 113, .34);
        }

        .uei-row.is-elevated {
          border-color: rgba(251, 191, 36, .3);
        }

        .uei-row.is-stable {
          border-color: rgba(34, 197, 94, .22);
        }

        .uei-brief {
          border: 1px solid rgba(96, 165, 250, .24);
          border-radius: 24px;
          padding: 20px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .14), transparent 35%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .56));
        }

        .uei-brief h2 {
          margin: 8px 0 10px;
          color: white;
          font-size: clamp(25px, 4vw, 42px);
          line-height: 1.05;
          letter-spacing: -.055em;
        }

        .uei-brief p {
          color: rgba(203, 213, 225, .76);
          line-height: 1.7;
        }

        .uei-source-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 10px;
        }

        .uei-source-card {
          border: 1px solid rgba(148, 163, 184, .13);
          border-radius: 16px;
          background: rgba(15, 23, 42, .48);
          padding: 12px;
        }

        .uei-source-card strong {
          display: block;
          margin-top: 6px;
          color: white;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .uei-source-card small {
          display: block;
          margin-top: 5px;
          color: rgba(148, 163, 184, .7);
          font-size: 9px;
          line-height: 1.4;
        }

        .uei-recommendation {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(148, 163, 184, .13);
          border-radius: 17px;
          background: rgba(15, 23, 42, .48);
          padding: 14px;
        }

        .uei-recommendation strong {
          color: white;
        }

        .uei-recommendation p {
          margin: 6px 0 0;
          color: rgba(203, 213, 225, .72);
          font-size: 11px;
          line-height: 1.5;
        }

        @media (max-width: 1180px) {
          .uei-command,
          .uei-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .uei-recommendation {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {actionMessage ? <div className="vs-banner">{actionMessage}</div> : null}

      <div className="uei-command">
        <div className="uei-command-primary">
          <span>National Executive Posture</span>
          <strong>{health.status || "Intelligence Ready"}</strong>
          <p>
            {briefing.strategic_summary ||
              "The unified layer is consolidating workspace pressure, operational execution, political signals, alerts, recommendations, and data-source readiness."}
          </p>
        </div>

        <div className="uei-command-metric">
          <span>Executive Health</span>
          <strong>{pct(health.overall_score)}</strong>
        </div>

        <div className="uei-command-metric">
          <span>Execution Score</span>
          <strong>{pct(health.execution_score)}</strong>
        </div>

        <div className="uei-command-metric">
          <span>Intelligence Confidence</span>
          <strong>{pct(health.intelligence_confidence)}</strong>
        </div>
      </div>

      <SectionCard
        title="Executive Scope"
        subtitle="Workspace and executive filters now drive one shared intelligence response."
      >
        <div className="uei-toolbar">
          <div className="uei-filter-grid">
            <select
              value={activeWorkspaceId || ""}
              onChange={(event) => setActiveWorkspaceId(event.target.value)}
            >
              <option value="">All workspaces</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} • {workspace.state || "National"}
                </option>
              ))}
            </select>

            <select
              value={filters.state || ""}
              onChange={(event) => setFilters({ state: event.target.value })}
            >
              <option value="">All states</option>
              {[...new Set(workspaceOptions.map((item) => item.state).filter(Boolean))]
                .sort()
                .map((state) => (
                  <option key={state}>{state}</option>
                ))}
            </select>

            <select
              value={filters.risk || ""}
              onChange={(event) => setFilters({ risk: event.target.value })}
            >
              <option value="">All risk levels</option>
              <option>Critical</option>
              <option>High</option>
              <option>Elevated</option>
              <option>Stable</option>
            </select>
          </div>

          <div className="uei-toolbar-actions">
            <button
              className="vs-button vs-button-secondary"
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

            <button
              className="vs-button"
              type="button"
              onClick={refresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh Intelligence"}
            </button>

            <Link
              className="vs-button vs-button-secondary"
              to="/executive-ai-command-platform"
            >
              Consult Executive AI
            </Link>

            <Link
              className="vs-button vs-button-secondary"
              to="/mission-control"
            >
              Mission Control
            </Link>
          </div>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        <StatCard
          label="Unified Workspaces"
          value={fmt(summary.total_workspaces)}
          delta={`${fmt(summary.high_risk_workspaces)} high risk`}
          tone={summary.high_risk_workspaces ? "down" : "up"}
        />
        <StatCard
          label="Open Tasks"
          value={fmt(summary.open_tasks)}
          delta={`${fmt(summary.blocked_tasks)} blocked`}
          tone={summary.blocked_tasks ? "down" : "neutral"}
        />
        <StatCard
          label="Political Signals"
          value={fmt(kpis.total_signals || signals.length)}
          delta={`${fmt(kpis.critical_signals)} critical`}
          tone={kpis.critical_signals ? "down" : "up"}
        />
        <StatCard
          label="Executive Alerts"
          value={fmt(kpis.total_alerts || alerts.length)}
          delta={`${fmt(kpis.critical_alerts)} critical`}
          tone={kpis.critical_alerts ? "down" : "up"}
        />
      </div>

      {loading ? (
        <EmptyState text="Loading Unified Executive Intelligence..." />
      ) : (
        <>
          <div className="uei-layout">
            <div className="uei-stack">
              <SectionCard
                title="Unified Executive Brief"
                subtitle="The recommended executive action generated from the shared operating picture."
                right={<Badge tone={tone(health.status)}>{health.status || "Ready"}</Badge>}
              >
                <div className="uei-brief">
                  <div className="vs-page-eyebrow">Recommended Executive Action</div>
                  <h2>{briefing.recommended_action || "Maintain executive oversight"}</h2>
                  <p>{briefing.headline || "The unified layer is online."}</p>
                  <div className="uei-source-status">
                    <Badge tone="accent">{briefing.decision_window || "Next review"}</Badge>
                    <Badge tone="active">
                      Confidence {pct(briefing.confidence_percentage)}
                    </Badge>
                    <Badge tone={degradedSources.length ? "demo" : "active"}>
                      {degradedSources.length} Degraded
                    </Badge>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Workspace Risk Rankings"
                subtitle="Every campaign workspace ranked by operational pressure."
                right={<Badge tone="accent">{workspaces.length} Workspaces</Badge>}
              >
                <div className="uei-stack">
                  {workspaces.length ? (
                    workspaces.map((item) => <WorkspaceRow key={item.id} item={item} />)
                  ) : (
                    <EmptyState text="No workspaces match the current scope." />
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="uei-stack">
              <SectionCard
                title="Executive Recommendations"
                subtitle="Cross-platform actions ready for Mission Control."
                right={
                  <Badge tone={recommendations.length ? "demo" : "active"}>
                    {recommendations.length}
                  </Badge>
                }
              >
                <div className="uei-stack">
                  {recommendations.length ? (
                    recommendations.slice(0, 10).map((item) => (
                      <div key={item.id} className="uei-recommendation">
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.detail || "Executive recommendation details unavailable."}</p>
                          <div className="uei-source-status">
                            <Badge tone={tone(item.priority)}>
                              {item.priority || "Medium"}
                            </Badge>
                            <Badge tone="info">
                              {item.owner || "Executive Operations"}
                            </Badge>
                          </div>
                        </div>

                        <div className="uei-row-actions">
                          {item.route ? (
                            <Link
                              className="vs-button vs-button-secondary"
                              to={item.route}
                            >
                              Review
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            className="vs-button"
                            disabled={creatingActionId === String(item.id)}
                            onClick={() => handleCreateAction(item)}
                          >
                            {creatingActionId === String(item.id)
                              ? "Creating..."
                              : "Create Action"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState text="No executive recommendations detected." />
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Urgent Workspaces"
                subtitle="Campaigns requiring executive attention first."
                right={<Badge tone={urgent.length ? "danger" : "active"}>{urgent.length}</Badge>}
              >
                <div className="uei-stack">
                  {urgent.length ? (
                    urgent.slice(0, 6).map((item) => (
                      <WorkspaceRow key={item.id} item={item} />
                    ))
                  ) : (
                    <EmptyState text="No urgent workspace escalation detected." />
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          <SectionCard
            title="Intelligence Source Status"
            subtitle="Each source degrades independently so one missing module cannot crash the unified layer."
            right={
              <Badge tone={degradedSources.length ? "demo" : "active"}>
                {sourceStatus.length - degradedSources.length}/{sourceStatus.length} Available
              </Badge>
            }
          >
            <div className="uei-source-grid">
              {sourceStatus.map((item) => (
                <div key={item.key} className="uei-source-card">
                  <span>{item.key}</span>
                  <strong>{item.status || "unknown"}</strong>
                  <div className="uei-source-status">
                    <Badge tone={tone(item.status)}>
                      {item.freshness || "unknown"}
                    </Badge>
                  </div>
                  <small>
                    {item.error ||
                      (item.last_seen
                        ? `Last seen ${new Date(item.last_seen).toLocaleString()}`
                        : "No timestamp available")}
                  </small>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="vs-grid-3">
            <SectionCard
              title="Task Pressure"
              subtitle="Highest-priority tasks in the active executive scope."
              right={<Badge tone="accent">{tasks.length}</Badge>}
            >
              <div className="uei-stack">
                {tasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="uei-row">
                    <ResponsiveRow
                      title={task.title || "Task"}
                      subtitle={task.description || "No task description."}
                      meta={[
                        { label: "Priority", value: task.priority || "Normal" },
                        { label: "Status", value: task.status || "Open" },
                        { label: "Workspace", value: task.workspace_id || "—" },
                      ]}
                      right={
                        <Badge tone={tone(task.priority || task.status)}>
                          {task.status || "Open"}
                        </Badge>
                      }
                    />
                  </div>
                ))}
                {!tasks.length ? <EmptyState text="No tasks in scope." /> : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Political Signals"
              subtitle="Highest-impact signals informing the executive picture."
              right={<Badge tone="accent">{signals.length}</Badge>}
            >
              <div className="uei-stack">
                {signals.slice(0, 6).map((signal) => (
                  <div key={signal.id} className="uei-row">
                    <ResponsiveRow
                      title={signal.title || "Political Signal"}
                      subtitle={
                        signal.summary ||
                        signal.description ||
                        "Signal detail unavailable."
                      }
                      meta={[
                        { label: "State", value: signal.state || "National" },
                        {
                          label: "Risk",
                          value: signal.risk || signal.severity || "Stable",
                        },
                        { label: "Score", value: signal.signal_score || 0 },
                      ]}
                    />
                  </div>
                ))}
                {!signals.length ? (
                  <EmptyState text="No political signals in scope." />
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Executive Alerts"
              subtitle="Critical notifications elevated into the shared intelligence layer."
              right={<Badge tone={alerts.length ? "demo" : "active"}>{alerts.length}</Badge>}
            >
              <div className="uei-stack">
                {alerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="uei-row">
                    <ResponsiveRow
                      title={alert.title || alert.message || "Executive Alert"}
                      subtitle={
                        alert.description ||
                        alert.detail ||
                        "Alert details unavailable."
                      }
                      meta={[
                        { label: "Level", value: alert.level || "Info" },
                        { label: "Source", value: alert.source || "Platform" },
                        { label: "State", value: alert.state || "National" },
                      ]}
                    />
                  </div>
                ))}
                {!alerts.length ? (
                  <EmptyState text="No executive alerts in scope." />
                ) : null}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </PageShell>
  );
}

