import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function statusTone(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("active") || v.includes("done") || v.includes("complete") || v.includes("resolved")) return "active";
  if (v.includes("risk") || v.includes("delayed") || v.includes("high") || v.includes("blocked") || v.includes("critical")) return "danger";
  if (v.includes("watch") || v.includes("medium") || v.includes("open") || v.includes("progress")) return "demo";
  return "default";
}

function normalizeStatus(status = "open") {
  const value = String(status || "").toLowerCase();
  if (["complete", "completed", "done", "resolved"].includes(value)) return "complete";
  if (["in_progress", "in progress", "started", "active"].includes(value)) return "in_progress";
  if (["blocked", "hold", "paused"].includes(value)) return "blocked";
  return "open";
}

function isHighPriority(task = {}) {
  return ["high", "critical"].includes(String(task.priority || "").toLowerCase());
}

function isLinkedSignal(task = {}) {
  return Boolean(task.metadata?.feed_id || task.metadata?.signal_id || task.metadata?.vendor_action_id);
}

function hoursOld(task = {}) {
  const raw = task.updated_at || task.created_at;
  if (!raw) return 0;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 36e5));
}

function buildOwnerStats(tasks = []) {
  const map = new Map();

  for (const task of tasks) {
    const owner = task.assigned_to || "Command Team";
    const current = map.get(owner) || {
      owner,
      total: 0,
      open: 0,
      complete: 0,
      blocked: 0,
      high: 0
    };

    current.total += 1;
    if (normalizeStatus(task.status) !== "complete") current.open += 1;
    if (normalizeStatus(task.status) === "complete") current.complete += 1;
    if (normalizeStatus(task.status) === "blocked") current.blocked += 1;
    if (isHighPriority(task)) current.high += 1;

    map.set(owner, current);
  }

  return Array.from(map.values()).sort((a, b) => b.open - a.open || b.high - a.high);
}

function buildWorkspaceModel(workspace = null, tasks = [], summary = {}) {
  const openTasks = tasks.filter((task) => normalizeStatus(task.status) !== "complete");
  const completeTasks = tasks.filter((task) => normalizeStatus(task.status) === "complete");
  const blockedTasks = tasks.filter((task) => normalizeStatus(task.status) === "blocked");
  const inProgressTasks = tasks.filter((task) => normalizeStatus(task.status) === "in_progress");
  const highPriorityTasks = tasks.filter(isHighPriority);
  const linkedSignals = tasks.filter(isLinkedSignal);
  const resolvedSignals = linkedSignals.filter((task) => normalizeStatus(task.status) === "complete");
  const agingTasks = openTasks.filter((task) => hoursOld(task) >= 24);
  const slaRiskTasks = openTasks.filter((task) => isHighPriority(task) && hoursOld(task) >= 2);

  const total = tasks.length;
  const completionRate = total ? Math.round((completeTasks.length / total) * 100) : 0;
  const signalClosureRate = linkedSignals.length
    ? Math.round((resolvedSignals.length / linkedSignals.length) * 100)
    : 0;

  return {
    campaign: {
      id: workspace?.id,
      campaign_name: workspace?.name || "Campaign Workspace",
      candidate_name: workspace?.candidate_name || workspace?.metadata?.candidate_name || "",
      state: workspace?.state || "National",
      office: workspace?.office || "Statewide",
      stage: workspace?.metadata?.stage || workspace?.cycle || "2026",
      status: workspace?.status || "active",
      firm_name: workspace?.firm_name || workspace?.metadata?.firm_name || "VoterSpheres Firm",
      owner_name: workspace?.metadata?.owner_name || "Command Team",
      description: workspace?.description || ""
    },
    analytics: {
      total,
      open: openTasks.length,
      complete: completeTasks.length,
      blocked: blockedTasks.length,
      inProgress: inProgressTasks.length,
      highPriority: highPriorityTasks.length,
      linkedSignals: linkedSignals.length,
      resolvedSignals: resolvedSignals.length,
      aging: agingTasks.length,
      slaRisk: slaRiskTasks.length,
      completionRate,
      signalClosureRate,
      owners: buildOwnerStats(tasks)
    },
    metrics: [
      { label: "Open Tasks", value: openTasks.length, subtext: `${highPriorityTasks.length} high priority`, tone: openTasks.length ? "neutral" : "up" },
      { label: "Completion Rate", value: `${completionRate}%`, subtext: `${completeTasks.length} of ${total || 0} closed`, tone: completionRate >= 70 ? "up" : "neutral" },
      { label: "Signal Closure", value: `${signalClosureRate}%`, subtext: `${resolvedSignals.length} of ${linkedSignals.length} resolved`, tone: signalClosureRate >= 70 ? "up" : "neutral" },
      { label: "SLA Risk", value: slaRiskTasks.length, subtext: `${agingTasks.length} aging tasks`, tone: slaRiskTasks.length ? "down" : "up" }
    ],
    tasks,
    alerts: [...slaRiskTasks, ...blockedTasks, ...highPriorityTasks]
      .filter((task, index, arr) => arr.findIndex((item) => item.id === task.id) === index)
      .slice(0, 8)
      .map((task) => ({
        id: task.id,
        title: task.title,
        message: task.description || "Execution task needs attention.",
        severity: task.priority || (normalizeStatus(task.status) === "blocked" ? "blocked" : "medium"),
        action_status: task.status || "open",
        type: task.source || "task",
        age: `${hoursOld(task)}h`
      })),
    activity: tasks.slice(0, 12).map((task) => ({
      id: `task-${task.id}`,
      activity_type: `task_${normalizeStatus(task.status)}`,
      created_at: task.updated_at || task.created_at,
      summary: task.title,
      details: {
        owner: task.assigned_to || "Command Team",
        priority: task.priority || "medium",
        source: task.source || "command_center"
      }
    })),
    summary
  };
}

