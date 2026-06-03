import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { useRealtimeTacticalEvents } from "../hooks/useRealtimeTacticalEvents";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import WorkspaceSignalFeed from "../components/workspaces/WorkspaceSignalFeed";

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function pct(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function riskTone(value) {
  const risk = String(value || "").toLowerCase();
  if (risk === "critical" || risk === "high") return "danger";
  if (risk === "elevated") return "demo";
  if (risk === "stable" || risk === "complete") return "active";
  return "accent";
}

function statusTone(value) {
  const status = String(value || "").toLowerCase();
  if (["complete", "completed", "done", "resolved"].includes(status)) return "active";
  if (["blocked", "critical", "high"].includes(status)) return "danger";
  if (["in_progress", "active", "open"].includes(status)) return "demo";
  return "default";
}

function normalizeStatus(value = "open") {
  const status = String(value || "").toLowerCase();
  if (["complete", "completed", "done", "resolved"].includes(status)) return "complete";
  if (["blocked", "paused", "hold"].includes(status)) return "blocked";
  if (["in_progress", "in progress", "active", "started"].includes(status)) return "in_progress";
  return "open";
}

function metadata(task = {}) {
  if (!task.metadata) return {};
  if (typeof task.metadata === "object") return task.metadata;
  try {
    return JSON.parse(task.metadata);
  } catch {
    return {};
  }
}

function isCountyTask(task = {}) {
  const meta = metadata(task);
  const source = String(task.source || meta.source || "").toLowerCase();
  return (
    source.includes("state_operations") ||
    source.includes("county") ||
    Boolean(meta.county || meta.county_name || meta.heat_score)
  );
}

function InsightRow({ item }) {
  return (
    <div className={`cw-insight cw-${String(item.severity || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={item.title || "Workspace insight"}
        subtitle={item.recommendation || "Review and assign owner."}
        meta={[
          { label: "Severity", value: item.severity || "Signal" },
          { label: "Source", value: item.source || "Workspace Intelligence" },
        ]}
        right={<Badge tone={riskTone(item.severity)}>{item.severity || "Signal"}</Badge>}
      />
    </div>
  );
}

function TaskRow({ task, onUpdate, changing }) {
  const status = normalizeStatus(task.status);
  const complete = status === "complete";
  const meta = metadata(task);
  const countyTask = isCountyTask(task);

  return (
    <div className={`cw-task ${complete ? "is-complete" : ""} ${countyTask ? "is-county" : ""}`}>
      <ResponsiveRow
        title={task.title || "Workspace task"}
        subtitle={task.description || task.source || "Command Center"}
        meta={[
          { label: "Status", value: task.status || "open" },
          { label: "Priority", value: task.priority || "medium" },
          { label: "State", value: task.state || meta.state || "National" },
          { label: "Owner", value: task.assigned_to || "Command Team" },
          { label: "County", value: meta.county || meta.county_name || "—" },
        ]}
        right={
          <div className="cw-row-actions">
            <Badge tone={statusTone(task.status)}>{task.status || "open"}</Badge>
            <button
              type="button"
              className={complete ? "vs-button vs-button-secondary" : "vs-button"}
              onClick={() => onUpdate(task, complete ? "open" : "complete")}
              disabled={changing}
            >
              {changing ? "Updating..." : complete ? "Reopen" : "Complete"}
            </button>
          </div>
        }
      />
    </div>
  );
}

function OwnerRow({ item }) {
  return (
    <div className="cw-owner-row">
      <ResponsiveRow
        title={item.owner || "Command Team"}
        subtitle="Workspace workload"
        meta={[
          { label: "Open", value: item.open || 0 },
          { label: "Complete", value: item.complete || 0 },
          { label: "Blocked", value: item.blocked || 0 },
          { label: "High", value: item.high || 0 },
        ]}
        right={<Badge tone={item.open ? "demo" : "active"}>{item.open || 0} open</Badge>}
      />
    </div>
  );
}

function ActivityRow({ item }) {
  return (
    <div className="cw-activity-row">
      <strong>{item.title || "Workspace activity"}</strong>
      <span>
        {item.type || "activity"} • {item.owner || "Command Team"} •{" "}
        {item.created_at ? new Date(item.created_at).toLocaleString() : "Live"}
      </span>
    </div>
  );
}

export default function CampaignWorkspace() {
  const params = useParams();
  const navigate = useNavigate();

  const {
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    refreshWorkspaces,
  } = useWorkspace();

  const workspaceId = String(params.id || activeWorkspaceId || "");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [changingTaskId, setChangingTaskId] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!workspaceId) {
        setLoading(false);
        setData(null);
        return;
      }

      try {
        if (quiet) setRefreshing(true);
        else setLoading(true);

        setError("");

        const result =
          typeof api.workspaceOperatingRoom === "function"
            ? await api.workspaceOperatingRoom(workspaceId)
            : await api.getWorkspace(workspaceId);

        setData(result);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load campaign workspace operating room."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId]
  );

  useRealtimeTacticalEvents({
    workspaceId,
    onRefresh: () => load({ quiet: true }),
  });

  useEffect(() => {
    if (params.id && String(params.id) !== String(activeWorkspaceId || "")) {
      setActiveWorkspaceId(params.id);
    }
  }, [params.id, activeWorkspaceId, setActiveWorkspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTaskStatus(task, status) {
    try {
      setChangingTaskId(task.id);
      setMessage("");

      if (typeof api.updateTask === "function") {
        await api.updateTask(task.id, { status });
      } else if (typeof api.updateTaskStatus === "function") {
        await api.updateTaskStatus(task.id, status);
      } else {
        await api.tasksUpdate(task.id, { status });
      }

      setMessage(`Task ${status === "complete" ? "completed" : "reopened"}.`);
      await load({ quiet: true });
      await refreshWorkspaces?.();
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.message || "Failed to update task.");
    } finally {
      setChangingTaskId("");
    }
  }

  async function handlePulse() {
    try {
      setMessage("");

      if (typeof api.emitWorkspacePulse === "function") {
        await api.emitWorkspacePulse(workspaceId, {
          message: "Workspace operating room pulse requested.",
        });
      }

      setMessage("Realtime workspace pulse emitted.");
      await load({ quiet: true });
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.message || "Failed to emit workspace pulse.");
    }
  }

  const workspace = data?.workspace || activeWorkspace || {};
  const summary = data?.summary || {};
  const tasks = data?.tasks || [];
  const countyEscalations = data?.countyEscalations || tasks.filter(isCountyTask);
  const insights = data?.insights || [];
  const owners = data?.owners || [];
  const activity = data?.activity || [];

  const openTasks = useMemo(
    () => tasks.filter((task) => normalizeStatus(task.status) !== "complete"),
    [tasks]
  );

  const highPriorityTasks = useMemo(
    () => tasks.filter((task) => ["critical", "high"].includes(String(task.priority || "").toLowerCase())),
    [tasks]
  );

  const campaignTitle = workspace?.name || "Campaign Workspace";

  return (
    <PageShell
      eyebrow="Campaign Operating Room"
      title={campaignTitle}
      description="Workspace command shell for execution pressure, county escalations, tactical tasks, owners, timeline, and realtime intelligence."
      tickerItems={[
        {
          label: "Pressure",
          value: pct(summary.pressure_score || 0),
          dotClass: Number(summary.pressure_score || 0) >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Risk",
          value: summary.risk || "Stable",
          dotClass: ["Critical", "High"].includes(summary.risk) ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Open",
          value: `${summary.open_tasks || openTasks.length || 0}`,
          dotClass: openTasks.length ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .cw-room-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
          gap: 18px;
          align-items: start;
        }

        .cw-room-stack {
          display: grid;
          gap: 14px;
        }

        .cw-hero {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 34%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.82));
          padding: 22px;
        }

        .cw-hero-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .cw-hero h2 {
          margin: 0;
          color: white;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .cw-hero p {
          margin: 8px 0 0;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
        }

        .cw-pressure {
          color: white;
          font-size: 64px;
          font-weight: 950;
          letter-spacing: -0.08em;
          line-height: 1;
          margin-top: 16px;
        }

        .cw-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .cw-mini-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .cw-mini-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .cw-mini-grid b {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
        }

        .cw-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .cw-task,
        .cw-insight,
        .cw-owner-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .cw-task.is-county {
          border-color: rgba(251, 191, 36, 0.28);
        }

        .cw-task.is-complete {
          border-color: rgba(34, 197, 94, 0.24);
          opacity: 0.82;
        }

        .cw-task .vs-responsive-row,
        .cw-insight .vs-responsive-row,
        .cw-owner-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .cw-critical,
        .cw-high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .cw-elevated {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .cw-row-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cw-activity-row {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          background: rgba(15, 23, 42, 0.58);
          padding: 13px;
        }

        .cw-activity-row strong {
          display: block;
          color: white;
          font-size: 13px;
        }

        .cw-activity-row span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.64);
          font-size: 12px;
        }

        .cw-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1100px) {
          .cw-room-layout,
          .cw-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="cw-message">{message}</div> : null}

      {!workspaceId ? (
        <EmptyState text="No active workspace selected. Open Campaign Workspaces and choose a workspace." />
      ) : loading ? (
        <EmptyState text="Loading campaign operating room..." />
      ) : (
        <>
          <div className="vs-grid-4">
            <StatCard label="Pressure" value={pct(summary.pressure_score || 0)} delta={summary.risk || "Stable"} tone={Number(summary.pressure_score || 0) >= 65 ? "down" : "up"} />
            <StatCard label="Open Tasks" value={fmt(summary.open_tasks || 0)} delta={`${fmt(highPriorityTasks.length)} high priority`} tone={summary.open_tasks ? "neutral" : "up"} />
            <StatCard label="County Escalations" value={fmt(summary.active_county_escalations || 0)} delta={`${fmt(summary.county_escalations || 0)} total`} tone={summary.active_county_escalations ? "down" : "up"} />
            <StatCard label="Completion" value={pct(summary.completion_rate || 0)} delta={`${fmt(summary.completed_tasks || 0)} complete`} tone={summary.completion_rate >= 70 ? "up" : "neutral"} />
          </div>

          <WorkspaceSignalFeed workspaceId={workspaceId || workspace?.id} />

          <div className="cw-room-layout">
            <div className="cw-room-stack">
              <div className="cw-hero">
                <div className="cw-hero-top">
                  <div>
                    <h2>{campaignTitle}</h2>
                    <p>
                      {workspace.state || "National"} • {workspace.office || "Statewide"} • {workspace.cycle || "2026"}
                    </p>
                  </div>

                  <Badge tone={riskTone(summary.risk)}>{summary.risk || "Stable"}</Badge>
                </div>

                <div className="cw-pressure">{pct(summary.pressure_score || 0)}</div>

                <div className="cw-mini-grid">
                  <div><span>Total Tasks</span><b>{fmt(summary.total_tasks || 0)}</b></div>
                  <div><span>Blocked</span><b>{fmt(summary.blocked_tasks || 0)}</b></div>
                  <div><span>In Progress</span><b>{fmt(summary.in_progress_tasks || 0)}</b></div>
                  <div><span>Aging</span><b>{fmt(summary.aging_tasks || 0)}</b></div>
                </div>

                <div className="cw-actions">
                  <Link className="vs-button" to="/command-center">Open Command Center</Link>
                  <Link className="vs-button vs-button-secondary" to="/state-operations">State Operations</Link>
                  <Link className="vs-button vs-button-secondary" to="/operations-map">Executive Map</Link>
                  <button type="button" className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                    Refresh
                  </button>
                  <button type="button" className="vs-button vs-button-secondary" onClick={handlePulse}>
                    Realtime Pulse
                  </button>
                </div>
              </div>

              <SectionCard
                title="Workspace Command Center"
                subtitle="Workspace-scoped execution tasks, owners, county escalations, and status control."
                right={<Badge tone="accent">{tasks.length} tasks</Badge>}
              >
                {!tasks.length ? (
                  <EmptyState text="No tasks loaded for this workspace." />
                ) : (
                  <div className="cw-room-stack">
                    {tasks.slice(0, 18).map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        changing={String(changingTaskId) === String(task.id)}
                        onUpdate={handleTaskStatus}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="County Operations Layer"
                subtitle="County escalation tasks connected to the State Operations heat engine."
                right={<Badge tone={countyEscalations.length ? "demo" : "active"}>{countyEscalations.length} escalations</Badge>}
              >
                {!countyEscalations.length ? (
                  <EmptyState text="No county escalations are currently linked to this workspace." />
                ) : (
                  <div className="cw-room-stack">
                    {countyEscalations.slice(0, 10).map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        changing={String(changingTaskId) === String(task.id)}
                        onUpdate={handleTaskStatus}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="cw-room-stack">
              <SectionCard
                title="Workspace Intelligence Feed"
                subtitle="AI-style strategic recommendations from task pressure and county escalation signals."
                right={<Badge tone={insights.length ? "demo" : "active"}>{insights.length} insights</Badge>}
              >
                {!insights.length ? (
                  <EmptyState text="No workspace insights available yet." />
                ) : (
                  <div className="cw-room-stack">
                    {insights.map((item) => (
                      <InsightRow key={item.id || item.title} item={item} />
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Owner Workload"
                subtitle="Execution load by owner."
                right={<Badge tone="accent">{owners.length} owners</Badge>}
              >
                {!owners.length ? (
                  <EmptyState text="No owner workload available." />
                ) : (
                  <div className="cw-room-stack">
                    {owners.slice(0, 8).map((item) => (
                      <OwnerRow key={item.owner} item={item} />
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Workspace Timeline"
                subtitle="Recent operational activity from this campaign workspace."
              >
                {!activity.length ? (
                  <EmptyState text="No workspace activity yet." />
                ) : (
                  <div className="cw-room-stack">
                    {activity.slice(0, 12).map((item) => (
                      <ActivityRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
