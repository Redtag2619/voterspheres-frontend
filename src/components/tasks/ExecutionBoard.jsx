import { useEffect, useRef } from "react";
import Badge from "../ui/Badge";

function statusTone(status) {
  const value = String(status || "").toLowerCase();
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

function getAssignee(task = {}) {
  const assignedUser = task.assigned_user || {};
  const name =
    assignedUser.name ||
    task.assigned_to_name ||
    task.assigned_to ||
    "Command Team";

  const initials =
    assignedUser.initials ||
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    "CT";

  return {
    name,
    email: assignedUser.email || task.assigned_to_email || "",
    avatar_url: assignedUser.avatar_url || task.assigned_to_avatar_url || "",
    initials
  };
}

function isSameTask(task, focusedTaskId) {
  if (!focusedTaskId) return false;

  return (
    String(task.id || "") === String(focusedTaskId) ||
    String(task.local_id || "") === String(focusedTaskId)
  );
}

function AssigneeAvatar({ assignee, size = 34 }) {
  return (
    <div
      className="vs-task-avatar"
      title={assignee.email ? `${assignee.name} â€¢ ${assignee.email}` : assignee.name}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size
      }}
    >
      {assignee.avatar_url ? (
        <img src={assignee.avatar_url} alt={assignee.name} />
      ) : (
        <span>{assignee.initials}</span>
      )}
    </div>
  );
}

function TaskCard({ task, isFocused, focusedTaskRef, onStatusChange }) {
  const assignee = getAssignee(task);

  return (
    <div
      ref={isFocused ? focusedTaskRef : null}
      className={`vs-card-muted ${isFocused ? "vs-task-focus-pulse" : ""}`}
      style={{
        border: isFocused ? "1px solid rgba(34,197,94,0.6)" : undefined
      }}
    >
      <div className="vs-responsive-row">
        <div className="vs-responsive-left">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <AssigneeAvatar assignee={assignee} />
            <div style={{ minWidth: 0 }}>
              <div className="vs-row-title">{task.title}</div>

              {isFocused ? (
                <div style={{ marginTop: 6 }}>
                  <Badge tone="success">Focused from Feed</Badge>
                </div>
              ) : null}
            </div>
          </div>

          <div className="vs-row-subtitle">
            {task.description || "Execution task generated from Command Center."}
          </div>

          <div className="vs-responsive-meta">
            <div className="vs-meta-block">
              <div className="vs-meta-label">Assigned</div>
              <div className="vs-meta-value">{assignee.name}</div>
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
              <div className="vs-meta-label">Source</div>
              <div className="vs-meta-value">{task.source || "command_center"}</div>
            </div>
          </div>
        </div>

        <div className="vs-responsive-right">
          <div className="vs-inline-actions">
            <Badge tone={priorityTone(task.priority)}>{task.priority || "medium"}</Badge>
            <Badge tone={statusTone(task.status)}>{task.status || "open"}</Badge>

            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onStatusChange?.(task, "in_progress")}
              disabled={task.status === "complete"}
            >
              Start
            </button>

            <button
              type="button"
              className="vs-button"
              onClick={() => onStatusChange?.(task, "complete")}
              disabled={task.status === "complete"}
            >
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExecutionBoard({
  tasks = [],
  onStatusChange,
  focusedTaskId = null
}) {
  const focusedTaskRef = useRef(null);

  const open = tasks.filter((task) => task.status !== "complete");
  const complete = tasks.filter((task) => task.status === "complete");

  useEffect(() => {
    if (!focusedTaskId || !focusedTaskRef.current) return;

    const timer = setTimeout(() => {
      const element = focusedTaskRef.current;
      const rect = element.getBoundingClientRect();

      const absoluteTop = rect.top + window.scrollY;
      const viewportCenterOffset = window.innerHeight / 2 - rect.height / 2;
      const scrollTarget = Math.max(0, absoluteTop - viewportCenterOffset);

      window.scrollTo({
        top: scrollTarget,
        behavior: "smooth"
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [focusedTaskId, tasks.length]);

  return (
    <section className="vs-section-card">
      <div className="vs-section-head">
        <div className="vs-section-title-wrap">
          <h3 className="vs-section-title">Executive Execution Board</h3>
          <div className="vs-section-subtitle">
            One-click command actions converted into assigned, persistent campaign tasks.
          </div>
        </div>

        <Badge tone="accent">{tasks.length} tasks</Badge>
      </div>

      <div className="vs-stack">
        {!tasks.length ? (
          <div className="vs-empty-state">
            No execution tasks yet. Click a Command Center action to create one.
          </div>
        ) : (
          <>
            {open.map((task) => (
              <TaskCard
                key={task.id || task.local_id}
                task={task}
                isFocused={isSameTask(task, focusedTaskId)}
                focusedTaskRef={focusedTaskRef}
                onStatusChange={onStatusChange}
              />
            ))}

            {complete.length ? (
              <details className="vs-card-muted">
                <summary style={{ cursor: "pointer", fontWeight: 800 }}>
                  Completed tasks ({complete.length})
                </summary>

                <div className="vs-stack" style={{ marginTop: 12 }}>
                  {complete.map((task) => (
                    <TaskCard
                      key={task.id || task.local_id}
                      task={task}
                      isFocused={isSameTask(task, focusedTaskId)}
                      focusedTaskRef={focusedTaskRef}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </>
        )}
      </div>

      <style>{`
        .vs-task-avatar {
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background:
            radial-gradient(circle at 30% 20%, rgba(96, 165, 250, 0.35), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85));
          color: rgba(226, 232, 240, 0.95);
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          box-shadow: 0 10px 22px rgba(2, 6, 23, 0.20);
        }

        .vs-task-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vs-task-avatar span {
          line-height: 1;
        }

        .vs-task-focus-pulse {
          animation: vsTaskPulse 1.8s ease-out 3;
          scroll-margin-top: 120px;
          scroll-margin-bottom: 120px;
        }

        @keyframes vsTaskPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34,197,94,0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(34,197,94,0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34,197,94,0);
          }
        }
      `}</style>
    </section>
  );
}