export default function CampaignWorkspace() {
  const params = useParams();
  const navigate = useNavigate();

  const {
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    refreshWorkspaces
  } = useWorkspace();

  const routeWorkspaceId = params.id ? String(params.id) : "";
  const workspaceId = routeWorkspaceId || activeWorkspaceId || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState(() => buildWorkspaceModel(activeWorkspace, [], {}));

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    if (routeWorkspaceId && routeWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(routeWorkspaceId);
    }
  }, [routeWorkspaceId, activeWorkspaceId, setActiveWorkspaceId]);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      if (!workspaceId) {
        setLoading(false);
        setWorkspace(buildWorkspaceModel(null, [], {}));
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [workspaceRes, tasksRes] = await Promise.allSettled([
          api.getWorkspace(workspaceId),
          api.tasks({ limit: 250, workspace_id: workspaceId })
        ]);

        if (!active) return;

        const workspaceData =
          workspaceRes.status === "fulfilled"
            ? workspaceRes.value?.workspace || workspaceRes.value
            : activeWorkspace;

        const summary =
          workspaceRes.status === "fulfilled"
            ? workspaceRes.value?.summary || {}
            : {};

        const taskRows =
          tasksRes.status === "fulfilled"
            ? tasksRes.value?.results || tasksRes.value?.tasks || []
            : [];

        setWorkspace(buildWorkspaceModel(workspaceData, taskRows, summary));
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load campaign workspace"
        );

        setWorkspace(buildWorkspaceModel(activeWorkspace, [], {}));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [workspaceId, activeWorkspace]);

  const campaignTitle = useMemo(() => {
    const campaign = workspace?.campaign;
    if (!campaign) return `Campaign Workspace #${workspaceId || "—"}`;
    return campaign.campaign_name || campaign.candidate_name || `Campaign Workspace #${workspaceId || "—"}`;
  }, [workspace, workspaceId]);

  async function handleRefresh() {
    await refreshWorkspaces?.();
    if (workspaceId) navigate(`/campaign-workspace/${workspaceId}`);
  }

  return (
    <PageShell
      eyebrow="Workspace Analytics"
      title={campaignTitle}
      description="Campaign-level analytics for execution pressure, linked signal closure, owner workload, blockers, and operational momentum."
      demo={demoMode}
      demoText="Demo mode is active. Workspace analytics may include simulated records."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Workspace Profile"
        subtitle="Campaign-level operating context and active workspace metadata."
        right={
          <div className="vs-inline-actions">
            <Badge tone={statusTone(workspace?.campaign?.status)}>
              {workspace?.campaign?.status || "Active"}
            </Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={handleRefresh}>
              Refresh
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <div className="vs-card-muted">
            <div className="vs-stat-label">Stage / Cycle</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.stage || "Open"}</div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">State</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.state || "N/A"}</div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">Office</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.office || "Statewide"}</div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">Owner</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.owner_name || "Command Team"}</div>
          </div>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        {(workspace.metrics || []).map((metric, index) => (
          <StatCard
            key={`${metric.label}-${index}`}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Executive Pressure"
          subtitle="Where campaign operations require attention right now."
          right={<Badge tone={workspace.analytics.slaRisk ? "danger" : "active"}>{workspace.analytics.slaRisk} SLA risk</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading execution pressure..." />
            ) : !(workspace.alerts || []).length ? (
              <EmptyState text="No active execution pressure." />
            ) : (
              (workspace.alerts || []).map((alert) => (
                <ResponsiveRow
                  key={alert.id || alert.title}
                  title={alert.title}
                  subtitle={alert.message}
                  meta={[
                    { label: "Type", value: alert.type || "task" },
                    { label: "Status", value: alert.action_status || "open" },
                    { label: "Age", value: alert.age || "—" }
                  ]}
                  right={<Badge tone={statusTone(alert.severity)}>{alert.severity || "medium"}</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Signal Closure Analytics"
          subtitle="How well intelligence signals are being converted into closed execution."
          right={<Badge tone={workspace.analytics.signalClosureRate >= 70 ? "active" : "demo"}>{workspace.analytics.signalClosureRate}% closed</Badge>}
        >
          <div className="vs-grid-2">
            <div className="vs-card-muted">
              <div className="vs-stat-label">Linked Signals</div>
              <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>
                {workspace.analytics.linkedSignals}
              </div>
            </div>
            <div className="vs-card-muted">
              <div className="vs-stat-label">Resolved Signals</div>
              <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>
                {workspace.analytics.resolvedSignals}
              </div>
            </div>
            <div className="vs-card-muted">
              <div className="vs-stat-label">Blocked Tasks</div>
              <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>
                {workspace.analytics.blocked}
              </div>
            </div>
            <div className="vs-card-muted">
              <div className="vs-stat-label">In Progress</div>
              <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>
                {workspace.analytics.inProgress}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="vs-grid-3">
        <SectionCard title="Workspace Tasks" subtitle="Execution items scoped to this campaign workspace.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading tasks..." />
            ) : !(workspace.tasks || []).length ? (
              <EmptyState text="No tasks found for this workspace." />
            ) : (
              (workspace.tasks || []).slice(0, 10).map((task) => (
                <ResponsiveRow
                  key={task.id || task.local_id || task.title}
                  title={task.title}
                  subtitle={task.description || "Campaign execution task"}
                  meta={[
                    { label: "Status", value: task.status || "open" },
                    { label: "Priority", value: task.priority || "medium" },
                    { label: "Owner", value: task.assigned_to || "Command Team" }
                  ]}
                  right={<Badge tone={statusTone(task.status)}>{task.status || "open"}</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Owner Workload" subtitle="Task ownership, pressure, and team capacity.">
          <div className="vs-stack">
            {!workspace.analytics.owners.length ? (
              <EmptyState text="No assigned owners yet." />
            ) : (
              workspace.analytics.owners.map((owner) => (
                <ResponsiveRow
                  key={owner.owner}
                  title={owner.owner}
                  subtitle={`${owner.open} open • ${owner.complete} complete`}
                  meta={[
                    { label: "High", value: owner.high },
                    { label: "Blocked", value: owner.blocked },
                    { label: "Total", value: owner.total }
                  ]}
                  right={<Badge tone={owner.blocked || owner.high >= 3 ? "danger" : owner.open >= 5 ? "demo" : "active"}>{owner.open} open</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Workspace Metadata" subtitle="Campaign identifiers and client workspace details.">
          <div className="vs-stack">
            <ResponsiveRow
              title={workspace?.campaign?.candidate_name || "Candidate not set"}
              subtitle={workspace?.campaign?.description || "Workspace metadata"}
              meta={[
                { label: "Workspace ID", value: workspace?.campaign?.id || workspaceId || "—" },
                { label: "State", value: workspace?.campaign?.state || "National" },
                { label: "Office", value: workspace?.campaign?.office || "Statewide" },
                { label: "Cycle", value: workspace?.campaign?.stage || "2026" }
              ]}
              right={<Badge tone="default">Workspace</Badge>}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Activity Timeline" subtitle="Recent operational activity across this workspace.">
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading activity..." />
          ) : !(workspace.activity || []).length ? (
            <EmptyState text="No activity yet." />
          ) : (
            (workspace.activity || []).map((item) => {
              const details = item.details || item.metadata || {};
              const detailEntries = Object.entries(details)
                .filter(([k]) => k !== "timestamp")
                .slice(0, 4)
                .map(([k, v]) => ({ label: k, value: String(v) }));

              return (
                <ResponsiveRow
                  key={item.id}
                  title={String(item.activity_type || "").replaceAll("_", " ")}
                  subtitle={item.summary}
                  meta={[
                    { label: "When", value: item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown" },
                    ...detailEntries
                  ]}
                />
              );
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
