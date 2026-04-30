import { useMemo, useState } from "react";
import Badge from "../ui/Badge";

const LANES = [
  { id: "open", title: "Open" },
  { id: "in_progress", title: "In Progress" },
  { id: "blocked", title: "Blocked" },
  { id: "complete", title: "Complete" }
];

function normalizeStatus(status) {
  const v = String(status || "").toLowerCase();
  if (["complete", "done"].includes(v)) return "complete";
  if (["in_progress", "in progress"].includes(v)) return "in_progress";
  if (["blocked"].includes(v)) return "blocked";
  return "open";
}

function TaskCard({ task, onStatusChange }) {
  return (
    <div className="vs-task-card">
      <div className="vs-task-card-head">
        <div className="vs-task-card-title">{task.title}</div>
      </div>

      <div className="vs-task-card-subtitle">
        {task.description || "Execution task"}
      </div>

      <div className="vs-task-meta">
        <div>{task.assigned_to || "Command Team"}</div>
        <div>{task.state || "National"}</div>
      </div>

      <div className="vs-task-actions">
        <button onClick={() => onStatusChange(task, "in_progress")}>
          Start
        </button>
        <button onClick={() => onStatusChange(task, "complete")}>
          Complete
        </button>
      </div>
    </div>
  );
}

export default function ExecutionBoard({ tasks = [], onStatusChange }) {
  const [dragging, setDragging] = useState(null);

  const grouped = useMemo(() => {
    const map = {
      open: [],
      in_progress: [],
      blocked: [],
      complete: []
    };

    tasks.forEach((t) => {
      map[normalizeStatus(t.status)].push(t);
    });

    return map;
  }, [tasks]);

  function onDrop(e, lane) {
    e.preventDefault();
    const id = e.dataTransfer.getData("id");
    const task = tasks.find((t) => String(t.id) === id);
    if (task) onStatusChange(task, lane);
    setDragging(null);
  }

  return (
    <div className="vs-board">
      {LANES.map((lane) => (
        <div
          key={lane.id}
          className="vs-lane"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, lane.id)}
        >
          <div className="vs-lane-header">
            {lane.title}
            <Badge>{grouped[lane.id].length}</Badge>
          </div>

          <div className="vs-lane-stack">
            {grouped[lane.id].map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("id", task.id);
                  setDragging(task.id);
                }}
              >
                <TaskCard
                  task={task}
                  onStatusChange={onStatusChange}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <style>{`
        .vs-board {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          align-items: stretch;
        }

        .vs-lane {
          display: flex;
          flex-direction: column;
          background: rgba(15,23,42,0.5);
          border-radius: 16px;
          padding: 12px;
          min-height: 300px;
        }

        .vs-lane-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: 800;
        }

        .vs-lane-stack {
          display: grid;
          gap: 10px;
        }

        /* ✅ UNIFORM CARDS */
        .vs-task-card {
          height: 220px;
          min-height: 220px;
          max-height: 220px;
          display: flex;
          flex-direction: column;
          padding: 12px;
          border-radius: 12px;
          background: rgba(15,23,42,0.9);
          border: 1px solid rgba(148,163,184,0.2);
        }

        /* ✅ TITLE CLAMP */
        .vs-task-card-title {
          font-weight: 800;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ✅ DESCRIPTION CLAMP */
        .vs-task-card-subtitle {
          margin-top: 6px;
          font-size: 0.85rem;
          color: rgba(203,213,225,0.8);

          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .vs-task-meta {
          margin-top: 10px;
          font-size: 0.75rem;
          color: rgba(148,163,184,0.8);
        }

        /* ✅ PUSH ACTIONS TO BOTTOM */
        .vs-task-actions {
          margin-top: auto;
          display: flex;
          gap: 6px;
        }

        button {
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(59,130,246,0.6);
          color: white;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
