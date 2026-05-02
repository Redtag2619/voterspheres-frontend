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
  if (
    v.includes("active") ||
    v.includes("done") ||
    v.includes("complete") ||
    v.includes("resolved")
  ) {
    return "active";
  }
  if (
    v.includes("risk") ||
    v.includes("delayed") ||
    v.includes("high") ||
    v.includes("blocked") ||
    v.includes("critical")
  ) {
    return "danger";
  }
  if (
    v.includes("watch") ||
    v.includes("medium") ||
    v.includes("open") ||
    v.includes("progress")
  ) {
    return "demo";
  }
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
  return Boolean(
    task.metadata?.feed_id ||
      task.metadata?.signal_id ||
      task.metadata?.vendor_action_id
  );
}

function hoursOld(task = {}) {
  const raw = task.updated_at || task.created_at;
  if (!raw) return 0;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 36e5));
}

function escapeHtml(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeFileName(value = "workspace-report") {
  return (
    String(value || "workspace-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "workspace-report"
  );
}

function buildClientEmailDraft(workspace = {}, report = null) {
  const campaign = workspace.campaign || {};
  const analytics = workspace.analytics || {};
  const title = campaign.campaign_name || "Workspace";
  const generatedDate = new Date().toLocaleDateString();
  const reportName = report?.filename || `${safeFileName(title)}-report.html`;

  const subject = `${title} Workspace Report - ${generatedDate}`;
  const body = [
    `Hi,`,
    ``,
    `Attached is the latest VoterSpheres workspace report for ${title}.`,
    ``,
    `Executive summary:`,
    `- Open tasks: ${analytics.open || 0}`,
    `- Completed tasks: ${analytics.complete || 0}`,
    `- Blocked tasks: ${analytics.blocked || 0}`,
    `- SLA risk items: ${analytics.slaRisk || 0}`,
    `- Signal closure rate: ${analytics.signalClosureRate || 0}%`,
    ``,
    `Report file: ${reportName}`,
    ``,
    `Recommended next step: review any blocked or SLA-risk items first, then confirm ownership for remaining open work.`,
    ``,
    `Best,`,
    `Command Team`
  ].join("\n");

  return { subject, body };
}

function reportHistoryKey(workspaceId = "") {
  return `vs_workspace_reports_${workspaceId || "default"}`;
}

function loadReportHistory(workspaceId = "") {
  try {
    const raw = localStorage.getItem(reportHistoryKey(workspaceId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReportHistory(workspaceId = "", reports = []) {
  try {
    localStorage.setItem(reportHistoryKey(workspaceId), JSON.stringify(reports.slice(0, 20)));
  } catch {
    // Ignore localStorage failures.
  }
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
      {
        label: "Open Tasks",
        value: openTasks.length,
        subtext: `${highPriorityTasks.length} high priority`,
        tone: openTasks.length ? "neutral" : "up"
      },
      {
        label: "Completion Rate",
        value: `${completionRate}%`,
        subtext: `${completeTasks.length} of ${total || 0} closed`,
        tone: completionRate >= 70 ? "up" : "neutral"
      },
      {
        label: "Signal Closure",
        value: `${signalClosureRate}%`,
        subtext: `${resolvedSignals.length} of ${linkedSignals.length} resolved`,
        tone: signalClosureRate >= 70 ? "up" : "neutral"
      },
      {
        label: "SLA Risk",
        value: slaRiskTasks.length,
        subtext: `${agingTasks.length} aging tasks`,
        tone: slaRiskTasks.length ? "down" : "up"
      }
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

function buildReportHtml(workspace = {}) {
  const campaign = workspace.campaign || {};
  const analytics = workspace.analytics || {};
  const tasks = workspace.tasks || [];
  const alerts = workspace.alerts || [];
  const owners = analytics.owners || [];
  const activity = workspace.activity || [];
  const generatedAt = new Date().toLocaleString();

  const rows = (items, renderer, empty = "No records.") =>
    items.length
      ? items.map(renderer).join("")
      : `<tr><td colspan="5" class="empty">${empty}</td></tr>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(campaign.campaign_name)} Workspace Report</title>
  <style>
    body { margin: 0; padding: 34px; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #f8fafc; }
    .report { max-width: 1040px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); }
    .hero { background: linear-gradient(135deg, #0f172a, #1e3a8a); color: white; padding: 30px; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; font-weight: 800; color: #93c5fd; }
    h1 { margin: 8px 0 0; font-size: 30px; line-height: 1.15; }
    .subtitle { margin-top: 8px; color: #cbd5e1; line-height: 1.5; }
    .body { padding: 28px 30px 34px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 18px 0 26px; }
    .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; background: #f8fafc; }
    .label { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: #64748b; text-transform: uppercase; }
    .value { margin-top: 8px; font-size: 24px; font-weight: 900; color: #0f172a; }
    .sub { margin-top: 4px; font-size: 12px; color: #64748b; }
    h2 { margin: 28px 0 10px; font-size: 18px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 18px; }
    th { background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; padding: 11px; }
    td { border-top: 1px solid #e2e8f0; padding: 11px; vertical-align: top; font-size: 13px; color: #334155; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #e0f2fe; color: #075985; font-size: 11px; font-weight: 800; }
    .danger { background: #fee2e2; color: #991b1b; }
    .active { background: #dcfce7; color: #166534; }
    .empty { color: #94a3b8; text-align: center; padding: 18px; }
    .footer { margin-top: 26px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
    @media print { body { background: white; padding: 0; } .report { box-shadow: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="report">
    <div class="hero">
      <div class="eyebrow">VoterSpheres Workspace Report</div>
      <h1>${escapeHtml(campaign.campaign_name || "Campaign Workspace")}</h1>
      <div class="subtitle">${escapeHtml(campaign.state || "National")} • ${escapeHtml(campaign.office || "Statewide")} • ${escapeHtml(campaign.stage || "2026")}<br/>Generated ${escapeHtml(generatedAt)}</div>
    </div>
    <div class="body">
      <h2>Executive Summary</h2>
      <div class="grid">
        <div class="card"><div class="label">Open Tasks</div><div class="value">${analytics.open || 0}</div><div class="sub">${analytics.highPriority || 0} high priority</div></div>
        <div class="card"><div class="label">Completion Rate</div><div class="value">${analytics.completionRate || 0}%</div><div class="sub">${analytics.complete || 0} of ${analytics.total || 0} closed</div></div>
        <div class="card"><div class="label">Signal Closure</div><div class="value">${analytics.signalClosureRate || 0}%</div><div class="sub">${analytics.resolvedSignals || 0} of ${analytics.linkedSignals || 0} resolved</div></div>
        <div class="card"><div class="label">SLA Risk</div><div class="value">${analytics.slaRisk || 0}</div><div class="sub">${analytics.aging || 0} aging tasks</div></div>
      </div>
      <h2>Workspace Profile</h2>
      <table><tbody>
        <tr><th>Candidate</th><td>${escapeHtml(campaign.candidate_name || "Not set")}</td><th>Status</th><td>${escapeHtml(campaign.status || "active")}</td></tr>
        <tr><th>State</th><td>${escapeHtml(campaign.state || "National")}</td><th>Office</th><td>${escapeHtml(campaign.office || "Statewide")}</td></tr>
        <tr><th>Owner</th><td>${escapeHtml(campaign.owner_name || "Command Team")}</td><th>Workspace ID</th><td>${escapeHtml(campaign.id || "—")}</td></tr>
      </tbody></table>
      <h2>Execution Pressure</h2>
      <table><thead><tr><th>Item</th><th>Status</th><th>Severity</th><th>Type</th><th>Age</th></tr></thead><tbody>
        ${rows(alerts, (alert) => `<tr><td><strong>${escapeHtml(alert.title)}</strong><br/>${escapeHtml(alert.message)}</td><td>${escapeHtml(alert.action_status)}</td><td><span class="badge danger">${escapeHtml(alert.severity)}</span></td><td>${escapeHtml(alert.type)}</td><td>${escapeHtml(alert.age)}</td></tr>`, "No active pressure items.")}
      </tbody></table>
      <h2>Owner Workload</h2>
      <table><thead><tr><th>Owner</th><th>Open</th><th>Complete</th><th>High Priority</th><th>Blocked</th></tr></thead><tbody>
        ${rows(owners, (owner) => `<tr><td><strong>${escapeHtml(owner.owner)}</strong></td><td>${owner.open}</td><td>${owner.complete}</td><td>${owner.high}</td><td>${owner.blocked}</td></tr>`, "No owner workload yet.")}
      </tbody></table>
      <h2>Workspace Tasks</h2>
      <table><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Owner</th><th>Source</th></tr></thead><tbody>
        ${rows(tasks.slice(0, 25), (task) => `<tr><td><strong>${escapeHtml(task.title)}</strong><br/>${escapeHtml(task.description || "")}</td><td><span class="badge ${normalizeStatus(task.status) === "complete" ? "active" : ""}">${escapeHtml(task.status || "open")}</span></td><td>${escapeHtml(task.priority || "medium")}</td><td>${escapeHtml(task.assigned_to || "Command Team")}</td><td>${escapeHtml(task.source || "command_center")}</td></tr>`, "No tasks in this workspace.")}
      </tbody></table>
      <h2>Recent Activity</h2>
      <table><thead><tr><th>Activity</th><th>Summary</th><th>When</th><th>Details</th></tr></thead><tbody>
        ${rows(activity, (item) => {
          const details = Object.entries(item.details || {}).map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(value)}`).join("<br/>");
          return `<tr><td>${escapeHtml(String(item.activity_type || "").replaceAll("_", " "))}</td><td>${escapeHtml(item.summary || "")}</td><td>${escapeHtml(item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown")}</td><td>${details}</td></tr>`;
        }, "No recent activity.")}
      </tbody></table>
      <div class="footer">Prepared by VoterSpheres. This report summarizes workspace execution status, signal closure, owner workload, and operational pressure.</div>
    </div>
  </div>
</body>
</html>`;
}

function downloadWorkspaceReport(workspace = {}, existingReport = null) {
  const html = existingReport?.html || buildReportHtml(workspace);
  const campaignName =
    workspace?.campaign?.campaign_name || existingReport?.title || "workspace";
  const stamp = new Date().toISOString().slice(0, 10);
  const filename =
    existingReport?.filename || `${safeFileName(campaignName)}-report-${stamp}.html`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);

  return { html, filename };
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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState(() =>
    buildWorkspaceModel(activeWorkspace, [], {})
  );
  const [reportHistory, setReportHistory] = useState(() =>
    loadReportHistory(workspaceId)
  );
  const [clientEmail, setClientEmail] = useState("");
  const [emailDraftMessage, setEmailDraftMessage] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    if (routeWorkspaceId && routeWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(routeWorkspaceId);
    }
  }, [routeWorkspaceId, activeWorkspaceId, setActiveWorkspaceId]);

  useEffect(() => {
    setReportHistory(loadReportHistory(workspaceId));
  }, [workspaceId]);

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
    return (
      campaign.campaign_name ||
      campaign.candidate_name ||
      `Campaign Workspace #${workspaceId || "—"}`
    );
  }, [workspace, workspaceId]);

  async function handleRefresh() {
    await refreshWorkspaces?.();
    if (workspaceId) navigate(`/campaign-workspace/${workspaceId}`);
  }

  async function handleExportReport() {
    try {
      setExporting(true);

      const { html, filename } = downloadWorkspaceReport(workspace);
      const report = {
        id: `report-${Date.now()}`,
        title: `${workspace?.campaign?.campaign_name || "Workspace"} Report`,
        filename,
        generated_at: new Date().toISOString(),
        generated_by: "Command Team",
        workspace_id: workspaceId,
        summary: {
          open: workspace.analytics.open,
          complete: workspace.analytics.complete,
          blocked: workspace.analytics.blocked,
          slaRisk: workspace.analytics.slaRisk,
          signalClosureRate: workspace.analytics.signalClosureRate
        },
        html
      };

      const nextReports = [report, ...reportHistory].slice(0, 20);
      setReportHistory(nextReports);
      saveReportHistory(workspaceId, nextReports);
    } finally {
      setTimeout(() => setExporting(false), 350);
    }
  }

  function handleDownloadSavedReport(report) {
    downloadWorkspaceReport(workspace, report);
  }

  function handleOpenSavedReport(report) {
    const blob = new Blob([report.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function handleClearReports() {
    setReportHistory([]);
    saveReportHistory(workspaceId, []);
  }

  function ensureLatestReportRecord() {
    if (reportHistory[0]) return reportHistory[0];

    const html = buildReportHtml(workspace);
    const campaignName = workspace?.campaign?.campaign_name || "workspace";
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${safeFileName(campaignName)}-report-${stamp}.html`;
    const report = {
      id: `report-${Date.now()}`,
      title: `${workspace?.campaign?.campaign_name || "Workspace"} Report`,
      filename,
      generated_at: new Date().toISOString(),
      generated_by: "Command Team",
      workspace_id: workspaceId,
      summary: {
        open: workspace.analytics.open,
        complete: workspace.analytics.complete,
        blocked: workspace.analytics.blocked,
        slaRisk: workspace.analytics.slaRisk,
        signalClosureRate: workspace.analytics.signalClosureRate
      },
      html
    };

    const nextReports = [report, ...reportHistory].slice(0, 20);
    setReportHistory(nextReports);
    saveReportHistory(workspaceId, nextReports);
    return report;
  }

  async function handleCopyEmailDraft() {
    const report = ensureLatestReportRecord();
    const draft = buildClientEmailDraft(workspace, report);
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;

    try {
      await navigator.clipboard.writeText(text);
      setEmailCopied(true);
      setEmailDraftMessage("Email draft copied. Attach the downloaded report before sending.");
      setTimeout(() => setEmailCopied(false), 1800);
    } catch {
      setEmailDraftMessage("Could not copy automatically. Select and copy the draft text manually.");
    }
  }

  function handleOpenEmailDraft() {
    if (!clientEmail.trim()) {
      setEmailDraftMessage("Enter a client email address first.");
      return;
    }

    const report = ensureLatestReportRecord();
    const draft = buildClientEmailDraft(workspace, report);
    const mailto = `mailto:${encodeURIComponent(clientEmail.trim())}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;

    setEmailDraftMessage("Email draft opened. Attach the downloaded report before sending.");
    window.location.href = mailto;
  }

  return (
    <PageShell
      eyebrow="Workspace Analytics"
      title={campaignTitle}
      description="Campaign-level analytics for execution pressure, linked signal closure, owner workload, blockers, operational momentum, and client reporting."
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
            <button
              type="button"
              className="vs-button"
              onClick={handleExportReport}
              disabled={loading || exporting}
            >
              {exporting ? "Exporting..." : "Export Report"}
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <div className="vs-card-muted">
            <div className="vs-stat-label">Stage / Cycle</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
              {workspace?.campaign?.stage || "Open"}
            </div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">State</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
              {workspace?.campaign?.state || "N/A"}
            </div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">Office</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
              {workspace?.campaign?.office || "Statewide"}
            </div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">Owner</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
              {workspace?.campaign?.owner_name || "Command Team"}
            </div>
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
          right={
            <Badge tone={workspace.analytics.slaRisk ? "danger" : "active"}>
              {workspace.analytics.slaRisk} SLA risk
            </Badge>
          }
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
                  right={
                    <Badge tone={statusTone(alert.severity)}>
                      {alert.severity || "medium"}
                    </Badge>
                  }
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Signal Closure Analytics"
          subtitle="How well intelligence signals are being converted into closed execution."
          right={
            <Badge tone={workspace.analytics.signalClosureRate >= 70 ? "active" : "demo"}>
              {workspace.analytics.signalClosureRate}% closed
            </Badge>
          }
        >
          <div className="vs-grid-2">
            <div className="vs-card-muted"><div className="vs-stat-label">Linked Signals</div><div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>{workspace.analytics.linkedSignals}</div></div>
            <div className="vs-card-muted"><div className="vs-stat-label">Resolved Signals</div><div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>{workspace.analytics.resolvedSignals}</div></div>
            <div className="vs-card-muted"><div className="vs-stat-label">Blocked Tasks</div><div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>{workspace.analytics.blocked}</div></div>
            <div className="vs-card-muted"><div className="vs-stat-label">In Progress</div><div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>{workspace.analytics.inProgress}</div></div>
          </div>
        </SectionCard>
      </div>

      <div className="vs-grid-3">
        <SectionCard title="Workspace Tasks" subtitle="Execution items scoped to this campaign workspace.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading tasks..." /> : !(workspace.tasks || []).length ? <EmptyState text="No tasks found for this workspace." /> : (workspace.tasks || []).slice(0, 10).map((task) => (
              <ResponsiveRow key={task.id || task.local_id || task.title} title={task.title} subtitle={task.description || "Campaign execution task"} meta={[{ label: "Status", value: task.status || "open" }, { label: "Priority", value: task.priority || "medium" }, { label: "Owner", value: task.assigned_to || "Command Team" }]} right={<Badge tone={statusTone(task.status)}>{task.status || "open"}</Badge>} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Owner Workload" subtitle="Task ownership, pressure, and team capacity.">
          <div className="vs-stack">
            {!workspace.analytics.owners.length ? <EmptyState text="No assigned owners yet." /> : workspace.analytics.owners.map((owner) => (
              <ResponsiveRow key={owner.owner} title={owner.owner} subtitle={`${owner.open} open • ${owner.complete} complete`} meta={[{ label: "High", value: owner.high }, { label: "Blocked", value: owner.blocked }, { label: "Total", value: owner.total }]} right={<Badge tone={owner.blocked || owner.high >= 3 ? "danger" : owner.open >= 5 ? "demo" : "active"}>{owner.open} open</Badge>} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Workspace Metadata" subtitle="Campaign identifiers and client workspace details.">
          <div className="vs-stack">
            <ResponsiveRow title={workspace?.campaign?.candidate_name || "Candidate not set"} subtitle={workspace?.campaign?.description || "Workspace metadata"} meta={[{ label: "Workspace ID", value: workspace?.campaign?.id || workspaceId || "—" }, { label: "State", value: workspace?.campaign?.state || "National" }, { label: "Office", value: workspace?.campaign?.office || "Statewide" }, { label: "Cycle", value: workspace?.campaign?.stage || "2026" }]} right={<Badge tone="default">Workspace</Badge>} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Workspace Report Center" subtitle="Saved client-ready workspace reports generated from this analytics dashboard." right={<div className="vs-inline-actions"><Badge tone="accent">{reportHistory.length} saved</Badge>{reportHistory.length ? <button type="button" className="vs-button vs-button-secondary" onClick={handleClearReports}>Clear</button> : null}</div>}>
        <div className="vs-stack">
          {!reportHistory.length ? <EmptyState text="No saved reports yet. Click Export Report to generate the first client-ready report." /> : reportHistory.map((report) => (
            <ResponsiveRow key={report.id} title={report.title} subtitle={`Generated ${new Date(report.generated_at).toLocaleString()} by ${report.generated_by || "Command Team"}`} meta={[{ label: "Open", value: report.summary?.open ?? 0 }, { label: "Complete", value: report.summary?.complete ?? 0 }, { label: "Blocked", value: report.summary?.blocked ?? 0 }, { label: "SLA Risk", value: report.summary?.slaRisk ?? 0 }, { label: "Signal Closure", value: `${report.summary?.signalClosureRate ?? 0}%` }]} right={<div className="vs-inline-actions"><button type="button" className="vs-button vs-button-secondary" onClick={() => handleOpenSavedReport(report)}>Open</button><button type="button" className="vs-button" onClick={() => handleDownloadSavedReport(report)}>Download</button></div>} />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Send Report to Client"
        subtitle="Prepare a client-ready email draft using the latest workspace analytics report."
        right={<Badge tone={clientEmail.trim() ? "active" : "demo"}>{clientEmail.trim() ? "Ready" : "Draft"}</Badge>}
      >
        <div className="vs-stack">
          <div className="vs-card-muted">
            <div className="vs-stat-label">Client Email</div>
            <input
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
              placeholder="client@example.com"
              style={{
                marginTop: "0.65rem",
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.22)",
                background: "rgba(15, 23, 42, 0.48)",
                color: "inherit",
                padding: "0.75rem 0.85rem",
                outline: "none"
              }}
            />
          </div>

          <ResponsiveRow
            title={`${workspace?.campaign?.campaign_name || "Workspace"} Client Report Email`}
            subtitle="Copies or opens a polished client email draft. Download the report from Report Center and attach it before sending."
            meta={[
              { label: "Open", value: workspace.analytics.open },
              { label: "Complete", value: workspace.analytics.complete },
              { label: "Blocked", value: workspace.analytics.blocked },
              { label: "SLA Risk", value: workspace.analytics.slaRisk },
              { label: "Signal Closure", value: `${workspace.analytics.signalClosureRate}%` }
            ]}
            right={
              <div className="vs-inline-actions">
                <button
                  type="button"
                  className="vs-button vs-button-secondary"
                  onClick={handleCopyEmailDraft}
                >
                  {emailCopied ? "Copied" : "Copy Draft"}
                </button>
                <button
                  type="button"
                  className="vs-button"
                  onClick={handleOpenEmailDraft}
                >
                  Open Email
                </button>
              </div>
            }
          />

          {emailDraftMessage ? (
            <div className="vs-banner" style={{ borderColor: "rgba(96,165,250,0.25)", background: "rgba(30,64,175,0.12)", color: "rgba(191,219,254,0.96)" }}>
              {emailDraftMessage}
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Activity Timeline" subtitle="Recent operational activity across this workspace.">
        <div className="vs-stack">
          {loading ? <EmptyState text="Loading activity..." /> : !(workspace.activity || []).length ? <EmptyState text="No activity yet." /> : (workspace.activity || []).map((item) => {
            const details = item.details || item.metadata || {};
            const detailEntries = Object.entries(details).filter(([k]) => k !== "timestamp").slice(0, 4).map(([k, v]) => ({ label: k, value: String(v) }));
            return <ResponsiveRow key={item.id} title={String(item.activity_type || "").replaceAll("_", " ")} subtitle={item.summary} meta={[{ label: "When", value: item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown" }, ...detailEntries]} />;
          })}
        </div>
      </SectionCard>
    </PageShell>
  );
}

