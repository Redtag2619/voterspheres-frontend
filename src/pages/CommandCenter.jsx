import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import DemoOnboarding from "../components/demo/DemoOnboarding.jsx";
import LiveActivityStream from "../components/demo/LiveActivityStream.jsx";
import ExecutionBoard from "../components/tasks/ExecutionBoard.jsx";
import { useApiResource } from "../hooks/useApiResource";
import useLiveChannel from "../hooks/useLiveChannel";
import useRealtimeStream from "../hooks/useRealtimeStream";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

const fallbackData = {
  metrics: [
    { label: "National Win Index", value: "61.8", delta: "+3.1", tone: "up" },
    { label: "Active Threats", value: "4", delta: "2 require action", tone: "down" },
    { label: "Fundraising Pulse", value: "$12.8M", delta: "+9.4%", tone: "up" },
    { label: "Persuasion Opportunity", value: "8.9", delta: "+0.8", tone: "up" }
  ],
  battlegrounds: [
    { race: "GA Senate", state: "Georgia", office: "Senate", probability: "57%", momentum: "+2.4", risk: "Elevated", priority: "Tier 1" },
    { race: "PA Senate", state: "Pennsylvania", office: "Senate", probability: "54%", momentum: "+1.8", risk: "Watch", priority: "Tier 1" },
    { race: "AZ Senate", state: "Arizona", office: "Senate", probability: "51%", momentum: "+1.1", risk: "Watch", priority: "Tier 2" }
  ],
  actions: [
    { title: "Deploy suburban affordability contrast", owner: "War Room", due: "Now", detail: "Shift message weight into metro persuadable voter clusters.", state: "Georgia", office: "Senate", risk: "Elevated" },
    { title: "Escalate MailOps delay response", owner: "MailOps", due: "45 min", detail: "Coordinate with vendor and USPS contacts to protect weekend delivery.", state: "Georgia", office: "Senate", risk: "Elevated" },
    { title: "Refresh surrogate briefing memo", owner: "Comms", due: "2 hrs", detail: "Update talking points around education and cost-of-living pressure.", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ],
  feed: [
    { id: 1, time: "08:12", title: "Opposition affordability attack accelerating", source: "War Room", severity: "High", type: "warroom.threat_detected", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 2, time: "08:41", title: "Mail delay detected at Atlanta NDC", source: "Mail Intelligence", severity: "High", type: "mail.delay_detected", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 3, time: "09:05", title: "Forecast updated for PA Senate", source: "Forecast Engine", severity: "Medium", type: "forecast.updated", state: "Pennsylvania", office: "Senate", risk: "Watch" },
    { id: 4, time: "09:22", title: "Vendor coverage gap flagged in AZ", source: "Vendor Intelligence", severity: "High", type: "vendor.coverage_gap", state: "Arizona", office: "Senate", risk: "Elevated" },
    { id: 5, time: "09:37", title: "Candidate contact gap requires verification", source: "Candidate Intelligence", severity: "Medium", type: "candidate.contact_gap", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ]
};

const fallbackCrossSignal = {
  summary: {
    states_tracked: 3,
    critical_states: 1,
    high_states: 2,
    vendor_gap_states: 1
  },
  top_priorities: [
    {
      state: "Georgia",
      severity: "High",
      risk: "Elevated",
      priority_score: 91,
      recommended_actions: ["Escalate MailOps response.", "Increase suburban persuasion pressure."],
      finance: { receipts: 12800000 },
      vendors: { coverage_status: "Tight" },
      mailops: { mail_risks: 2 }
    },
    {
      state: "Arizona",
      severity: "High",
      risk: "Elevated",
      priority_score: 84,
      recommended_actions: ["Audit vendor coverage.", "Prepare backup vendor lane."],
      finance: { receipts: 9400000 },
      vendors: { coverage_status: "Gap" },
      mailops: { mail_risks: 1 }
    },
    {
      state: "Pennsylvania",
      severity: "Medium",
      risk: "Watch",
      priority_score: 76,
      recommended_actions: ["Verify candidate contacts.", "Refresh surrogate memo."],
      finance: { receipts: 11100000 },
      vendors: { coverage_status: "Stable" },
      mailops: { mail_risks: 0 }
    }
  ],
  results: []
};

function badgeToneFromSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high" || v === "elevated" || v === "severe") return "danger";
  if (v === "medium" || v === "watch") return "demo";
  return "default";
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function dedupeFeed(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type || ""}-${item.title || ""}-${item.time || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesFilters(item, filters) {
  if (!item) return false;
  if (filters.state && item.state !== filters.state) return false;
  if (filters.office && item.office !== filters.office) return false;
  if (filters.risk && item.risk !== filters.risk) return false;
  return true;
}

function getActionClass(action) {
  const value = String(action || "").toLowerCase();

  if (value.includes("escalate")) return "vs-decision-btn escalate";
  if (value.includes("audit")) return "vs-decision-btn audit";
  if (value.includes("deploy")) return "vs-decision-btn deploy";
  if (value.includes("activate")) return "vs-decision-btn activate";
  if (value.includes("verify") || value.includes("refresh")) return "vs-decision-btn verify";

  return "vs-decision-btn";
}

function getTaskOwner(action) {
  const value = String(action || "").toLowerCase();

  if (value.includes("mail") || value.includes("delivery") || value.includes("usps")) return "MailOps";
  if (value.includes("vendor") || value.includes("coverage") || value.includes("operations")) return "Operations";
  if (value.includes("candidate") || value.includes("profile") || value.includes("contact")) return "Candidate Intelligence";
  if (value.includes("surrogate") || value.includes("message") || value.includes("media")) return "War Room";

  return "Command Team";
}

function getTaskPriority(action, risk) {
  const value = String(action || "").toLowerCase();
  const riskValue = String(risk || "").toLowerCase();

  if (value.includes("escalate") || riskValue === "elevated" || riskValue === "critical") return "high";
  if (value.includes("audit") || value.includes("verify")) return "medium";
  return "medium";
}

function buildExecutiveDecision({ feed = [] }) {
  if (!feed.length) return null;

  const high = feed.find((item) =>
    ["high", "critical"].includes(String(item.severity || "").toLowerCase())
  );

  if (!high) return null;

  const state = high.state || "Priority State";
  const type = String(high.type || "").toLowerCase();

  if (type.includes("mail")) {
    return {
      level: "CRITICAL",
      title: `${state} MailOps disruption detected`,
      actions: ["Escalate logistics response", "Contact USPS political desk", "Shift delivery windows"]
    };
  }

  if (type.includes("vendor")) {
    return {
      level: "HIGH",
      title: `${state} vendor coverage instability`,
      actions: ["Audit vendor coverage", "Deploy backup vendor", "Escalate operations"]
    };
  }

  if (type.includes("candidate")) {
    return {
      level: "HIGH",
      title: `${state} candidate intelligence gap`,
      actions: ["Refresh candidate profile", "Verify contact records", "Assign analyst review"]
    };
  }

  return {
    level: "HIGH",
    title: `${state} campaign pressure rising`,
    actions: ["Deploy message shift", "Increase media weight", "Activate surrogate network"]
  };
}

function CommandSectionIntro({ eyebrow, title, description, badge }) {
  return (
    <div className="vs-command-section-intro">
      <div>
        {eyebrow ? <div className="vs-command-eyebrow">{eyebrow}</div> : null}
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {badge ? <div>{badge}</div> : null}
    </div>
  );
}

function BattlegroundRow({ row, active = false }) {
  const isElevated = String(row.risk || "").toLowerCase() === "elevated";

  return (
    <div className={`vs-premium-row-card ${active ? "is-live" : ""} ${isElevated ? "is-elevated" : ""}`}>
      <ResponsiveRow
        active={active}
        title={row.race}
        subtitle={`${row.state || "Statewide"} â€¢ ${row.office || "Race"}`}
      meta={[
        { label: "Win Prob.", value: row.probability },
        { label: "Momentum", value: row.momentum },
        { label: "Risk", value: row.risk },
        { label: "Priority", value: row.priority }
      ]}
        alert={isElevated ? "vs-live-dot" : "vs-live-dot-warning"}
        right={<Badge tone={isElevated ? "danger" : "demo"}>{row.risk}</Badge>}
      />
    </div>
  );
}

function FeedRow({
  item,
  live = false,
  expanded = false,
  onToggle,
  onCreateTask,
  taskState = "idle"
}) {
  const severity = String(item.severity || "").toLowerCase();
  const taskCreated = ["created", "exists", "in_progress", "complete"].includes(taskState);
  const taskCreating = taskState === "creating";
  const taskLabel = taskState === "complete" ? "Task Complete" : taskState === "in_progress" ? "In Progress" : taskState === "exists" ? "Task Exists" : "Task Created";

  return (
    <div className={`vs-premium-row-card ${live ? "is-live" : ""} ${severity === "high" || severity === "critical" ? "is-elevated" : ""}`}>
      <ResponsiveRow
        live={live}
        title={item.title}
        subtitle={`${item.source}${item.type ? ` â€¢ ${item.type}` : ""}`}
        meta={[
          { label: "Time", value: item.time || "Now" },
          { label: "Severity", value: item.severity || "Info" },
          { label: "State", value: item.state || "National" },
          { label: "Office", value: item.office || "Statewide" }
        ]}
        alert={severity === "high" || severity === "critical" ? "vs-live-dot" : "vs-live-dot-warning"}
        right={
          <div className="vs-inline-actions">
            <Badge tone={badgeToneFromSeverity(item.severity)}>{item.severity || "Info"}</Badge>
            {taskCreated ? <Badge tone="active">{taskLabel}</Badge> : null}
            <button type="button" className="vs-button vs-button-secondary" onClick={onToggle}>
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        }
      />

      {expanded ? (
        <div className="vs-feed-expanded">
          <div className="vs-feed-expanded-title">Briefing Detail</div>
          <div className="vs-feed-expanded-body">
            {item.detail || item.description || item.title || "No additional detail available."}
          </div>

          <div className="vs-responsive-meta" style={{ marginTop: 12 }}>
            <div className="vs-meta-block">
              <div className="vs-meta-label">Signal Type</div>
              <div className="vs-meta-value">{item.type || "intelligence.signal"}</div>
            </div>
            <div className="vs-meta-block">
              <div className="vs-meta-label">Risk</div>
              <div className="vs-meta-value">{item.risk || "Watch"}</div>
            </div>
            <div className="vs-meta-block">
              <div className="vs-meta-label">Source</div>
              <div className="vs-meta-value">{item.source || "Command Center"}</div>
            </div>
          </div>

          <div className="vs-inline-actions" style={{ marginTop: 14 }}>
            {taskCreated ? (
              <Badge tone="active">{taskLabel}</Badge>
            ) : (
              <button
                type="button"
                className="vs-decision-btn deploy"
                disabled={taskCreating}
                onClick={onCreateTask}
              >
                {taskCreating ? "Creating..." : "Create Task"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
function ActionRow({ item }) {
  return (
    <div className="vs-premium-row-card is-action">
      <ResponsiveRow
      title={item.title}
      subtitle={item.detail}
      meta={[
        { label: "Owner", value: item.owner },
        { label: "Due", value: item.due }
      ]}
        alert="vs-live-dot-success"
        right={<Badge tone="accent">{item.due}</Badge>}
      />
    </div>
  );
}

function PriorityRow({ item, index }) {
  const isUrgent = ["Critical", "High"].includes(item.severity);

  return (
    <div className={`vs-premium-row-card ${isUrgent ? "is-elevated" : ""}`}>
      <ResponsiveRow
      title={`#${index + 1} ${item.state} â€” ${item.severity}`}
      subtitle={(item.recommended_actions || []).join(" ") || "Multiple intelligence signals require executive review."}
      meta={[
        { label: "Score", value: item.priority_score },
        { label: "Receipts", value: formatMoney(item.finance?.receipts) },
        { label: "Vendors", value: item.vendors?.coverage_status || "â€”" },
        { label: "Mail Risk", value: item.mailops?.mail_risks || 0 }
      ]}
        alert={isUrgent ? "vs-live-dot" : "vs-live-dot-warning"}
        right={<Badge tone={badgeToneFromSeverity(item.severity)}>{item.risk}</Badge>}
      />
    </div>
  );
}

export default function CommandCenter() {
  const fetcher = useCallback(() => api.commandCenter(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);

  const [crossSignal, setCrossSignal] = useState(fallbackCrossSignal);
  const [crossLoading, setCrossLoading] = useState(true);
  const [liveBanner, setLiveBanner] = useState("");
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveFeedIds, setLiveFeedIds] = useState([]);
  const [liveBattlegroundStates, setLiveBattlegroundStates] = useState([]);
  const [executionTasks, setExecutionTasks] = useState([]);
  const [expandedFeedIds, setExpandedFeedIds] = useState(() => new Set());
  const [feedTaskStates, setFeedTaskStates] = useState(() => ({}));

  const { filters } = useExecutiveFilters();

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  const effectiveData = demoMode ? fallbackData : data || fallbackData;
  const effectiveCrossSignal = demoMode ? fallbackCrossSignal : crossSignal || fallbackCrossSignal;

  useEffect(() => {
    let active = true;

    async function loadCrossSignal() {
      if (demoMode) {
        setCrossSignal(fallbackCrossSignal);
        setCrossLoading(false);
        return;
      }

      try {
        setCrossLoading(true);
        const response = api.crossSignalIntelligence
          ? await api.crossSignalIntelligence()
          : (await api.get("/intelligence/cross-signal")).data;

        if (!active) return;
        setCrossSignal(response || fallbackCrossSignal);
      } catch {
        if (!active) return;
        setCrossSignal(fallbackCrossSignal);
      } finally {
        if (active) setCrossLoading(false);
      }
    }

    loadCrossSignal();

    return () => {
      active = false;
    };
  }, [demoMode]);

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      try {
        const response = await api.tasks?.({ limit: 100 });
        if (!active) return;
        setExecutionTasks(response?.results || []);
      } catch {
        if (!active) return;
        setExecutionTasks([]);
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, []);

  useLiveChannel("intelligence:command-center", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const liveId = `cc-threat-${Date.now()}`;

      setLiveBanner(`Live threat fused into Command Center: ${threat.title || "Threat detected"}`);
      setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));
      setLiveBattlegroundStates((prev) => [
        threat.state || "Georgia",
        ...prev.filter((item) => item !== (threat.state || "Georgia"))
      ].slice(0, 5));

      setData((prev) => ({
        ...(prev || fallbackData),
        feed: dedupeFeed([
          {
            id: liveId,
            time: now,
            title: threat.title || "Threat detected",
            source: threat.source || "War Room",
            severity: threat.severity || "High",
            type: "warroom.threat_detected",
            state: threat.state || "Georgia",
            office: threat.office || "Senate",
            risk: threat.risk || "Elevated"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8)
      }));
    }
  });

  useRealtimeStream(null, (event) => {
    const alert = event?.payload?.alert || event?.payload?.event || null;
    if (!alert) return;

    const liveId = event.id || `live-${Date.now()}`;

    setLiveBanner(`Realtime alert fused into Command Center: ${alert.title || "New signal"}`);
    setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      alert.state || "National",
      ...prev.filter((item) => item !== (alert.state || "National"))
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: liveId,
        time: new Date(event.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: alert.title || "Realtime intelligence signal",
        source: alert.source || "Realtime",
        severity: alert.severity || "Medium",
        type: alert.event_type || event.type || "alert.dispatched",
        state: alert.state || "National",
        office: alert.office || "Statewide",
        risk: alert.risk || "Watch"
      },
      ...prev
    ].slice(0, 8));
  });

  function handleDemoSignal(signal) {
    const liveId = signal.id || `demo-live-${Date.now()}`;

    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);
    setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: liveId,
        time: signal.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: signal.title,
        source: signal.source,
        severity: signal.severity,
        type: "demo.signal",
        state: signal.state,
        office: signal.office,
        risk: signal.risk
      },
      ...prev
    ].slice(0, 8));
  }

  function injectLocalSignal(signal = {}) {
    const liveId = `exec-${Date.now()}`;

    setLiveBanner(signal.title || "Command action executed");
    setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));

    if (signal.state) {
      setLiveBattlegroundStates((prev) => [
        signal.state,
        ...prev.filter((item) => item !== signal.state)
      ].slice(0, 5));
    }

    setLiveAlerts((prev) => [
      {
        id: liveId,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: signal.title || "Command action executed",
        source: signal.source || "Execution Engine",
        severity: signal.severity || "Medium",
        type: signal.type || "command.action",
        state: signal.state || "National",
        office: signal.office || "Statewide",
        risk: signal.risk || "Watch"
      },
      ...prev
    ].slice(0, 8));
  }

  async function createExecutionTask(action, context = {}) {
    const priority = getTaskPriority(action, context.risk);

    const payload = {
      title: action,
      description: context.detail || "Generated from the Command Center decision engine.",
      source: context.source || "command_center",
      state: context.state || "National",
      office: context.office || "Statewide",
      priority,
      status: "open",
      assigned_to: getTaskOwner(action),
      due_label: priority === "high" ? "Now" : "Today",
      metadata: {
        ...context,
        action
      }
    };

    try {
      const response = await api.createTask?.(payload);
      const task = response?.task || response || payload;
      setExecutionTasks((prev) => [task, ...prev].slice(0, 25));
      return task;
    } catch {
      const localId = `local-task-${Date.now()}`;
      const fallbackTask = {
        ...payload,
        id: localId,
        local_id: localId,
        created_at: new Date().toISOString()
      };

      setExecutionTasks((prev) => [fallbackTask, ...prev].slice(0, 25));
      return fallbackTask;
    }
  }

  async function updateExecutionTaskStatus(task, status) {
    if (!task) return;

    setExecutionTasks((prev) =>
      prev.map((item) =>
        String(item.id || item.local_id) === String(task.id || task.local_id)
          ? { ...item, status }
          : item
      )
    );

    if (String(task.id || "").startsWith("local-task")) return;

    try {
      await api.updateTask?.(task.id, { status });
    } catch {
      // Keep local status update even if backend is unavailable.
    }
  }

  async function handleActionClick(action, context = {}) {
    const text = String(action || "").toLowerCase();

    await createExecutionTask(action, context);

    if (text.includes("candidate") || text.includes("profile") || text.includes("contact")) {
      injectLocalSignal({
        title: `Candidate action queued: ${action}`,
        severity: "Medium",
        source: "Candidate Intelligence",
        state: context.state,
        office: context.office,
        risk: "Watch"
      });

      window.location.href = `/candidates?candidate=${encodeURIComponent(context.candidate_name || "")}&context=command-center`;
      return;
    }

    if (text.includes("alert") || text.includes("escalate")) {
      try {
        await api.dispatchAlerts?.({ limit: 1 });
      } catch {
        // Local execution still succeeds if backend dispatch is unavailable.
      }

      injectLocalSignal({
        title: `Alert dispatched: ${action}`,
        severity: "High",
        source: "Command Center",
        state: context.state,
        office: context.office,
        risk: "Elevated"
      });
      return;
    }

    if (text.includes("assign") || text.includes("deploy") || text.includes("activate")) {
      injectLocalSignal({
        title: `Task assigned: ${action}`,
        severity: "Medium",
        source: "Execution Engine",
        state: context.state,
        office: context.office,
        risk: "Watch"
      });
      return;
    }

    injectLocalSignal({
      title: `Action executed: ${action}`,
      severity: "Medium",
      source: "Command Center",
      state: context.state,
      office: context.office,
      risk: context.risk || "Watch"
    });
  }

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [liveBanner]);

  useEffect(() => {
    if (!liveFeedIds.length && !liveBattlegroundStates.length) return;

    const timer = setTimeout(() => {
      setLiveFeedIds([]);
      setLiveBattlegroundStates([]);
    }, 5200);

    return () => clearTimeout(timer);
  }, [liveFeedIds, liveBattlegroundStates]);

  function getFeedKey(item) {
    return String(item.id || `${item.time || "now"}-${item.title || "feed"}`);
  }

  function toggleFeed(id) {
    setExpandedFeedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getStableFeedId(item = {}) {
    return String(item.id || `${item.type || "signal"}-${item.time || "now"}-${item.title || "feed"}`);
  }

  function findExistingFeedTask(item = {}) {
    const feedId = getStableFeedId(item);
    const title = `Review signal: ${item.title || "Command Center signal"}`;

    return executionTasks.find((task) => {
      const taskFeedId = String(task?.metadata?.feed_id || "");
      const taskSignalId = String(task?.metadata?.signal_id || "");
      const taskTitle = String(task?.title || "");
      return (
        (feedId && (taskFeedId === feedId || taskSignalId === feedId)) ||
        taskTitle === title
      );
    });
  }

  function getFeedTaskState(item = {}) {
    const id = getFeedKey(item);
    if (feedTaskStates[id]) return feedTaskStates[id];

    const existingTask = findExistingFeedTask(item);
    if (!existingTask) return "idle";

    const status = String(existingTask.status || "open").toLowerCase();
    if (status === "complete") return "complete";
    if (status === "in_progress") return "in_progress";
    return "exists";
  }

  async function createTaskFromFeed(item = {}) {
    const id = getFeedKey(item);
    const feedId = getStableFeedId(item);
    const existingTask = findExistingFeedTask(item);

    if (existingTask) {
      const status = String(existingTask.status || "open").toLowerCase();
      setFeedTaskStates((prev) => ({
        ...prev,
        [id]: status === "complete" ? "complete" : status === "in_progress" ? "in_progress" : "exists"
      }));
      return;
    }

    setFeedTaskStates((prev) => ({ ...prev, [id]: "creating" }));

    const result = await createExecutionTask(`Review signal: ${item.title || "Command Center signal"}`, {
      source: "command_center_feed",
      state: item.state || "National",
      office: item.office || "Statewide",
      risk: item.risk || "Watch",
      signal_type: item.type || "intelligence.signal",
      feed_id: feedId,
      signal_id: feedId,
      detail: item.detail || item.description || item.title || "Review this Command Center signal."
    });

    if (result?.duplicate) {
      setFeedTaskStates((prev) => ({ ...prev, [id]: "exists" }));
      return;
    }

    setFeedTaskStates((prev) => ({ ...prev, [id]: "created" }));

    injectLocalSignal({
      title: `Task created from feed: ${item.title || "Command Center signal"}`,
      severity: item.severity || "Medium",
      source: "Execution Engine",
      type: "feed.task_created",
      state: item.state || "National",
      office: item.office || "Statewide",
      risk: item.risk || "Watch"
    });
  }

  const battlegrounds = useMemo(
    () => (effectiveData?.battlegrounds || []).filter((item) => matchesFilters(item, filters)),
    [effectiveData, filters]
  );

  const feed = useMemo(
    () =>
      dedupeFeed([...(liveAlerts || []), ...(effectiveData?.feed || [])]).filter((item) =>
        matchesFilters(item, filters)
      ),
    [effectiveData, liveAlerts, filters]
  );

  const actions = useMemo(
    () => (effectiveData?.actions || []).filter((item) => matchesFilters(item, filters)),
    [effectiveData, filters]
  );

  const topPriorities = useMemo(() => {
    return (effectiveCrossSignal?.top_priorities || []).filter((item) => {
      if (filters.state && item.state !== filters.state) return false;
      if (filters.risk && item.risk !== filters.risk && item.severity !== filters.risk) return false;
      return true;
    });
  }, [effectiveCrossSignal, filters]);

  const highSeverityCount = feed.filter((item) =>
    ["high", "critical"].includes(String(item.severity || "").toLowerCase())
  ).length;

  const executiveDecision = useMemo(() => {
    try {
      return buildExecutiveDecision({ feed, battlegrounds });
    } catch {
      return null;
    }
  }, [feed, battlegrounds]);

  const crossMetrics = useMemo(() => {
    const summary = effectiveCrossSignal?.summary || {};

    return [
      { label: "Tracked States", value: summary.states_tracked || 0, delta: "Cross-signal engine", tone: "up" },
      { label: "Critical States", value: summary.critical_states || 0, delta: "Immediate review", tone: summary.critical_states ? "down" : "up" },
      { label: "High States", value: summary.high_states || 0, delta: "Priority markets", tone: summary.high_states ? "down" : "up" },
      { label: "Vendor Gap States", value: summary.vendor_gap_states || 0, delta: "Coverage pressure", tone: summary.vendor_gap_states ? "down" : "up" }
    ];
  }, [effectiveCrossSignal]);

  return (
    <PageShell
      eyebrow="Executive Command Center"
      title="Campaign control, race velocity, and strategic response in one operating view."
      description="Monitor battleground pressure, fundraising movement, narrative threats, vendor gaps, MailOps risk, and next-best actions across one executive command surface."
      demo={demoMode}
      demoText="Demo campaign is live: battleground movement, threat pressure, and execution signals are simulated for presentation."
      tickerItems={[
        { label: "Threats", value: `${highSeverityCount} high`, dotClass: "vs-live-dot" },
        { label: "Priorities", value: `${topPriorities.length} ranked`, dotClass: "vs-live-dot-warning" },
        { label: "Actions", value: `${actions.length} queued`, dotClass: "vs-live-dot-success" }
      ]}
    >
      <style>{`
        .vs-command-section-intro {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .vs-command-section-intro h3 {
          margin: 0;
          font-size: 1.02rem;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .vs-command-section-intro p {
          margin: 6px 0 0;
          color: var(--vs-muted, rgba(226, 232, 240, 0.68));
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .vs-command-eyebrow {
          margin-bottom: 6px;
          color: var(--vs-accent, #60a5fa);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .vs-premium-row-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.48));
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.18);
          overflow: hidden;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .vs-premium-row-card:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.32);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.24);
        }

        .vs-premium-row-card.is-elevated {
          border-color: rgba(248, 113, 113, 0.32);
          background: linear-gradient(135deg, rgba(127, 29, 29, 0.22), rgba(15, 23, 42, 0.68));
        }

        .vs-premium-row-card.is-live {
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.28), 0 18px 46px rgba(37, 99, 235, 0.16);
        }

        .vs-premium-row-card.is-action {
          border-color: rgba(34, 197, 94, 0.18);
        }

        .vs-premium-row-card .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .vs-feed-expanded {
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          padding: 14px 16px 16px;
          animation: vsFeedExpand 180ms ease both;
        }

        .vs-feed-expanded-title {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(96, 165, 250, 0.95);
          margin-bottom: 8px;
        }

        .vs-feed-expanded-body {
          color: rgba(226, 232, 240, 0.82);
          font-size: 0.92rem;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        @keyframes vsFeedExpand {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {error && !demoMode ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {liveBanner ? <div className="vs-banner vs-live-banner-pulse">{liveBanner}</div> : null}

      <DemoOnboarding />
      <LiveActivityStream onSignal={handleDemoSignal} />

      {executiveDecision ? (
        <div className={`vs-decision-panel ${String(executiveDecision.level || "").toLowerCase()}`}>
          <div className="vs-decision-header">
            <span className="vs-decision-level">{executiveDecision.level}</span>
            <span className="vs-decision-title">{executiveDecision.title}</span>
          </div>

          <div className="vs-decision-actions">
            {executiveDecision.actions.map((action, index) => (
              <button
                key={`${action}-${index}`}
                className={getActionClass(action)}
                type="button"
                onClick={() =>
                  handleActionClick(action, {
                    state: feed?.[0]?.state,
                    office: feed?.[0]?.office,
                    risk: feed?.[0]?.risk
                  })
                }
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="vs-grid-4">
        {(effectiveData?.metrics || []).map((metric, index) => (
          <StatCard key={`${metric.label}-${index}`} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
        ))}
      </div>

      <ExecutionBoard tasks={executionTasks} onStatusChange={updateExecutionTaskStatus} />

      <SectionCard
        title="Cross-Signal Priority Layer"
        subtitle="Highest-pressure states ranked from fundraising, vendor coverage, MailOps risk, and executive feed signals."
        right={<Badge tone="danger">{topPriorities.length} ranked</Badge>}
      >
        <div className="vs-grid-4" style={{ marginBottom: 16 }}>
          {crossMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="vs-stack">
          {!demoMode && crossLoading ? (
            <EmptyState text="Loading cross-signal priority engine..." />
          ) : !topPriorities.length ? (
            <EmptyState text="No cross-signal priorities available for the current filters." />
          ) : (
            topPriorities.slice(0, 6).map((item, index) => (
              <PriorityRow key={`${item.state}-${index}`} item={item} index={index} />
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Priority Battleground Board"
        subtitle="Top races requiring executive monitoring and rapid adjustment."
        right={<Badge tone="accent">{battlegrounds.length} tracked</Badge>}
      >
        <div className="vs-stack">
          {!demoMode && loading ? (
            <EmptyState text="Loading battleground board..." />
          ) : !battlegrounds.length ? (
            <EmptyState text="No battleground data available for the current filters." />
          ) : (
            battlegrounds.map((row) => (
              <BattlegroundRow
                key={`${row.race}-${row.priority}`}
                row={row}
                active={
                  liveBattlegroundStates.includes(row.state) ||
                  liveBattlegroundStates.includes(String(row.state || "").slice(0, 2))
                }
              />
            ))
          )}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard title="War Room Feed" subtitle="Live risk, logistics, forecast, and alert signals entering the executive terminal.">
          <div className="vs-stack">
            {!demoMode && loading ? (
              <EmptyState text="Loading command feed..." />
            ) : !feed.length ? (
              <EmptyState text="No live command feed items for the current filters." />
            ) : (
              feed.map((item) => {
                const id = getFeedKey(item);

                return (
                  <FeedRow
                    key={id}
                    item={item}
                    live={liveFeedIds.includes(item.id)}
                    expanded={expandedFeedIds.has(id)}
                    onToggle={() => toggleFeed(id)}
                    onCreateTask={() => createTaskFromFeed(item)}
                    taskState={getFeedTaskState(item)}
                  />
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Executive Action Queue" subtitle="Highest-leverage next steps across active intelligence inputs.">
          <div className="vs-stack">
            {!demoMode && loading ? (
              <EmptyState text="Loading action queue..." />
            ) : !actions.length ? (
              <EmptyState text="No executive actions available for the current filters." />
            ) : (
              actions.map((item, index) => <ActionRow key={`${item.title}-${index}`} item={item} />)
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
