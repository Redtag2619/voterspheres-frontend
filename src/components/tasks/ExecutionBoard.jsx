import Badge from "../ui/Badge";

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "complete") return "active";
  if (value === "in_progress") return "info";
  return "demo";
}

function priorityTone(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "high" || value === "critical") return "danger";
  if (value === "medium") return "demo";
  return "default";
}

function getSourceMeta(task = {}) {
  const source = String(task.source || "").toLowerCase();

  if (source === "vendor_network" || source === "vendor_intelligence") {
    return {
      label: "Vendor",
      tone: "accent"
    };
  }

  if (source === "command_center") {
    return {
      label: "Command",
      tone: "default"
    };
  }

  return {
    label: "System",
    tone: "default"
  };
}

export default function ExecutionBoard({ tasks = [], onStatusChange }) {
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
              const sourceMeta = getSourceMeta(task);
              const isVendor = sourceMeta.label === "Vendor";

              return (
                <div
                  key={task.id || task.local_id}
                  className={`vs-card-muted ${isVendor ? "vs-card-vendor" : ""}`}
                >
                  <div className="vs-responsive-row">
                    <div className="vs-responsive-left">
                      <div className="vs-row-title">{task.title}</div>

                      <div className="vs-row-subtitle">
                        {task.description ||
                          "Execution task generated from Command Center."}
                      </div>

                      <div className="vs-responsive-meta">
                        <div className="vs-meta-block">
                          <div className="vs-meta-label">Owner</div>
                          <div className="vs-meta-value">
                            {task.assigned_to || "Command Team"}
                          </div>
                        </div>

                        <div className="vs-meta-block">
                          <div className="vs-meta-label">State</div>
                          <div className="vs-meta-value">
                            {task.state || "National"}
                          </div>
                        </div>

                        <div className="vs-meta-block">
                          <div className="vs-meta-label">Due</div>
                          <div className="vs-meta-value">
                            {task.due_label || "Now"}
                          </div>
                        </div>

                        <div className="vs-meta-block">
                          <div className="vs-meta-label">Source</div>
                          <div className="vs-meta-value">
                            {isVendor
                              ? "Vendor Intelligence"
                              : "Command Center"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="vs-responsive-right">
                      <div className="vs-inline-actions">
                        <Badge tone={sourceMeta.tone}>
                          {sourceMeta.label}
                        </Badge>

                        <Badge tone={priorityTone(task.priority)}>
                          {task.priority || "medium"}
                        </Badge>

                        <Badge tone={statusTone(task.status)}>
                          {task.status || "open"}
                        </Badge>

                        {task.status !== "in_progress" && (
                          <button
                            type="button"
                            className="vs-button vs-button-secondary"
                            onClick={() =>
                              onStatusChange?.(task, "in_progress")
                            }
                          >
                            Start
                          </button>
                        )}

                        {task.status !== "complete" && (
                          <button
                            type="button"
                            className="vs-button"
                            onClick={() =>
                              onStatusChange?.(task, "complete")
                            }
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {complete.length ? (
              <details className="vs-card-muted">
                <summary style={{ cursor: "pointer", fontWeight: 800 }}>
                  Completed tasks ({complete.length})
                </summary>

                <div className="vs-stack" style={{ marginTop: 12 }}>
                  {complete.map((task) => {
                    const sourceMeta = getSourceMeta(task);

                    return (
                      <div
                        key={task.id || task.local_id}
                        className="vs-card-muted"
                      >
                        <div className="vs-row-title">{task.title}</div>
                        <div className="vs-row-subtitle">
                          Completed • {task.assigned_to || "Command Team"} •{" "}
                          {sourceMeta.label}
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
      `}</style>
    </section>
  );
}
