import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

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
        subtitle={`${item.state || "National"} • ${item.office || "Campaign"} • ${item.cycle || "2026"}`}
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
          .emc-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Pressure Score" value={pct(summary.pressure_score || 0)} delta={summary.mission_risk || "Stable"} tone={Number(summary.pressure_score || 0) >= 65 ? "down" : "up"} />
        <StatCard label="Critical Signals" value={fmt(summary.critical_signals)} delta="Needs review" tone={summary.critical_signals ? "down" : "up"} />
        <StatCard label="Open Tasks" value={fmt(summary.open_tasks)} delta="Execution queue" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="CRM Follow-Ups" value={fmt(summary.crm_followups)} delta="Stakeholder touches" tone={summary.crm_followups ? "neutral" : "up"} />
      </div>

      {loading ? (
        <EmptyState text="Loading Executive Mission Control..." />
      ) : (
        <div className="emc-grid">
          <div className="emc-stack">
            <div className="emc-hero">
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

            <SectionCard
              title="Next 24 Hours Mission Queue"
              subtitle="Ranked action items from signals, tasks, rapid response, and CRM follow-ups."
              right={<Badge tone={missionItems.length ? "demo" : "active"}>{missionItems.length} items</Badge>}
            >
              {!topMissionItems.length ? (
                <EmptyState text="No urgent mission items detected." />
              ) : (
                <div className="emc-stack">
                  {topMissionItems.map((item) => (
                    <MissionItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Workspace Health"
              subtitle="Pressure by campaign workspace."
              right={<Badge tone="accent">{workspaceHealth.length} workspaces</Badge>}
            >
              {!workspaceHealth.length ? (
                <EmptyState text="No workspace health records available." />
              ) : (
                <div className="emc-stack">
                  {workspaceHealth.map((item) => (
                    <WorkspaceHealthRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Critical Political Signals"
              subtitle="Highest pressure political signals currently driving mission risk."
              right={<Badge tone={criticalSignals.length ? "danger" : "active"}>{criticalSignals.length} signals</Badge>}
            >
              {!criticalSignals.length ? (
                <EmptyState text="No critical political signals detected." />
              ) : (
                <div className="emc-stack">
                  {criticalSignals.slice(0, 8).map((signal) => (
                    <SignalRow key={signal.id} signal={signal} />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="emc-stack">
            <SectionCard
              title="AI Strategic Recommendations"
              subtitle="Recommended moves for the next operating cycle."
            >
              <div className="emc-stack">
                {recommendations.map((item, index) => (
                  <div key={`${item}-${index}`} className="emc-recommendation">
                    {item}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Open Execution Tasks"
              subtitle="Tasks that still need owner action."
              right={<Badge tone={openTasks.length ? "demo" : "active"}>{openTasks.length} open</Badge>}
            >
              {!openTasks.length ? (
                <EmptyState text="No open execution tasks." />
              ) : (
                <div className="emc-stack">
                  {openTasks.slice(0, 8).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Rapid Response Queue"
              subtitle="Narrative response items requiring follow-through."
              right={<Badge tone={rapidResponses.length ? "demo" : "active"}>{rapidResponses.length} responses</Badge>}
            >
              {!rapidResponses.length ? (
                <EmptyState text="No open rapid responses." />
              ) : (
                <div className="emc-stack">
                  {rapidResponses.slice(0, 6).map((item) => (
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
            </SectionCard>

            <SectionCard
              title="CRM Follow-Ups"
              subtitle="Stakeholder touches and activities still open."
              right={<Badge tone={crmFollowups.length ? "demo" : "active"}>{crmFollowups.length} follow-ups</Badge>}
            >
              {!crmFollowups.length ? (
                <EmptyState text="No CRM follow-ups open." />
              ) : (
                <div className="emc-stack">
                  {crmFollowups.slice(0, 6).map((item) => (
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
            </SectionCard>

            <SectionCard
              title="Vendor Gaps"
              subtitle="Potential vendor coverage or operational capacity issues."
              right={<Badge tone={vendorGaps.length ? "demo" : "active"}>{vendorGaps.length} gaps</Badge>}
            >
              {!vendorGaps.length ? (
                <EmptyState text="No vendor gaps detected." />
              ) : (
                <div className="emc-stack">
                  {vendorGaps.slice(0, 6).map((vendor) => (
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
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
