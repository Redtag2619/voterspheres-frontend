import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

import useLiveChannel from "../hooks/useLiveChannel";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

const fallbackData = {
  metrics: [],
  summary: {},
  threats: [],
  queue: [],
  signals: [],
  command_cards: [],
  recommendations: [],
  tasks: [],
  crm_followups: [],
  rapid_responses: [],
  vendor_gaps: [],
  reports: [],
};

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function pct(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function tone(value) {
  const v = String(value || "").toLowerCase();

  if (["critical", "high", "danger", "p1"].includes(v)) return "danger";
  if (["elevated", "medium", "p2", "open", "pending"].includes(v)) return "demo";
  if (["stable", "complete", "completed", "resolved"].includes(v)) return "active";
  return "accent";
}

function severityTone(value) {
  return tone(value);
}

function matchesFilters(item, filters = {}) {
  if (!item) return false;
  if (filters.state && item.state !== filters.state) return false;
  if (filters.office && item.office !== filters.office) return false;
  if (filters.risk && item.risk !== filters.risk) return false;
  return true;
}

function ThreatRow({ item }) {
  return (
    <div className={`war-row war-${String(item.severity || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={clean(item.title)}
        subtitle={clean(item.recommendation || "Review this active threat.")}
        meta={[
          { label: "Severity", value: item.severity || "Info" },
          { label: "Source", value: item.source || "—" },
          { label: "Score", value: item.score || item.velocity || "Live" },
          { label: "Risk", value: item.risk || "Watch" },
        ]}
        alert={
          ["critical", "high"].includes(String(item.severity || "").toLowerCase())
            ? "vs-live-dot"
            : "vs-live-dot-warning"
        }
        right={
          <div className="war-row-actions">
            <Badge tone={severityTone(item.severity)}>{item.severity || "Info"}</Badge>
            {item.url ? (
              <a className="vs-button vs-button-secondary" href={item.url} target="_blank" rel="noreferrer">
                Read
              </a>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

function QueueRow({ item }) {
  return (
    <div className={`war-row war-${String(item.priority || "p2").toLowerCase()}`}>
      <ResponsiveRow
        title={clean(item.item || "Response item")}
        subtitle={`Owner: ${item.owner || "Command Team"} • ${item.action || "Review and assign owner."}`}
        meta={[
          { label: "Priority", value: item.priority || "P2" },
          { label: "Owner", value: item.owner || "—" },
          { label: "ETA", value: item.eta || "Today" },
          { label: "Risk", value: item.risk || "Watch" },
        ]}
        alert={String(item.priority || "").toLowerCase() === "p1" ? "vs-live-dot" : "vs-live-dot-warning"}
        right={<Badge tone={tone(item.priority)}>{item.priority || "P2"}</Badge>}
      />
    </div>
  );
}

function SignalRow({ item }) {
  return (
    <div className="war-row">
      <ResponsiveRow
        title={item.channel || "Signal"}
        subtitle={clean(item.text || "Signal entered the war room.")}
        meta={[
          { label: "Time", value: item.time || "Now" },
          { label: "Channel", value: item.channel || "—" },
          { label: "State", value: item.state || "National" },
          { label: "Risk", value: item.risk || "Watch" },
        ]}
        alert="vs-live-dot-success"
        right={<Badge tone={tone(item.risk)}>{item.risk || "Signal"}</Badge>}
      />
    </div>
  );
}

function WorkspaceCard({ item }) {
  return (
    <div className={`war-card war-${String(item.risk || "stable").toLowerCase()}`}>
      <div className="war-card-top">
        <div>
          <strong>{item.title || "Workspace"}</strong>
          <span>{item.state || "National"} • {item.office || "Campaign"} • {item.cycle || "2026"}</span>
        </div>
        <Badge tone={tone(item.risk)}>{item.risk || "Stable"}</Badge>
      </div>

      <div className="war-pressure">{pct(item.pressure_score || 0)}</div>

      <div className="war-mini-grid">
        <div><span>Open Tasks</span><b>{fmt(item.open_tasks)}</b></div>
        <div><span>Signals</span><b>{fmt(item.signals)}</b></div>
      </div>
    </div>
  );
}

function RecommendationRow({ item }) {
  return (
    <div className="war-row">
      <ResponsiveRow
        title={clean(item.title || "Strategic recommendation")}
        subtitle={clean(item.why || item.expected_impact || "Review recommendation.")}
        meta={[
          { label: "Category", value: item.category || "Advisor" },
          { label: "Priority", value: item.priority || "Medium" },
          { label: "State", value: item.state || "National" },
          { label: "Confidence", value: pct(item.confidence || 0) },
        ]}
        right={<Badge tone={tone(item.confidence || item.priority)}>{pct(item.confidence || 0)}</Badge>}
      />
    </div>
  );
}

function ReportRow({ item }) {
  return (
    <div className="war-row">
      <ResponsiveRow
        title={item.title || "Intelligence report"}
        subtitle={clean(item.executive_summary || "Generated intelligence report.")}
        meta={[
          { label: "Type", value: String(item.report_type || "report").replace(/_/g, " ") },
          { label: "State", value: item.state || "National" },
          { label: "Status", value: item.status || "generated" },
          { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleDateString() : "—" },
        ]}
        right={<Link className="vs-button vs-button-secondary" to="/intelligence-reports">Open</Link>}
      />
    </div>
  );
}

function WarRoomExecutiveHeader({
  summary,
  threats,
  queue,
  signals,
  commandCards,
  recommendations,
  reports,
  tasks,
  crmFollowups,
  rapidResponses,
  vendorGaps,
  highThreats,
  loading,
  refreshing,
  lastUpdated,
  onRefresh,
}) {
  const pressure = Number(summary.pressure_score || 0);
  const queuePressure = queue.length + tasks.length + crmFollowups.length + rapidResponses.length + vendorGaps.length;
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        96 -
          Math.min(28, pressure * 0.28) -
          Math.min(24, highThreats * 5) -
          Math.min(14, queue.length * 1.5) -
          Math.min(10, queuePressure * 0.75) +
          Math.min(8, commandCards.length * 1.25) +
          Math.min(6, reports.length * 1.2)
      )
    )
  );

  return (
    <div className="war-exec-ribbon" id="war-overview">
      <div className="war-exec-copy">
        <span>Election War Room Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive live-command layer for mission risk, threat detection, signal velocity,
          strategic recommendations, operational backlog, CRM follow-ups, workspace pressure,
          and intelligence report review.
        </p>

        <div className="war-exec-badges">
          <Badge tone={tone(summary.mission_risk)}>{summary.mission_risk || "Stable"} Mission Risk</Badge>
          <Badge tone={highThreats ? "danger" : "active"}>{highThreats} High Threats</Badge>
          <Badge tone={queue.length ? "demo" : "active"}>{queue.length} Queue Items</Badge>
          <Badge tone="info">{signals.length} Signals</Badge>
          <Badge tone="accent">{commandCards.length} Workspaces</Badge>
          <Badge tone="active">{reports.length} Reports</Badge>
        </div>
      </div>

      <div className="war-exec-grid">
        <div>
          <span>Pressure Score</span>
          <strong>{pct(pressure)}</strong>
        </div>
        <div>
          <span>Recommendations</span>
          <strong>{fmt(recommendations.length)}</strong>
        </div>
        <div>
          <span>Operational Backlog</span>
          <strong>{fmt(queuePressure)}</strong>
        </div>
        <div>
          <span>Live Status</span>
          <strong>{loading || refreshing ? "Refreshing" : "Ready"}</strong>
        </div>
      </div>

      <div className="war-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading || refreshing}>
          {refreshing ? "Refreshing War Room..." : "Refresh War Room"}
        </button>
        <Link to="/mission-control">Mission Control</Link>
        <Link to="/strategic-advisor">Strategic Advisor</Link>
        <Link to="/command-center">Command Center</Link>
        <Link to="/intelligence-reports">Reports</Link>
        <Link to="/campaign-crm">CRM</Link>
      </div>

      <div className="war-exec-footer">
        <span>Updated: {lastUpdated || "Ready"}</span>
        <span>Live Channel: intelligence:warroom</span>
      </div>
    </div>
  );
}

function WarRoomActionCenter({ onRefresh }) {
  return (
    <div className="war-action-center">
      <button type="button" onClick={onRefresh}>Refresh War Room</button>
      <Link to="/mission-control">Open Mission Control</Link>
      <Link to="/strategic-advisor">Open Strategic Advisor</Link>
      <Link to="/command-center">Open Command Center</Link>
      <Link to="/intelligence-reports">Open Intelligence Reports</Link>
      <Link to="/campaign-crm">Open Campaign CRM</Link>
      <Link to="/political-intelligence">Open Political Intelligence</Link>
    </div>
  );
}

export default function AIWarRoom() {
  const { filters } = useExecutiveFilters();

  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [liveBanner, setLiveBanner] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result =
        typeof api.electionWarRoom === "function"
          ? await api.electionWarRoom()
          : await api.warRoom();

      setData({
        metrics: arr(result?.metrics),
        summary: result?.summary || {},
        threats: arr(result?.threats),
        queue: arr(result?.queue),
        signals: arr(result?.signals),
        command_cards: arr(result?.command_cards),
        recommendations: arr(result?.recommendations),
        tasks: arr(result?.tasks),
        crm_followups: arr(result?.crm_followups),
        rapid_responses: arr(result?.rapid_responses),
        vendor_gaps: arr(result?.vendor_gaps),
        reports: arr(result?.reports),
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Election War Room."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  useLiveChannel("intelligence:warroom", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};
      setLiveBanner(`Live threat detected: ${threat.title || "New war room threat"}`);

      setData((prev) => ({
        ...(prev || fallbackData),
        threats: [
          {
            id: `live-threat-${Date.now()}`,
            state: threat.state || "National",
            office: threat.office || "Campaign",
            risk: threat.risk || "Elevated",
            severity: threat.severity || "High",
            ...threat,
          },
          ...arr(prev?.threats),
        ].slice(0, 12),
      }));
    }

    if (event.type === "warroom.signal_detected") {
      const signal = event.payload || {};
      setLiveBanner(`Live signal detected: ${signal.channel || "New signal"}`);

      setData((prev) => ({
        ...(prev || fallbackData),
        signals: [
          {
            id: `live-signal-${Date.now()}`,
            state: signal.state || "National",
            office: signal.office || "Campaign",
            risk: signal.risk || "Elevated",
            ...signal,
          },
          ...arr(prev?.signals),
        ].slice(0, 16),
      }));
    }
  });

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [liveBanner]);

  const threats = useMemo(
    () => arr(data.threats).filter((item) => matchesFilters(item, filters)),
    [data.threats, filters]
  );

  const queue = useMemo(
    () => arr(data.queue).filter((item) => matchesFilters(item, filters)),
    [data.queue, filters]
  );

  const signals = useMemo(
    () => arr(data.signals).filter((item) => matchesFilters(item, filters)),
    [data.signals, filters]
  );

  const highThreats = threats.filter((item) =>
    ["critical", "high"].includes(String(item.severity || "").toLowerCase())
  ).length;

  const summary = data.summary || {};
  const metrics = arr(data.metrics);
  const commandCards = arr(data.command_cards);
  const recommendations = arr(data.recommendations);
  const tasks = arr(data.tasks);
  const crmFollowups = arr(data.crm_followups);
  const rapidResponses = arr(data.rapid_responses);
  const vendorGaps = arr(data.vendor_gaps);
  const reports = arr(data.reports);

  const backlogCount = tasks.length + crmFollowups.length + rapidResponses.length + vendorGaps.length;

  const navSections = [
    { id: "war-overview", label: "Overview" },
    { id: "war-metrics", label: "Metrics" },
    { id: "war-command-hero", label: "Mission" },
    { id: "war-threats", label: "Threat Board", badge: threats.length },
    { id: "war-queue", label: "Response Queue", badge: queue.length },
    { id: "war-workspaces", label: "Workspaces", badge: commandCards.length },
    { id: "war-signals", label: "Signals", badge: signals.length },
    { id: "war-advisor", label: "Strategic Advisor", badge: recommendations.length },
    { id: "war-backlog", label: "Backlog", badge: backlogCount },
    { id: "war-reports", label: "Reports", badge: reports.length },
    { id: "war-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Election War Room"
      title="Election War Room"
      description="Single-screen command center for Mission Control, Strategic Advisor, live signals, response queue, CRM follow-ups, reports, and workspace pressure."
      demo={demoMode}
      demoText="Demo mode is active for this module."
      tickerItems={[
        { label: "Mission Risk", value: summary.mission_risk || "Stable", dotClass: ["Critical", "High"].includes(summary.mission_risk) ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Pressure", value: pct(summary.pressure_score || 0), dotClass: Number(summary.pressure_score || 0) >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "High Threats", value: `${highThreats}`, dotClass: highThreats ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Queue", value: `${queue.length} live`, dotClass: queue.length ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .war-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(239, 68, 68, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.16), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .war-exec-copy {
          min-width: 0;
        }

        .war-exec-copy span,
        .war-exec-grid span,
        .war-exec-footer span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .war-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .war-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .war-exec-badges,
        .war-exec-actions,
        .war-exec-footer,
        .war-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .war-exec-badges {
          margin-top: 14px;
        }

        .war-exec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .war-exec-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .war-exec-grid strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .war-exec-actions,
        .war-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .war-exec-actions button,
        .war-exec-actions a,
        .war-action-center button,
        .war-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .war-exec-actions button:hover,
        .war-exec-actions a:hover,
        .war-action-center button:hover,
        .war-action-center a:hover {
          border-color: rgba(248, 113, 113, 0.44);
          background: rgba(239, 68, 68, 0.14);
          color: white;
        }

        .war-exec-actions button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .war-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }


        .war-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
          gap: 18px;
          align-items: start;
        }

        .war-stack {
          display: grid;
          gap: 14px;
        }

        .war-hero {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.24), transparent 34%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.84));
          padding: 22px;
        }

        .war-hero-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .war-hero h2 {
          margin: 0;
          color: white;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .war-hero p {
          margin: 10px 0 0;
          color: rgba(203, 213, 225, 0.74);
          font-size: 13px;
          line-height: 1.6;
        }

        .war-pressure {
          margin-top: 18px;
          color: white;
          font-size: 72px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.08em;
        }

        .war-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .war-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .war-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .war-critical,
        .war-high,
        .war-p1 {
          border-color: rgba(248, 113, 113, 0.38);
        }

        .war-elevated,
        .war-medium,
        .war-p2 {
          border-color: rgba(251, 191, 36, 0.32);
        }

        .war-row-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .war-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .war-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 34%),
            rgba(15, 23, 42, 0.62);
          padding: 16px;
        }

        .war-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .war-card strong {
          display: block;
          color: white;
          font-size: 14px;
          font-weight: 900;
        }

        .war-card span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.66);
          font-size: 12px;
        }

        .war-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .war-mini-grid div {
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.38);
          border: 1px solid rgba(148, 163, 184, 0.12);
          padding: 10px;
        }

        .war-mini-grid span {
          color: rgba(203, 213, 225, 0.62);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .war-mini-grid b {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 18px;
        }

        @media (max-width: 1100px) {
          .war-grid,
          .war-card-grid,
          .war-exec-ribbon {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="war-exec-stack">
        <WarRoomExecutiveHeader
          summary={summary}
          threats={threats}
          queue={queue}
          signals={signals}
          commandCards={commandCards}
          recommendations={recommendations}
          reports={reports}
          tasks={tasks}
          crmFollowups={crmFollowups}
          rapidResponses={rapidResponses}
          vendorGaps={vendorGaps}
          highThreats={highThreats}
          loading={loading}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          onRefresh={() => load({ quiet: true })}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {liveBanner ? <div className="vs-banner">{liveBanner}</div> : null}

      <CollapsibleSection
        id="war-metrics"
        title="War Room Metrics"
        subtitle="Mission risk, pressure, threat count, queue volume, live signals, and generated reports."
        defaultOpen
        right={<Badge tone={highThreats ? "danger" : "active"}>{highThreats} High Threats</Badge>}
      >
      <div className="vs-grid-4">
        {metrics.length ? (
          metrics.map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          ))
        ) : (
          <>
            <StatCard label="Threats" value={fmt(threats.length)} delta="Live board" tone={threats.length ? "down" : "up"} />
            <StatCard label="Queue" value={fmt(queue.length)} delta="Response items" tone={queue.length ? "neutral" : "up"} />
            <StatCard label="Signals" value={fmt(signals.length)} delta="Signal stream" tone="up" />
            <StatCard label="Reports" value={fmt(reports.length)} delta="Generated briefs" tone="up" />
          </>
        )}
      </div>
      </CollapsibleSection>

      {loading ? (
        <EmptyState text="Loading Election War Room..." />
      ) : (
        <div className="war-grid">
          <div className="war-stack">
            <div id="war-command-hero" className="war-hero">
              <div className="war-hero-top">
                <div>
                  <h2>Election War Room</h2>
                  <p>
                    Live command layer combining Mission Control, Strategic Advisor, political signals,
                    execution queue, CRM follow-ups, reports, and workspace pressure.
                  </p>
                </div>
                <Badge tone={tone(summary.mission_risk)}>{summary.mission_risk || "Stable"}</Badge>
              </div>

              <div className="war-pressure">{pct(summary.pressure_score || 0)}</div>

              <div className="war-actions">
                <Link className="vs-button" to="/mission-control">Mission Control</Link>
                <Link className="vs-button vs-button-secondary" to="/strategic-advisor">Strategic Advisor</Link>
                <Link className="vs-button vs-button-secondary" to="/intelligence-reports">Reports</Link>
                <Link className="vs-button vs-button-secondary" to="/campaign-crm">CRM</Link>
                <button className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                  Refresh
                </button>
              </div>
            </div>

            <CollapsibleSection
              id="war-threats"
              title="Live Threat Board"
              subtitle="Highest-priority political and operational pressure entering the war room."
              defaultOpen
              right={<Badge tone={threats.length ? "danger" : "active"}>{threats.length} threats</Badge>}
            >
              {!threats.length ? (
                <EmptyState text="No active threats available for the current filters." />
              ) : (
                <ShowMoreList
                  items={threats}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Threats`}
                  className="war-stack"
                  renderItem={(item) => <ThreatRow item={item} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="war-queue"
              title="Response Queue"
              subtitle="Next-cycle command items from Mission Control."
              defaultOpen
              right={<Badge tone={queue.length ? "demo" : "active"}>{queue.length} live</Badge>}
            >
              {!queue.length ? (
                <EmptyState text="No response queue items available for the current filters." />
              ) : (
                <ShowMoreList
                  items={queue}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Queue Items`}
                  className="war-stack"
                  renderItem={(item) => <QueueRow item={item} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="war-workspaces"
              title="Workspace Command Cards"
              subtitle="Workspace pressure and execution status."
              defaultOpen={false}
              right={<Badge tone="accent">{commandCards.length} workspaces</Badge>}
            >
              {!commandCards.length ? (
                <EmptyState text="No workspace command cards available." />
              ) : (
                <ShowMoreList
                  items={commandCards}
                  initialCount={6}
                  showAllLabel={(count) => `Show All ${count} Workspaces`}
                  className="war-card-grid"
                  renderItem={(item) => <WorkspaceCard item={item} />}
                />
              )}
            </CollapsibleSection>
          </div>

          <div className="war-stack">
            <CollapsibleSection
              id="war-signals"
              title="Signal Stream"
              subtitle="Live intelligence entering the terminal."
              defaultOpen
              right={<Badge tone="info">{signals.length} active</Badge>}
            >
              {!signals.length ? (
                <EmptyState text="No live signals available for the current filters." />
              ) : (
                <ShowMoreList
                  items={signals}
                  initialCount={12}
                  showAllLabel={(count) => `Show All ${count} Signals`}
                  className="war-stack"
                  renderItem={(item) => <SignalRow item={item} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="war-advisor"
              title="Strategic Advisor Feed"
              subtitle="AI-ranked strategic recommendations."
              defaultOpen={false}
              right={<Badge tone={recommendations.length ? "demo" : "active"}>{recommendations.length}</Badge>}
            >
              {!recommendations.length ? (
                <EmptyState text="No strategic advisor recommendations available." />
              ) : (
                <ShowMoreList
                  items={recommendations}
                  initialCount={6}
                  showAllLabel={(count) => `Show All ${count} Recommendations`}
                  className="war-stack"
                  renderItem={(item) => <RecommendationRow item={item} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="war-backlog"
              title="Operational Backlog"
              subtitle="Tasks, CRM follow-ups, rapid responses, and vendor gaps."
              defaultOpen={false}
              right={<Badge tone="accent">{tasks.length + crmFollowups.length + rapidResponses.length + vendorGaps.length}</Badge>}
            >
              <div className="war-stack">
                {tasks.slice(0, 6).map((task) => (
                  <QueueRow
                    key={`task-${task.id}`}
                    item={{
                      id: task.id,
                      priority: String(task.priority || "").toLowerCase() === "high" ? "P1" : "P2",
                      owner: task.assigned_to || "Command Center",
                      item: task.title || "Task",
                      eta: "Today",
                      risk: task.priority || "Medium",
                      action: task.description || "Review task.",
                    }}
                  />
                ))}

                {crmFollowups.slice(0, 6).map((item) => (
                  <QueueRow
                    key={`crm-${item.id}`}
                    item={{
                      id: item.id,
                      priority: "P2",
                      owner: "CRM",
                      item: item.title || "CRM Follow-Up",
                      eta: "Today",
                      risk: "Medium",
                      action: item.contact_name || item.outcome || "Complete stakeholder follow-up.",
                    }}
                  />
                ))}

                {!tasks.length && !crmFollowups.length && !rapidResponses.length && !vendorGaps.length ? (
                  <EmptyState text="No operational backlog detected." />
                ) : null}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="war-reports"
              title="Recent Intelligence Reports"
              subtitle="Latest generated reports and briefs."
              defaultOpen={false}
              right={<Badge tone="active">{reports.length}</Badge>}
            >
              {!reports.length ? (
                <EmptyState text="No reports generated yet." />
              ) : (
                <ShowMoreList
                  items={reports}
                  initialCount={5}
                  showAllLabel={(count) => `Show All ${count} Reports`}
                  className="war-stack"
                  renderItem={(item) => <ReportRow item={item} />}
                />
              )}
            </CollapsibleSection>
          </div>
        </div>
      )}

      <CollapsibleSection
        id="war-actions"
        title="Executive Action Center"
        subtitle="Move from the War Room into connected VoterSpheres execution modules."
        defaultOpen={false}
        right={<Badge tone="active">Command Links</Badge>}
      >
        <WarRoomActionCenter onRefresh={() => load({ quiet: true })} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
