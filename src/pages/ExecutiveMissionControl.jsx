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

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function pct(value) {
  return `${Number(value || 0).toFixed(0)}%`;
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

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high", "danger", "blocked"].includes(v)) return "danger";
  if (["elevated", "medium", "open", "pending"].includes(v)) return "demo";
  if (["stable", "complete", "completed", "done", "resolved"].includes(v)) return "active";
  return "accent";
}

function MissionItemRow({ item }) {
  return (
    <div className={`emc-row emc-${String(item.priority || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={clean(item.title || "Mission item")}
        subtitle={clean(item.description || item.action || "Review mission item.")}
        meta={[
          { label: "Type", value: item.type || "Mission" },
          { label: "Priority", value: item.priority || "Medium" },
          { label: "State", value: item.state || "National" },
          { label: "Source", value: item.source || "VoterSpheres" },
        ]}
        right={
          <div className="emc-row-actions">
            <Badge tone={tone(item.priority)}>{item.priority || "Mission"}</Badge>
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

function WorkspaceHealthRow({ item }) {
  return (
    <div className={`emc-row emc-${String(item.risk || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={item.name || "Workspace"}
        subtitle={`${item.state || "National"} â€¢ ${item.office || "Campaign"} â€¢ ${item.cycle || "2026"}`}
        meta={[
          { label: "Pressure", value: pct(item.pressure_score || 0) },
          { label: "Risk", value: item.risk || "Stable" },
          { label: "Open Tasks", value: item.open_tasks || 0 },
          { label: "Signals", value: item.signals || 0 },
        ]}
        right={<Badge tone={tone(item.risk)}>{item.risk || "Stable"}</Badge>}
      />
    </div>
  );
}

function SignalRow({ signal }) {
  return (
    <div className="emc-row">
      <ResponsiveRow
        title={clean(signal.title || "Political signal")}
        subtitle={clean(signal.summary || signal.source || "Signal")}
        meta={[
          { label: "Type", value: signal.signal_type || "signal" },
          { label: "Risk", value: signal.risk || signal.severity || "Stable" },
          { label: "State", value: signal.state || "National" },
          { label: "Score", value: signal.signal_score || 0 },
        ]}
        right={<Badge tone={tone(signal.risk || signal.severity)}>{signal.risk || signal.severity || "Signal"}</Badge>}
      />
    </div>
  );
}

function TaskRow({ task }) {
  return (
    <div className="emc-row">
      <ResponsiveRow
        title={task.title || "Open task"}
        subtitle={task.description || task.source || "Execution task"}
        meta={[
          { label: "Status", value: task.status || "open" },
          { label: "Priority", value: task.priority || "medium" },
          { label: "Owner", value: task.assigned_to || "Unassigned" },
          { label: "State", value: task.state || "National" },
        ]}
        right={<Badge tone={tone(task.priority || task.status)}>{task.priority || task.status || "Task"}</Badge>}
      />
    </div>
  );
}

function MissionControlExecutiveHeader({
  summary,
  missionItems,
  criticalSignals,
  openTasks,
  workspaceHealth,
  recommendations,
  rapidResponses,
  crmFollowups,
  vendorGaps,
  loading,
  refreshing,
  lastUpdated,
  onRefresh,
}) {
  const pressure = Number(summary.pressure_score || 0);
  const critical = Number(summary.critical_signals || criticalSignals.length || 0);
  const tasks = Number(summary.open_tasks || openTasks.length || 0);
  const crm = Number(summary.crm_followups || crmFollowups.length || 0);
  const gaps = Number(vendorGaps.length || 0);
  const workspaceRisk = workspaceHealth.filter((item) =>
    ["critical", "high", "elevated"].includes(String(item.risk || "").toLowerCase())
  ).length;

  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        96 -
          Math.min(28, pressure * 0.28) -
          Math.min(20, critical * 4) -
          Math.min(14, tasks * 0.85) -
          Math.min(10, crm * 0.7) -
          Math.min(10, gaps * 1.6) -
          Math.min(10, workspaceRisk * 2) +
          Math.min(8, recommendations.length * 1.2)
      )
    )
  );

  return (
    <div className="emc-exec-ribbon" id="mission-overview">
      <div className="emc-exec-copy">
        <span>Mission Control Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive operating center for the next 24 hours: critical signals, ranked mission actions,
          execution tasks, CRM follow-ups, workspace health, rapid response, vendor gaps, and AI recommendations.
        </p>

        <div className="emc-exec-badges">
          <Badge tone={tone(summary.mission_risk)}>{summary.mission_risk || "Stable"} Mission Risk</Badge>
          <Badge tone={critical ? "danger" : "active"}>{critical} Critical Signals</Badge>
          <Badge tone={tasks ? "demo" : "active"}>{tasks} Open Tasks</Badge>
          <Badge tone={gaps ? "demo" : "active"}>{gaps} Vendor Gaps</Badge>
          <Badge tone="accent">{missionItems.length} Mission Items</Badge>
          <Badge tone="info">{recommendations.length} AI Recommendations</Badge>
        </div>
      </div>

      <div className="emc-exec-grid">
        <div>
          <span>Pressure Score</span>
          <strong>{pct(pressure)}</strong>
        </div>
        <div>
          <span>Workspace Risk</span>
          <strong>{fmt(workspaceRisk)}</strong>
        </div>
        <div>
          <span>Rapid Response</span>
          <strong>{fmt(rapidResponses.length)}</strong>
        </div>
        <div>
          <span>Live Status</span>
          <strong>{loading || refreshing ? "Refreshing" : "Ready"}</strong>
        </div>
      </div>

      <div className="emc-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading || refreshing}>
          {refreshing ? "Refreshing Mission..." : "Refresh Mission Control"}
        </button>
        <Link to="/command-center">Command Center</Link>
        <Link to="/ai-war-room">AI War Room</Link>
        <Link to="/campaign-crm">Campaign CRM</Link>
        <Link to="/political-intelligence">Political Intelligence</Link>
        <Link to="/state-operations">State Operations</Link>
        <Link to="/vendors">Vendors</Link>
      </div>

      <div className="emc-exec-footer">
        <span>Updated: {lastUpdated || "Ready"}</span>
        <span>Auto Refresh: 30 seconds</span>
      </div>
    </div>
  );
}

