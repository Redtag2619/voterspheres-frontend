import { useCallback, useEffect, useState } from "react";
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

  if (["blocked", "critical", "missing", "failed", "missing_table"].includes(v)) {
    return "danger";
  }

  if (["needs review", "stale", "low_count", "no_timestamp", "review"].includes(v)) {
    return "demo";
  }

  if (["healthy", "active", "ready"].includes(v)) {
    return "active";
  }

  return "accent";
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value) {
  if (!value) return "N/A";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "N/A";
  }
}

export default function LiveDataRefreshCenter() {
  const [data, setData] = useState({
    summary: {},
    feeds: [],
    blockers: [],
    review_items: [],
    last_run: null,
  });

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.liveDataRefresh();

      setData({
        summary: result?.summary || {},
        feeds: arr(result?.feeds),
        blockers: arr(result?.blockers),
        review_items: arr(result?.review_items),
        last_run: result?.last_run || null,
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
          "Failed to load Live Data Refresh Center."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runRefresh() {
    const ok = window.confirm(
      "Run full live data refresh? This will touch updated_at timestamps on launch-critical records where possible."
    );

    if (!ok) return;

    try {
      setRunning(true);
      setError("");
      setMessage("");

      const result = await api.runLiveDataRefresh();
      setMessage(result?.message || "Live data refresh completed.");

      setData({
        summary: result?.summary || {},
        feeds: arr(result?.feeds),
        blockers: arr(result?.blockers),
        review_items: arr(result?.review_items),
        last_run: data.last_run,
      });

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to run live data refresh."
      );
    } finally {
      setRunning(false);
    }
  }

  const summary = data.summary || {};
  const feeds = arr(data.feeds);
  const blockers = arr(data.blockers);
  const reviewItems = arr(data.review_items);

  return (
    <PageShell
      eyebrow="Live Feed Operations"
      title="Live Data Refresh Center"
      description="Refresh and inspect launch-critical feeds powering Live Intelligence, Executive KPI Layer, Launch Readiness, Executive Workspace, QA, CRM, reports, vendors, notifications, and revenue workflow."
      tickerItems={[
        {
          label: "Readiness",
          value: `${summary.readiness_score || 0}%`,
          dotClass:
            summary.readiness_score >= 80
              ? "vs-live-dot-success"
              : summary.readiness_score >= 50
              ? "vs-live-dot-warning"
              : "vs-live-dot",
        },
        {
          label: "Healthy",
          value: `${summary.healthy || 0}/${summary.total || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Blocked",
          value: `${summary.blocked || 0}`,
          dotClass: summary.blocked ? "vs-live-dot" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: lastUpdated || "Ready",
          dotClass: "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .refresh-grid {
          display: grid;
          grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr);
          gap: 18px;
          align-items: start;
        }

        .refresh-stack {
          display: grid;
          gap: 14px;
        }

        .refresh-command {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .refresh-score {
          margin-top: 14px;
          color: white;
          font-size: clamp(54px, 8vw, 96px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .refresh-title {
          margin: 12px 0 0;
          color: white;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.05em;
          line-height: 1.05;
        }

        .refresh-sub {
          margin-top: 10px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.65;
        }

        .refresh-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .refresh-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .refresh-row.healthy {
          border-color: rgba(34, 197, 94, .28);
        }

        .refresh-row.stale,
        .refresh-row.low_count,
        .refresh-row.no_timestamp {
          border-color: rgba(251, 146, 60, .32);
        }

        .refresh-row.missing,
        .refresh-row.critical,
        .refresh-row.failed,
        .refresh-row.missing_table {
          border-color: rgba(248, 113, 113, .4);
        }

        .refresh-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .refresh-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-banner-demo">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Refresh Readiness"
          value={`${summary.readiness_score || 0}%`}
          delta={summary.status || "Checking"}
          tone={summary.readiness_score >= 80 ? "up" : "neutral"}
        />
        <StatCard label="Healthy Feeds" value={`${summary.healthy || 0}/${summary.total || 0}`} delta="Launch-critical feeds" tone="up" />
        <StatCard label="Review" value={summary.review || 0} delta="Low/stale/timestamp" tone={summary.review ? "neutral" : "up"} />
        <StatCard label="Blocked" value={summary.blocked || 0} delta="Missing/critical/failed" tone={summary.blocked ? "down" : "up"} />
      </div>

      {loading ? (
        <EmptyState text="Loading live data refresh status..." />
      ) : (
        <div className="refresh-grid">
          <div className="refresh-stack">
            <div className="refresh-command">
              <Badge tone={tone(summary.status)}>
                {summary.status || "Checking"}
              </Badge>

              <div className="refresh-score">{summary.readiness_score || 0}%</div>

              <h2 className="refresh-title">Live Feed Refresh Control</h2>

              <div className="refresh-sub">
                Use this page after seeding demo data, running FEC syncs, importing vendors, creating CRM contacts, generating reports, or updating workspace activity. It helps clear stale-feed launch warnings by refreshing detectable records.
              </div>

              <div className="refresh-actions">
                <button className="vs-button" onClick={runRefresh} disabled={running}>
                  {running ? "Refreshing..." : "Run Full Platform Refresh"}
                </button>
                <Link className="vs-button vs-button-secondary" to="/launch-readiness">
                  Launch Readiness
                </Link>
                <Link className="vs-button vs-button-secondary" to="/live-intelligence-layer">
                  Live Intelligence
                </Link>
              </div>
            </div>

            <SectionCard
              title="Blockers"
              subtitle="Feeds still blocking launch readiness after refresh."
              right={<Badge tone={blockers.length ? "danger" : "active"}>{blockers.length}</Badge>}
            >
              <div className="refresh-stack">
                {!blockers.length ? (
                  <EmptyState text="No live data blockers detected." />
                ) : (
                  blockers.map((item) => (
                    <div key={item.key} className={`refresh-row ${item.status}`}>
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.message}
                        meta={[
                          { label: "Status", value: titleCase(item.status) },
                          { label: "Count", value: item.count || 0 },
                          { label: "Target", value: item.minCount || 0 },
                          { label: "Last Updated", value: formatTime(item.last_updated_at) },
                        ]}
                        right={
                          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                            <Badge tone={tone(item.status)}>{titleCase(item.status)}</Badge>
                            <Link className="vs-button vs-button-secondary" to={item.route}>Open</Link>
                          </div>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Needs Review"
              subtitle="Feeds that are present but low, stale, or missing timestamps."
              right={<Badge tone={reviewItems.length ? "demo" : "active"}>{reviewItems.length}</Badge>}
            >
              <div className="refresh-stack">
                {!reviewItems.length ? (
                  <EmptyState text="No review items detected." />
                ) : (
                  reviewItems.map((item) => (
                    <div key={item.key} className={`refresh-row ${item.status}`}>
                      <ResponsiveRow
                        title={item.label}
                        subtitle={item.message}
                        meta={[
                          { label: "Status", value: titleCase(item.status) },
                          { label: "Count", value: item.count || 0 },
                          { label: "Target", value: item.minCount || 0 },
                          { label: "Freshness", value: item.freshness_hours === null ? "N/A" : `${item.freshness_hours}h` },
                        ]}
                        right={<Badge tone={tone(item.status)}>{titleCase(item.status)}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="All Live Feeds"
            subtitle="Current status of every launch-critical feed."
            right={<Badge tone="accent">{feeds.length}</Badge>}
          >
            <div className="refresh-stack">
              {!feeds.length ? (
                <EmptyState text="No feed status returned." />
              ) : (
                feeds.map((item) => (
                  <div key={item.key} className={`refresh-row ${item.status}`}>
                    <ResponsiveRow
                      title={item.label}
                      subtitle={item.message}
                      meta={[
                        { label: "Table", value: item.table },
                        { label: "Status", value: titleCase(item.status) },
                        { label: "Count", value: item.count || 0 },
                        { label: "Target", value: item.minCount || 0 },
                        { label: "Last Updated", value: formatTime(item.last_updated_at) },
                        { label: "Freshness", value: item.freshness_hours === null ? "N/A" : `${item.freshness_hours}h` },
                      ]}
                      right={
                        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                          <Badge tone={tone(item.status)}>{titleCase(item.status)}</Badge>
                          <Link className="vs-button vs-button-secondary" to={item.route}>Open</Link>
                        </div>
                      }
                    />
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}
