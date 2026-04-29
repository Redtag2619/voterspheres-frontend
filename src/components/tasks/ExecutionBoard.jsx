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

function getTaskKey(task = {}) {
  return String(task.id || task.local_id || task.task_id || "");
}

function getSourceMeta(task = {}) {
  const source = String(task.source || "").toLowerCase();
  if (source === "vendor_network" || source === "vendor_intelligence") {
    return { label: "Vendor", tone: "accent", isVendor: true };
  }
  if (source === "command_center") {
    return { label: "Command", tone: "default", isVendor: false };
  }
  return { label: "System", tone: "default", isVendor: false };
}

function getVendorLink(task = {}) {
  const state = task.state || task.metadata?.state || "";
  const params = new URLSearchParams();
  if (state && state !== "National") params.set("state", state);
  params.set("source", "execution-board");
  return `/vendors?${params.toString()}`;
}

function openVendorLink(task) {
  window.location.href = getVendorLink(task);
}

function TaskRow({ task, highlighted = false, onStatusChange }) {
  const sourceMeta = getSourceMeta(task);

  return (
    <div
      id={highlighted ? "focused-execution-task" : undefined}
      className={`vs-card-muted ${sourceMeta.isVendor ? "vs-card-vendor" : ""} ${highlighted ? "vs-task-focus-pulse" : ""}`}
    >
      <div className="vs-responsive-row">
        <div className="vs-responsive-left">
          <div className="vs-row-title">{task.title}</div>
          <div className="vs-row-subtitle">
            {task.description || "Execution task generated from Command Center."}
          </div>

          <div className="vs-responsive-meta">
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
              <div className="vs-meta-label">Source</div>
              <div className="vs-meta-value">
                {sourceMeta.isVendor ? "Vendor Intelligence" : "Command Center"}
              </div>
            </div>
          </div>
        </div>

        <div className="vs-responsive-right">
          <div className="vs-inline-actions">
            {highlighted ? <Badge tone="active">Selected</Badge> : null}
            <Badge tone={sourceMeta.tone}>{sourceMeta.label}</Badge>
            <Badge tone={priorityTone(task.priority)}>{task.priority || "medium"}</Badge>
            <Badge tone={statusTone(task.status)}>{task.status || "open"}</Badge>

            {sourceMeta.isVendor ? (
              <button type="button" className="vs-button vs-button-secondary" onClick={() => openVendorLink(task)}>
                View Vendors
              </button>
            ) : null}

            {task.status !== "in_progress" && task.status !== "complete" ? (
              <button type="button" className="vs-button vs-button-secondary" onClick={() => onStatusChange?.(task, "in_progress")}>
                Start
              </button>
            ) : null}

            {task.status !== "complete" ? (
              <button type="button" className="vs-button" onClick={() => onStatusChange?.(task, "complete")}>
                Complete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExecutionBoard({ tasks = [], onStatusChange, highlightedTaskId = "" }) {
  const highlightedKey = String(highlightedTaskId || "");
  const open = tasks.filter((task) => task.status !== "complete");
  const complete = tasks.filter((task) => task.status === "complete");

  return (
    <section className="vs-section-card">
      <div className="vs-section-head">
        <div className="vs-section-title-wrap">
          <h3 className="vs-section-title">Executive Execution Board</h3>
          <div className="vs-section-subtitle">
            Unified execution layer across Command Center and Vendor Intelligence.
          </div>
        </div>
        <Badge tone="accent">{tasks.length} tasks</Badge>
      </div>

      <div className="vs-stack">
        {!tasks.length ? (
          <div className="vs-empty-state">
            No execution tasks yet. Actions from Command Center and Vendor Intelligence will appear here.
          </div>
        ) : (
          <>
            {open.map((task) => {
              const taskKey = getTaskKey(task);
              return (
                <TaskRow
                  key={taskKey || task.title}
                  task={task}
                  highlighted={Boolean(highlightedKey && taskKey === highlightedKey)}
                  onStatusChange={onStatusChange}
                />
              );
            })}

            {complete.length ? (
              <details className="vs-card-muted">
                <summary style={{ cursor: "pointer", fontWeight: 800 }}>
                  Completed tasks ({complete.length})
                </summary>

                <div className="vs-stack" style={{ marginTop: 12 }}>
                  {complete.map((task) => {
                    const taskKey = getTaskKey(task);
                    const sourceMeta = getSourceMeta(task);
                    const highlighted = Boolean(highlightedKey && taskKey === highlightedKey);

                    return (
                      <div
                        key={taskKey || task.title}
                        id={highlighted ? "focused-execution-task" : undefined}
                        className={`vs-card-muted ${sourceMeta.isVendor ? "vs-card-vendor" : ""} ${highlighted ? "vs-task-focus-pulse" : ""}`}
                      >
                        <div className="vs-row-title">{task.title}</div>
                        <div className="vs-row-subtitle">
                          Completed • {task.assigned_to || "Command Team"} • {sourceMeta.label}
                        </div>

                        <div className="vs-inline-actions" style={{ marginTop: 10 }}>
                          {highlighted ? <Badge tone="active">Selected</Badge> : null}
                          <Badge tone="active">Complete</Badge>
                          {sourceMeta.isVendor ? (
                            <button type="button" className="vs-button vs-button-secondary" onClick={() => openVendorLink(task)}>
                              View Vendors
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ) : null}
          </>
        )}
      </div>

      <style>{`
        .vs-card-vendor {
          border: 1px solid rgba(34, 197, 94, 0.25);
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.15);
        }

        .vs-task-focus-pulse {
          position: relative;
          border-color: rgba(96, 165, 250, 0.7) !important;
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.28), rgba(15, 23, 42, 0.72)) !important;
          box-shadow:
            0 0 0 1px rgba(96, 165, 250, 0.45),
            0 0 0 6px rgba(96, 165, 250, 0.08),
            0 22px 54px rgba(37, 99, 235, 0.2) !important;
          animation: vsTaskFocusPulse 1.1s ease-in-out 4;
        }

        .vs-task-focus-pulse::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(96, 165, 250, 0), rgba(96, 165, 250, 0.18), rgba(96, 165, 250, 0));
          animation: vsTaskFocusSweep 1.1s ease-in-out 4;
        }

        @keyframes vsTaskFocusPulse {
          0%, 100% { transform: translateY(0); }
          45% {
            transform: translateY(-2px);
            box-shadow:
              0 0 0 1px rgba(96, 165, 250, 0.65),
              0 0 0 9px rgba(96, 165, 250, 0.12),
              0 24px 60px rgba(37, 99, 235, 0.26);
          }
        }

        @keyframes vsTaskFocusSweep {
          0% { opacity: 0; transform: translateX(-35%); }
          45% { opacity: 1; }
          100% { opacity: 0; transform: translateX(35%); }
        }
      `}</style>
    </section>
  );
}

