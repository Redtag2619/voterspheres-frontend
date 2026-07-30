import { useCallback, useEffect, useMemo, useState } from "react"; 
import { Link } from "react-router-dom"; 
import { api } from ".. /services/api"; 

import PageShell from ".. /components/ui/PageShell"; 
import SectionCard from ".. /components/ui/SectionCard"; 
import StatCard from ".. /components/ui/StatCard"; 
import Badge from ".. /components/ui/Badge"; 
import EmptyState from ".. /components/ui/EmptyState"; 
import ResponsiveRow from ".. /components/ui/ResponsiveRow"; 

import "./LiveIntelligenceLayer.css"; 

function arr(value) {
 return Array.isArray(value) ? value : [];
}

function num(value, fallback = 0) {
 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
 return Math.min(max, Math.max(min, num(value)));
}

function normalizeStatus(value) {
 return String(value || "").trim().toLowerCase() || " unknown"; 
}

function labelize(value) {
 return String(value || "unknown")
 .replace(/_/g, " ")
 .replace(/\b\w/g, (letter) => letter.toUpperCase()); 
}

function tone(value) {
 const status = normalizeStatus(value);

 if (
 ["critical", "missing", "failed", "disconnected", "not ready"].includes(
 status
 )
 ) {
 return "danger";
 }

 if (
 ["stale", "degraded", "partial", "needs review", "conditional"].includes(
 status
 )
 ) {
 return "demo";
 }

 if (
 ["live", "fresh", "ready", "launch ready", "healthy"].includes(status)
 ) {
 return "active";
 }

 return "accent"; 
}

function scoreTone(value) {
 const score = num(value);

 if (score >= 85) return "active"; 
 if (score >= 65) return "demo"; 
 return "danger"; 
}

function formatDate(value) {
 if (!value) return "Never";

 const date = new Date(value); 

 if (Number.isNaN(date.getTime())) {
 return "Invalid timestamp";
 }

 return date.toLocaleString(); 
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

function normalizeFeed(feed = {}) {
 return {
 key: feed.key || feed.id || feed.label || "feed",
 label: feed.label || feed.name || feed.key || "Unnamed feed",
 description: feed.description || "",
 domain: feed.domain || feed.category || "Platform Infrastructure",
 status: normalizeStatus(feed.status),
 criticality: normalizeStatus(feed.criticality || "supporting"),
 requiredForLaunch: Boolean(
 feed.required_for_launch ?? feed.requiredForLaunch
 ),
 score: clamp(feed.score ?? feed.health_score),
 count: num(feed.count),
 targetCount: num(feed.target_count ?? feed.targetCount),
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
 scoreImpact: num(feed.score_impact ?? feed.scoreImpact),
 }; 
}

function normalizeBlocker(item = {}, feedMap = new Map()) {
 const feed = feedMap.get(item.feed_key || item.key);

 return {
 key: item.key || item.feed_key || item.title || "blocker",
 title: item.title || feed?. label || "Launch blocker",
 detail:
 item.detail ||
 item.failure_reason ||
 feed?. failureReason ||
 "This source requires review before production launch.",
 status: normalizeStatus(item.status || feed?. status),
 priority: normalizeStatus(
 item.priority ||
 (["critical", "missing"].includes(
 normalizeStatus(item.status || feed?. status)
 )
 ? "high"
 : "medium")
 ),
 owner: item.owner || feed?. owner || "Unassigned",
 route: item.route || feed?. route || "/executive-workspace",
 remediation:
 item.remediation ||
 item.action ||
 feed?. remediation ||
 "Review and repair the affected source.",
 scoreImpact: num(item.score_impact ?? feed?. scoreImpact),
 lastSuccessAt: item.last_success_at || feed?. lastSuccessAt || null,
 }; 
}

function normalizeDomain(domain = {}) {
 return {
 key: domain.key || domain.label || domain.name || "domain",
 label: domain.label || domain.name || "Operating Domain",
 description: domain.description || "",
 score: clamp(domain.score),
 weight: num(domain.weight),
 readyFeeds: num(domain.ready_feeds ?? domain.readyFeeds),
 totalFeeds: num(domain.total_feeds ?? domain.totalFeeds),
 blockerCount: num(domain.blocker_count ?? domain.blockerCount),
 status: normalizeStatus(domain.status),
 }; 
}

function buildModel(result = {}) {
 const feeds = arr(result.feeds).map(normalizeFeed);
 const feedMap = new Map(feeds.map((feed) => [feed.key, feed]));

 const rawBlockers = arr(result.blockers).length
 ? arr(result.blockers)
 : arr(result.recommendations); 

 const blockers = rawBlockers.map((item) =>
 normalizeBlocker(item, feedMap)
 ); 

 const readyFeeds = feeds.filter((feed) =>
 ["live", "fresh", "ready"].includes(feed.status)
 ); 

 const summary = result.summary || {}; 
 const readinessScore = clamp(
 summary.readiness_score ?? 
 result.readiness_score ?? 
 (feeds.length ? (readyFeeds.length / feeds.length) * 100 : 0)
 ); 

 return {
 summary: {
 ... summary,
 readinessScore,
 readinessStatus:
 summary.readiness_status ||
 result.readiness_status ||
 (readinessScore >= 85
 ? "Launch Ready"
 : readinessScore >= 65
 ? "Needs Review"
 : "Not Ready"),
 projectedScore: clamp(
 summary.projected_score ?? result.projected_score ?? readinessScore
 ),
 totalFeeds: num(summary.total_feeds, feeds.length),
 readyFeeds: num(summary.ready_feeds, readyFeeds.length),
 reviewFeeds: num(
 summary.review_feeds,
 Math.max(0, feeds.length - readyFeeds.length)
 ), 
 blockerCount: num(summary.blocker_count, blockers.length),
 coreReady: num(summary.core_ready),
 coreTotal: num(summary.core_total),
 scoreChange24h: num(summary.score_change_24h),
 lastScanAt:
 summary.last_scan_at || result.last_scan_at || new Date().toISOString(),
 },
 feeds,
 blockers,
 domains: arr(result.domains).map(normalizeDomain),
 rules: arr(result.rules),
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
 <Badge tone={scoreTone( domain.score)}>
 {labelize(domain.status || "Review")}
 </Badge>
 }
 />
 </div>
 ); 
}

