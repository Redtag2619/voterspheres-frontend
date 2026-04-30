import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../ui/Badge";

const LANES = [
  { id: "open", title: "Open", subtitle: "Needs owner action" },
  { id: "in_progress", title: "In Progress", subtitle: "Being handled now" },
  { id: "blocked", title: "Blocked", subtitle: "Needs escalation" },
  { id: "complete", title: "Complete", subtitle: "Closed work" }
];

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["complete", "completed", "done"].includes(value)) return "complete";
  if (["in_progress", "in progress", "started", "active"].includes(value)) return "in_progress";
  if (["blocked", "paused", "hold"].includes(value)) return "blocked";
  return "open";
}

function statusTone(status) {
  const value = normalizeStatus(status);
  if (value === "complete") return "active";
  if (value === "in_progress") return "info";
  if (value === "blocked") return "danger";
  return "demo";
}

function priorityTone(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "high" || value === "critical") return "danger";
  if (value === "medium") return "demo";
  return "default";
}

function formatStatusLabel(status) {
  const value = normalizeStatus(status);
  if (value === "in_progress") return "In Progress";
  if (value === "complete") return "Complete";
  if (value === "blocked") return "Blocked";
  return "Open";
}

function getTaskId(task) {
  return String(task?.id || task?.local_id || task?.title || "");
}

function isSameTask(task, focusedTaskId) {
  if (!focusedTaskId) return false;
  return getTaskId(task) === String(focusedTaskId);
}

function hoursOld(task) {
  const raw = task?.updated_at || task?.created_at || task?.createdAt;
  if (!raw) return 0;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 0;

  return Math.max(0, (Date.now() - date.getTime()) / 36e5);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function slaInfo(task) {
  const ageHours = hoursOld(task);
  const priority = String(task?.priority || "").toLowerCase();
  const status = normalizeStatus(task?.status);

  if (status === "complete") {
    return { label: "Closed", tone: "active", detail: "Completed" };
  }

  const criticalLimit = priority === "critical" || priority === "high" ? 2 : 24;
  const warningLimit = priority === "critical" || priority === "high" ? 1 : 8;

  if (ageHours >= criticalLimit) {
    return { label: "SLA Risk", tone: "danger", detail: `${Math.round(ageHours)}h old` };
  }

  if (ageHours >= warningLimit) {
    return { label: "Aging", tone: "demo", detail: `${Math.round(ageHours)}h old` };
  }

  return {
    label: "Fresh",
    tone: "active",
    detail: ageHours < 1 ? "<1h old" : `${Math.round(ageHours)}h old`
  };
}

function initialsFor(task) {
  return (
    task?.assignee_initials ||
    String(task?.assigned_to || "Command Team")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    "CT"
  );
}

function TaskAvatar({ task, onClick }) {
  if (task?.assignee_avatar) {
    return (
      <button type="button" className="vs-task-avatar-button" onClick={onClick}>
        <img
          src={task.assignee_avatar}
          alt={task.assigned_to || "Assignee"}
          className="vs-task-avatar"
        />
      </button>
    );
  }

  return (
    <button type="button" className="vs-task-avatar-button" onClick={onClick}>
      <div className="vs-task-avatar">{initialsFor(task)}</div>
    </button>
  );
}

function TaskCard({ task, isFocused, isSelected, onStatusChange, onDragStart, onOpen }) {
  const sla = slaInfo(task);

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, task)}
      onClick={() => onOpen(task)}
      className={`vs-task-card ${isFocused ? "vs-task-focus-pulse" : ""} ${isSelected ? "is-selected" : ""}`}
      style={{
        border: isFocused || isSelected ? "1px solid rgba(34,197,94,0.62)" : undefined
      }}
    >
      <div className="vs-task-card-head">
        <TaskAvatar task={task} onClick={(event) => {
          event.stopPropagation();
          onOpen(task);
        }} />

        <div className="vs-task-card-title-wrap">
          <div className="vs-task-card-title">{task.title}</div>
          <div className="vs-task-card-subtitle">
            {task.description || "Execution task generated from Command Center."}
          </div>
        </div>
      </div>

      {isFocused ? (
        <div style={{ marginTop: 8 }}>
          <Badge tone="success">Focused from Feed</Badge>
        </div>
      ) : null}

      <div className="vs-task-meta-grid">
        <div className="vs-meta-block">
          <div className="vs-meta-label">Owner</div>
          <div className="vs-meta-value">{task.assigned_to || "Command Team"}</div>
        </div>

        <div className="vs-meta-block">
          <div className="vs-meta-label">State</div>
          <div className="vs-meta-value">{task.state || "National"}</div>
        </div>

        <div className="vs-meta-block">
          <div className="vs-meta-label">Due</div>
          <div className="vs-meta-value">{task.due_label || "Now"}</div>
        </div>

        <div className="vs-meta-block">
          <div className="vs-meta-label">Age</div>
          <div className="vs-meta-value">{sla.detail}</div>
        </div>
      </div>

      <div className="vs-task-card-badges">
        <Badge tone={priorityTone(task.priority)}>{task.priority || "medium"}</Badge>
        <Badge tone={statusTone(task.status)}>{formatStatusLabel(task.status)}</Badge>
        <Badge tone={sla.tone}>{sla.label}</Badge>
      </div>

      <div className="vs-task-card-actions" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onStatusChange?.(task, "in_progress")}
          disabled={normalizeStatus(task.status) === "in_progress"}
        >
          Start
        </button>

        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onStatusChange?.(task, "blocked")}
          disabled={normalizeStatus(task.status) === "blocked"}
        >
          Block
        </button>

        <button
          type="button"
          className="vs-button"
          onClick={() => onStatusChange?.(task, "complete")}
          disabled={normalizeStatus(task.status) === "complete"}
        >
          Complete
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="vs-detail-row">
      <div className="vs-meta-label">{label}</div>
      <div className="vs-detail-value">{value || "—"}</div>
    </div>
  );
}

