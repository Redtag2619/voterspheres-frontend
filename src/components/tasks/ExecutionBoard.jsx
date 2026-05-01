import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../ui/Badge";

const RAW_API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://127.0.0.1:10000/api";

const API_BASE = RAW_API_BASE.replace(/\/+$/, "").endsWith("/api")
  ? RAW_API_BASE.replace(/\/+$/, "")
  : `${RAW_API_BASE.replace(/\/+$/, "")}/api`;

function apiUrl(path = "") {
  const normalizedPath = String(path || "").replace(/^\/api(?=\/)/, "");
  return `${API_BASE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

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
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â€”";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function nowLabel() {
  return new Date().toLocaleString([], {
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

function initialsFor(value) {
  if (typeof value !== "string" && value?.assignee_initials) {
    return value.assignee_initials;
  }

  const name =
    typeof value === "string"
      ? value
      : value?.assigned_to || value?.created_by || "Command Team";

  return (
    String(name || "Command Team")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CT"
  );
}

function authHeaders() {
  const token =
    localStorage.getItem("vs_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    "";

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

function normalizeComment(row = {}) {
  return {
    id: row.id || `comment-${Date.now()}`,
    text: row.body || row.text || row.comment || "",
    author: row.author_name || row.author || "Command Team",
    initials: row.author_initials || initialsFor(row.author_name || row.author),
    created_at: formatDateTime(row.created_at) || row.created_at || "Now",
    raw_created_at: row.created_at
  };
}

function normalizeActivity(row = {}) {
  return {
    id: row.id || `activity-${Date.now()}`,
    title: row.title || row.event_type || "Task updated",
    subtitle: row.detail || formatDateTime(row.created_at),
    initials: row.actor_initials || initialsFor(row.actor_name || "System"),
    created_at: row.created_at,
    tone: String(row.event_type || "").includes("blocked") ? "danger" : "default"
  };
}

function TaskAvatar({ task }) {
  if (task?.assignee_avatar) {
    return (
      <img
        src={task.assignee_avatar}
        alt={task.assigned_to || "Assignee"}
        className="vs-task-avatar"
      />
    );
  }

  return <div className="vs-task-avatar">{initialsFor(task)}</div>;
}

function DetailRow({ label, value }) {
  const displayValue =
    String(label || "").toLowerCase() === "source"
      ? "Cmd Ctr"
      : value || "—";

  return (
    <div className="vs-detail-row">
      <div className="vs-meta-label">{label}</div>
      <div className="vs-detail-value">{displayValue}</div>
    </div>
  );
}

function CommentItem({ comment }) {
  return (
    <div className="vs-comment-item">
      <div className="vs-comment-avatar">{comment.initials || initialsFor(comment.author)}</div>
      <div className="vs-comment-body">
        <div className="vs-comment-head">
          <span className="vs-comment-author">{comment.author || "Command Team"}</span>
          <span className="vs-comment-time">{comment.created_at || "Now"}</span>
        </div>
        <div className="vs-comment-text">{comment.text}</div>
      </div>
    </div>
  );
}

function ActivityItem({ title, subtitle, initials = "VS", tone = "default" }) {
  return (
    <div className="vs-activity-item">
      <span className={`vs-activity-dot ${tone === "danger" ? "is-danger" : ""}`} />
      <div>
        <div className="vs-activity-title">{title}</div>
        <div className="vs-activity-subtitle">{subtitle}</div>
      </div>
      <div className="vs-activity-avatar">{initials}</div>
    </div>
  );
}

function TaskExpandedPanel({
  task,
  comments = [],
  activity = [],
  loadingTimeline = false,
  timelineError = "",
  onAddComment,
  onStatusChange
}) {
  const [assigneeName, setAssigneeName] = useState(task?.assigned_to || "");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const sla = slaInfo(task);

  useEffect(() => {
    setAssigneeName(task?.assigned_to || "");
    setCommentText("");
  }, [task]);

  async function updateAssignee() {
    const value = assigneeName.trim();
    if (!value) return;

    onStatusChange?.(task, normalizeStatus(task.status), {
      assigned_to: value,
      assignee_initials: initialsFor(value)
    });
  }

  async function submitComment(event) {
    event.preventDefault();

    const value = commentText.trim();
    if (!value || submittingComment) return;

    setSubmittingComment(true);

    try {
      await onAddComment?.(task, {
        text: value,
        author: task?.assigned_to || task?.created_by || "Command Team",
        initials: initialsFor(task?.assigned_to || task?.created_by || "Command Team"),
        created_at: nowLabel()
      });

      setCommentText("");
    } finally {
      setSubmittingComment(false);
    }
  }

  const defaultTimelineItems = [
    {
      title: "Task created",
      subtitle: formatDateTime(task.created_at),
      initials: initialsFor(task.created_by || "VS")
    },
    {
      title: `Status: ${formatStatusLabel(task.status)}`,
      subtitle: `Last updated ${formatDateTime(task.updated_at)}`,
      initials: initialsFor(task.assigned_to || "CT"),
      tone: normalizeStatus(task.status) === "blocked" ? "danger" : "default"
    },
    ...(task.metadata?.feed_id
      ? [{ title: "Created from feed signal", subtitle: task.metadata.feed_id, initials: "FI" }]
      : []),
    ...(task.metadata?.vendor_action_id
      ? [{ title: "Connected to vendor action", subtitle: task.metadata.vendor_action_id, initials: "VI" }]
      : [])
  ];

  const timelineItems = activity.length ? activity : defaultTimelineItems;

  return (
    <div className="vs-task-expanded">
      <div className="vs-task-expanded-section">
        <div className="vs-task-expanded-title">Full Detail</div>
        <div className="vs-task-expanded-description">
          {task.description || "No task description available."}
        </div>
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

      <div className="vs-task-expanded-section">
        <div className="vs-task-expanded-title">Reassign Owner</div>
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

      <div className="vs-task-expanded-section">
        <div className="vs-task-expanded-title">Status Controls</div>
        <div className="vs-inline-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={() => onStatusChange?.(task, "open")}>
            Open
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={() => onStatusChange?.(task, "in_progress")}>
            Start
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={() => onStatusChange?.(task, "blocked")}>
            Block
          </button>
          <button type="button" className="vs-button" onClick={() => onStatusChange?.(task, "complete")}>
            Complete
          </button>
        </div>
      </div>

      <div className="vs-task-expanded-section">
        <div className="vs-task-expanded-title">Comments</div>

        <form className="vs-comment-form" onSubmit={submitComment}>
          <textarea
            className="vs-comment-input"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Add an internal note, update, or handoff..."
            rows={3}
          />
          <div className="vs-comment-actions">
            <span>{comments.length} comment{comments.length === 1 ? "" : "s"}</span>
            <button type="submit" className="vs-button" disabled={!commentText.trim() || submittingComment}>
              {submittingComment ? "Saving..." : "Add Comment"}
            </button>
          </div>
        </form>

        <div className="vs-comment-list">
          {timelineError ? <div className="vs-empty-mini">{timelineError}</div> : null}
          {!comments.length ? (
            <div className="vs-empty-mini">No comments yet.</div>
          ) : (
            comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
          )}
        </div>
      </div>

      <div className="vs-task-expanded-section">
        <div className="vs-task-expanded-title">Activity History</div>
        <div className="vs-activity-list">
          {loadingTimeline ? (
            <div className="vs-empty-mini">Loading activity...</div>
          ) : (
            timelineItems.map((item, index) => (
              <ActivityItem
                key={`${item.id || item.title}-${index}`}
                title={item.title}
                subtitle={item.subtitle}
                initials={item.initials}
                tone={item.tone}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isFocused,
  isExpanded,
  comments = [],
  activity = [],
  loadingTimeline = false,
  timelineError = "",
  onAddComment,
  onStatusChange,
  onDragStart,
  onToggle
}) {
  const sla = slaInfo(task);

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, task)}
      className={`vs-task-card ${isFocused ? "vs-task-focus-pulse" : ""} ${isExpanded ? "is-expanded" : ""}`}
      style={{
        border: isFocused || isExpanded ? "1px solid rgba(34,197,94,0.62)" : undefined
      }}
    >
      <div className="vs-task-card-top" onClick={() => onToggle(task)}>
        <div className="vs-task-card-title-wrap">
          <div className="vs-task-card-title">{task.title}</div>
          <div className="vs-task-card-subtitle">
            {task.description || "Execution task generated from Command Center."}
          </div>
        </div>

        <div className="vs-task-card-avatar-wrap">
          <TaskAvatar task={task} />
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

      <div className="vs-task-card-actions">
        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onToggle(task)}
        >
          {isExpanded ? "Collapse" : "Details"}
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

      {isExpanded ? (
        <TaskExpandedPanel
          task={task}
          comments={comments}
          activity={activity}
          loadingTimeline={loadingTimeline}
          timelineError={timelineError}
          onAddComment={onAddComment}
          onStatusChange={onStatusChange}
        />
      ) : null}
    </div>
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
  const [expandedTaskIds, setExpandedTaskIds] = useState(() => new Set());
  const [commentsByTaskId, setCommentsByTaskId] = useState({});
  const [activityByTaskId, setActivityByTaskId] = useState({});
  const [loadingTaskIds, setLoadingTaskIds] = useState(() => new Set());
  const [timelineErrors, setTimelineErrors] = useState({});

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

      setExpandedTaskIds((prev) => {
        const next = new Set(prev);
        next.add(String(focusedTaskId));
        return next;
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [focusedTaskId, tasks.length]);

  async function loadTimeline(task) {
    const id = getTaskId(task);
    if (!id || String(id).startsWith("local-")) return;

    setLoadingTaskIds((prev) => new Set(prev).add(id));
    setTimelineErrors((prev) => ({ ...prev, [id]: "" }));

    try {
      const data = await requestJson(`/tasks/${id}/timeline`);
      setCommentsByTaskId((prev) => ({
        ...prev,
        [id]: (data.comments || []).map(normalizeComment)
      }));
      setActivityByTaskId((prev) => ({
        ...prev,
        [id]: (data.activity || []).map(normalizeActivity)
      }));
    } catch (err) {
      setTimelineErrors((prev) => ({
        ...prev,
        [id]: err.message || "Could not load comments/activity."
      }));
    } finally {
      setLoadingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function handleToggle(task) {
    const id = getTaskId(task);
    const willOpen = !expandedTaskIds.has(id);

    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (willOpen && !commentsByTaskId[id] && !activityByTaskId[id]) {
      loadTimeline(task);
    }
  }

  async function handleAddComment(task, comment) {
    const id = getTaskId(task);

    if (!id || String(id).startsWith("local-")) {
      setCommentsByTaskId((prev) => ({
        ...prev,
        [id]: [comment, ...(prev[id] || [])]
      }));
      return;
    }

    const optimistic = {
      id: `comment-local-${Date.now()}`,
      ...comment
    };

    setCommentsByTaskId((prev) => ({
      ...prev,
      [id]: [optimistic, ...(prev[id] || [])]
    }));

    try {
      const data = await requestJson(`/tasks/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          body: comment.text,
          author_name: comment.author,
          author_initials: comment.initials
        })
      });

      setCommentsByTaskId((prev) => ({
        ...prev,
        [id]: [normalizeComment(data.comment), ...(prev[id] || []).filter((item) => item.id !== optimistic.id)]
      }));

      if (data.activity) {
        setActivityByTaskId((prev) => ({
          ...prev,
          [id]: [normalizeActivity(data.activity), ...(prev[id] || [])]
        }));
      }
    } catch (err) {
      setTimelineErrors((prev) => ({
        ...prev,
        [id]: err.message || "Comment saved locally only."
      }));
    }
  }

  function handleStatusChange(task, status, extra = {}) {
    onStatusChange?.(task, status, extra);

    const id = getTaskId(task);
    if (!id) return;

    setTimeout(() => {
      loadTimeline(task);
    }, 450);
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
    <section className="vs-section-card">
      <div className="vs-section-head">
        <div className="vs-section-title-wrap">
          <h3 className="vs-section-title">Executive Execution Board</h3>
          <div className="vs-section-subtitle">
            Drag tasks between lanes, expand blocks for persisted comments/activity, and convert intelligence into closed work.
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
                    const id = getTaskId(task);
                    const isFocused = isSameTask(task, focusedTaskId);
                    const isExpanded = expandedTaskIds.has(id);

                    return (
                      <div
                        key={task.id || task.local_id}
                        ref={isFocused ? focusedTaskRef : null}
                      >
                        <TaskCard
                          task={task}
                          isFocused={isFocused}
                          isExpanded={isExpanded}
                          comments={commentsByTaskId[id] || []}
                          activity={activityByTaskId[id] || []}
                          loadingTimeline={loadingTaskIds.has(id)}
                          timelineError={timelineErrors[id] || ""}
                          onAddComment={handleAddComment}
                          onStatusChange={handleStatusChange}
                          onDragStart={handleDragStart}
                          onToggle={handleToggle}
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

      <style>{`
        .vs-execution-lanes {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          align-items: start;
        }

        .vs-execution-lane {
          min-height: 320px;
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
          min-height: 285px;
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

        .vs-task-card:not(.is-expanded) {
          height: 285px;
          max-height: 285px;
        }

        .vs-task-card.is-expanded {
          height: auto;
          max-height: none;
          cursor: default;
        }

        .vs-task-card:active {
          cursor: grabbing;
        }

        .vs-task-card:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.32);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.24);
        }

        .vs-task-card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          min-height: 76px;
          cursor: pointer;
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

        .vs-task-card-avatar-wrap {
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

        .vs-task-expanded {
          margin-top: 14px;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          padding-top: 14px;
          display: grid;
          gap: 14px;
          animation: vsTaskExpand 180ms ease both;
        }

        .vs-task-expanded-section {
          display: grid;
          gap: 10px;
        }

        .vs-task-expanded-title {
          color: rgba(248, 250, 252, 0.94);
          font-weight: 900;
        }

        .vs-task-expanded-description {
          color: rgba(203, 213, 225, 0.84);
          line-height: 1.55;
          overflow-wrap: anywhere;
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

        .vs-drawer-reassign {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .vs-drawer-reassign .vs-input {
          flex: 1;
          min-width: 160px;
        }

        .vs-comment-form {
          display: grid;
          gap: 10px;
        }

        .vs-comment-input {
          width: 100%;
          min-width: 0;
          resize: vertical;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.62);
          color: rgba(248, 250, 252, 0.92);
          padding: 10px 12px;
          outline: none;
          font: inherit;
        }

        .vs-comment-actions {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          color: rgba(148, 163, 184, 0.88);
          font-size: 0.82rem;
        }

        .vs-comment-list,
        .vs-activity-list {
          display: grid;
          gap: 10px;
        }

        .vs-comment-item {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          gap: 10px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 14px;
          padding: 10px;
          background: rgba(15, 23, 42, 0.42);
        }

        .vs-comment-avatar,
        .vs-activity-avatar {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 0.68rem;
          font-weight: 900;
          color: rgba(240, 253, 250, 0.95);
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.86), rgba(34, 197, 94, 0.68));
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .vs-comment-body {
          min-width: 0;
        }

        .vs-comment-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }

        .vs-comment-author {
          color: rgba(248, 250, 252, 0.92);
          font-weight: 900;
        }

        .vs-comment-time {
          color: rgba(148, 163, 184, 0.78);
          font-size: 0.76rem;
          white-space: nowrap;
        }

        .vs-comment-text {
          margin-top: 6px;
          color: rgba(203, 213, 225, 0.86);
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .vs-empty-mini {
          border: 1px dashed rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          padding: 12px;
          color: rgba(148, 163, 184, 0.78);
          font-size: 0.86rem;
          text-align: center;
        }

        .vs-activity-item {
          display: grid;
          grid-template-columns: 12px minmax(0, 1fr) 30px;
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

        .vs-activity-dot.is-danger {
          background: rgba(248, 113, 113, 0.95);
          box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.12);
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

        @keyframes vsTaskExpand {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

          .vs-task-card:not(.is-expanded) {
            height: auto;
            min-height: 260px;
            max-height: none;
          }
        }
      `}</style>
    </section>
  );
}


