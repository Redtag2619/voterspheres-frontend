import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard"; 
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

import "./LiveIntelligenceLayer.css";

const READY_STATUSES = new Set(["live", "fresh", "ready", "healthy", "launch ready"]);
const REVIEW_STATUSES = new Set([
  "stale",
  "degraded",
  "partial",
  "needs review",
  "conditional",
]);
const DANGER_STATUSES = new Set([
  "critical",
  "missing",
  "failed",
  "disconnected",
  "not ready",
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, asNumber(value)));
}

function normalizeStatus(value, fallback = "unknown") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || fallback;
}

function labelize(value) {
  return String(value || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(value) {
  const status = normalizeStatus(value);

  if (DANGER_STATUSES.has(status)) return "danger";
  if (REVIEW_STATUSES.has(status)) return "demo";
  if (READY_STATUSES.has(status)) return "active";

  return "accent";
}

function scoreTone(value) {
  const score = asNumber(value);

  if (score >= 85) return "active";
  if (score >= 65) return "demo";
  return "danger";
}

function formatDate(value) {
  if (!value) return "Never";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function formatRelative(value) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60000)
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

function normalizeFeed(feed = {}, index = 0) {
  return {
    key: String(feed.key || feed.id || `feed-${index}`),
    label: feed.label || feed.name || feed.key || `Feed ${index + 1}`,
    description: feed.description || "",
    domain: feed.domain || feed.category || "Platform Infrastructure",
    status: normalizeStatus(feed.status),
    criticality: normalizeStatus(feed.criticality, "supporting"),
    requiredForLaunch: Boolean(
      feed.required_for_launch ?? feed.requiredForLaunch
    ),
    count: asNumber(feed.count),
    targetCount: asNumber(feed.target_count ?? feed.targetCount),
    connectivityScore: clamp(
      feed.connectivity_score ?? feed.connectivityScore
    ),
    freshnessScore: clamp(feed.freshness_score ?? feed.freshnessScore),
    coverageScore: clamp(feed.coverage_score ?? feed.coverageScore),
    qualityScore: clamp(feed.quality_score ?? feed.qualityScore),
    owner: feed.owner || "Unassigned",
    route: feed.route || "/executive-workspace",
    lastSuccessAt:
      feed.last_success_at || feed.last_seen || feed.lastSuccessAt || null,
    lastAttemptAt: feed.last_attempt_at || feed.lastAttemptAt || null,
    failureReason: feed.failure_reason || feed.error || "",
    remediation:
      feed.remediation ||
      feed.recommended_action ||
      "Review source configuration and production data availability.",
    scoreImpact: asNumber(feed.score_impact ?? feed.scoreImpact),
  };
}

function normalizeDomain(domain = {}, index = 0) {
  return {
    key: String(domain.key || domain.id || `domain-${index}`),
    label: domain.label || domain.name || `Operating Domain ${index + 1}`,
    description: domain.description || "",
    score: clamp(domain.score),
    weight: asNumber(domain.weight),
    readyFeeds: asNumber(domain.ready_feeds ?? domain.readyFeeds),
    totalFeeds: asNumber(domain.total_feeds ?? domain.totalFeeds),
    blockerCount: asNumber(domain.blocker_count ?? domain.blockerCount),
    status: normalizeStatus(domain.status, "review"),
  };
}

function normalizeBlocker(item = {}, feedMap = new Map(), index = 0) {
  const feed = feedMap.get(item.feed_key || item.key);

  return {
    key: String(item.key || item.id || item.feed_key || `blocker-${index}`),
    title: item.title || feed?.label || `Launch Blocker ${index + 1}`,
    detail:
      item.detail ||
      item.failure_reason ||
      feed?.failureReason ||
      "This source requires review before production launch.",
    status: normalizeStatus(item.status || feed?.status, "needs review"),
    priority: normalizeStatus(
      item.priority ||
        (DANGER_STATUSES.has(
          normalizeStatus(item.status || feed?.status)
        )
          ? "high"
          : "medium")
    ),
    owner: item.owner || feed?.owner || "Unassigned",
    route: item.route || feed?.route || "/executive-workspace",
    remediation:
      item.remediation ||
      item.action ||
      feed?.remediation ||
      "Review and repair the affected source.",
    scoreImpact: asNumber(item.score_impact ?? feed?.scoreImpact),
    lastSuccessAt: item.last_success_at || feed?.lastSuccessAt || null,
  };
}

function buildModel(result = {}) {
  const feeds = asArray(result.feeds).map(normalizeFeed);
  const feedMap = new Map(feeds.map((feed) => [feed.key, feed]));

  const blockerSource = asArray(result.blockers).length
    ? asArray(result.blockers)
    : asArray(result.recommendations);

  const blockers = blockerSource.map((item, index) =>
    normalizeBlocker(item, feedMap, index)
  );

  const domains = asArray(result.domains).map(normalizeDomain);
  const readyFeeds = feeds.filter((feed) => READY_STATUSES.has(feed.status));
  const summary = result.summary || {};

  const readinessScore = clamp(
    summary.readiness_score ??
      result.readiness_score ??
      (feeds.length ? (readyFeeds.length / feeds.length) * 100 : 0)
  );

  const projectedScore = clamp(
    summary.projected_score ?? result.projected_score ?? readinessScore
  );

  return {
    summary: {
      readinessScore,
      projectedScore,
      readinessStatus:
        summary.readiness_status ||
        result.readiness_status ||
        (readinessScore >= 85
          ? "Launch Ready"
          : readinessScore >= 65
            ? "Needs Review"
            : "Not Ready"),
      totalFeeds: asNumber(summary.total_feeds, feeds.length),
      readyFeeds: asNumber(summary.ready_feeds, readyFeeds.length),
      reviewFeeds: asNumber(
        summary.review_feeds,
        Math.max(0, feeds.length - readyFeeds.length)
      ),
      blockerCount: asNumber(summary.blocker_count, blockers.length),
      coreReady: asNumber(summary.core_ready),
      coreTotal: asNumber(summary.core_total),
      scoreChange24h: asNumber(summary.score_change_24h),
      lastScanAt:
        summary.last_scan_at ||
        result.last_scan_at ||
        new Date().toISOString(),
    },
    feeds,
    blockers,
    domains,
    rules: asArray(result.rules),
  };
}

function HealthBreakdown({ feed }) {
  const metrics = [
    ["Connectivity", feed.connectivityScore],
    ["Freshness", feed.freshnessScore],
    ["Coverage", feed.coverageScore],
    ["Quality", feed.qualityScore],
  ];

  return (
    <div className="live-health-grid">
      {metrics.map(([label, value]) => (
        <div key={label} className="live-health-item">
          <span>{label}</span>
          <strong>{Math.round(value)}%</strong>
          <div className="live-meter" aria-label={`${label}: ${value}%`}>
            <span style={{ width: `${clamp(value)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DomainRow({ domain }) {
  return (
    <div className="live-domain-row">
      <ResponsiveRow
        title={domain.label}
        subtitle={
          domain.description ||
          "Weighted readiness contribution for this operating domain."
        }
        meta={[
          { label: "Readiness", value: `${Math.round(domain.score)}%` },
          { label: "Weight", value: `${domain.weight}%` },
          {
            label: "Feeds Ready",
            value: `${domain.readyFeeds}/${domain.totalFeeds}`,
          },
          { label: "Blockers", value: domain.blockerCount },
        ]}
        right={
          <Badge tone={scoreTone(domain.score)}>
            {labelize(domain.status)}
          </Badge>
        }
      />
    </div>
  );
}

function FeedRow({ feed }) {
  const tone = statusTone(feed.status);

  return (
    <div className={`live-feed-card live-feed-card-${tone}`}>
      <ResponsiveRow
        title={feed.label}
        subtitle={feed.failureReason || feed.description || feed.remediation}
        meta={[
          { label: "Domain", value: feed.domain },
          { label: "Records", value: feed.count.toLocaleString() },
          { label: "Owner", value: feed.owner },
          { label: "Last Success", value: formatDate(feed.lastSuccessAt) },
        ]}
        alert={
          ["danger", "demo"].includes(tone)
            ? {
                tone,
                text:
                  feed.failureReason ||
                  `${labelize(feed.status)} feed requires review.`,
              }
            : null
        }
        right={
          <div className="live-row-actions">
            <Badge tone={tone}>{labelize(feed.status)}</Badge>
            <Link className="vs-button vs-button-secondary" to={feed.route}>
              Open
            </Link>
          </div>
        }
      />

      <HealthBreakdown feed={feed} />

      <div className="live-feed-footer">
        <div className="live-feed-tags">
          <Badge tone="accent">{labelize(feed.criticality)}</Badge>
          <Badge tone={feed.requiredForLaunch ? "demo" : "accent"}>
            {feed.requiredForLaunch ? "Required for Launch" : "Supporting"}
          </Badge>
        </div>

        <span>Last attempt: {formatDate(feed.lastAttemptAt)}</span>
      </div>
    </div>
  );
}

function BlockerRow({ blocker }) {
  return (
    <div className="live-blocker-row">
      <ResponsiveRow
        title={blocker.title}
        subtitle={blocker.detail}
        meta={[
          { label: "Priority", value: labelize(blocker.priority) },
          { label: "Owner", value: blocker.owner },
          {
            label: "Score Impact",
            value: `+${Math.round(blocker.scoreImpact)} pts`,
          },
          {
            label: "Last Success",
            value: formatDate(blocker.lastSuccessAt),
          },
        ]}
        alert={{
          tone: statusTone(blocker.status),
          text: blocker.remediation,
        }}
        right={
          <div className="live-row-actions">
            <Badge tone={statusTone(blocker.status)}>
              {labelize(blocker.status)}
            </Badge>
            <Link className="vs-button vs-button-secondary" to={blocker.route}>
              Resolve
            </Link>
          </div>
        }
      />
    </div>
  );
}

export default function LiveIntelligenceLayer() {
  const [model, setModel] = useState(() => buildModel());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    domain: "",
    status: "",
  });

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await api.liveIntelligenceLayer();
      setModel(buildModel(result));
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

  const { summary, feeds, blockers, domains, rules } = model;

  const domainOptions = useMemo(
    () =>
      [...new Set(feeds.map((feed) => feed.domain).filter(Boolean))].sort(),
    [feeds]
  );

  const filteredFeeds = useMemo(() => {
    const query = filters.q.trim().toLowerCase();

    return feeds
      .filter((feed) => !filters.domain || feed.domain === filters.domain)
      .filter((feed) => {
        if (!filters.status) return true;

        if (filters.status === "ready") {
          return READY_STATUSES.has(feed.status);
        }

        if (filters.status === "review") {
          return !READY_STATUSES.has(feed.status);
        }

        return feed.status === filters.status;
      })
      .filter((feed) => {
        if (!query) return true;

        return [
          feed.label,
          feed.description,
          feed.domain,
          feed.owner,
          feed.status,
          feed.remediation,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const rank = {
          missing: 0,
          critical: 1,
          disconnected: 2,
          failed: 3,
          degraded: 4,
          stale: 5,
          fresh: 6,
          live: 7,
          ready: 8,
        };

        return (rank[a.status] ?? 99) - (rank[b.status] ?? 99);
      });
  }, [feeds, filters]);

  const sortedBlockers = useMemo(
    () =>
      [...blockers].sort((a, b) => {
        const rank = { high: 0, critical: 0, medium: 1, low: 2 };

        return (
          (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3) ||
          b.scoreImpact - a.scoreImpact
        );
      }),
    [blockers]
  );

  const readinessDelta =
    summary.scoreChange24h >= 0
      ? `+${summary.scoreChange24h.toFixed(1)} points in 24 hours`
      : `${summary.scoreChange24h.toFixed(1)} points in 24 hours`;

  const fallbackRules = [
    {
      key: "connectivity",
      label: "Connectivity",
      weight: 25,
      detail: "Source is reachable and queryable.",
    },
    {
      key: "freshness",
      label: "Freshness",
      weight: 30,
      detail: "Source is within its configured freshness threshold.",
    },
    {
      key: "coverage",
      label: "Coverage",
      weight: 25,
      detail: "Source meets the expected production record volume.",
    },
    {
      key: "quality",
      label: "Quality",
      weight: 20,
      detail: "Records are valid, complete, and non-duplicate.",
    },
  ];

  return (
    <PageShell
      eyebrow="Launch Readiness"
      title="Live Intelligence Layer"
      description="Monitor production data health, weighted operating readiness, and launch blockers across the VoterSpheres intelligence platform."
      tickerItems={[
        {
          label: "Readiness",
          value: `${Math.round(summary.readinessScore)}%`,
          dotClass:
            summary.readinessScore >= 85
              ? "vs-live-dot-success"
              : summary.readinessScore >= 65
                ? "vs-live-dot-warning"
                : "vs-live-dot",
        },
        {
          label: "Projected",
          value: `${Math.round(summary.projectedScore)}%`,
          dotClass:
            summary.projectedScore >= 85
              ? "vs-live-dot-success"
              : "vs-live-dot-warning",
        },
        {
          label: "Core Systems",
          value: `${summary.coreReady}/${summary.coreTotal}`,
          dotClass:
            summary.coreTotal > 0 && summary.coreReady === summary.coreTotal
              ? "vs-live-dot-success"
              : "vs-live-dot-warning",
        },
        {
          label: "Last Scan",
          value: refreshing
            ? "Refreshing"
            : formatRelative(summary.lastScanAt),
          dotClass: refreshing
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
      ]}
    >
      {error ? (
        <div className="vs-banner vs-banner-danger">{error}</div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard
          label="Launch Readiness"
          value={`${Math.round(summary.readinessScore)}%`}
          delta={readinessDelta}
          tone={summary.readinessScore >= 85 ? "up" : "down"}
        />

        <StatCard
          label="Projected Readiness"
          value={`${Math.round(summary.projectedScore)}%`}
          delta="After current blockers are resolved"
          tone={
            summary.projectedScore > summary.readinessScore ? "up" : "neutral"
          }
        />

        <StatCard
          label="Core Systems Ready"
          value={`${summary.coreReady}/${summary.coreTotal}`}
          delta="Required production systems"
          tone={
            summary.coreTotal > 0 && summary.coreReady === summary.coreTotal
              ? "up"
              : "down"
          }
        />

        <StatCard
          label="Launch Blockers"
          value={summary.blockerCount}
          delta="Issues requiring action"
          tone={summary.blockerCount ? "down" : "up"}
        />
      </div>

      {loading ? (
        <EmptyState text="Scanning live intelligence feeds..." />
      ) : (
        <>
          <div className="live-overview-grid">
            <SectionCard
              title="Executive Readiness Summary"
              subtitle="Current production readiness and expected launch position after remediation."
              right={
                <Badge tone={scoreTone(summary.readinessScore)}>
                  {summary.readinessStatus}
                </Badge>
              }
            >
              <div className="live-summary-panel">
                <div className="live-summary-score">
                  <span>Current readiness</span>
                  <strong>{Math.round(summary.readinessScore)}%</strong>
                  <div className="live-readiness-track">
                    <span
                      style={{ width: `${clamp(summary.readinessScore)}%` }}
                    />
                  </div>
                </div>

                <div className="live-summary-details">
                  <div>
                    <span>Projected readiness</span>
                    <strong>{Math.round(summary.projectedScore)}%</strong>
                  </div>
                  <div>
                    <span>Feeds ready</span>
                    <strong>{summary.readyFeeds}</strong>
                  </div>
                  <div>
                    <span>Feeds needing review</span>
                    <strong>{summary.reviewFeeds}</strong>
                  </div>
                  <div>
                    <span>Total monitored feeds</span>
                    <strong>{summary.totalFeeds}</strong>
                  </div>
                </div>

                <div className="live-summary-actions">
                  <button
                    className="vs-button"
                    type="button"
                    disabled={refreshing}
                    onClick={() => load({ quiet: true })}
                  >
                    {refreshing ? "Refreshing..." : "Run Health Scan"}
                  </button>

                  <Link
                    className="vs-button vs-button-secondary"
                    to="/executive-workspace"
                  >
                    Executive Workspace
                  </Link>

                  <Link
                    className="vs-button vs-button-secondary"
                    to="/command-center"
                  >
                    Command Center
                  </Link>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Launch Position"
              subtitle="Operating threshold and expected improvement from open fixes."
            >
              <div className="vs-stack">
                <div className="vs-card-muted">
                  <strong>Launch Ready</strong>
                  <div className="vs-row-subtitle">
                    85% to 100% with all required core systems healthy.
                  </div>
                </div>

                <div className="vs-card-muted">
                  <strong>Conditional Launch</strong>
                  <div className="vs-row-subtitle">
                    65% to 84% with documented executive approval.
                  </div>
                </div>

                <div className="vs-card-muted">
                  <strong>Launch Blocked</strong>
                  <div className="vs-row-subtitle">
                    Below 65% or required core systems are missing.
                  </div>
                </div>

                <div className="live-projection-card">
                  <span>Expected improvement</span>
                  <strong>
                    +
                    {Math.max(
                      0,
                      Math.round(
                        summary.projectedScore - summary.readinessScore
                      )
                    )}{" "}
                    points
                  </strong>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="vs-grid-2">
            <SectionCard
              title="Operating Domain Readiness"
              subtitle="Weighted readiness by major VoterSpheres operating system."
              right={<Badge tone="accent">{domains.length} Domains</Badge>}
            >
              {domains.length ? (
                <div className="vs-stack">
                  {domains.map((domain) => (
                    <DomainRow key={domain.key} domain={domain} />
                  ))}
                </div>
              ) : (
                <EmptyState text="Domain readiness will appear when the weighted backend response is available." />
              )}
            </SectionCard>

            <SectionCard
              title="Launch Blockers"
              subtitle="Highest-impact issues preventing production readiness."
              right={
                <Badge tone={sortedBlockers.length ? "danger" : "active"}>
                  {sortedBlockers.length}
                </Badge>
              }
            >
              {sortedBlockers.length ? (
                <div className="vs-stack">
                  {sortedBlockers.slice(0, 8).map((blocker) => (
                    <BlockerRow key={blocker.key} blocker={blocker} />
                  ))}
                </div>
              ) : (
                <EmptyState text="No launch blockers detected." />
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Intelligence Feed Health"
            subtitle="Search and filter production feeds by domain, readiness, ownership, and health."
            right={<Badge tone="accent">{filteredFeeds.length} Feeds</Badge>}
          >
            <div className="live-filters">
              <input
                type="search"
                placeholder="Search intelligence feeds..."
                value={filters.q}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    q: event.target.value,
                  }))
                }
              />

              <select
                value={filters.domain}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    domain: event.target.value,
                  }))
                }
              >
                <option value="">All Domains</option>
                {domainOptions.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">All Statuses</option>
                <option value="ready">Ready</option>
                <option value="review">Needs Review</option>
                <option value="missing">Missing</option>
                <option value="critical">Critical</option>
                <option value="degraded">Degraded</option>
                <option value="stale">Stale</option>
              </select>

              <button
                className="vs-button"
                type="button"
                disabled={refreshing}
                onClick={() => load({ quiet: true })}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {filteredFeeds.length ? (
              <div className="vs-stack">
                {filteredFeeds.map((feed) => (
                  <FeedRow key={feed.key} feed={feed} />
                ))}
              </div>
            ) : (
              <EmptyState text="No intelligence feeds match the selected filters." />
            )}
          </SectionCard>

          <div className="vs-grid-2">
            <SectionCard
              title="Readiness Scoring"
              subtitle="How each production feed contributes to launch readiness."
            >
              <div className="vs-stack">
                {(rules.length ? rules : fallbackRules).map((rule) => (
                  <div
                    key={rule.key || rule.label}
                    className="vs-card-muted"
                  >
                    <div className="live-rule-row">
                      <div>
                        <strong>{rule.label}</strong>
                        <div className="vs-row-subtitle">{rule.detail}</div>
                      </div>
                      <Badge tone="accent">{asNumber(rule.weight)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Operational Actions"
              subtitle="Route readiness issues into existing VoterSpheres workflows."
            >
              <div className="live-action-list">
                <Link to="/tasks">
                  <strong>Create Remediation Task</strong>
                  <span>
                    Assign an owner and due date for a launch blocker.
                  </span>
                </Link>

                <Link to="/command-center">
                  <strong>Open Command Center</strong>
                  <span>Route blockers into the execution board.</span>
                </Link>

                <Link to="/executive-workspace">
                  <strong>Review Executive Owners</strong>
                  <span>
                    Confirm accountability across operating domains.
                  </span>
                </Link>

                <Link to="/reports">
                  <strong>Generate Readiness Report</strong>
                  <span>Create a leadership-ready launch status brief.</span>
                </Link>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </PageShell>
  );
}
