import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function tone(status) {
  const value = String(status || "").toLowerCase();

  if (["blocked", "critical", "failed"].includes(value)) return "danger";
  if (["review", "needs review"].includes(value)) return "demo";
  if (["ready", "launch ready"].includes(value)) return "active";

  return "accent";
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProductionHardeningCenter() {
  const [data, setData] = useState({
    summary: {},
    checks: [],
    blockers: [],
    review_items: [],
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

      const result = await api.productionHardening();

      setData({
        summary: result?.summary || {},
        checks: arr(result?.checks),
        blockers: arr(result?.blockers),
        review_items: arr(result?.review_items),
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
          "Failed to load Production Hardening Center."
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
  const checks = arr(data.checks);
  const blockers = arr(data.blockers);
  const reviewItems = arr(data.review_items);

  const grouped = useMemo(() => {
    return checks.reduce((acc, item) => {
      const key = item.category || "Other";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [checks]);

  return (
    <PageShell
      eyebrow="Launch Readiness"
      title="Production Hardening Center"
      description="Internal launch command center for authentication, permissions, billing, live data, environment variables, database readiness, workflows, alerts, and deployment blockers."
      tickerItems={[
        {
          label: "Readiness",
          value: `${summary.readiness_score || 0}%`,
          dotClass:
            summary.readiness_status === "Launch Ready"
              ? "vs-live-dot-success"
              : summary.readiness_status === "Blocked"
              ? "vs-live-dot"
              : "vs-live-dot-warning",
        },
        {
          label: "Ready",
          value: `${summary.ready || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Review",
          value: `${summary.review || 0}`,
          dotClass: summary.review ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Blocked",
          value: `${summary.blocked || 0}`,
          dotClass: summary.blocked ? "vs-live-dot" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .hardening-grid {
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(360px, .65fr);
          gap: 18px;
          align-items: start;
        }

        .hardening-stack {
          display: grid;
          gap: 14px;
        }

        .hardening-command {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .16), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .86));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.28);
        }

        .hardening-score {
          color: white;
          font-size: clamp(64px, 10vw, 116px);
          line-height: .92;
          font-weight: 950;
          letter-spacing: -.08em;
          margin-top: 16px;
        }

        .hardening-sub {
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.7;
          max-width: 780px;
          margin-top: 12px;
        }

        .hardening-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .hardening-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .hardening-row.ready {
          border-color: rgba(34, 197, 94, .28);
        }

        .hardening-row.review {
          border-color: rgba(251, 146, 60, .32);
        }

        .hardening-row.blocked {
          border-color: rgba(248, 113, 113, .38);
        }

        .hardening-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .hardening-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Readiness Score"
          value={`${summary.readiness_score || 0}%`}
          delta={summary.readiness_status || "Checking"}
          tone={summary.readiness_status === "Launch Ready" ? "up" : "neutral"}
        />
        <StatCard label="Ready" value={summary.ready || 0} delta="Passing checks" tone="up" />
        <StatCard label="Needs Review" value={summary.review || 0} delta="Warnings" tone="neutral" />
        <StatCard label="Blocked" value={summary.blocked || 0} delta="Launch blockers" tone={summary.blocked ? "down" : "up"} />
      </div>

      {loading ? (
        <EmptyState text="Loading production hardening status..." />
      ) : (
        <div className="hardening-grid">
          <div className="hardening-stack">
            <div className="hardening-command">
              <Badge tone={tone(summary.readiness_status)}>
                {summary.readiness_status || "Checking"}
              </Badge>

              <div className="hardening-score">{summary.readiness_score || 0}%</div>

              <div className="hardening-sub">
                Production readiness is based on environment variables, database checks, billing configuration, live data availability, workspace readiness, CRM/revenue workflows, alerting, and launch-critical platform records.
              </div>

              <div className="hardening-actions">
                <button className="vs-button" onClick={() => load({ quiet: true })}>
                  {refreshing ? "Refreshing..." : "Refresh Checks"}
                </button>
                <Link className="vs-button vs-button-secondary" to="/live-intelligence-layer">
                  Live Intelligence Layer
                </Link>
                <Link className="vs-button vs-button-secondary" to="/executive-workspace">
                  Executive Workspace
                </Link>
              </div>
            </div>

            {Object.entries(grouped).map(([category, rows]) => (
              <SectionCard
                key={category}
                title={category}
                subtitle={`Production checks for ${category.toLowerCase()}.`}
                right={<Badge tone="accent">{rows.length}</Badge>}
              >
                <div className="hardening-stack">
                  {rows.map((item) => (
                    <div key={item.key} className={`hardening-row ${item.status}`}>
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.detail}
                        meta={[
                          { label: "Status", value: titleCase(item.status) },
                          { label: "Category", value: item.category },
                          { label: "Action", value: item.action },
                          { label: "Route", value: item.route || "N/A" },
                        ]}
                        right={
                          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                            <Badge tone={tone(item.status)}>{titleCase(item.status)}</Badge>
                            {item.route ? (
                              <Link className="vs-button vs-button-secondary" to={item.route}>
                                Open
                              </Link>
                            ) : null}
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>

          <div className="hardening-stack">
            <SectionCard
              title="Launch Blockers"
              subtitle="These should be resolved before public launch."
              right={<Badge tone={blockers.length ? "danger" : "active"}>{blockers.length}</Badge>}
            >
              <div className="hardening-stack">
                {!blockers.length ? (
                  <EmptyState text="No launch blockers detected." />
                ) : (
                  blockers.map((item) => (
                    <div key={item.key} className="hardening-row blocked">
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.action}
                        meta={[
                          { label: "Detail", value: item.detail },
                          { label: "Category", value: item.category },
                          { label: "Status", value: titleCase(item.status) },
                          { label: "Route", value: item.route || "N/A" },
                        ]}
                        right={item.route ? <Link className="vs-button vs-button-secondary" to={item.route}>Open</Link> : null}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Needs Review"
              subtitle="Warnings that may not block launch but should be checked."
              right={<Badge tone={reviewItems.length ? "demo" : "active"}>{reviewItems.length}</Badge>}
            >
              <div className="hardening-stack">
                {!reviewItems.length ? (
                  <EmptyState text="No review warnings detected." />
                ) : (
                  reviewItems.map((item) => (
                    <div key={item.key} className="hardening-row review">
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.action}
                        meta={[
                          { label: "Detail", value: item.detail },
                          { label: "Category", value: item.category },
                          { label: "Status", value: titleCase(item.status) },
                          { label: "Route", value: item.route || "N/A" },
                        ]}
                        right={item.route ? <Link className="vs-button vs-button-secondary" to={item.route}>Open</Link> : null}
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
