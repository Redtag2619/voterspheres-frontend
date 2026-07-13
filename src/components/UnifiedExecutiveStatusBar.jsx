import { Link } from "react-router-dom";
import { useUnifiedExecutiveIntelligence } from "../context/UnifiedExecutiveIntelligenceContext";

function number(value = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : 0; 
}

function percent(value = 0) {
  return `${Math.round(number(value))}%`;
}

function ageLabel(value = 0) {
  if (!Number.isFinite(value)) return "Waiting for data";
  if (value < 60000) return "Updated moments ago";

  const minutes = Math.floor(value / 60000);

  if (minutes < 60) {
    return `Updated ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

function connectionLabel(state, refreshing, stale) {
  if (refreshing || state === "syncing") return "Synchronizing";
  if (state === "offline") return "Offline Cache";
  if (state === "degraded") return "Degraded";
  if (stale) return "Refresh Needed";
  return "Live";
}

function connectionClass(state, refreshing, stale) {
  if (refreshing || state === "syncing") return "is-syncing";
  if (state === "offline" || state === "degraded") return "is-danger";
  if (stale) return "is-warning";
  return "is-live";
}

export default function UnifiedExecutiveStatusBar() {
  const {
    health,
    summary,
    alerts,
    recommendations,
    sourceStatus,
    refreshing,
    connectionState,
    dataAgeMs,
    isStale,
    error,
    refresh,
  } = useUnifiedExecutiveIntelligence();

  const degradedSources = sourceStatus.filter(
    (source) => source.status === "degraded"
  ).length;

  const highPriorityRecommendations = recommendations.filter((item) =>
    ["critical", "high"].includes(
      String(item.priority || "").toLowerCase()
    )
  ).length;

  const stateClass = connectionClass(
    connectionState,
    refreshing,
    isStale
  );

  return (
    <div className={`uei-live-bar ${stateClass}`}>
      <style>{`
        .uei-live-bar {
          position: relative;
          z-index: 55;
          display: grid;
          grid-template-columns: auto repeat(5, minmax(120px, auto)) auto;
          gap: 10px;
          align-items: center;
          padding: 9px 22px;
          border-bottom: 1px solid rgba(148, 163, 184, .13);
          background:
            radial-gradient(circle at left, rgba(59,130,246,.14), transparent 28%),
            rgba(2, 6, 23, .92);
          color: rgba(226,232,240,.88);
          backdrop-filter: blur(16px);
        }

        .uei-live-state,
        .uei-live-metric,
        .uei-live-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .uei-live-state {
          min-width: 160px;
          color: white;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .uei-live-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 18px rgba(34,197,94,.7);
        }

        .uei-live-bar.is-syncing .uei-live-dot {
          background: #60a5fa;
          box-shadow: 0 0 18px rgba(96,165,250,.72);
          animation: uei-pulse 1.1s infinite;
        }

        .uei-live-bar.is-warning .uei-live-dot {
          background: #f59e0b;
          box-shadow: 0 0 18px rgba(245,158,11,.7);
        }

        .uei-live-bar.is-danger .uei-live-dot {
          background: #ef4444;
          box-shadow: 0 0 18px rgba(239,68,68,.7);
        }

        .uei-live-metric {
          min-width: 0;
          padding: 6px 10px;
          border: 1px solid rgba(148,163,184,.11);
          border-radius: 12px;
          background: rgba(15,23,42,.45);
        }

        .uei-live-metric span {
          color: rgba(148,163,184,.72);
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .07em;
        }

        .uei-live-metric strong {
          color: white;
          font-size: 11px;
          white-space: nowrap;
        }

        .uei-live-actions {
          justify-content: flex-end;
        }

        .uei-live-actions button,
        .uei-live-actions a {
          border: 1px solid rgba(148,163,184,.15);
          border-radius: 999px;
          background: rgba(15,23,42,.58);
          color: white;
          padding: 7px 10px;
          font-size: 10px;
          font-weight: 850;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .uei-live-actions button:hover,
        .uei-live-actions a:hover {
          border-color: rgba(251,146,60,.42);
          background: rgba(251,146,60,.14);
        }

        .uei-live-error {
          grid-column: 1 / -1;
          color: #fecaca;
          font-size: 10px;
        }

        @keyframes uei-pulse {
          50% { opacity: .35; transform: scale(.76); }
        }

        @media (max-width: 1250px) {
          .uei-live-bar {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .uei-live-state,
          .uei-live-actions {
            justify-content: center;
          }
        }

        @media (max-width: 720px) {
          .uei-live-bar {
            grid-template-columns: 1fr 1fr;
            padding: 9px 14px;
          }

          .uei-live-state,
          .uei-live-actions {
            grid-column: 1 / -1;
          }

          .uei-live-metric {
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="uei-live-state">
        <span className="uei-live-dot" />
        <span>
          {connectionLabel(
            connectionState,
            refreshing,
            isStale
          )}
        </span>
      </div>

      <div className="uei-live-metric">
        <span>Health</span>
        <strong>{percent(health.overall_score)}</strong>
      </div>

      <div className="uei-live-metric">
        <span>Readiness</span>
        <strong>{percent(health.readiness_score)}</strong>
      </div>

      <div className="uei-live-metric">
        <span>Alerts</span>
        <strong>{number(alerts.length)}</strong>
      </div>

      <div className="uei-live-metric">
        <span>Priority Actions</span>
        <strong>{highPriorityRecommendations}</strong>
      </div>

      <div className="uei-live-metric">
        <span>Sources</span>
        <strong>
          {Math.max(0, sourceStatus.length - degradedSources)}/
          {sourceStatus.length}
        </strong>
      </div>

      <div className="uei-live-metric">
        <span>Freshness</span>
        <strong>{ageLabel(dataAgeMs)}</strong>
      </div>

      <div className="uei-live-actions">
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? "Syncing..." : "Refresh"}
        </button>

        <Link to="/executive-intelligence">
          Open Intelligence
        </Link>
      </div>

      {error ? (
        <div className="uei-live-error">
          {error}
        </div>
      ) : null}
    </div>
  );
}

