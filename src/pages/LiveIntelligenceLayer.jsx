import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

import "./LiveIntelligenceLayer.css";

const READY = new Set(["live", "fresh", "ready"]);
const SEVERITY = { missing: 0, critical: 1, failed: 2, disconnected: 3, degraded: 4, stale: 5, partial: 6, fresh: 7, live: 8, ready: 9 };

const arr = (value) => (Array.isArray(value) ? value : []);
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value) => Math.max(0, Math.min(100, num(value)));
const statusOf = (value) => String(value || "unknown").trim().toLowerCase();

function tone(value) {
  const status = statusOf(value);
  if (["missing", "critical", "failed", "disconnected", "not ready"].includes(status)) return "danger";
  if (["stale", "degraded", "partial", "needs review"].includes(status)) return "demo";
  if (["live", "fresh", "ready", "launch ready"].includes(status)) return "active";
  return "accent";
}

function labelStatus(value) {
  return statusOf(value).replace(/\b\w/g, (char) => char.toUpperCase());
}

function dateLabel(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
}

function relativeTime(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function normalizeFeed(feed = {}) {
  return {
    key: feed.key || feed.id || feed.label || "feed",
    label: feed.label || feed.name || feed.key || "Unnamed feed",
    description: feed.description || "",
    domain: feed.domain || feed.category || "Platform",
    status: statusOf(feed.status),
    criticality: String(feed.criticality || "supporting").toLowerCase(),
    required_for_launch: Boolean(feed.required_for_launch),
    weight: num(feed.weight),
    score: clamp(feed.score ?? feed.health_score),
    connectivity_score: clamp(feed.connectivity_score),
    freshness_score: clamp(feed.freshness_score),
    coverage_score: clamp(feed.coverage_score),
    quality_score: clamp(feed.quality_score),
    count: num(feed.count),
    target_count: num(feed.target_count),
    last_success_at: feed.last_success_at || feed.last_seen || null,
    last_attempt_at: feed.last_attempt_at || null,
    failure_reason: feed.failure_reason || feed.error || "",
    remediation: feed.remediation || feed.recommended_action || "Review source health and configuration.",
    owner: feed.owner || "Unassigned",
    route: feed.route || "/executive-workspace",
    environment: feed.environment || "production",
    score_impact: num(feed.score_impact),
  };
}

function normalizeModel(result = {}) {
  const feeds = arr(result.feeds).map(normalizeFeed);
  const feedMap = new Map(feeds.map((feed) => [feed.key, feed]));
  const recommendations = arr(result.blockers).length ? arr(result.blockers) : arr(result.recommendations);

  const blockers = recommendations.map((item) => {
    const feed = feedMap.get(item.feed_key || item.key);
    return {
      key: item.key || item.feed_key || item.title,
      title: item.title || feed?.label || "Launch blocker",
      detail: item.detail || item.failure_reason || feed?.failure_reason || "",
      status: statusOf(item.status || feed?.status),
      priority: String(item.priority || "medium").toLowerCase(),
      owner: item.owner || feed?.owner || "Unassigned",
      route: item.route || feed?.route || "/executive-workspace",
      remediation: item.remediation || item.action || feed?.remediation || "Review source configuration.",
      score_impact: num(item.score_impact ?? feed?.score_impact),
      last_success_at: item.last_success_at || feed?.last_success_at || null,
    };
  });

  const ready = feeds.filter((feed) => READY.has(feed.status)).length;
  const summary = result.summary || {};
  const score = clamp(summary.readiness_score ?? result.readiness_score ?? (feeds.length ? ready / feeds.length * 100 : 0));

  return {
    summary: {
      ...summary,
      readiness_score: score,
      readiness_status: summary.readiness_status || (score >= 85 ? "Launch Ready" : score >= 65 ? "Needs Review" : "Not Ready"),
      projected_score: clamp(summary.projected_score ?? result.projected_score ?? score),
      total_feeds: num(summary.total_feeds, feeds.length),
      ready_feeds: num(summary.ready_feeds, ready),
      review_feeds: num(summary.review_feeds, feeds.length - ready),
      blocker_count: num(summary.blocker_count, blockers.length),
      core_ready: num(summary.core_ready),
      core_total: num(summary.core_total),
      score_change_24h: num(summary.score_change_24h),
      live: num(summary.live, feeds.filter((feed) => feed.status === "live").length),
      fresh: num(summary.fresh, feeds.filter((feed) => feed.status === "fresh").length),
      stale: num(summary.stale, feeds.filter((feed) => feed.status === "stale").length),
      critical: num(summary.critical, feeds.filter((feed) => feed.status === "critical").length),
      missing: num(summary.missing, feeds.filter((feed) => feed.status === "missing").length),
      last_scan_at: summary.last_scan_at || result.last_scan_at || new Date().toISOString(),
    },
    domains: arr(result.domains),
    feeds,
    blockers,
    rules: arr(result.rules),
  };
}

function Progress({ value }) {
  return <div className="li-progress"><span style={{ width: `${clamp(value)}%` }} /></div>;
}

function DomainCard({ domain }) {
  return (
    <article className={`li-domain-card is-${tone(domain.status)}`}>
      <div className="li-domain-head">
        <div>
          <strong>{domain.label}</strong>
          <span>{domain.description}</span>
        </div>
        <Badge tone={tone(domain.status)}>{Math.round(num(domain.score))}%</Badge>
      </div>
      <Progress value={domain.score} />
      <div className="li-domain-meta">
        <span>{num(domain.ready_feeds)}/{num(domain.total_feeds)} feeds ready</span>
        <span>{num(domain.blocker_count)} blockers</span>
        <span>{num(domain.weight)}% weight</span>
      </div>
    </article>
  );
}

function BlockerCard({ blocker }) {
  return (
    <article className={`li-blocker is-${blocker.priority}`}>
      <div className="li-blocker-mark">!</div>
      <div className="li-blocker-body">
        <div className="li-blocker-head">
          <div>
            <span>{labelStatus(blocker.status)} · {blocker.owner}</span>
            <h3>{blocker.title}</h3>
          </div>
          <Badge tone={tone(blocker.status)}>+{Math.round(blocker.score_impact)} pts</Badge>
        </div>
        {blocker.detail ? <p>{blocker.detail}</p> : null}
        <div className="li-remediation">
          <strong>Recommended action</strong>
          <span>{blocker.remediation}</span>
        </div>
        <div className="li-blocker-foot">
          <small>Last success: {dateLabel(blocker.last_success_at)}</small>
          <Link className="vs-button vs-button-secondary" to={blocker.route}>Resolve</Link>
        </div>
      </div>
    </article>
  );
}

function FeedRow({ feed }) {
  return (
    <article className={`li-feed is-${tone(feed.status)}`}>
      <div className="li-feed-main">
        <i className={`is-${feed.status}`} />
        <div>
          <div className="li-feed-title">
            <strong>{feed.label}</strong>
            {feed.required_for_launch ? <span>Required</span> : null}
          </div>
          <p>{feed.description || feed.remediation}</p>
          <div className="li-tags"><span>{feed.domain}</span><span>{feed.criticality}</span><span>{feed.environment}</span></div>
        </div>
      </div>
      <div className="li-feed-score">
        <div><span>Health</span><strong>{Math.round(feed.score)}%</strong></div>
        <Progress value={feed.score} />
      </div>
      <div className="li-feed-metrics">
        <span><b>{feed.count.toLocaleString()}</b> records</span>
        <span><b>{Math.round(feed.coverage_score)}%</b> coverage</span>
        <span><b>{Math.round(feed.quality_score)}%</b> quality</span>
        <span><b>{relativeTime(feed.last_success_at)}</b> last success</span>
      </div>
      <div className="li-feed-actions">
        <Badge tone={tone(feed.status)}>{labelStatus(feed.status)}</Badge>
        <Link className="vs-button vs-button-secondary" to={feed.route}>Open</Link>
      </div>
    </article>
  );
}

export default function LiveIntelligenceLayer() {
  const [model, setModel] = useState(() => normalizeModel());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [domain, setDomain] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      quiet ? setRefreshing(true) : setLoading(true);
      setError("");
      setModel(normalizeModel(await api.liveIntelligenceLayer()));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Live Intelligence Layer.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { summary, domains, feeds, blockers, rules } = model;
  const domainOptions = useMemo(() => [...new Set(feeds.map((feed) => feed.domain))].sort(), [feeds]);

  const filteredFeeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...feeds]
      .filter((feed) => domain === "all" || feed.domain === domain)
      .filter((feed) => status === "all" || (status === "ready" ? READY.has(feed.status) : status === "review" ? !READY.has(feed.status) : feed.status === status))
      .filter((feed) => !query || [feed.label, feed.description, feed.domain, feed.owner, feed.remediation].join(" ").toLowerCase().includes(query))
      .sort((a, b) => (SEVERITY[a.status] ?? 99) - (SEVERITY[b.status] ?? 99) || b.weight - a.weight);
  }, [feeds, domain, status, search]);

  const orderedBlockers = useMemo(() => [...blockers].sort((a, b) => ({ high: 0, critical: 0, medium: 1, low: 2 }[a.priority] ?? 3) - ({ high: 0, critical: 0, medium: 1, low: 2 }[b.priority] ?? 3) || b.score_impact - a.score_impact), [blockers]);

  return (
    <PageShell
      eyebrow="Launch Readiness"
      title="Live Intelligence Layer"
      description="Measure weighted readiness across political intelligence, operations, CRM, finance, vendors, alerts, workspaces, and platform infrastructure."
      tickerItems={[
        { label: "Readiness", value: `${Math.round(summary.readiness_score)}%`, dotClass: summary.readiness_score >= 85 ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Projection", value: `${Math.round(summary.projected_score)}%`, dotClass: summary.projected_score >= 85 ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Core Systems", value: `${summary.core_ready}/${summary.core_total}`, dotClass: summary.core_ready === summary.core_total ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Last Scan", value: refreshing ? "Refreshing" : relativeTime(summary.last_scan_at), dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="li-stats">
        <StatCard label="Readiness Score" value={`${Math.round(summary.readiness_score)}%`} delta={`${summary.score_change_24h >= 0 ? "+" : ""}${summary.score_change_24h.toFixed(1)} pts / 24h`} tone={summary.readiness_score >= 85 ? "up" : "down"} />
        <StatCard label="Projected Readiness" value={`${Math.round(summary.projected_score)}%`} delta="After open blockers" tone="up" />
        <StatCard label="Core Systems Ready" value={`${summary.core_ready}/${summary.core_total}`} delta="Required for launch" tone={summary.core_ready === summary.core_total ? "up" : "down"} />
        <StatCard label="Launch Blockers" value={summary.blocker_count} delta="Require remediation" tone={summary.blocker_count ? "down" : "up"} />
      </div>

      {loading ? <EmptyState text="Scanning live intelligence feeds..." /> : (
        <>
          <section className="li-command">
            <div className="li-command-score">
              <Badge tone={tone(summary.readiness_status)}>{summary.readiness_status}</Badge>
              <div>{Math.round(summary.readiness_score)}<span>%</span></div>
              <p>Weighted readiness reflects source criticality, connectivity, freshness, coverage, and data quality.</p>
              <div className="li-command-actions">
                <button className="vs-button" disabled={refreshing} onClick={() => load({ quiet: true })}>{refreshing ? "Refreshing..." : "Run Health Scan"}</button>
                <Link className="vs-button vs-button-secondary" to="/executive-workspace">Executive Workspace</Link>
                <Link className="vs-button vs-button-secondary" to="/command-center">Command Center</Link>
              </div>
            </div>
            <div className="li-projection">
              <div className="li-projection-head"><div><span>Launch projection</span><strong>{Math.round(summary.projected_score)}%</strong></div><Badge tone={tone(summary.projected_score >= 85 ? "ready" : "stale")}>+{Math.max(0, Math.round(summary.projected_score - summary.readiness_score))} pts</Badge></div>
              <Progress value={summary.projected_score} />
              <div className="li-projection-grid"><div><span>Current</span><strong>{Math.round(summary.readiness_score)}%</strong></div><div><span>Core fixes</span><strong>{Math.round(Math.min(summary.projected_score, summary.readiness_score + 25))}%</strong></div><div><span>Projected</span><strong>{Math.round(summary.projected_score)}%</strong></div></div>
              <p>Projection assumes open blockers are resolved without introducing new critical failures.</p>
            </div>
            <div className="li-command-metrics">
              <div><span>Ready feeds</span><strong>{summary.ready_feeds}</strong></div>
              <div><span>Needs review</span><strong>{summary.review_feeds}</strong></div>
              <div><span>Critical</span><strong>{summary.critical}</strong></div>
              <div><span>Missing</span><strong>{summary.missing}</strong></div>
            </div>
          </section>

          <SectionCard title="Readiness by Operating Domain" subtitle="Weighted contribution of each domain to overall launch readiness." right={<Badge tone="accent">{domains.length} domains</Badge>}>
            {domains.length ? <div className="li-domain-grid">{domains.map((item) => <DomainCard key={item.key || item.label} domain={item} />)}</div> : <EmptyState text="Domain scores will appear after the weighted backend model is deployed." />}
          </SectionCard>

          <div className="li-layout">
            <div className="li-stack">
              <SectionCard title="Launch Blockers" subtitle="Highest-impact issues preventing production readiness." right={<Badge tone={orderedBlockers.length ? "danger" : "active"}>{orderedBlockers.length}</Badge>}>
                {orderedBlockers.length ? <div className="li-blocker-list">{orderedBlockers.slice(0, 8).map((item) => <BlockerCard key={item.key} blocker={item} />)}</div> : <EmptyState text="No launch blockers detected." />}
              </SectionCard>

              <SectionCard title="Intelligence Feed Matrix" subtitle="Connectivity, freshness, coverage, quality, and status for every source." right={<Badge tone="accent">{filteredFeeds.length}</Badge>}>
                <div className="li-toolbar">
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feeds, owners, domains, or actions..." />
                  <select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="all">All domains</option>{domainOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="ready">Ready</option><option value="review">Needs review</option><option value="missing">Missing</option><option value="critical">Critical</option><option value="stale">Stale</option><option value="degraded">Degraded</option></select>
                </div>
                {filteredFeeds.length ? <div className="li-feed-list">{filteredFeeds.map((feed) => <FeedRow key={feed.key} feed={feed} />)}</div> : <EmptyState text="No feeds match the selected filters." />}
              </SectionCard>
            </div>

            <aside className="li-side">
              <SectionCard title="Scoring Model" subtitle="How weighted readiness is calculated.">
                <div className="li-rule-list">{(rules.length ? rules : [
                  { label: "Connectivity", weight: 25, detail: "Source can be reached and queried." },
                  { label: "Freshness", weight: 30, detail: "Feed-specific recency threshold." },
                  { label: "Coverage", weight: 25, detail: "Expected production record volume." },
                  { label: "Quality", weight: 20, detail: "Valid and non-duplicate records." },
                ]).map((rule) => <div key={rule.key || rule.label}><div><strong>{rule.label}</strong><span>{rule.detail}</span></div><Badge tone="accent">{num(rule.weight)}%</Badge></div>)}</div>
              </SectionCard>
              <SectionCard title="Launch Gates" subtitle="Recommended production thresholds.">
                <div className="li-gates"><div><span>Launch ready</span><strong>85–100%</strong><Badge tone="active">Ready</Badge></div><div><span>Conditional launch</span><strong>65–84%</strong><Badge tone="demo">Review</Badge></div><div><span>Launch blocked</span><strong>0–64%</strong><Badge tone="danger">Blocked</Badge></div></div>
              </SectionCard>
              <SectionCard title="Operational Controls" subtitle="Next actions for launch leadership.">
                <div className="li-controls"><Link to="/tasks">Create remediation task</Link><Link to="/executive-workspace">Review executive owners</Link><Link to="/command-center">Open execution board</Link><Link to="/reports">Export readiness report</Link></div>
              </SectionCard>
            </aside>
          </div>
        </>
      )}
    </PageShell>
  );
}
