import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function pct(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function riskTone(value) {
  const risk = String(value || "").toLowerCase();
  if (risk === "critical" || risk === "high") return "danger";
  if (risk === "elevated") return "demo";
  if (risk === "stable" || risk === "active") return "active";
  return "default";
}

function riskClass(value) {
  const risk = String(value || "").toLowerCase();
  if (risk === "critical") return "xw-critical";
  if (risk === "high") return "xw-high";
  if (risk === "elevated") return "xw-elevated";
  return "xw-stable";
}

function getRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.workspaces)) return payload.workspaces;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function WorkspaceRow({ item }) {
  return (
    <div className={`xw-row ${riskClass(item.risk)}`}>
      <ResponsiveRow
        title={item.name || "Campaign Workspace"}
        subtitle={`${item.state || "National"} • ${item.office || "Statewide"} • ${item.cycle || "2026"}`}
        meta={[
          { label: "Pressure", value: pct(item.pressure_score || 0) },
          { label: "Open", value: fmt(item.open_task_count || 0) },
          { label: "High", value: fmt(item.high_priority_task_count || 0) },
          { label: "County Esc.", value: fmt(item.active_county_escalation_count || 0) },
          { label: "Complete", value: pct(item.completion_rate || 0) },
        ]}
        right={
          <div className="xw-actions">
            <Badge tone={riskTone(item.risk)}>{item.risk || "Stable"}</Badge>
            <Link className="vs-button vs-button-secondary" to={`/campaign-workspace/${item.id}`}>
              Open
            </Link>
          </div>
        }
      />
    </div>
  );
}

