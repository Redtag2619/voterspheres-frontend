import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function riskClass(value) {
  const n = Number(value || 0);
  if (n >= 70) return "danger";
  if (n >= 40) return "warning";
  return "success";
}

export default function ExecutiveKpiRibbon() {
  const [data, setData] = useState({
    active_workspaces: 0,
    national_risk: 0,
    open_tasks: 0,
    urgent_tasks: 0,
    critical_alerts: 0,
    critical_signals: 0,
    clients_at_risk: 0,
    monthly_retainer: 0,
    live_readiness: 0,
    status: "Stable",
  });

  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const result = await api.executiveKpis();
      setData(result?.summary || {});
    } catch (err) {
      setError("KPI offline");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const risk = riskClass(data.national_risk);
  const readiness = riskClass(100 - Number(data.live_readiness || 0));

  return (
    <div className="exec-kpi-ribbon">
      <style>{`
        .exec-kpi-ribbon {
          position: relative;
          z-index: 55;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 1px;
          border-top: 1px solid rgba(148, 163, 184, .12);
          border-bottom: 1px solid rgba(148, 163, 184, .12);
          background: rgba(2, 6, 23, .92);
        }

        .exec-kpi-item {
          text-decoration: none;
          color: inherit;
          padding: 10px 14px;
          background: rgba(15, 23, 42, .62);
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .exec-kpi-item:hover {
          background: rgba(251, 146, 60, .12);
        }

        .exec-kpi-label {
          color: rgba(148, 163, 184, .82);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .11em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .exec-kpi-value {
          color: #f8fafc;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .exec-kpi-sub {
          color: rgba(203, 213, 225, .62);
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .exec-kpi-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          margin-right: 6px;
        }

        .exec-kpi-dot.success {
          background: #22c55e;
          box-shadow: 0 0 14px rgba(34, 197, 94, .55);
        }

        .exec-kpi-dot.warning {
          background: #fb923c;
          box-shadow: 0 0 14px rgba(251, 146, 60, .55);
        }

        .exec-kpi-dot.danger {
          background: #ef4444;
          box-shadow: 0 0 14px rgba(239, 68, 68, .55);
        }

        .exec-kpi-offline {
          color: #fca5a5;
        }

        @media (max-width: 1180px) {
          .exec-kpi-ribbon {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .exec-kpi-ribbon {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .exec-kpi-item {
            padding: 9px 10px;
          }

          .exec-kpi-value {
            font-size: 15px;
          }
        }
      `}</style>

      <Link className="exec-kpi-item" to="/executive-workspace">
        <span className="exec-kpi-label">Active Workspaces</span>
        <span className="exec-kpi-value">{data.active_workspaces || 0}</span>
        <span className="exec-kpi-sub">Campaign hubs online</span>
      </Link>

      <Link className="exec-kpi-item" to="/national-command">
        <span className="exec-kpi-label">National Risk</span>
        <span className="exec-kpi-value">
          <span className={`exec-kpi-dot ${risk}`} />
          {data.national_risk || 0}%
        </span>
        <span className="exec-kpi-sub">{data.status || "Stable"}</span>
      </Link>

      <Link className="exec-kpi-item" to="/command-center">
        <span className="exec-kpi-label">Open Tasks</span>
        <span className="exec-kpi-value">{data.open_tasks || 0}</span>
        <span className="exec-kpi-sub">{data.urgent_tasks || 0} urgent</span>
      </Link>

      <Link className="exec-kpi-item" to="/notifications">
        <span className="exec-kpi-label">Critical Alerts</span>
        <span className="exec-kpi-value">{data.critical_alerts || 0}</span>
        <span className="exec-kpi-sub">{data.critical_signals || 0} signals</span>
      </Link>

      <Link className="exec-kpi-item" to="/revenue-intelligence">
        <span className="exec-kpi-label">Revenue Watch</span>
        <span className="exec-kpi-value">{money(data.monthly_retainer)}</span>
        <span className="exec-kpi-sub">{data.clients_at_risk || 0} clients at risk</span>
      </Link>

      <Link className="exec-kpi-item" to="/live-intelligence-layer">
        <span className="exec-kpi-label">Live Readiness</span>
        <span className="exec-kpi-value">
          <span className={`exec-kpi-dot ${readiness}`} />
          {data.live_readiness || 0}%
        </span>
        <span className={`exec-kpi-sub ${error ? "exec-kpi-offline" : ""}`}>
          {error || "Feeds monitored"}
        </span>
      </Link>
    </div>
  );
}
