import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high", "blocked", "overdue"].includes(v)) return "danger";
  if (["medium", "open", "in_progress"].includes(v)) return "demo";
  if (["complete", "completed", "done", "resolved", "active"].includes(v)) return "active";
  return "accent";
}

function normalizeStatus(value = "") {
  const v = String(value || "").toLowerCase();
  if (["complete", "completed", "done", "resolved"].includes(v)) return "complete";
  if (["blocked", "paused", "hold"].includes(v)) return "blocked";
  if (["in_progress", "active", "started"].includes(v)) return "in_progress";
  return "open";
}

function dueDateInput(value) {
  if (!value) return "";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function OwnerWorkloadRow({ item }) {
  return (
    <div className="own-row">
      <ResponsiveRow
        title={item.owner || "Unassigned"}
        subtitle="Task ownership workload"
        meta={[
          { label: "Total", value: item.total || 0 },
          { label: "Open", value: item.open || 0 },
          { label: "Complete", value: item.complete || 0 },
          { label: "Blocked", value: item.blocked || 0 },
          { label: "High", value: item.high || 0 },
          { label: "Overdue", value: item.overdue || 0 },
        ]}
        right={<Badge tone={item.blocked || item.overdue ? "danger" : item.open ? "demo" : "active"}>{item.open || 0} open</Badge>}
      />
    </div>
  );
}

function TaskOwnershipRow({ task, owners, onUpdate, updatingId }) {
  const updating = String(updatingId) === String(task.id);

  const [owner, setOwner] = useState(task.assigned_to || "");
  const [status, setStatus] = useState(normalizeStatus(task.status));
  const [priority, setPriority] = useState(task.priority || "medium");
  const [dueDate, setDueDate] = useState(dueDateInput(task.due_date));

  useEffect(() => {
    setOwner(task.assigned_to || "");
    setStatus(normalizeStatus(task.status));
    setPriority(task.priority || "medium");
    setDueDate(dueDateInput(task.due_date));
  }, [task]);

  return (
    <div className={`own-task own-${String(priority || "medium").toLowerCase()}`}>
      <ResponsiveRow
        title={task.title || "Task"}
        subtitle={task.description || task.workspace_name || task.source || "Command task"}
        meta={[
          { label: "Workspace", value: task.workspace_name || "—" },
          { label: "State", value: task.state || "National" },
          { label: "Status", value: status },
          { label: "Priority", value: priority },
          { label: "Due", value: dueDate || "—" },
        ]}
        right={<Badge tone={tone(priority)}>{priority || "medium"}</Badge>}
      />

      <div className="own-controls">
        <select value={owner} onChange={(event) => setOwner(event.target.value)}>
          <option value="">Unassigned</option>
          {owners.map((person) => (
            <option key={person.id || person.email || person.name} value={person.name || person.email}>
              {person.name || person.email}
            </option>
          ))}
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="complete">Complete</option>
        </select>

        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="normal">Normal</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />

        <button
          type="button"
          className="vs-button own-save"
          disabled={updating}
          onClick={() =>
            onUpdate(task.id, {
              assigned_to: owner || null,
              status,
              priority,
              due_date: dueDate || null,
              note: "Updated from Task Ownership System",
            })
          }
        >
          {updating ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function TaskOwnership() {
  const [data, setData] = useState(null);
  const [updatingId, setUpdatingId] = useState("");
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.taskOwnershipDashboard();
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load task ownership.");
      setData({ summary: {}, owners: [], workload: [], tasks: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateTask(taskId, payload) {
    try {
      setUpdatingId(taskId);
      setMessage("");
      setError("");

      await api.updateTaskOwnership(taskId, payload);
      setMessage("Task ownership updated.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to update task ownership.");
    } finally {
      setUpdatingId("");
    }
  }

  const summary = data?.summary || {};
  const owners = data?.owners || [];
  const workload = data?.workload || [];
  const tasks = data?.tasks || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const status = normalizeStatus(task.status);
      const priority = String(task.priority || "").toLowerCase();

      if (filter === "all") return true;
      if (filter === "open") return status !== "complete";
      if (filter === "unassigned") return !task.assigned_to;
      if (filter === "blocked") return status === "blocked";
      if (filter === "high") return ["critical", "high"].includes(priority);
      return status === filter;
    });
  }, [tasks, filter]);

  return (
    <PageShell
      eyebrow="Task Ownership"
      title="AI Task Ownership + Team Assignment"
      description="Assign owners, set priority, manage due dates, track workload, and convert intelligence into accountable execution."
      tickerItems={[
        { label: "Open", value: `${summary.open_tasks || 0}`, dotClass: summary.open_tasks ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Unassigned", value: `${summary.unassigned || 0}`, dotClass: summary.unassigned ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Owners", value: `${summary.owners || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .own-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .own-stack {
          display: grid;
          gap: 14px;
        }

        .own-row,
        .own-task {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .own-row .vs-responsive-row,
        .own-task .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .own-critical,
        .own-high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .own-controls {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr auto;
          gap: 10px;
          padding: 0 16px 16px;
        }

        .own-controls select,
        .own-controls input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 10px 12px;
          outline: none;
        }

        .own-save {
          padding: 9px 14px;
          font-size: 12px;
        }

        .own-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .own-tabs button {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15,23,42,0.74);
          color: rgba(226,232,240,0.84);
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 12px;
          cursor: pointer;
          text-transform: capitalize;
        }

        .own-tabs button.is-active {
          border-color: rgba(96,165,250,0.62);
          background: rgba(37,99,235,0.28);
          color: white;
        }

        .own-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1100px) {
          .own-layout,
          .own-controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="own-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Open Tasks" value={fmt(summary.open_tasks)} delta="Needs owner/action" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="Unassigned" value={fmt(summary.unassigned)} delta="No owner set" tone={summary.unassigned ? "down" : "up"} />
        <StatCard label="Blocked" value={fmt(summary.blocked)} delta="Execution risk" tone={summary.blocked ? "down" : "up"} />
        <StatCard label="Owners" value={fmt(summary.owners)} delta="Available team" tone="up" />
      </div>

      {loading ? (
        <EmptyState text="Loading task ownership system..." />
      ) : (
        <div className="own-layout">
          <SectionCard
            title="Assignable Tasks"
            subtitle="Assign owners, status, priority, and due dates."
            right={<Badge tone="accent">{filteredTasks.length} tasks</Badge>}
          >
            <div className="own-tabs">
              {["open", "unassigned", "blocked", "high", "complete", "all"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={filter === item ? "is-active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {!filteredTasks.length ? (
              <EmptyState text="No tasks match this filter." />
            ) : (
              <div className="own-stack">
                {filteredTasks.map((task) => (
                  <TaskOwnershipRow
                    key={task.id}
                    task={task}
                    owners={owners}
                    updatingId={updatingId}
                    onUpdate={updateTask}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Team Workload"
            subtitle="Execution load by owner."
            right={<Badge tone="accent">{workload.length} owners</Badge>}
          >
            {!workload.length ? (
              <EmptyState text="No workload data yet." />
            ) : (
              <div className="own-stack">
                {workload.map((item) => (
                  <OwnerWorkloadRow key={item.owner} item={item} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}
