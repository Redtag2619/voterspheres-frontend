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

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["fail", "failing", "blocked"].includes(v)) return "danger";
  if (["review", "needs review"].includes(v)) return "demo";
  if (["pass", "launch ready", "ready"].includes(v)) return "active";
  return "accent";
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function LaunchQACenter() {
  const [data, setData] = useState({
    summary: {},
    checks: [],
    failures: [],
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

      const result = await api.launchQa();

      setData({
        summary: result?.summary || {},
        checks: arr(result?.checks),
        failures: arr(result?.failures),
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
          "Failed to load Launch QA Center."
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
  const failures = arr(data.failures);
  const reviewItems = arr(data.review_items);

  const grouped = useMemo(() => {
    return checks.reduce((acc, item) => {
      const key = item.area || "Other";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [checks]);

  return (
    <PageShell
      eyebrow="Launch QA"
      title="Launch QA & Smoke Test Center"
      description="Internal launch checklist for backend health, frontend routes, auth, billing, live data, Executive Workspace, Opportunity Engine, KPI Layer, notifications, reports, CRM, and production readiness."
      tickerItems={[
        {
          label: "QA Score",
          value: `${summary.score || 0}%`,
          dotClass:
            summary.status === "Launch Ready"
              ? "vs-live-dot-success"
              : summary.status === "Failing"
              ? "vs-live-dot"
              : "vs-live-dot-warning",
        },
        { label: "Pass", value: `${summary.pass || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Review", value: `${summary.review || 0}`, dotClass: "vs-live-dot-warning" },
        { label: "Fail", value: `${summary.fail || 0}`, dotClass: summary.fail ? "vs-live-dot" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .qa-grid {
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(360px, .65fr);
          gap: 18px;
          align-items: start;
        }

        .qa-stack {
          display: grid;
          gap: 14px;
        }

        .qa-command {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .16), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .86));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.28);
        }

        .qa-score {
          color: white;
          font-size: clamp(64px, 10vw, 116px);
          line-height: .92;
          font-weight: 950;
          letter-spacing: -.08em;
          margin-top: 16px;
        }

        .qa-sub {
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.7;
          max-width: 780px;
          margin-top: 12px;
        }

        .qa-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .qa-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .qa-row.pass {
          border-color: rgba(34, 197, 94, .28);
        }

        .qa-row.review {
          border-color: rgba(251, 146, 60, .32);
        }

        .qa-row.fail {
          border-color: rgba(248, 113, 113, .38);
        }

        .qa-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .qa-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="QA Score"
          value={`${summary.score || 0}%`}
          delta={summary.status || "Checking"}
          tone={summary.status === "Launch Ready" ? "up" : "neutral"}
        />
        <StatCard label="Passing" value={summary.pass || 0} delta="Smoke tests passed" tone="up" />
        <StatCard label="Needs Review" value={summary.review || 0} delta="Warnings" tone="neutral" />
        <StatCard label="Failing" value={summary.fail || 0} delta="Launch blockers" tone={summary.fail ? "down" : "up"} />
      </div>

      {loading ? (
        <EmptyState text="Running launch QA checks..." />
      ) : (
        <div className="qa-grid">
          <div className="qa-stack">
            <div className="qa-command">
              <Badge tone={tone(summary.status)}>
                {summary.status || "Checking"}
              </Badge>

              <div className="qa-score">{summary.score || 0}%</div>

              <div className="qa-sub">
                This page performs launch smoke checks against the operating system: backend, database, auth context, billing configuration, live data records, workspace workflow, CRM, Opportunity Engine dependencies, reports, alerts, and core launch modules.
              </div>

              <div className="qa-actions">
                <button className="vs-button" onClick={() => load({ quiet: true })}>
                  {refreshing ? "Running..." : "Run QA Checks"}
                </button>
                <Link className="vs-button vs-button-secondary" to="/production-hardening">
                  Production Hardening
                </Link>
                <Link className="vs-button vs-button-secondary" to="/live-intelligence-layer">
                  Live Intelligence
                </Link>
              </div>
            </div>

            {Object.entries(grouped).map(([area, rows]) => (
              <SectionCard
                key={area}
                title={area}
                subtitle={`Smoke tests for ${area.toLowerCase()}.`}
                right={<Badge tone="accent">{rows.length}</Badge>}
              >
                <div className="qa-stack">
                  {rows.map((item) => (
                    <div key={item.key} className={`qa-row ${item.status}`}>
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.detail}
                        meta={[
                          { label: "Status", value: titleCase(item.status) },
                          { label: "Area", value: item.area },
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

          <div className="qa-stack">
            <SectionCard
              title="Failing Checks"
              subtitle="Resolve these before launch."
              right={<Badge tone={failures.length ? "danger" : "active"}>{failures.length}</Badge>}
            >
              <div className="qa-stack">
                {!failures.length ? (
                  <EmptyState text="No failing launch checks detected." />
                ) : (
                  failures.map((item) => (
                    <div key={item.key} className="qa-row fail">
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.action}
                        meta={[
                          { label: "Detail", value: item.detail },
                          { label: "Area", value: item.area },
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
              subtitle="Warnings that should be checked before launch."
              right={<Badge tone={reviewItems.length ? "demo" : "active"}>{reviewItems.length}</Badge>}
            >
              <div className="qa-stack">
                {!reviewItems.length ? (
                  <EmptyState text="No review warnings detected." />
                ) : (
                  reviewItems.map((item) => (
                    <div key={item.key} className="qa-row review">
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.action}
                        meta={[
                          { label: "Detail", value: item.detail },
                          { label: "Area", value: item.area },
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
