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
  const v = String(status || "").toLowerCase();

  if (["critical", "missing", "not ready"].includes(v)) return "danger";
  if (["stale", "needs review"].includes(v)) return "demo";
  if (["live", "fresh", "launch ready"].includes(v)) return "active";

  return "accent";
}

function formatDate(value) {
  if (!value) return "Never";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "Never";
  }
}

export default function LiveIntelligenceLayer() {
  const [data, setData] = useState({
    summary: {},
    feeds: [],
    recommendations: [],
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

      const result = await api.liveIntelligenceLayer();

      setData({
        summary: result?.summary || {},
        feeds: arr(result?.feeds),
        recommendations: arr(result?.recommendations),
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
          "Failed to load Live Intelligence Layer."
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
  const feeds = arr(data.feeds);
  const recommendations = arr(data.recommendations);

  const groupedFeeds = useMemo(() => {
    return {
      live: feeds.filter((feed) => ["live", "fresh"].includes(feed.status)),
      review: feeds.filter((feed) => ["stale", "critical", "missing"].includes(feed.status)),
    };
  }, [feeds]);

  return (
    <PageShell
      eyebrow="Launch Readiness"
      title="Live Intelligence Layer"
      description="Verify that VoterSpheres live data feeds are healthy, fresh, and ready for launch across candidates, FEC, signals, vendors, tasks, CRM, reports, alerts, workspaces, and revenue."
      tickerItems={[
        {
          label: "Readiness",
          value: `${summary.readiness_score || 0}%`,
          dotClass:
            summary.readiness_score >= 85
              ? "vs-live-dot-success"
              : summary.readiness_score >= 65
              ? "vs-live-dot-warning"
              : "vs-live-dot",
        },
        {
          label: "Live / Fresh",
          value: `${Number(summary.live || 0) + Number(summary.fresh || 0)}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Needs Review",
          value: `${Number(summary.stale || 0) + Number(summary.critical || 0) + Number(summary.missing || 0)}`,
          dotClass:
            Number(summary.stale || 0) + Number(summary.critical || 0) + Number(summary.missing || 0)
              ? "vs-live-dot-warning"
              : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Refreshing" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .live-layer-command {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .16), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .86));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.28);
        }

        .live-layer-score {
          color: white;
          font-size: clamp(58px, 10vw, 112px);
          line-height: .9;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .live-layer-label {
          margin-top: 10px;
          color: rgba(203, 213, 225, .72);
          font-size: 13px;
          line-height: 1.7;
          max-width: 760px;
        }

        .live-layer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .live-layer-grid {
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(360px, .65fr);
          gap: 18px;
          align-items: start;
        }

        .live-layer-stack {
          display: grid;
          gap: 14px;
        }

        .live-feed-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .live-feed-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .live-feed-row.is-live {
          border-color: rgba(34, 197, 94, .28);
        }

        .live-feed-row.is-review {
          border-color: rgba(251, 146, 60, .28);
        }

        .live-feed-row.is-critical {
          border-color: rgba(248, 113, 113, .36);
        }

        @media (max-width: 1100px) {
          .live-layer-grid {
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
          tone={summary.readiness_score >= 85 ? "up" : "neutral"}
        />
        <StatCard label="Total Feeds" value={summary.total_feeds || 0} delta="Tracked sources" tone="up" />
        <StatCard label="Live / Fresh" value={Number(summary.live || 0) + Number(summary.fresh || 0)} delta="Launch-ready feeds" tone="up" />
        <StatCard
          label="Needs Review"
          value={Number(summary.stale || 0) + Number(summary.critical || 0) + Number(summary.missing || 0)}
          delta="Stale, critical, or missing"
          tone={summary.missing || summary.critical ? "down" : "neutral"}
        />
      </div>

      {loading ? (
        <EmptyState text="Loading live intelligence status..." />
      ) : (
        <div className="live-layer-grid">
          <div className="live-layer-stack">
            <div className="live-layer-command">
              <Badge tone={tone(summary.readiness_status)}>
                {summary.readiness_status || "Checking"}
              </Badge>

              <div className="live-layer-score">{summary.readiness_score || 0}%</div>

              <div className="live-layer-label">
                Launch readiness is based on feed freshness and whether each core system has records available. This layer helps identify demo/stale/missing data before launch.
              </div>

              <div className="live-layer-actions">
                <button className="vs-button" onClick={() => load({ quiet: true })}>
                  {refreshing ? "Refreshing..." : "Refresh Status"}
                </button>
                <Link className="vs-button vs-button-secondary" to="/executive-workspace">
                  Executive Workspace
                </Link>
                <Link className="vs-button vs-button-secondary" to="/search">
                  Universal Search
                </Link>
              </div>
            </div>

            <SectionCard
              title="Live / Fresh Feeds"
              subtitle="Sources that are currently launch-ready."
              right={<Badge tone="active">{groupedFeeds.live.length}</Badge>}
            >
              <div className="live-layer-stack">
                {!groupedFeeds.live.length ? (
                  <EmptyState text="No feeds are currently marked live or fresh." />
                ) : (
                  groupedFeeds.live.map((feed) => (
                    <div key={feed.key} className="live-feed-row is-live">
                      <ResponsiveRow
                        title={feed.label}
                        subtitle={feed.description}
                        meta={[
                          { label: "Status", value: feed.status },
                          { label: "Records", value: feed.count },
                          { label: "Owner", value: feed.owner },
                          { label: "Last Seen", value: formatDate(feed.last_seen) },
                        ]}
                        right={
                          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                            <Badge tone={tone(feed.status)}>{feed.status}</Badge>
                            <Link className="vs-button vs-button-secondary" to={feed.route}>
                              Open
                            </Link>
                          </div>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Feeds Needing Review"
              subtitle="Stale, critical, or missing launch data sources."
              right={<Badge tone={groupedFeeds.review.length ? "danger" : "active"}>{groupedFeeds.review.length}</Badge>}
            >
              <div className="live-layer-stack">
                {!groupedFeeds.review.length ? (
                  <EmptyState text="No stale or missing feeds detected." />
                ) : (
                  groupedFeeds.review.map((feed) => (
                    <div
                      key={feed.key}
                      className={`live-feed-row ${feed.status === "critical" || feed.status === "missing" ? "is-critical" : "is-review"}`}
                    >
                      <ResponsiveRow
                        title={feed.label}
                        subtitle={feed.description}
                        meta={[
                          { label: "Status", value: feed.status },
                          { label: "Records", value: feed.count },
                          { label: "Owner", value: feed.owner },
                          { label: "Last Seen", value: formatDate(feed.last_seen) },
                        ]}
                        right={
                          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                            <Badge tone={tone(feed.status)}>{feed.status}</Badge>
                            <Link className="vs-button vs-button-secondary" to={feed.route}>
                              Open
                            </Link>
                          </div>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <div className="live-layer-stack">
            <SectionCard
              title="Launch Recommendations"
              subtitle="Action list generated from stale or missing feeds."
              right={<Badge tone={recommendations.length ? "demo" : "active"}>{recommendations.length}</Badge>}
            >
              <div className="live-layer-stack">
                {!recommendations.length ? (
                  <EmptyState text="No launch blockers detected in live intelligence feeds." />
                ) : (
                  recommendations.map((item) => (
                    <div key={item.key} className="live-feed-row">
                      <ResponsiveRow
                        title={item.title}
                        subtitle={item.detail}
                        meta={[
                          { label: "Status", value: item.status },
                          { label: "Route", value: item.route },
                          { label: "Action", value: "Review source" },
                          { label: "Priority", value: item.status === "missing" ? "High" : "Medium" },
                        ]}
                        right={
                          <Link className="vs-button vs-button-secondary" to={item.route}>
                            Open
                          </Link>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Launch Rules" subtitle="How feed status is calculated.">
              <div className="live-layer-stack">
                <div className="vs-card-muted">
                  <strong>Live</strong>
                  <div className="vs-row-subtitle">Updated within 6 hours.</div>
                </div>
                <div className="vs-card-muted">
                  <strong>Fresh</strong>
                  <div className="vs-row-subtitle">Updated within 24 hours.</div>
                </div>
                <div className="vs-card-muted">
                  <strong>Stale</strong>
                  <div className="vs-row-subtitle">Updated within 72 hours.</div>
                </div>
                <div className="vs-card-muted">
                  <strong>Critical / Missing</strong>
                  <div className="vs-row-subtitle">Older than 72 hours or no timestamp detected.</div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
