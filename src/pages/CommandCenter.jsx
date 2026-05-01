import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    { id: 3, time: "09:05", title: "Forecast updated for PA Senate", source: "Forecast Engine", severity: "Medium", type: "forecast.updated", state: "Pennsylvania", office: "Senate", risk: "Watch" }
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

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "complete") return "active";
  if (value === "in_progress") return "info";
  if (value === "blocked") return "danger";
  return "demo";
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function initialsFromName(name = "Command Team") {
  return String(name || "Command Team")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CT";
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

function isVendorDrivenPriority(item = {}) {
  const coverage = String(item.vendors?.coverage_status || "").toLowerCase();
  const actions = (item.recommended_actions || []).join(" ").toLowerCase();

  return (
    coverage === "gap" ||
    coverage === "thin" ||
    actions.includes("vendor") ||
    actions.includes("coverage") ||
    actions.includes("backup vendor")
  );
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

function getFeedKey(item) {
  return String(item.id || `${item.time || "now"}-${item.title || "feed"}`);
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

function AssigneeAvatar({ taskState, item, fallback = "WR", onClick }) {
  const name = taskState?.assigned_to || item?.assigned_to || item?.owner || "War Room";
  const initials = taskState?.assignee_initials || item?.assignee_initials || initialsFromName(name) || fallback;
  const avatar = taskState?.assignee_avatar || item?.assignee_avatar || "";
  const title = `Filter workload for ${name}`;

  return (
    <button type="button" className="vs-avatar-button" onClick={onClick} title={title}>
      {avatar ? <img className="vs-avatar" src={avatar} alt={`${name} avatar`} /> : <span className="vs-avatar">{initials}</span>}
    </button>
  );
}

function BattlegroundRow({ row, active = false }) {
  const isElevated = String(row.risk || "").toLowerCase() === "elevated";

  return (
    <div className={`vs-premium-row-card ${active ? "is-live" : ""} ${isElevated ? "is-elevated" : ""}`}>
      <ResponsiveRow
        active={active}
        title={row.race}
        subtitle={`${row.state || "Statewide"} • ${row.office || "Race"}`}
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
  onViewTask,
  onAssigneeClick,
  taskState
}) {
  const severity = String(item.severity || "").toLowerCase();
  const hasTask = Boolean(taskState?.exists || taskState?.task_id);
  const status = String(taskState?.status || "open").toLowerCase();
  const isResolved = hasTask && ["complete", "completed", "done"].includes(status);
  const isActioned = hasTask && !isResolved;

  const loopLabel = isResolved ? "Resolved" : isActioned ? "Actioned" : "No Task";
  const loopTone = isResolved ? "active" : isActioned ? "info" : "default";

  return (
    <div
      className={`vs-premium-row-card ${live ? "is-live" : ""} ${
        severity === "high" || severity === "critical" ? "is-elevated" : ""
      }`}
    >
      <ResponsiveRow
        live={live}
        title={item.title}
        subtitle={`${item.source}${item.type ? ` • ${item.type}` : ""}`}
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
            <Badge tone={loopTone}>{loopLabel}</Badge>
            {hasTask ? <Badge tone={statusTone(status)}>{status}</Badge> : null}
            <button type="button" className="vs-button vs-button-secondary" onClick={onToggle}>
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        }
      />

      {expanded ? (
        <div className={`vs-feed-expanded ${isResolved ? "is-resolved" : isActioned ? "is-actioned" : ""}`}>
          <div className="vs-feed-expanded-header">
            <AssigneeAvatar taskState={taskState} item={item} onClick={onAssigneeClick} />

            <div className="vs-feed-expanded-header-copy">
              <div className="vs-feed-expanded-title">Briefing Detail</div>
              <div className="vs-feed-expanded-owner">
                {taskState?.assigned_to || item.assigned_to || item.owner || "War Room"}
              </div>
            </div>

            <div className="vs-feed-loop-status">
              <Badge tone={loopTone}>{loopLabel}</Badge>
            </div>
          </div>

          <div className="vs-feed-expanded-body">
            {item.detail || item.description || item.title || "No additional detail available."}
          </div>

          <div className="vs-responsive-meta vs-feed-expanded-meta" style={{ marginTop: 12 }}>
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

            <div className="vs-meta-block">
              <div className="vs-meta-label">Outcome</div>
              <div className="vs-meta-value">{loopLabel}</div>
            </div>
          </div>

          {hasTask ? (
            <div className="vs-feed-loop-card">
              <div>
                <div className="vs-feed-loop-title">
                  {isResolved ? "Signal resolved by execution task" : "Signal actioned into execution"}
                </div>
                <div className="vs-feed-loop-subtitle">
                  {taskState?.title || "Linked execution task"} · Status: {status}
                </div>
              </div>

              <Badge tone={loopTone}>{loopLabel}</Badge>
            </div>
          ) : null}

          <div className="vs-inline-actions" style={{ marginTop: 14 }}>
            {hasTask ? (
              <>
                <button type="button" className="vs-decision-btn deploy" onClick={onViewTask}>
                  View Task
                </button>
                <Badge tone={loopTone}>{loopLabel}</Badge>
              </>
            ) : (
              <button type="button" className="vs-decision-btn deploy" onClick={onCreateTask}>
                Create Task
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
          { label: "Owner", value: item.owner || "Command Team" },
          { label: "State", value: item.state || "National" },
          { label: "Due", value: item.due || "Today" },
          { label: "Risk", value: item.risk || "Watch" }
        ]}
        alert="vs-live-dot-success"
        right={<Badge tone="accent">{item.due || "Today"}</Badge>}
      />
    </div>
  );
}

function PriorityRow({ item, index }) {
  const isUrgent = ["Critical", "High"].includes(item.severity);

  return (
    <div className={`vs-premium-row-card ${isUrgent ? "is-elevated" : ""}`}>
      <ResponsiveRow
        title={`#${index + 1} ${item.state} — ${item.severity}`}
        subtitle={(item.recommended_actions || []).join(" ") || "Multiple intelligence signals require executive review."}
        meta={[
          { label: "Score", value: item.priority_score },
          { label: "Receipts", value: formatMoney(item.finance?.receipts) },
          { label: "Vendors", value: item.vendors?.coverage_status || "—" },
          { label: "Mail Risk", value: item.mailops?.mail_risks || 0 }
        ]}
        alert={isUrgent ? "vs-live-dot" : "vs-live-dot-warning"}
        right={<Badge tone={badgeToneFromSeverity(item.severity)}>{item.risk}</Badge>}
      />
    </div>
  );
}

function taskMatchesAssignee(task = {}, assignee = null) {
  if (!assignee) return true;

  const taskUserId = String(task.assigned_to_user_id || "");
  const taskEmail = String(task.assigned_to_email || "").toLowerCase();
  const taskName = String(task.assigned_to || "Command Team").toLowerCase();

  if (assignee.user_id && taskUserId && taskUserId === String(assignee.user_id)) return true;
  if (assignee.email && taskEmail && taskEmail === String(assignee.email).toLowerCase()) return true;
  return taskName === String(assignee.name || "Command Team").toLowerCase();
}


function workloadPressure(openCount = 0, highCount = 0) {
  if (openCount >= 8 || highCount >= 3) {
    return {
      key: "overloaded",
      label: "Overloaded",
      tone: "danger",
      detail: "Reassign or reduce load",
      className: "is-overloaded"
    };
  }

  if (openCount >= 5 || highCount >= 2) {
    return {
      key: "pressure",
      label: "Pressure",
      tone: "demo",
      detail: "Approaching capacity",
      className: "is-pressure"
    };
  }

  return {
    key: "balanced",
    label: "Balanced",
    tone: "active",
    detail: "Capacity available",
    className: "is-balanced"
  };
}

function UserWorkloadPanel({ assignee, tasks = [], onClear }) {
  if (!assignee) return null;

  const openTasks = tasks.filter((task) => String(task.status || "open").toLowerCase() !== "complete");
  const completeTasks = tasks.filter((task) => String(task.status || "open").toLowerCase() === "complete");
  const highTasks = tasks.filter((task) => ["high", "critical"].includes(String(task.priority || "").toLowerCase()));
  const pressure = workloadPressure(openTasks.length, highTasks.length);

  return (
    <SectionCard
      title="User Workload"
      subtitle="Filtered execution load for the selected feed owner."
      right={
        <div className="vs-inline-actions">
          <Badge tone={pressure.tone}>{pressure.label}</Badge>
          <button type="button" className="vs-button vs-button-secondary" onClick={onClear}>
            Clear Filter
          </button>
        </div>
      }
    >
      <div className={`vs-workload-pressure ${pressure.className}`}>
        <div className="vs-workload-head">
          <div className="vs-avatar-static">
            {assignee.avatar ? <img className="vs-avatar" src={assignee.avatar} alt={`${assignee.name} avatar`} /> : <span className="vs-avatar">{assignee.initials || initialsFromName(assignee.name)}</span>}
          </div>

          <div className="vs-workload-copy">
            <div className="vs-row-title">{assignee.name || "Command Team"}</div>
            <div className="vs-row-subtitle">
              {assignee.email || assignee.user_id || "Assigned workload across Command Center tasks"}
            </div>
          </div>
        </div>

        <div className="vs-workload-pressure-right">
          <div className="vs-workload-pressure-label">{pressure.label}</div>
          <div className="vs-workload-pressure-detail">{pressure.detail}</div>
        </div>
      </div>

      <div className="vs-grid-4" style={{ marginTop: 14 }}>
        <StatCard
          label="Open"
          value={openTasks.length}
          delta={openTasks.length >= 8 ? "Over capacity" : openTasks.length >= 5 ? "Approaching limit" : "Within range"}
          tone={openTasks.length >= 8 ? "down" : openTasks.length >= 5 ? "neutral" : "up"}
        />
        <StatCard
          label="High Priority"
          value={highTasks.length}
          delta={highTasks.length >= 3 ? "Escalate now" : highTasks.length >= 2 ? "Monitor closely" : "Controlled"}
          tone={highTasks.length >= 3 ? "down" : highTasks.length >= 2 ? "neutral" : "up"}
        />
        <StatCard label="Complete" value={completeTasks.length} delta="Closed tasks" tone="up" />
        <StatCard label="Pressure" value={pressure.label} delta={pressure.detail} tone={pressure.key === "overloaded" ? "down" : pressure.key === "pressure" ? "neutral" : "up"} />
      </div>

      <div className="vs-stack" style={{ marginTop: 16 }}>
        {!tasks.length ? (
          <EmptyState text="No tasks assigned to this user yet." />
        ) : (
          tasks.slice(0, 6).map((task) => (
            <div key={task.id || task.local_id || task.title} className="vs-card-muted">
              <ResponsiveRow
                title={task.title}
                subtitle={task.description || "Assigned execution task."}
                meta={[
                  { label: "Status", value: task.status || "open" },
                  { label: "Priority", value: task.priority || "medium" },
                  { label: "State", value: task.state || "National" },
                  { label: "Due", value: task.due_label || "Today" }
                ]}
                right={<Badge tone={statusTone(task.status)}>{task.status || "open"}</Badge>}
              />
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

function ResolvedVendorRow({ gap }) {
  return (
    <div className="vs-premium-row-card is-resolved-gap">
      <ResponsiveRow
        title={`${gap.state} vendor gap resolved`}
        subtitle="Completed execution task removed this vendor gap from active priorities."
        meta={[
          { label: "Task", value: gap.resolved_by_task_id ? `#${gap.resolved_by_task_id}` : "Completed" },
          { label: "State", value: gap.state || "National" },
          { label: "Score", value: gap.coverage_score ?? "—" },
          { label: "Status", value: "Resolved" }
        ]}
        alert="vs-live-dot-success"
        right={<Badge tone="active">Resolved</Badge>}
      />
    </div>
  );
}


function assigneeKeyFromTask(task = {}) {
  return (
    String(task.assigned_to_user_id || "") ||
    String(task.assigned_to_email || "") ||
    String(task.assigned_to || "Command Team")
  ).toLowerCase();
}

function buildAssigneeProfiles(tasks = []) {
  const map = new Map();

  for (const task of tasks) {
    const name = task.assigned_to || "Command Team";
    const key = assigneeKeyFromTask(task);
    const isOpen = String(task.status || "open").toLowerCase() !== "complete";
    const isHigh = ["high", "critical"].includes(String(task.priority || "").toLowerCase());

    if (!map.has(key)) {
      map.set(key, {
        key,
        name,
        user_id: task.assigned_to_user_id || "",
        email: task.assigned_to_email || "",
        avatar: task.assignee_avatar || "",
        initials: task.assignee_initials || initialsFromName(name),
        open_count: 0,
        high_count: 0,
        complete_count: 0,
        total_count: 0
      });
    }

    const profile = map.get(key);
    profile.total_count += 1;
    if (isOpen) profile.open_count += 1;
    else profile.complete_count += 1;
    if (isOpen && isHigh) profile.high_count += 1;
  }

  return Array.from(map.values()).map((profile) => ({
    ...profile,
    pressure: workloadPressure(profile.open_count, profile.high_count)
  }));
}

function selectedAssigneeKey(assignee = null) {
  if (!assignee) return "";
  return String(assignee.user_id || assignee.email || assignee.name || "").toLowerCase();
}

function buildReassignmentSuggestions(tasks = [], selectedAssignee = null) {
  const profiles = buildAssigneeProfiles(tasks);
  const selectedKey = selectedAssigneeKey(selectedAssignee);

  const overloaded = profiles
    .filter((profile) => ["overloaded", "pressure"].includes(profile.pressure.key))
    .filter((profile) => !selectedKey || profile.key === selectedKey)
    .sort((a, b) => b.open_count - a.open_count || b.high_count - a.high_count);

  const capacity = profiles
    .filter((profile) => profile.pressure.key === "balanced")
    .sort((a, b) => a.open_count - b.open_count || a.high_count - b.high_count);

  if (!overloaded.length || !capacity.length) return [];

  const suggestions = [];

  for (const from of overloaded) {
    const sourceTasks = tasks
      .filter((task) => {
        const taskKey = assigneeKeyFromTask(task);
        const isOpen = String(task.status || "open").toLowerCase() !== "complete";
        return taskKey === from.key && isOpen;
      })
      .sort((a, b) => {
        const aHigh = ["high", "critical"].includes(String(a.priority || "").toLowerCase()) ? 1 : 0;
        const bHigh = ["high", "critical"].includes(String(b.priority || "").toLowerCase()) ? 1 : 0;
        return bHigh - aHigh;
      });

    const to = capacity.find((candidate) => candidate.key !== from.key);
    if (!to) continue;

    for (const task of sourceTasks.slice(0, 2)) {
      suggestions.push({
        id: `${task.id || task.local_id || task.title}-${from.key}-${to.key}`,
        task,
        from,
        to,
        reason:
          from.pressure.key === "overloaded"
            ? `${from.name} is overloaded; ${to.name} has available capacity.`
            : `${from.name} is approaching capacity; ${to.name} can absorb this task.`
      });
    }
  }

  return suggestions.slice(0, 4);
}

function ReassignmentSuggestionsPanel({ suggestions = [], onApply }) {
  if (!suggestions.length) return null;

  return (
    <SectionCard
      title="AI Reassignment Suggestions"
      subtitle="Recommended task moves based on workload pressure, priority, and available team capacity."
      right={<Badge tone="info">{suggestions.length} suggested</Badge>}
    >
      <div className="vs-stack">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="vs-card-muted vs-ai-reassign-card">
            <ResponsiveRow
              title={suggestion.task.title}
              subtitle={suggestion.reason}
              meta={[
                { label: "From", value: suggestion.from.name },
                { label: "To", value: suggestion.to.name },
                { label: "Priority", value: suggestion.task.priority || "medium" },
                { label: "State", value: suggestion.task.state || "National" }
              ]}
              alert="vs-live-dot-warning"
              right={
                <button
                  type="button"
                  className="vs-decision-btn deploy"
                  onClick={() => onApply?.(suggestion)}
                >
                  Reassign
                </button>
              }
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default function CommandCenter() {
  const fetcher = useCallback(() => api.commandCenter(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);

  const [crossSignal, setCrossSignal] = useState(fallbackCrossSignal);
  const [crossLoading, setCrossLoading] = useState(true);
  const [vendorIntel, setVendorIntel] = useState(null);
  const [vendorLoading, setVendorLoading] = useState(true);
  const [liveBanner, setLiveBanner] = useState("");
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveFeedIds, setLiveFeedIds] = useState([]);
  const [liveBattlegroundStates, setLiveBattlegroundStates] = useState([]);
  const [executionTasks, setExecutionTasks] = useState([]);
  const [expandedFeedIds, setExpandedFeedIds] = useState(() => new Set());
  const [feedTaskState, setFeedTaskState] = useState({});
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [reassignmentMessage, setReassignmentMessage] = useState("");

  const executionBoardRef = useRef(null);
  const autoVendorTaskIds = useRef(new Set());
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

    async function loadVendorIntel() {
      if (demoMode) {
        setVendorIntel(null);
        setVendorLoading(false);
        return;
      }

      try {
        setVendorLoading(true);
        const response = await api.vendorScoring?.();
        if (!active) return;
        setVendorIntel(response || null);
      } catch {
        if (!active) return;
        setVendorIntel(null);
      } finally {
        if (active) setVendorLoading(false);
      }
    }

    loadVendorIntel();

    return () => {
      active = false;
    };
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) return;
    api.dispatchVendorAlerts?.().catch(() => {});
  }, [demoMode]);

  async function loadTasks() {
    try {
      const response = await api.tasks?.({ limit: 100 });
      setExecutionTasks(response?.results || []);
    } catch {
      setExecutionTasks([]);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const response = await api.tasks?.({ limit: 100 });
        if (!active) return;
        setExecutionTasks(response?.results || []);
      } catch {
        if (!active) return;
        setExecutionTasks([]);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, []);

    useRealtimeStream("tasks", (event) => {
    if (!event?.type) return;

    const payload = event.payload || {};
    const task = payload.task || null;

    if (event.type === "task.created" && task) {
      setExecutionTasks((prev) => {
        const exists = prev.some(
          (item) => String(item.id || item.local_id) === String(task.id)
        );

        if (exists) return prev;
        return [task, ...prev].slice(0, 100);
      });

      setLiveBanner(`New task created: ${task.title || "Execution task"}`);
      return;
    }

    if (event.type === "task.updated" && task) {
      setExecutionTasks((prev) =>
        prev.map((item) =>
          String(item.id || item.local_id) === String(task.id)
            ? { ...item, ...task }
            : item
        )
      );

      setLiveBanner(`Task updated: ${task.title || "Execution task"}`);
      return;
    }

    if (event.type === "task.comment_created") {
      setLiveBanner("New task comment added.");

      if (payload.task_id) {
        setFocusedTaskId((current) => current || payload.task_id);
      }

      return;
    }

    if (event.type === "task.activity_created") {
      return;
    }
  });

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
    const assignedTo = context.assigned_to || getTaskOwner(action);

    const payload = {
      title: action,
      description: context.detail || "Generated from the Command Center decision engine.",
      source: context.source || "command_center",
      state: context.state || "National",
      office: context.office || "Statewide",
      priority,
      status: "open",
      assigned_to: assignedTo,
      assignee_initials: context.assignee_initials || initialsFromName(assignedTo),
      due_label: priority === "high" ? "Now" : "Today",
      metadata: {
        ...context,
        action
      }
    };

    try {
      const response = await api.createTask?.(payload);
      const task = response?.task || response || payload;
      setExecutionTasks((prev) => [task, ...prev].slice(0, 100));
      return { task, duplicate: Boolean(response?.duplicate) };
    } catch {
      const localId = `local-task-${Date.now()}`;
      const fallbackTask = {
        ...payload,
        id: localId,
        local_id: localId,
        created_at: new Date().toISOString()
      };

      setExecutionTasks((prev) => [fallbackTask, ...prev].slice(0, 100));
      return { task: fallbackTask, duplicate: false };
    }
  }

  useEffect(() => {
    if (demoMode) return;
    if (!vendorIntel?.recommended_actions?.length) return;

    const existingIds = new Set(
      executionTasks
        .map((task) => task?.metadata?.vendor_action_id)
        .filter(Boolean)
        .map(String)
    );

    async function createVendorGapTasks() {
      for (const action of vendorIntel.recommended_actions.slice(0, 5)) {
        const vendorActionId = String(action.id || `${action.state || "National"}-${action.title || "vendor-gap"}`);

        if (existingIds.has(vendorActionId)) continue;
        if (autoVendorTaskIds.current.has(vendorActionId)) continue;

        autoVendorTaskIds.current.add(vendorActionId);

        await createExecutionTask(action.title || "Close vendor coverage gap", {
          vendor_action_id: vendorActionId,
          state: action.state || "National",
          office: "Statewide",
          risk: action.priority === "High" ? "Elevated" : "Watch",
          source: "vendor_intelligence",
          assigned_to: action.owner || "Vendor Intelligence",
          assignee_initials: initialsFromName(action.owner || "Vendor Intelligence"),
          detail: action.detail || "Review vendor bench strength and assign backup capacity."
        });

        injectLocalSignal({
          title: `Vendor task created: ${action.title || "Close vendor coverage gap"}`,
          severity: action.priority === "High" ? "High" : "Medium",
          source: "Vendor Intelligence",
          type: "vendor.task_created",
          state: action.state || "National",
          office: "Statewide",
          risk: action.priority === "High" ? "Elevated" : "Watch"
        });
      }
    }

    createVendorGapTasks();
  }, [demoMode, vendorIntel, executionTasks]);

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
      await loadTasks();

      if (
        status === "complete" &&
        ["vendor_network", "vendor_intelligence"].includes(String(task.source || "").toLowerCase())
      ) {
        const refreshed = await api.vendorScoring?.();
        setVendorIntel(refreshed || null);
      }
    } catch {
      // Keep local status update even if backend is unavailable.
    }
  }

  async function handleActionClick(action, context = {}) {
    const value = String(action || "").toLowerCase();

    await createExecutionTask(action, context);

    if (value.includes("candidate") || value.includes("profile") || value.includes("contact")) {
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

    if (value.includes("vendor") || value.includes("coverage") || value.includes("operations")) {
      injectLocalSignal({
        title: `Vendor action queued: ${action}`,
        severity: context.risk === "Elevated" ? "High" : "Medium",
        source: "Vendor Intelligence",
        type: "vendor.action_queued",
        state: context.state,
        office: context.office || "Statewide",
        risk: context.risk || "Watch"
      });
      return;
    }

    if (value.includes("alert") || value.includes("escalate")) {
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

    if (value.includes("assign") || value.includes("deploy") || value.includes("activate")) {
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

  const battlegrounds = useMemo(
    () => (effectiveData?.battlegrounds || []).filter((item) => matchesFilters(item, filters)),
    [effectiveData, filters]
  );

  const resolvedVendorGapStates = useMemo(() => {
    return new Set((vendorIntel?.resolved_gaps || []).map((gap) => gap.state).filter(Boolean));
  }, [vendorIntel]);

  const vendorFeed = useMemo(() => {
    const riskSignals = (vendorIntel?.risk_signals || []).map((item) => ({
      id: `vendor-risk-${item.id}`,
      time: "Now",
      title: item.title || `${item.vendor_name || "Vendor"} requires review`,
      source: "Vendor Intelligence",
      severity: item.severity || "Medium",
      type: "vendor.coverage_gap",
      state: item.state || "National",
      office: "Statewide",
      risk: String(item.status || "").toLowerCase() === "active" ? "Watch" : "Elevated",
      assigned_to: "Vendor Intelligence",
      assignee_initials: "VI"
    }));

    const gapSignals = (vendorIntel?.gaps || []).map((gap, index) => ({
      id: `vendor-gap-${gap.state || index}`,
      time: "Now",
      title: gap.title || `${gap.state || "State"} vendor coverage gap`,
      source: "Vendor Intelligence",
      severity: gap.severity || "Medium",
      type: "vendor.coverage_gap",
      state: gap.state || "National",
      office: "Statewide",
      risk: gap.severity === "High" ? "Elevated" : "Watch",
      assigned_to: "Vendor Intelligence",
      assignee_initials: "VI"
    }));

    return dedupeFeed([...gapSignals, ...riskSignals]).slice(0, 8);
  }, [vendorIntel]);

  const feed = useMemo(
    () =>
      dedupeFeed([...(vendorFeed || []), ...(liveAlerts || []), ...(effectiveData?.feed || [])]).filter((item) =>
        matchesFilters(item, filters)
      ),
    [effectiveData, liveAlerts, vendorFeed, filters]
  );

  useEffect(() => {
    let active = true;

    async function loadFeedTaskState() {
      if (!feed.length) {
        setFeedTaskState({});
        return;
      }

      const localResults = {};
      for (const item of feed) {
        const id = getFeedKey(item);
        const match = executionTasks.find(
          (task) =>
            String(task?.metadata?.feed_id || "") === id ||
            String(task?.metadata?.signal_id || "") === id
        );

        if (match) {
          localResults[id] = {
            exists: true,
            task_id: match.id || match.local_id,
            status: match.status || "open",
            title: match.title,
            assigned_to: match.assigned_to || "Command Team",
            assignee_avatar: match.assignee_avatar,
            assignee_initials: match.assignee_initials || initialsFromName(match.assigned_to)
          };
        }
      }

      try {
        const ids = feed.map((item) => getFeedKey(item)).join(",");
        const response = api.feedTaskState
          ? await api.feedTaskState(ids)
          : (await api.get(`/tasks/feed-state?ids=${encodeURIComponent(ids)}`)).data;

        if (!active) return;
        setFeedTaskState({ ...localResults, ...(response?.results || {}) });
      } catch {
        if (!active) return;
        setFeedTaskState(localResults);
      }
    }

    loadFeedTaskState();

    return () => {
      active = false;
    };
  }, [feed, executionTasks]);

  const vendorActions = useMemo(() => {
    return (vendorIntel?.recommended_actions || []).map((item) => ({
      title: item.title || "Review vendor coverage",
      owner: item.owner || "Vendor Intelligence",
      due: item.due || "Today",
      detail: item.detail || "Review vendor bench strength and assign backup capacity.",
      state: item.state || "National",
      office: "Statewide",
      risk: item.priority === "High" ? "Elevated" : "Watch"
    }));
  }, [vendorIntel]);

  const actions = useMemo(
    () =>
      [...vendorActions, ...(effectiveData?.actions || [])].filter((item) =>
        matchesFilters(item, filters)
      ),
    [effectiveData, vendorActions, filters]
  );

  const topPriorities = useMemo(() => {
    const base = (effectiveCrossSignal?.top_priorities || []).filter((item) => {
      if (filters.state && item.state !== filters.state) return false;
      if (filters.risk && item.risk !== filters.risk && item.severity !== filters.risk) return false;

      if (resolvedVendorGapStates.has(item.state) && isVendorDrivenPriority(item)) {
        return false;
      }

      return true;
    });

    const vendorPriorities = (vendorIntel?.gaps || []).map((gap) => {
      const score = Number(gap.coverage_score || 50);
      const priorityScore = Math.max(1, 100 - score);

      return {
        state: gap.state,
        severity: gap.severity || "Medium",
        risk: gap.severity === "High" ? "Elevated" : "Watch",
        priority_score: priorityScore,
        recommended_actions: [gap.detail || "Close vendor coverage gap and assign backup capacity."],
        finance: { receipts: 0 },
        vendors: { coverage_status: score < 30 ? "Gap" : "Thin" },
        mailops: { mail_risks: 0 }
      };
    });

    return [...vendorPriorities, ...base]
      .sort((a, b) => Number(b.priority_score || 0) - Number(a.priority_score || 0))
      .slice(0, 6);
  }, [effectiveCrossSignal, vendorIntel, filters, resolvedVendorGapStates]);

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
    const vendorSummary = vendorIntel?.summary || {};
    const activeVendorGaps =
      Number(vendorSummary.high_gap_states || 0) + Number(vendorSummary.medium_gap_states || 0);

    return [
      { label: "Tracked States", value: summary.states_tracked || vendorSummary.states_covered || 0, delta: "Cross-signal engine", tone: "up" },
      { label: "Critical States", value: summary.critical_states || 0, delta: "Immediate review", tone: summary.critical_states ? "down" : "up" },
      { label: "Active Vendor Gaps", value: activeVendorGaps, delta: "Unresolved coverage pressure", tone: activeVendorGaps ? "down" : "up" },
      { label: "Resolved Vendor Gaps", value: vendorSummary.resolved_gap_states || 0, delta: "Closed by tasks", tone: "up" }
    ];
  }, [effectiveCrossSignal, vendorIntel]);

  const workloadTasks = useMemo(
    () => executionTasks.filter((task) => taskMatchesAssignee(task, selectedAssignee)),
    [executionTasks, selectedAssignee]
  );

  const reassignmentSuggestions = useMemo(
    () => buildReassignmentSuggestions(executionTasks, selectedAssignee),
    [executionTasks, selectedAssignee]
  );

  async function applyReassignmentSuggestion(suggestion) {
    if (!suggestion?.task || !suggestion?.to) return;

    const taskId = suggestion.task.id || suggestion.task.local_id;
    const patch = {
      assigned_to: suggestion.to.name,
      assigned_to_user_id: suggestion.to.user_id || "",
      assigned_to_email: suggestion.to.email || "",
      assignee_avatar: suggestion.to.avatar || "",
      assignee_initials: suggestion.to.initials || initialsFromName(suggestion.to.name)
    };

    setExecutionTasks((prev) =>
      prev.map((task) =>
        String(task.id || task.local_id) === String(taskId)
          ? { ...task, ...patch }
          : task
      )
    );

    try {
      if (taskId && !String(taskId).startsWith("local-task")) {
        await api.updateTask?.(taskId, patch);
      }

      await loadTasks();
      setReassignmentMessage(
        `Reassigned "${suggestion.task.title}" from ${suggestion.from.name} to ${suggestion.to.name}.`
      );
      setLiveBanner(`AI reassignment applied: ${suggestion.to.name} now owns the task.`);
    } catch {
      setReassignmentMessage("Reassignment saved locally, but backend update failed.");
    }
  }

  function selectAssigneeFromFeed(item = {}, taskState = null) {
    const name = taskState?.assigned_to || item.assigned_to || item.owner || "War Room";

    setSelectedAssignee({
      name,
      user_id: taskState?.assigned_to_user_id || item.assigned_to_user_id || "",
      email: taskState?.assigned_to_email || item.assigned_to_email || "",
      avatar: taskState?.assignee_avatar || item.assignee_avatar || "",
      initials: taskState?.assignee_initials || item.assignee_initials || initialsFromName(name)
    });

    setLiveBanner(`Filtered workload for ${name}`);

    setTimeout(() => {
      executionBoardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  function toggleFeed(id) {
    setExpandedFeedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createTaskFromFeed(item = {}) {
    const id = getFeedKey(item);
    const assignedTo = item.assigned_to || item.owner || "War Room";
    const title = `Review signal: ${item.title || "Command Center signal"}`;

    const result = await createExecutionTask(title, {
      source: "command_center",
      state: item.state || "National",
      office: item.office || "Statewide",
      risk: item.risk || "Watch",
      signal_type: item.type || "intelligence.signal",
      feed_id: id,
      signal_id: id,
      assigned_to: assignedTo,
      assignee_initials: item.assignee_initials || initialsFromName(assignedTo),
      detail: item.detail || item.description || item.title || "Review this Command Center signal."
    });

    const task = result?.task || {};

    setFeedTaskState((prev) => ({
      ...prev,
      [id]: {
        exists: true,
        task_id: task.id || task.local_id,
        status: task.status || "open",
        title: task.title,
        assigned_to: task.assigned_to || assignedTo,
        assignee_avatar: task.assignee_avatar,
        assignee_initials: task.assignee_initials || initialsFromName(task.assigned_to || assignedTo)
      }
    }));

    injectLocalSignal({
      title: result?.duplicate
        ? `Task exists for feed: ${item.title || "Command Center signal"}`
        : `Task created from feed: ${item.title || "Command Center signal"}`,
      severity: item.severity || "Medium",
      source: "Execution Engine",
      type: "feed.task_created",
      state: item.state || "National",
      office: item.office || "Statewide",
      risk: item.risk || "Watch"
    });

    await loadTasks();
  }

  function viewTaskFromFeed(item = {}) {
    const id = getFeedKey(item);
    const taskId = feedTaskState[id]?.task_id;

    if (!taskId) return;

    setFocusedTaskId(taskId);

    setTimeout(() => {
      executionBoardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 80);
  }

  return (
    <PageShell
      eyebrow="Executive Command Center"
      title="Campaign control, race velocity, and strategic response."
      description="Monitor battleground pressure, fundraising movement, narrative threats, vendor gaps, MailOps risk, and next-best actions in one command surface."
      demo={demoMode}
      demoText="Demo campaign is live: battleground movement, threat pressure, and execution signals are simulated for presentation."
      tickerItems={[
        { label: "Threats", value: `${highSeverityCount} high`, dotClass: "vs-live-dot" },
        { label: "Priorities", value: `${topPriorities.length} ranked`, dotClass: "vs-live-dot-warning" },
        { label: "Actions", value: `${actions.length} queued`, dotClass: "vs-live-dot-success" }
      ]}
    >
      <style>{`
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

        .vs-premium-row-card.is-resolved-gap {
          border-color: rgba(34, 197, 94, 0.42);
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.28), rgba(15, 23, 42, 0.62));
        }

        .vs-premium-row-card .vs-responsive-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 132px;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .vs-premium-row-card .vs-responsive-left,
        .vs-premium-row-card .vs-responsive-right {
          min-width: 0;
          max-width: 100%;
        }

        .vs-premium-row-card .vs-responsive-right {
          justify-self: end;
          overflow: hidden;
        }

        .vs-premium-row-card .vs-inline-actions {
          flex-wrap: wrap;
          justify-content: flex-end;
          max-width: 100%;
        }

        .vs-premium-row-card .vs-responsive-meta,
        .vs-feed-expanded-meta {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
          max-width: 100%;
        }

        .vs-premium-row-card .vs-meta-block,
        .vs-feed-expanded-meta .vs-meta-block {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }

        .vs-premium-row-card .vs-meta-value,
        .vs-premium-row-card .vs-row-title,
        .vs-premium-row-card .vs-row-subtitle,
        .vs-feed-expanded-meta .vs-meta-value {
          min-width: 0;
          max-width: 100%;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .vs-feed-expanded {
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          padding: 14px 16px 16px;
          animation: vsFeedExpand 180ms ease both;
        }

        .vs-feed-expanded-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .vs-feed-expanded-header-copy {
          min-width: 0;
        }

        .vs-feed-expanded-title {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(96, 165, 250, 0.95);
          margin-bottom: 4px;
        }

        .vs-feed-expanded-owner {
          color: rgba(226, 232, 240, 0.72);
          font-size: 0.84rem;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .vs-feed-expanded-body {
          color: rgba(226, 232, 240, 0.82);
          font-size: 0.92rem;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }        
        
        .vs-feed-expanded.is-actioned {
          border-top-color: rgba(96, 165, 250, 0.22);
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.1), rgba(15, 23, 42, 0.18));
        }

        .vs-feed-expanded.is-resolved {
          border-top-color: rgba(34, 197, 94, 0.28);
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.16), rgba(15, 23, 42, 0.18));
        }

        .vs-feed-loop-status {
          margin-left: auto;
          flex: 0 0 auto;
        }

        .vs-feed-loop-card {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.42);
        }

        .vs-feed-loop-title {
          color: rgba(248, 250, 252, 0.94);
          font-weight: 900;
        }

        .vs-feed-loop-subtitle {
          margin-top: 3px;
          color: rgba(148, 163, 184, 0.86);
          font-size: 0.82rem;
        }

        .vs-avatar {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 0.72rem;
          font-weight: 900;
          color: rgba(240, 253, 250, 0.95);
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.9), rgba(34, 197, 94, 0.75));
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 10px 22px rgba(2, 6, 23, 0.24);
          object-fit: cover;
          flex: 0 0 auto;
        }


        .vs-avatar-button,
        .vs-avatar-static {
          appearance: none;
          border: 0;
          padding: 0;
          margin: 0;
          background: transparent;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .vs-avatar-button:hover .vs-avatar {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.32), 0 12px 28px rgba(2, 6, 23, 0.3);
        }

        .vs-workload-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vs-workload-copy {
          min-width: 0;
        }


        .vs-workload-pressure {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.76), rgba(15, 23, 42, 0.46));
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.14);
        }

        .vs-workload-pressure.is-balanced {
          border-color: rgba(34, 197, 94, 0.34);
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.24), rgba(15, 23, 42, 0.62));
        }

        .vs-workload-pressure.is-pressure {
          border-color: rgba(234, 179, 8, 0.36);
          background: linear-gradient(135deg, rgba(113, 63, 18, 0.25), rgba(15, 23, 42, 0.62));
        }

        .vs-workload-pressure.is-overloaded {
          border-color: rgba(248, 113, 113, 0.46);
          background: linear-gradient(135deg, rgba(127, 29, 29, 0.28), rgba(15, 23, 42, 0.62));
          animation: vsWorkloadPressurePulse 1.9s ease-out 3;
        }

        .vs-workload-pressure-right {
          min-width: 126px;
          text-align: right;
        }

        .vs-workload-pressure-label {
          font-size: 0.82rem;
          font-weight: 900;
          color: rgba(248, 250, 252, 0.95);
        }

        .vs-workload-pressure-detail {
          margin-top: 2px;
          font-size: 0.75rem;
          color: rgba(226, 232, 240, 0.7);
        }

        .vs-ai-reassign-card {
          border-color: rgba(96, 165, 250, 0.24);
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.14), rgba(15, 23, 42, 0.58));
        }

        @keyframes vsWorkloadPressurePulse {
          0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.44); }
          70% { box-shadow: 0 0 0 10px rgba(248, 113, 113, 0); }
          100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
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
      {reassignmentMessage ? <div className="vs-banner">{reassignmentMessage}</div> : null}

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

      <div ref={executionBoardRef}>
        <ExecutionBoard
          tasks={selectedAssignee ? workloadTasks : executionTasks}
          onStatusChange={updateExecutionTaskStatus}
          focusedTaskId={focusedTaskId}
        />
      </div>

      <UserWorkloadPanel
        assignee={selectedAssignee}
        tasks={workloadTasks}
        onClear={() => setSelectedAssignee(null)}
      />

      <ReassignmentSuggestionsPanel
        suggestions={reassignmentSuggestions}
        onApply={applyReassignmentSuggestion}
      />

      <SectionCard
        title="Cross-Signal Priority Layer"
        subtitle="Highest-pressure states ranked by fundraising, vendor coverage, MailOps risk, and executive feed signals."
        right={<Badge tone="danger">{topPriorities.length} ranked</Badge>}
      >
        <div className="vs-grid-4" style={{ marginBottom: 16 }}>
          {crossMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="vs-stack">
          {!demoMode && (crossLoading || vendorLoading) ? (
            <EmptyState text="Loading cross-signal priority engine..." />
          ) : !topPriorities.length ? (
            <EmptyState text="No unresolved cross-signal priorities available for the current filters." />
          ) : (
            topPriorities.slice(0, 6).map((item, index) => (
              <PriorityRow key={`${item.state}-${index}`} item={item} index={index} />
            ))
          )}
        </div>

        {vendorIntel?.resolved_gaps?.length ? (
          <div className="vs-stack" style={{ marginTop: 16 }}>
            {vendorIntel.resolved_gaps.slice(0, 3).map((gap) => (
              <ResolvedVendorRow key={gap.id || gap.state} gap={gap} />
            ))}
          </div>
        ) : null}
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
        <SectionCard title="War Room Feed" subtitle="Live risk, logistics, forecast, vendor, and alert signals entering the command feed.">
          <div className="vs-stack">
            {!demoMode && loading ? (
              <EmptyState text="Loading command feed..." />
            ) : !feed.length ? (
              <EmptyState text="No live command feed items for the current filters." />
            ) : (
              feed.map((item) => {
                const id = getFeedKey(item);
                const taskState = feedTaskState[id] || null;

                return (
                  <FeedRow
                    key={id}
                    item={item}
                    live={liveFeedIds.includes(item.id)}
                    expanded={expandedFeedIds.has(id)}
                    taskState={taskState}
                    onToggle={() => toggleFeed(id)}
                    onCreateTask={() => createTaskFromFeed(item)}
                    onViewTask={() => viewTaskFromFeed(item)}
                    onAssigneeClick={() => selectAssigneeFromFeed(item, taskState)}
                  />
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Executive Action Queue" subtitle="Highest-leverage next steps from active intelligence inputs.">
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