function FeedRow({ feed }) {
 return (
 <div
 className={`live-feed-card live-feed-card-${tone(feed.status)}`}
 >
 <ResponsiveRow
 title={feed.label}
 subtitle={
 feed.failureReason || feed.description || feed.remediation
 }
 meta={[
 { label: "Domain", value: feed.domain },
 { label: "Records", value: feed.count.toLocaleString() },
 { label: "Owner", value: feed.owner },
 { label: "Last Success", value: formatDate(feed.lastSuccessAt) },
 ]}
 alert={
 ["danger", "demo"].includes(tone(feed.status))
 ? {
 tone: tone(feed.status),
 text:
 feed.failureReason ||
 `${labelize(feed.status)} feed requires review.`,
 }
 : null
 }
 right={
 <div className="live-row-actions">
 <Badge tone={tone(feed.status)}>{labelize(feed.status)}</Badge>
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
 {feed.requiredForLaunch ? (
 <Badge tone="demo">Required for Launch</Badge>
 ) : (
 <Badge tone="accent">Supporting</Badge>
 )}
 </div>

 <span>
 Last attempt: {formatDate(feed.lastAttemptAt)}
 </span>
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
 tone: tone(blocker.status),
 text: blocker.remediation,
 }}
 right={
 <div className="live-row-actions">
 <Badge tone={tone(blocker.status)}>
 {labelize(blocker.status)}
 </ Badge>
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
 if (quiet) setRefreshing(true);
 else setLoading(true);

 setError(""); 

 const result = await api.liveIntelligenceLayer(); 
 setModel(buildModel(result)); 
 } catch (err) {
 setError(
 err?. response?. data?. error ||
 err?. response?. data?. detail ||
 err?. message ||
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
 () => [... new Set(feeds.map((feed) => feed.domain).filter(Boolean))].sort(),
 [feeds]
 ); 

 const filteredFeeds = useMemo(() => {
 const query = filters.q.trim().toLowerCase();

 return feeds
 .filter((feed) => !filters.domain || feed.domain === filters.domain)
 .filter((feed) => {
 if (!filters.status) return true;

 if (filters.status === "ready") {
 return ["live", "fresh", "ready"].includes(feed.status);
 }

 if (filters.status === "review") {
 return ![" live", "fresh", "ready"].includes(feed.status);
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
 [... blockers].sort((a, b) => {
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
 summary.coreTotal > 0 &&
 summary.coreReady === summary.coreTotal
 ? "vs-live-dot-success"
 : "vs-live-dot-warning",
 },
 {
 label: "Last Scan",
 value: refreshing ? "Refreshing" : formatRelative(summary.lastScanAt),
 dotClass: refreshing
 ? "vs-live-dot-warning"
 : "vs-live-dot-success",
 },
 ]}
 >
 {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

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
 summary.projectedScore > summary.readinessScore
 ? "up"
 : "neutral"
 }
 />

 <StatCard
 label="Core Systems Ready"
 value={`${summary.coreReady}/${summary.coreTotal}`}
 delta="Required production systems"
 tone={
 summary.coreTotal > 0 &&
 summary.coreReady === summary.coreTotal
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
 style={{
 width: `${clamp(summary.readinessScore)}%`,
 }}
 />
 </div>
 </div>

 <div className="live-summary-details">
 <div>
 <span>Projected readiness</span>
 <strong>{Math.round( summary.projectedScore)}%</strong>
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
 placeholder="Search intelligence feeds..."
 value={filters.q}
 onChange={(event) =>
 setFilters({
 ... filters,
 q: event.target.value,
 })
 }
 />

 <select
 value={filters.domain}
 onChange={(event) =>
 setFilters({
 ... filters,
 domain: event.target.value,
 })
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
 setFilters({
 ... filters,
 status: event.target.value,
 })
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
 {(rules.length
 ? rules
 : [
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
 detail:
 "Source is within its configured freshness threshold.",
 },
 {
 key: " coverage",
 label: "Coverage",
 weight: 25,
 detail:
 "Source meets the expected production record volume.",
 },
 {
 key: "quality",
 label: "Quality",
 weight: 20,
 detail:
 "Records are valid, complete, and non-duplicate.",
 },
 ]
 ).map((rule) => (
 <div key={rule.key || rule.label} className="vs-card-muted">
 <div className="live-rule-row">
 <div>
 <strong>{rule.label}</strong>
 <div className="vs-row-subtitle">{rule.detail}</div>
 </div>
 <Badge tone="accent">{num(rule.weight)}%</Badge>
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
 <span>Assign an owner and due date for a launch blocker.</span>
 </Link>

 <Link to="/command-center">
 <strong>Open Command Center</strong>
 <span>Route blockers into the execution board.</span>
 </Link>

 <Link to="/executive-workspace">
 <strong>Review Executive Owners</strong>
 <span>Confirm accountability across operating domains.</span>
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
