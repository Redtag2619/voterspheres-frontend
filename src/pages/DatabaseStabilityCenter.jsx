import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function tone(value) {
  const v = String(value || "").toLowerCase();

  if (["blocked", "failed", "critical", "unstable"].includes(v)) return "danger";
  if (["review", "needs review", "slow", "empty"].includes(v)) return "demo";
  if (["healthy", "stable"].includes(v)) return "active";

  return "accent";
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DatabaseStabilityCenter() {
  const [data, setData] = useState({
    summary: {},
    ping: {},
    tables: [],
    env: [],
    blockers: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.databaseStability();

      setData({
        summary: result?.summary || {},
        ping: result?.ping || {},
        tables: arr(result?.tables),
        env: arr(result?.env),
        blockers: arr(result?.blockers),
      });

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Database Stability Center."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data.summary || {};
  const tables = arr(data.tables);
  const env = arr(data.env);
  const blockers = arr(data.blockers);

  const groupedTables = useMemo(() => {
    return {
      healthy: tables.filter((item) => item.status === "healthy"),
      review: tables.filter((item) => ["review", "empty"].includes(item.status)),
      failed: tables.filter((item) => item.status === "failed"),
    };
  }, [tables]);

  return (
    <PageShell
      eyebrow="Infrastructure Readiness"
      title="Database Stability Center"
      description="Monitor Postgres connectivity, query latency, pool pressure, launch-critical data tables, environment configuration, and database blockers before launch."
      tickerItems={[
        {
          label: "Status",
          value: summary.status || "Checking",
          dotClass:
            summary.status === "Stable"
              ? "vs-live-dot-success"
              : summary.status === "Blocked"
              ? "vs-live-dot"
              : "vs-live-dot-warning",
        },
        {
          label: "Latency",
          value: `${summary.average_latency_ms || 0}ms`,
          dotClass:
            summary.average_latency_ms <= 250
              ? "vs-live-dot-success"
              : summary.average_latency_ms <= 1000
              ? "vs-live-dot-warning"
              : "vs-live-dot",
        },
        {
          label: "Failed Tables",
          value: `${summary.failed_tables || 0}`,
          dotClass: summary.failed_tables ? "vs-live-dot" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Refreshing" : lastUpdated || "Ready",
          dotClass: "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .db-grid {
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(360px, .65fr);
          gap: 18px;
          align-items: start;
        }

        .db-stack {
          display: grid;
          gap: 14px;
        }

        .db-command {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 26px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .db-score {
          margin-top: 18px;
          color: white;
          font-size: clamp(58px, 10vw, 112px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .db-sub {
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.7;
          max-width: 780px;
          margin-top: 12px;
        }

        .db-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .db-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .db-row.healthy {
          border-color: rgba(34, 197, 94, .28);
        }

        .db-row.review,
        .db-row.empty {
          border-color: rgba(251, 146, 60, .34);
        }

        .db-row.failed {
          border-color: rgba(248, 113, 113, .4);
        }

        .db-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .db-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Database Score"
          value={`${summary.readiness_score || 0}%`}
          delta={summary.status || "Checking"}
          tone={summary.status === "Stable" ? "up" : "neutral"}
        />
        <StatCard
          label="Average Latency"
          value={`${summary.average_latency_ms || 0}ms`}
          delta="Query response"
          tone={summary.average_latency_ms <= 250 ? "up" : "neutral"}
        />
        <StatCard
          label="Pool Waiting"
          value={summary.pool_waiting || 0}
          delta={`Total ${summary.pool_total || 0} / Idle ${summary.pool_idle || 0}`}
          tone={summary.pool_waiting ? "down" : "up"}
        />
        <StatCard
          label="Blockers"
          value={blockers.length}
          delta="Database launch risks"
          tone={blockers.length ? "down" : "up"}
        />
      </div>

      {loading ? (
        <EmptyState text="Checking database stability..." />
      ) : (
        <div className="db-grid">
          <div className="db-stack">
            <div className="db-command">
              <Badge tone={tone(summary.status)}>
                {summary.status || "Checking"}
              </Badge>

              <div className="db-score">{summary.readiness_score || 0}%</div>

              <div className="db-sub">
                Database stability is based on connection health, query latency, Postgres pool pressure, critical table availability, record counts, and environment configuration.
              </div>

              <div className="db-actions">
                <button className="vs-button" onClick={() => load({ quiet: true })}>
                  {refreshing ? "Refreshing..." : "Refresh Database Checks"}
                </button>
              </div>
            </div>

            <SectionCard
              title="Critical Tables"
              subtitle="Launch-critical tables and record availability."
              right={<Badge tone="accent">{tables.length}</Badge>}
            >
              <div className="db-stack">
                {tables.map((item) => (
                  <div key={item.table} className={`db-row ${item.status}`}>
                    <ResponsiveRow
                      title={item.table}
                      subtitle={item.error || `${item.count} records found.`}
                      meta={[
                        { label: "Status", value: titleCase(item.status) },
                        { label: "Count", value: item.count },
                        { label: "Latency", value: `${item.latency_ms || 0}ms` },
                        { label: "Launch", value: item.status === "healthy" ? "Ready" : "Review" },
                      ]}
                      right={<Badge tone={tone(item.status)}>{titleCase(item.status)}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="db-stack">
            <SectionCard
              title="Connection"
              subtitle="Current database ping and version."
              right={<Badge tone={data.ping?.ok ? "active" : "danger"}>{data.ping?.ok ? "Online" : "Offline"}</Badge>}
            >
              <div className="db-stack">
                <div className={`db-row ${data.ping?.ok ? "healthy" : "failed"}`}>
                  <ResponsiveRow
                    title="Postgres Ping"
                    subtitle={data.ping?.error || "Database responded successfully."}
                    meta={[
                      { label: "Latency", value: `${data.ping?.latency_ms || 0}ms` },
                      { label: "Server Time", value: data.ping?.server_time || "N/A" },
                      { label: "Status", value: data.ping?.ok ? "Healthy" : "Failed" },
                      { label: "Version", value: data.ping?.version ? "Available" : "N/A" },
                    ]}
                    right={<Badge tone={data.ping?.ok ? "active" : "danger"}>{data.ping?.ok ? "Healthy" : "Failed"}</Badge>}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Environment"
              subtitle="Environment and pool configuration."
              right={<Badge tone="accent">{env.length}</Badge>}
            >
              <div className="db-stack">
                {env.map((item) => (
                  <div key={item.key} className={`db-row ${item.status}`}>
                    <ResponsiveRow
                      title={item.label}
                      subtitle={item.detail}
                      meta={[
                        { label: "Status", value: titleCase(item.status) },
                        { label: "Key", value: item.key },
                        { label: "Launch", value: item.status === "healthy" ? "Ready" : "Review" },
                        { label: "Area", value: "Infrastructure" },
                      ]}
                      right={<Badge tone={tone(item.status)}>{titleCase(item.status)}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Database Blockers"
              subtitle="Issues that can reduce Launch Readiness."
              right={<Badge tone={blockers.length ? "danger" : "active"}>{blockers.length}</Badge>}
            >
              <div className="db-stack">
                {!blockers.length ? (
                  <EmptyState text="No database blockers detected." />
                ) : (
                  blockers.map((item) => (
                    <div key={item.title} className="db-row failed">
                      <ResponsiveRow
                        title={item.title}
                        subtitle={item.detail}
                        meta={[
                          { label: "Priority", value: item.priority },
                          { label: "Action", value: item.action },
                          { label: "Launch", value: "Resolve" },
                          { label: "Area", value: "Database" },
                        ]}
                        right={<Badge tone="danger">{item.priority}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
