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

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function statusTone(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("active") || v.includes("done") || v.includes("complete") || v.includes("delivered")) return "active";
  if (v.includes("risk") || v.includes("delayed") || v.includes("high") || v.includes("blocked")) return "danger";
  if (v.includes("watch") || v.includes("medium") || v.includes("prospect") || v.includes("todo") || v.includes("open")) return "demo";
  return "default";
}

function normalizeStatus(status = "open") {
  const value = String(status || "").toLowerCase();
  if (["complete", "completed", "done"].includes(value)) return "complete";
  if (["in_progress", "in progress", "started", "active"].includes(value)) return "in_progress";
  if (["blocked", "hold", "paused"].includes(value)) return "blocked";
  return "open";
}

function buildWorkspaceModel(workspace = null, tasks = [], summary = {}) {
  const openTasks = tasks.filter((task) => normalizeStatus(task.status) !== "complete");
  const completeTasks = tasks.filter((task) => normalizeStatus(task.status) === "complete");
  const blockedTasks = tasks.filter((task) => normalizeStatus(task.status) === "blocked");
  const highPriorityTasks = tasks.filter((task) =>
    ["high", "critical"].includes(String(task.priority || "").toLowerCase())
  );

  const activeSignals = tasks.filter((task) => task.metadata?.feed_id || task.metadata?.signal_id);
  const resolvedSignals = activeSignals.filter((task) => normalizeStatus(task.status) === "complete");

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
    metrics: [
      { label: "Open Tasks", value: openTasks.length, subtext: `${highPriorityTasks.length} high priority` },
      { label: "Completed", value: completeTasks.length, subtext: "Closed execution" },
      { label: "Blocked", value: blockedTasks.length, subtext: "Needs escalation" },
      { label: "Linked Signals", value: activeSignals.length, subtext: `${resolvedSignals.length} resolved` }
    ],
    alerts: highPriorityTasks.slice(0, 6).map((task) => ({
      id: task.id,
      title: task.title,
      message: task.description || "High-priority execution task needs attention.",
      severity: task.priority || "high",
      action_status: task.status || "open",
      type: task.source || "task"
    })),
    tasks,
    vendors: [],
    contacts: [],
    documents: [],
    fundraising: {
      total_receipts: summary?.total_receipts || 0,
      cash_on_hand: summary?.cash_on_hand || 0
    },
    forecast: {
      snapshot: null,
      races: []
    },
    mail: {
      programs: [],
      drops: [],
      recent_events: []
    },
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
    }))
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

    if (workspaceId) {
      navigate(`/campaign-workspace/${workspaceId}`);
    }
  }

  return (
    <PageShell
      eyebrow="Campaign Operating Workspace"
      title={campaignTitle}
      description="The live workspace for campaign execution, linked signals, task pressure, team ownership, and operational closure."
      demo={demoMode}
      demoText="Demo mode is active. Workspace data may be simulated."
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
        subtitle="Campaign-level operating context for this client workspace."
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
          />
        ))}
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Execution Pressure"
          subtitle="High-priority items and blockers inside this workspace."
          right={<Badge>{(workspace.alerts || []).length} alerts</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading alerts..." />
            ) : !(workspace.alerts || []).length ? (
              <EmptyState text="No active execution alerts." />
            ) : (
              (workspace.alerts || []).map((alert) => (
                <ResponsiveRow
                  key={alert.id || alert.title}
                  title={alert.title}
                  subtitle={alert.message}
                  meta={[
                    { label: "Type", value: alert.type || "task" },
                    { label: "Status", value: alert.action_status || "open" },
                    { label: "Severity", value: alert.severity || "medium" }
                  ]}
                  right={<Badge tone={statusTone(alert.severity)}>{alert.severity || "medium"}</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Signal Closure" subtitle="Linked task outcomes for this campaign workspace.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading signal closure..." />
            ) : (
              <>
                <div className="vs-card-muted">
                  <div className="vs-stat-label">Linked Signals</div>
                  <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
                    {(workspace.tasks || []).filter((task) => task.metadata?.feed_id || task.metadata?.signal_id).length}
                  </div>
                </div>
                <div className="vs-card-muted">
                  <div className="vs-stat-label">Resolved Signals</div>
                  <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
                    {(workspace.tasks || []).filter(
                      (task) =>
                        (task.metadata?.feed_id || task.metadata?.signal_id) &&
                        normalizeStatus(task.status) === "complete"
                    ).length}
                  </div>
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="vs-grid-3">
        <SectionCard title="Workspace Tasks" subtitle="Execution items scoped to this campaign.">
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

        <SectionCard title="Owners" subtitle="Current task ownership in this workspace.">
          <div className="vs-stack">
            {Array.from(
              new Map(
                (workspace.tasks || []).map((task) => [
                  task.assigned_to || "Command Team",
                  {
                    name: task.assigned_to || "Command Team",
                    count: (workspace.tasks || []).filter(
                      (item) => (item.assigned_to || "Command Team") === (task.assigned_to || "Command Team")
                    ).length
                  }
                ])
              ).values()
            ).map((owner) => (
              <ResponsiveRow
                key={owner.name}
                title={owner.name}
                subtitle="Workspace assignee"
                meta={[{ label: "Tasks", value: owner.count }]}
                right={<Badge tone="accent">{owner.count}</Badge>}
              />
            ))}
            {!(workspace.tasks || []).length ? <EmptyState text="No assigned owners yet." /> : null}
          </div>
        </SectionCard>

        <SectionCard title="Workspace Metadata" subtitle="Campaign details and workspace identifiers.">
          <div className="vs-stack">
            <ResponsiveRow
              title={workspace?.campaign?.candidate_name || "Candidate not set"}
              subtitle={workspace?.campaign?.description || "Workspace metadata"}
              meta={[
                { label: "Workspace ID", value: workspace?.campaign?.id || workspaceId || "—" },
                { label: "State", value: workspace?.campaign?.state || "National" },
                { label: "Office", value: workspace?.campaign?.office || "Statewide" }
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