function TaskDetailDrawer({ task, onClose, onStatusChange }) {
  const [assigneeName, setAssigneeName] = useState(task?.assigned_to || "");
  const sla = slaInfo(task);

  useEffect(() => {
    setAssigneeName(task?.assigned_to || "");
  }, [task]);

  if (!task) return null;

  function updateAssignee() {
    const value = assigneeName.trim();
    if (!value) return;

    onStatusChange?.(task, normalizeStatus(task.status), {
      assigned_to: value,
      assignee_initials: value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    });
  }

  return (
    <aside className="vs-task-drawer" aria-label="Task details">
      <div className="vs-task-drawer-head">
        <div className="vs-task-drawer-person">
          <TaskAvatar task={task} onClick={() => {}} />
          <div>
            <div className="vs-task-drawer-kicker">Task Detail</div>
            <div className="vs-task-drawer-owner">{task.assigned_to || "Command Team"}</div>
          </div>
        </div>

        <button type="button" className="vs-drawer-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="vs-task-drawer-body">
        <div>
          <h3 className="vs-task-drawer-title">{task.title}</h3>
          <p className="vs-task-drawer-description">
            {task.description || "No task description available."}
          </p>
        </div>

        <div className="vs-drawer-badges">
          <Badge tone={priorityTone(task.priority)}>{task.priority || "medium"}</Badge>
          <Badge tone={statusTone(task.status)}>{formatStatusLabel(task.status)}</Badge>
          <Badge tone={sla.tone}>{sla.label}</Badge>
        </div>

        <div className="vs-detail-grid">
          <DetailRow label="Owner" value={task.assigned_to || "Command Team"} />
          <DetailRow label="State" value={task.state || "National"} />
          <DetailRow label="Office" value={task.office || "Statewide"} />
          <DetailRow label="Due" value={task.due_label || "Now"} />
          <DetailRow label="Age" value={sla.detail} />
          <DetailRow label="Source" value={task.source || "command_center"} />
          <DetailRow label="Created" value={formatDateTime(task.created_at)} />
          <DetailRow label="Updated" value={formatDateTime(task.updated_at)} />
        </div>

        <div className="vs-drawer-section">
          <div className="vs-drawer-section-title">Reassign Owner</div>
          <div className="vs-drawer-reassign">
            <input
              className="vs-input"
              value={assigneeName}
              onChange={(event) => setAssigneeName(event.target.value)}
              placeholder="Assign to..."
            />
            <button type="button" className="vs-button" onClick={updateAssignee}>
              Save
            </button>
          </div>
        </div>

        <div className="vs-drawer-section">
          <div className="vs-drawer-section-title">Status Controls</div>
          <div className="vs-inline-actions">
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onStatusChange?.(task, "open")}
            >
              Open
            </button>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onStatusChange?.(task, "in_progress")}
            >
              Start
            </button>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onStatusChange?.(task, "blocked")}
            >
              Block
            </button>
            <button
              type="button"
              className="vs-button"
              onClick={() => onStatusChange?.(task, "complete")}
            >
              Complete
            </button>
          </div>
        </div>

        <div className="vs-drawer-section">
          <div className="vs-drawer-section-title">Activity Timeline</div>
          <div className="vs-activity-list">
            <div className="vs-activity-item">
              <span className="vs-activity-dot" />
              <div>
                <div className="vs-activity-title">Task created</div>
                <div className="vs-activity-subtitle">{formatDateTime(task.created_at)}</div>
              </div>
            </div>

            <div className="vs-activity-item">
              <span className="vs-activity-dot" />
              <div>
                <div className="vs-activity-title">Last updated</div>
                <div className="vs-activity-subtitle">{formatDateTime(task.updated_at)}</div>
              </div>
            </div>

            {task.metadata?.feed_id ? (
              <div className="vs-activity-item">
                <span className="vs-activity-dot" />
                <div>
                  <div className="vs-activity-title">Created from feed signal</div>
                  <div className="vs-activity-subtitle">{task.metadata.feed_id}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function ExecutionBoard({
  tasks = [],
  onStatusChange,
  focusedTaskId = null
}) {
  const focusedTaskRef = useRef(null);
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [dragOverLane, setDragOverLane] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((task) => getTaskId(task) === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const laneTasks = useMemo(() => {
    const grouped = {
      open: [],
      in_progress: [],
      blocked: [],
      complete: []
    };

    for (const task of tasks) {
      grouped[normalizeStatus(task.status)]?.push(task);
    }

    return grouped;
  }, [tasks]);

  const slaSummary = useMemo(() => {
    const active = tasks.filter((task) => normalizeStatus(task.status) !== "complete");
    const risk = active.filter((task) => slaInfo(task).label === "SLA Risk").length;
    const aging = active.filter((task) => slaInfo(task).label === "Aging").length;

    return { active: active.length, risk, aging };
  }, [tasks]);

  useEffect(() => {
    if (!focusedTaskId || !focusedTaskRef.current) return;

    const timer = setTimeout(() => {
      const element = focusedTaskRef.current;
      const rect = element.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const viewportCenterOffset = window.innerHeight / 2 - rect.height / 2;
      const scrollTarget = Math.max(0, absoluteTop - viewportCenterOffset);

      window.scrollTo({ top: scrollTarget, behavior: "smooth" });
      setSelectedTaskId(String(focusedTaskId));
    }, 120);

    return () => clearTimeout(timer);
  }, [focusedTaskId, tasks.length]);

  function handleStatusChange(task, status, extra = {}) {
    onStatusChange?.(task, status, extra);
  }

  function handleDragStart(event, task) {
    const id = getTaskId(task);
    setDraggingTaskId(id);
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event, laneId) {
    event.preventDefault();
    setDragOverLane(laneId);
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event, laneId) {
    event.preventDefault();

    const id = event.dataTransfer.getData("text/plain") || draggingTaskId;
    const task = tasks.find((item) => getTaskId(item) === id);

    setDraggingTaskId("");
    setDragOverLane("");

    if (!task) return;
    if (normalizeStatus(task.status) === laneId) return;

    handleStatusChange(task, laneId);
  }

  return (
    <section className={`vs-section-card ${selectedTask ? "has-task-drawer" : ""}`}>
      <div className="vs-section-head">
        <div className="vs-section-title-wrap">
          <h3 className="vs-section-title">Executive Execution Board</h3>
          <div className="vs-section-subtitle">
            Drag tasks between lanes, monitor SLA pressure, and convert intelligence into closed work.
          </div>
        </div>

        <div className="vs-inline-actions">
          <Badge tone="accent">{tasks.length} tasks</Badge>
          <Badge tone={slaSummary.risk ? "danger" : "active"}>
            {slaSummary.risk} SLA risk
          </Badge>
          <Badge tone={slaSummary.aging ? "demo" : "active"}>
            {slaSummary.aging} aging
          </Badge>
        </div>
      </div>

      <div className="vs-execution-layout">
        <div className="vs-execution-main">
          {!tasks.length ? (
            <div className="vs-empty-state">
              No execution tasks yet. Click a Command Center action to create one.
            </div>
          ) : (
            <div className="vs-execution-lanes">
              {LANES.map((lane) => (
                <div
                  key={lane.id}
                  className={`vs-execution-lane ${dragOverLane === lane.id ? "is-drag-over" : ""}`}
                  onDragOver={(event) => handleDragOver(event, lane.id)}
                  onDragLeave={() => setDragOverLane("")}
                  onDrop={(event) => handleDrop(event, lane.id)}
                >
                  <div className="vs-execution-lane-head">
                    <div>
                      <div className="vs-execution-lane-title">{lane.title}</div>
                      <div className="vs-execution-lane-subtitle">{lane.subtitle}</div>
                    </div>

                    <Badge tone={lane.id === "complete" ? "active" : "accent"}>
                      {laneTasks[lane.id]?.length || 0}
                    </Badge>
                  </div>

                  <div className="vs-execution-lane-stack">
                    {!laneTasks[lane.id]?.length ? (
                      <div className="vs-execution-lane-empty">Drop task here</div>
                    ) : (
                      laneTasks[lane.id].map((task) => {
                        const isFocused = isSameTask(task, focusedTaskId);
                        const isSelected = getTaskId(task) === selectedTaskId;

                        return (
                          <div
                            key={task.id || task.local_id}
                            ref={isFocused ? focusedTaskRef : null}
                          >
                            <TaskCard
                              task={task}
                              isFocused={isFocused}
                              isSelected={isSelected}
                              onStatusChange={handleStatusChange}
                              onDragStart={handleDragStart}
                              onOpen={(picked) => setSelectedTaskId(getTaskId(picked))}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTaskId("")}
          onStatusChange={handleStatusChange}
        />
      </div>

      <style>{`
        .vs-execution-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }

        .has-task-drawer .vs-execution-layout {
          grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
        }

        .vs-execution-main {
          min-width: 0;
        }

        .vs-execution-lanes {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          align-items: stretch;
        }

        .vs-execution-lane {
          min-height: 320px;
          height: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.42);
          padding: 14px;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }

        .vs-execution-lane.is-drag-over {
          border-color: rgba(34, 197, 94, 0.58);
          background: rgba(22, 101, 52, 0.14);
          transform: translateY(-1px);
        }

        .vs-execution-lane-head {
          min-height: 58px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .vs-execution-lane-title {
          font-weight: 900;
          color: rgba(248, 250, 252, 0.95);
        }

        .vs-execution-lane-subtitle {
          margin-top: 3px;
          font-size: 0.78rem;
          color: rgba(148, 163, 184, 0.85);
        }

        .vs-execution-lane-stack {
          flex: 1;
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .vs-execution-lane-empty {
          display: grid;
          place-items: center;
          min-height: 220px;
          border: 1px dashed rgba(148, 163, 184, 0.22);
          border-radius: 14px;
          color: rgba(148, 163, 184, 0.74);
          font-size: 0.85rem;
        }

        .vs-task-card {
          height: 285px;
          min-height: 285px;
          max-height: 285px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.54));
          padding: 13px;
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.16);
          cursor: grab;
          overflow: hidden;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .vs-task-card.is-selected {
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.28), 0 18px 46px rgba(22, 163, 74, 0.12);
        }

        .vs-task-card:active {
          cursor: grabbing;
        }

        .vs-task-card:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.32);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.24);
        }

        .vs-task-card-head {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          min-height: 76px;
        }

        .vs-task-card-title-wrap {
          min-width: 0;
          flex: 1;
        }

        .vs-task-card-title {
          font-weight: 900;
          color: rgba(248, 250, 252, 0.95);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .vs-task-card-subtitle {
          margin-top: 6px;
          color: rgba(203, 213, 225, 0.76);
          font-size: 0.86rem;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .vs-task-avatar-button {
          border: 0;
          padding: 0;
          margin: 0;
          background: transparent;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .vs-task-avatar {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          object-fit: cover;
          font-size: 0.72rem;
          font-weight: 900;
          color: rgba(240, 253, 250, 0.95);
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.9), rgba(34, 197, 94, 0.75));
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 10px 22px rgba(2, 6, 23, 0.24);
        }

        .vs-task-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
          min-height: 58px;
        }

        .vs-task-meta-grid .vs-meta-block,
        .vs-task-meta-grid .vs-meta-label,
        .vs-task-meta-grid .vs-meta-value {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vs-task-card-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-top: 12px;
          min-height: 28px;
        }

        .vs-task-card-actions {
          margin-top: auto;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          min-height: 34px;
        }

        .vs-task-drawer {
          position: sticky;
          top: 96px;
          max-height: calc(100vh - 120px);
          overflow: auto;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.78));
          box-shadow: 0 22px 60px rgba(2, 6, 23, 0.32);
        }

        .vs-task-drawer-head {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.96);
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }

        .vs-task-drawer-person {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
        }

        .vs-task-drawer-kicker {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(96, 165, 250, 0.95);
        }

        .vs-task-drawer-owner {
          margin-top: 2px;
          color: rgba(226, 232, 240, 0.88);
          font-weight: 800;
        }

        .vs-drawer-close {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          color: rgba(248, 250, 252, 0.86);
          background: rgba(15, 23, 42, 0.62);
          cursor: pointer;
          font-size: 1.3rem;
          line-height: 1;
        }

        .vs-task-drawer-body {
          display: grid;
          gap: 16px;
          padding: 16px;
        }

        .vs-task-drawer-title {
          margin: 0;
          color: rgba(248, 250, 252, 0.96);
          font-size: 1.05rem;
          line-height: 1.35;
        }

        .vs-task-drawer-description {
          margin: 8px 0 0;
          color: rgba(203, 213, 225, 0.82);
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .vs-drawer-badges,
        .vs-drawer-reassign {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .vs-drawer-reassign .vs-input {
          flex: 1;
          min-width: 180px;
        }

        .vs-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .vs-detail-row {
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 14px;
          padding: 10px;
          background: rgba(15, 23, 42, 0.45);
          min-width: 0;
        }

        .vs-detail-value {
          margin-top: 4px;
          color: rgba(248, 250, 252, 0.9);
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .vs-drawer-section {
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .vs-drawer-section-title {
          margin-bottom: 10px;
          color: rgba(248, 250, 252, 0.94);
          font-weight: 900;
        }

        .vs-activity-list {
          display: grid;
          gap: 12px;
        }

        .vs-activity-item {
          display: grid;
          grid-template-columns: 12px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }

        .vs-activity-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          margin-top: 5px;
          background: rgba(34, 197, 94, 0.95);
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
        }

        .vs-activity-title {
          color: rgba(248, 250, 252, 0.9);
          font-weight: 800;
        }

        .vs-activity-subtitle {
          margin-top: 2px;
          color: rgba(148, 163, 184, 0.88);
          font-size: 0.82rem;
          overflow-wrap: anywhere;
        }

        .vs-task-focus-pulse {
          animation: vsTaskPulse 1.8s ease-out 3;
          scroll-margin-top: 120px;
          scroll-margin-bottom: 120px;
        }

        @keyframes vsTaskPulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70% { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }

        @media (max-width: 1280px) {
          .has-task-drawer .vs-execution-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .vs-task-drawer {
            position: relative;
            top: auto;
            max-height: none;
          }
        }

        @media (max-width: 1180px) {
          .vs-execution-lanes {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .vs-execution-lanes,
          .vs-detail-grid {
            grid-template-columns: 1fr;
          }

          .vs-task-card {
            height: auto;
            min-height: 260px;
            max-height: none;
          }
        }
      `}</style>
    </section>
  );
}
