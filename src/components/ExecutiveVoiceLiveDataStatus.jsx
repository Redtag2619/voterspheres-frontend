export default function ExecutiveVoiceLiveDataStatus({
  status = "idle",
  lastTool = null,
  error = "",
}) {
  const labels = {
    idle: "Live Data Standby",
    registering: "Connecting Live Data",
    ready: "Live Data Ready",
    "tool-running": "Retrieving Live Data",
    degraded: "Live Data Degraded",
    error: "Live Data Unavailable",
  };

  return (
    <div className={`ev-live-data-status is-${status}`}>
      <style>{`
        .ev-live-data-status {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 12px;
          border: 1px solid rgba(148,163,184,.15);
          border-radius: 14px;
          background: rgba(15,23,42,.56);
          color: rgba(226,232,240,.86);
          font-size: 11px;
          font-weight: 800;
        }

        .ev-live-data-status::before {
          content: "";
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #94a3b8;
          box-shadow: 0 0 14px rgba(148,163,184,.45);
        }

        .ev-live-data-status.is-ready::before {
          background: #22c55e;
          box-shadow: 0 0 16px rgba(34,197,94,.68);
        }

        .ev-live-data-status.is-registering::before,
        .ev-live-data-status.is-tool-running::before {
          background: #60a5fa;
          box-shadow: 0 0 16px rgba(96,165,250,.7);
          animation: ev-live-pulse 1s infinite;
        }

        .ev-live-data-status.is-degraded::before,
        .ev-live-data-status.is-error::before {
          background: #ef4444;
          box-shadow: 0 0 16px rgba(239,68,68,.7);
        }

        .ev-live-data-status small {
          color: rgba(148,163,184,.72);
          font-size: 9px;
          font-weight: 700;
        }

        @keyframes ev-live-pulse {
          50% {
            opacity: .35;
            transform: scale(.75);
          }
        }
      `}</style>

      <span>{labels[status] || labels.idle}</span>

      {lastTool?.name ? (
        <small>
          {lastTool.status === "running" ? "Using " : "Last used "}
          {lastTool.name.replaceAll("_", " ")}
        </small>
      ) : null}

      {error ? <small>{error}</small> : null}
    </div>
  );
}