function MissionActionCenter({ onRefresh }) {
  return (
    <div className="emc-action-center">
      <button type="button" onClick={onRefresh}>Refresh Mission Control</button>
      <Link to="/command-center">Open Command Center</Link>
      <Link to="/ai-war-room">Open AI War Room</Link>
      <Link to="/campaign-crm">Open Campaign CRM</Link>
      <Link to="/political-intelligence">Open Political Intelligence</Link>
      <Link to="/executive-decision-intelligence">Executive Intelligence</Link>
      <Link to="/state-operations">Open State Operations</Link>
      <Link to="/vendors">Open Vendor Network</Link>
      <Link to="/narrative-response">Open Rapid Response</Link>
    </div>
  );
}

export default function ExecutiveMissionControl() {
  const [data, setData] = useState({
    summary: {},
    mission_items: [],
    critical_signals: [],
    open_tasks: [],
    rapid_responses: [],
    crm_followups: [],
    workspace_health: [],
    vendor_gaps: [],
    ai_recommendations: [],
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

      const result = await api.executiveMissionControl();

      setData({
        summary: result?.summary || {},
        mission_items: arr(result?.mission_items),
        critical_signals: arr(result?.critical_signals),
        open_tasks: arr(result?.open_tasks),
        rapid_responses: arr(result?.rapid_responses),
        crm_followups: arr(result?.crm_followups),
        workspace_health: arr(result?.workspace_health),
        vendor_gaps: arr(result?.vendor_gaps),
        ai_recommendations: arr(result?.ai_recommendations),
        updated_at: result?.updated_at,
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
          "Failed to load Executive Mission Control."
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

  const summary = data.summary || {};
  const missionItems = arr(data.mission_items);
  const criticalSignals = arr(data.critical_signals);
  const openTasks = arr(data.open_tasks);
  const workspaceHealth = arr(data.workspace_health);
  const recommendations = arr(data.ai_recommendations);
  const rapidResponses = arr(data.rapid_responses);
  const crmFollowups = arr(data.crm_followups);
  const vendorGaps = arr(data.vendor_gaps);

  const topMissionItems = useMemo(() => missionItems.slice(0, 12), [missionItems]);

  const backlogTotal =
    openTasks.length +
    rapidResponses.length +
    crmFollowups.length +
    vendorGaps.length;

  const navSections = [
    { id: "mission-overview", label: "Overview" },
    { id: "mission-metrics", label: "Metrics" },
    { id: "mission-hero", label: "Command" },
    { id: "mission-queue", label: "Mission Queue", badge: missionItems.length },
    { id: "mission-workspaces", label: "Workspaces", badge: workspaceHealth.length },
    { id: "mission-signals", label: "Signals", badge: criticalSignals.length },
    { id: "mission-ai", label: "AI Recommendations", badge: recommendations.length },
    { id: "mission-tasks", label: "Tasks", badge: openTasks.length },
    { id: "mission-rapid-response", label: "Rapid Response", badge: rapidResponses.length },
    { id: "mission-crm", label: "CRM", badge: crmFollowups.length },
    { id: "mission-vendors", label: "Vendor Gaps", badge: vendorGaps.length },
    { id: "mission-actions", label: "Actions", badge: backlogTotal },
  ];

  return (
    <PageShell
      eyebrow="Executive Mission Control"
      title="Executive Mission Control"
      description="The next-24-hours operating center for critical signals, execution tasks, rapid responses, CRM follow-ups, workspace health, vendor gaps, and AI recommendations."
      tickerItems={[
        {
          label: "Mission Risk",
          value: summary.mission_risk || "Stable",
          dotClass: ["Critical", "High"].includes(summary.mission_risk)
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Pressure",
          value: pct(summary.pressure_score || 0),
          dotClass: Number(summary.pressure_score || 0) >= 65
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Critical Signals",
          value: `${summary.critical_signals || 0}`,
          dotClass: summary.critical_signals ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Open Tasks",
          value: `${summary.open_tasks || 0}`,
          dotClass: summary.open_tasks ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .emc-exec-ribbon {
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

        .emc-exec-copy { min-width: 0; }

        .emc-exec-copy span,
        .emc-exec-grid span,
        .emc-exec-footer span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .emc-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .emc-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .emc-exec-badges,
        .emc-exec-actions,
        .emc-exec-footer,
        .emc-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .emc-exec-badges { margin-top: 14px; }

        .emc-exec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .emc-exec-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .emc-exec-grid strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .emc-exec-actions,
        .emc-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .emc-exec-actions button,
        .emc-exec-actions a,
        .emc-action-center button,
        .emc-action-center a {
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

        .emc-exec-actions button:hover,
        .emc-exec-actions a:hover,
        .emc-action-center button:hover,
        .emc-action-center a:hover {
          border-color: rgba(248, 113, 113, 0.44);
          background: rgba(239, 68, 68, 0.14);
          color: white;
        }

        .emc-exec-actions button:disabled { opacity: 0.62; cursor: not-allowed; }

        .emc-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }


        .emc-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
          gap: 18px;
          align-items: start;
        }

        .emc-stack {
          display: grid;
          gap: 14px;
        }

        .emc-hero {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.24), transparent 34%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.84));
          padding: 22px;
        }

        .emc-hero-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .emc-hero h2 {
          margin: 0;
          color: white;
          font-size: 32px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .emc-hero p {
          margin: 8px 0 0;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
          line-height: 1.55;
        }

        .emc-pressure {
          margin-top: 18px;
          color: white;
          font-size: 72px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.08em;
        }

        .emc-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .emc-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .emc-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .emc-critical,
        .emc-high {
          border-color: rgba(248, 113, 113, 0.38);
        }

        .emc-elevated,
        .emc-medium {
          border-color: rgba(251, 191, 36, 0.32);
        }

        .emc-row-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .emc-recommendation {
          border-radius: 18px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          padding: 14px;
          color: rgba(226, 232, 240, 0.92);
          font-size: 13px;
          line-height: 1.55;
        }

        @media (max-width: 1100px) {
          .emc-grid,
          .emc-exec-ribbon {
            grid-template-columns: 1fr;
          }

          .emc-exec-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="emc-exec-stack">
        <MissionControlExecutiveHeader
          summary={summary}
          missionItems={missionItems}
          criticalSignals={criticalSignals}
          openTasks={openTasks}
          workspaceHealth={workspaceHealth}
          recommendations={recommendations}
          rapidResponses={rapidResponses}
          crmFollowups={crmFollowups}
          vendorGaps={vendorGaps}
          loading={loading}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          onRefresh={() => load({ quiet: true })}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <CollapsibleSection
        id="mission-metrics"
        title="Mission Control Metrics"
        subtitle="Pressure score, critical signals, execution queue, and stakeholder follow-ups."
        defaultOpen
        right={<Badge tone={tone(summary.mission_risk)}>{summary.mission_risk || "Stable"}</Badge>}
      >
      <div className="vs-grid-4">
        <StatCard label="Pressure Score" value={pct(summary.pressure_score || 0)} delta={summary.mission_risk || "Stable"} tone={Number(summary.pressure_score || 0) >= 65 ? "down" : "up"} />
        <StatCard label="Critical Signals" value={fmt(summary.critical_signals)} delta="Needs review" tone={summary.critical_signals ? "down" : "up"} />
        <StatCard label="Open Tasks" value={fmt(summary.open_tasks)} delta="Execution queue" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="CRM Follow-Ups" value={fmt(summary.crm_followups)} delta="Stakeholder touches" tone={summary.crm_followups ? "neutral" : "up"} />
      </div>
      </CollapsibleSection>

      {loading ? (
        <EmptyState text="Loading Executive Mission Control..." />
      ) : (
        <div className="emc-grid">
          <div className="emc-stack">
            <div id="mission-hero" className="emc-hero">
              <div className="emc-hero-top">
                <div>
                  <h2>What should the firm do in the next 24 hours?</h2>
                  <p>
                    Mission Control converts live political signals, workspaces, tasks, CRM follow-ups,
                    rapid responses, and vendor gaps into a ranked action queue.
                  </p>
                </div>

                <Badge tone={tone(summary.mission_risk)}>{summary.mission_risk || "Stable"}</Badge>
              </div>

              <div className="emc-pressure">{pct(summary.pressure_score || 0)}</div>

              <div className="emc-actions">
                <Link className="vs-button" to="/command-center">Open Command Center</Link>
                <Link className="vs-button vs-button-secondary" to="/campaign-crm">Campaign CRM</Link>
                <Link className="vs-button vs-button-secondary" to="/political-signals">Political Signals</Link>
                <Link className="vs-button vs-button-secondary" to="/narrative-response">Rapid Response</Link>
                <button type="button" className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                  Refresh
                </button>
              </div>
            </div>

            <CollapsibleSection
              id="mission-queue"
              title="Next 24 Hours Mission Queue"
              subtitle="Ranked action items from signals, tasks, rapid response, and CRM follow-ups."
              right={<Badge tone={missionItems.length ? "demo" : "active"}>{missionItems.length} items</Badge>}
            >
              {!topMissionItems.length ? (
                <EmptyState text="No urgent mission items detected." />
              ) : (
                <ShowMoreList
                  items={missionItems}
                  initialCount={12}
                  showAllLabel={(count) => `Show All ${count} Mission Items`}
                  className="emc-stack"
                  renderItem={(item) => <MissionItemRow item={item} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="mission-workspaces"
              title="Workspace Health"
              subtitle="Pressure by campaign workspace."
              right={<Badge tone="accent">{workspaceHealth.length} workspaces</Badge>}
            >
              {!workspaceHealth.length ? (
                <EmptyState text="No workspace health records available." />
              ) : (
                <ShowMoreList
                  items={workspaceHealth}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Workspaces`}
                  className="emc-stack"
                  renderItem={(item) => <WorkspaceHealthRow item={item} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="mission-signals"
              title="Critical Political Signals"
              subtitle="Highest pressure political signals currently driving mission risk."
              right={<Badge tone={criticalSignals.length ? "danger" : "active"}>{criticalSignals.length} signals</Badge>}
            >
              {!criticalSignals.length ? (
                <EmptyState text="No critical political signals detected." />
              ) : (
                <ShowMoreList
                  items={criticalSignals}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Signals`}
                  className="emc-stack"
                  renderItem={(signal) => <SignalRow signal={signal} />}
                />
              )}
            </CollapsibleSection>
          </div>

          <div className="emc-stack">
            <CollapsibleSection
              id="mission-ai"
              title="AI Strategic Recommendations"
              subtitle="Recommended moves for the next operating cycle."
            >
              {!recommendations.length ? (
                <EmptyState text="No AI strategic recommendations available." />
              ) : (
                <ShowMoreList
                  items={recommendations}
                  initialCount={6}
                  showAllLabel={(count) => `Show All ${count} AI Recommendations`}
                  className="emc-stack"
                  renderItem={(item) => (
                    <div className="emc-recommendation">
                      {typeof item === "string" ? item : item.title || item.recommendation || item.detail || "AI recommendation"}
                    </div>
                  )}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="mission-tasks"
              title="Open Execution Tasks"
              subtitle="Tasks that still need owner action."
              right={<Badge tone={openTasks.length ? "demo" : "active"}>{openTasks.length} open</Badge>}
            >
              {!openTasks.length ? (
                <EmptyState text="No open execution tasks." />
              ) : (
                <ShowMoreList
                  items={openTasks}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Tasks`}
                  className="emc-stack"
                  renderItem={(task) => <TaskRow task={task} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="mission-rapid-response"
              title="Rapid Response Queue"
              subtitle="Narrative response items requiring follow-through."
              right={<Badge tone={rapidResponses.length ? "demo" : "active"}>{rapidResponses.length} responses</Badge>}
            >
              {!rapidResponses.length ? (
                <EmptyState text="No open rapid responses." />
              ) : (
                <div className="emc-stack">
                  {rapidResponses.slice(0, 12).map((item) => (
                    <MissionItemRow
                      key={item.id}
                      item={{
                        id: item.id,
                        type: "Rapid Response",
                        title: item.title || "Rapid response",
                        description: item.response_strategy || item.narrative_summary || "Narrative response",
                        priority: item.threat_level || item.status || "Medium",
                        state: item.state || "National",
                        source: "Narrative Rapid Response",
                      }}
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="mission-crm"
              title="CRM Follow-Ups"
              subtitle="Stakeholder touches and activities still open."
              right={<Badge tone={crmFollowups.length ? "demo" : "active"}>{crmFollowups.length} follow-ups</Badge>}
            >
              {!crmFollowups.length ? (
                <EmptyState text="No CRM follow-ups open." />
              ) : (
                <div className="emc-stack">
                  {crmFollowups.slice(0, 12).map((item) => (
                    <MissionItemRow
                      key={item.id}
                      item={{
                        id: item.id,
                        type: "CRM Follow-Up",
                        title: item.title || "CRM follow-up",
                        description: item.body || item.outcome || item.contact_name || "Follow up with stakeholder.",
                        priority: "Medium",
                        state: item.state || "National",
                        source: "Campaign CRM",
                      }}
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="mission-vendors"
              title="Vendor Gaps"
              subtitle="Potential vendor coverage or operational capacity issues."
              right={<Badge tone={vendorGaps.length ? "demo" : "active"}>{vendorGaps.length} gaps</Badge>}
            >
              {!vendorGaps.length ? (
                <EmptyState text="No vendor gaps detected." />
              ) : (
                <div className="emc-stack">
                  {vendorGaps.slice(0, 12).map((vendor) => (
                    <MissionItemRow
                      key={vendor.id}
                      item={{
                        id: vendor.id,
                        type: "Vendor Gap",
                        title: vendor.name || vendor.vendor_name || "Vendor gap",
                        description: vendor.category || vendor.notes || "Review vendor coverage.",
                        priority: vendor.risk || vendor.coverage_tier || "Medium",
                        state: vendor.state || "National",
                        source: "Vendor Intelligence",
                      }}
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </div>
        </div>
      )}

      <CollapsibleSection
        id="mission-actions"
        title="Executive Action Center"
        subtitle="Move Mission Control signals into the connected VoterSpheres command modules."
        defaultOpen={false}
        right={<Badge tone="active">Mission Handoff</Badge>}
      >
        <MissionActionCenter onRefresh={() => load({ quiet: true })} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