export default function CrossWorkspaceExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result =
        typeof api.crossWorkspaceExecutiveOverview === "function"
          ? await api.crossWorkspaceExecutiveOverview()
          : await api.workspaces();

      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load cross-workspace executive dashboard."
      );

      setData({
        summary: {},
        workspaces: [],
        urgent_workspaces: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load({ quiet: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [load]);

  const rawRows = getRows(data);

  const workspaces = useMemo(() => {
    return rawRows
      .map((item) => {
        const totalTasks = Number(item.task_count || item.total_tasks || 0);
        const openTasks = Number(item.open_task_count || item.open_tasks || 0);
        const completedTasks = Number(item.complete_task_count || item.completed_task_count || item.completed_tasks || 0);
        const highPriority = Number(item.high_priority_task_count || item.high_priority_tasks || 0);
        const activeCounty = Number(item.active_county_escalation_count || item.active_county_escalations || 0);

        const completionRate =
          item.completion_rate !== undefined
            ? Number(item.completion_rate || 0)
            : totalTasks
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;

        const pressureScore =
          item.pressure_score !== undefined
            ? Number(item.pressure_score || 0)
            : Math.min(100, Math.round(openTasks * 6 + highPriority * 9 + activeCounty * 14));

        const risk =
          item.risk ||
          (pressureScore >= 82
            ? "Critical"
            : pressureScore >= 65
              ? "High"
              : pressureScore >= 42
                ? "Elevated"
                : "Stable");

        return {
          ...item,
          task_count: totalTasks,
          open_task_count: openTasks,
          completed_task_count: completedTasks,
          high_priority_task_count: highPriority,
          active_county_escalation_count: activeCounty,
          completion_rate: completionRate,
          pressure_score: pressureScore,
          risk,
        };
      })
      .sort((a, b) => Number(b.pressure_score || 0) - Number(a.pressure_score || 0));
  }, [rawRows]);

  const fallbackSummary = useMemo(() => {
    const totalTasks = workspaces.reduce((sum, item) => sum + Number(item.task_count || 0), 0);
    const openTasks = workspaces.reduce((sum, item) => sum + Number(item.open_task_count || 0), 0);
    const completedTasks = workspaces.reduce((sum, item) => sum + Number(item.completed_task_count || 0), 0);
    const highRisk = workspaces.filter((item) => ["Critical", "High"].includes(item.risk)).length;
    const critical = workspaces.filter((item) => item.risk === "Critical").length;

    return {
      total_workspaces: workspaces.length,
      active_workspaces: workspaces.filter((item) => String(item.status || "active").toLowerCase() === "active").length,
      critical_workspaces: critical,
      high_risk_workspaces: highRisk,
      total_tasks: totalTasks,
      open_tasks: openTasks,
      completed_tasks: completedTasks,
      blocked_tasks: workspaces.reduce((sum, item) => sum + Number(item.blocked_task_count || 0), 0),
      national_pressure_score: workspaces.length
        ? Math.round(workspaces.reduce((sum, item) => sum + Number(item.pressure_score || 0), 0) / workspaces.length)
        : 0,
    };
  }, [workspaces]);

  const summary = {
    ...fallbackSummary,
    ...(data?.summary || {}),
  };

  const urgent = useMemo(() => {
    const rows =
      Array.isArray(data?.urgent_workspaces) && data.urgent_workspaces.length
        ? data.urgent_workspaces
        : workspaces.filter((item) => ["Critical", "High"].includes(item.risk));

    return rows.slice(0, 10);
  }, [data, workspaces]);

  const stableCount = workspaces.filter((item) => item.risk === "Stable").length;

  return (
    <PageShell
      eyebrow="Executive Intelligence"
      title="Cross-Workspace Executive Dashboard"
      description="National command view across every campaign workspace, showing pressure, task load, county escalations, and execution risk."
      tickerItems={[
        {
          label: "National Pressure",
          value: pct(summary.national_pressure_score || 0),
          dotClass: Number(summary.national_pressure_score || 0) >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Workspaces",
          value: `${summary.total_workspaces || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "High Risk",
          value: `${summary.high_risk_workspaces || 0}`,
          dotClass: summary.high_risk_workspaces ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .xw-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .xw-stack {
          display: grid;
          gap: 14px;
        }

        .xw-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .xw-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .xw-critical,
        .xw-high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .xw-elevated {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .xw-stable {
          border-color: rgba(34, 197, 94, 0.22);
        }

        .xw-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .xw-pressure-card {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 36%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
          padding: 22px;
        }

        .xw-pressure-score {
          color: white;
          font-size: 58px;
          font-weight: 950;
          letter-spacing: -0.07em;
          line-height: 1;
        }

        .xw-pressure-label {
          margin-top: 8px;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
        }

        .xw-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .xw-mini-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .xw-mini-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
        }

        .xw-mini-grid b {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
        }

        @media (max-width: 1100px) {
          .xw-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="National Pressure"
          value={pct(summary.national_pressure_score || 0)}
          delta="Average workspace risk"
          tone={Number(summary.national_pressure_score || 0) >= 65 ? "down" : "up"}
        />
        <StatCard
          label="Total Workspaces"
          value={fmt(summary.total_workspaces)}
          delta={`${fmt(summary.active_workspaces)} active`}
          tone="up"
        />
        <StatCard
          label="High Risk"
          value={fmt(summary.high_risk_workspaces)}
          delta={`${fmt(summary.critical_workspaces)} critical`}
          tone={summary.high_risk_workspaces ? "down" : "up"}
        />
        <StatCard
          label="Open Tasks"
          value={fmt(summary.open_tasks)}
          delta={`${fmt(summary.completed_tasks)} complete`}
          tone={summary.open_tasks ? "neutral" : "up"}
        />
      </div>

      {loading ? (
        <EmptyState text="Loading cross-workspace intelligence..." />
      ) : (
        <div className="xw-grid">
          <div className="xw-stack">
            <SectionCard
              title="Workspace Risk Rankings"
              subtitle="All campaign workspaces ranked by executive pressure."
              right={<Badge tone="accent">{workspaces.length} workspaces</Badge>}
            >
              <div className="xw-stack">
                {!workspaces.length ? (
                  <EmptyState text="No workspaces available yet." />
                ) : (
                  workspaces.map((item) => <WorkspaceRow key={item.id} item={item} />)
                )}
              </div>
            </SectionCard>
          </div>

          <div className="xw-stack">
            <div className="xw-pressure-card">
              <div className="xw-pressure-score">{pct(summary.national_pressure_score || 0)}</div>
              <div className="xw-pressure-label">
                Cross-workspace operational pressure score.
              </div>

              <div className="xw-mini-grid">
                <div><span>Critical</span><b>{fmt(summary.critical_workspaces)}</b></div>
                <div><span>Stable</span><b>{fmt(stableCount)}</b></div>
                <div><span>Blocked Tasks</span><b>{fmt(summary.blocked_tasks)}</b></div>
                <div><span>Total Tasks</span><b>{fmt(summary.total_tasks)}</b></div>
              </div>
            </div>

            <SectionCard
              title="Urgent Workspaces"
              subtitle="Campaigns that need executive review first."
              right={<Badge tone={urgent.length ? "danger" : "active"}>{urgent.length} urgent</Badge>}
            >
              <div className="xw-stack">
                {!urgent.length ? (
                  <EmptyState text="No urgent workspace pressure detected." />
                ) : (
                  urgent.map((item) => <WorkspaceRow key={item.id} item={item} />)
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
