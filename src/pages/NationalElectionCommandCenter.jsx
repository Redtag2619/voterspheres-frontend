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
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.reports)) return value.reports;
  if (Array.isArray(value?.exports)) return value.exports;
  if (Array.isArray(value?.clients)) return value.clients;
  return [];
}

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

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high", "danger", "p1"].includes(v)) return "danger";
  if (["elevated", "medium", "p2", "open", "pending"].includes(v)) return "demo";
  if (["stable", "active", "complete", "completed", "resolved"].includes(v)) return "active";
  return "accent";
}

function CommandRow({ item }) {
  return (
    <div className={`necc-row necc-${String(item.priority || item.risk || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={clean(item.title || item.item || "Command item")}
        subtitle={clean(item.description || item.recommendation || item.action || "Review item.")}
        meta={[
          { label: "Type", value: item.type || item.category || "Command" },
          { label: "Priority", value: item.priority || item.risk || "Medium" },
          { label: "State", value: item.state || "National" },
          { label: "Source", value: item.source || "VoterSpheres" },
        ]}
        right={<Badge tone={tone(item.priority || item.risk)}>{item.priority || item.risk || "Live"}</Badge>}
      />
    </div>
  );
}

function WorkspaceCard({ item }) {
  return (
    <div className={`necc-card necc-${String(item.risk || "stable").toLowerCase()}`}>
      <div className="necc-card-top">
        <div>
          <strong>{item.name || item.title || "Workspace"}</strong>
          <span>{item.state || "National"} • {item.office || "Campaign"} • {item.cycle || "2026"}</span>
        </div>
        <Badge tone={tone(item.risk)}>{item.risk || "Stable"}</Badge>
      </div>

      <div className="necc-pressure">{pct(item.pressure_score || 0)}</div>

      <div className="necc-mini-grid">
        <div><span>Tasks</span><b>{fmt(item.open_tasks)}</b></div>
        <div><span>Signals</span><b>{fmt(item.signals)}</b></div>
      </div>
    </div>
  );
}

function ReportRow({ item }) {
  return (
    <div className="necc-row">
      <ResponsiveRow
        title={item.title || "Report"}
        subtitle={clean(item.executive_summary || item.metadata?.source_report_title || "Generated intelligence deliverable.")}
        meta={[
          { label: "Type", value: String(item.report_type || item.export_type || "report").replace(/_/g, " ") },
          { label: "State", value: item.state || item.metadata?.source_report_state || "National" },
          { label: "Status", value: item.status || "generated" },
          { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleDateString() : "—" },
        ]}
        right={<Badge tone="active">Ready</Badge>}
      />
    </div>
  );
}

export default function NationalElectionCommandCenter() {
  const [data, setData] = useState({
    mission: null,
    warRoom: null,
    advisor: null,
    reports: [],
    exports: [],
    clients: [],
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

      const [
        missionResult,
        warRoomResult,
        advisorResult,
        reportsResult,
        exportsResult,
        clientsResult,
      ] = await Promise.allSettled([
        api.executiveMissionControl?.(),
        api.electionWarRoom?.(),
        api.aiStrategicAdvisor?.(),
        api.intelligenceReports?.(),
        api.reportExports?.(),
        api.clientPortalClients?.(),
      ]);

      setData({
        mission: missionResult.status === "fulfilled" ? missionResult.value : null,
        warRoom: warRoomResult.status === "fulfilled" ? warRoomResult.value : null,
        advisor: advisorResult.status === "fulfilled" ? advisorResult.value : null,
        reports: reportsResult.status === "fulfilled" ? arr(reportsResult.value) : [],
        exports: exportsResult.status === "fulfilled" ? arr(exportsResult.value) : [],
        clients: clientsResult.status === "fulfilled" ? arr(clientsResult.value) : [],
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load National Election Command Center.");
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

  const missionSummary = data.mission?.summary || {};
  const warSummary = data.warRoom?.summary || {};
  const advisorSummary = data.advisor?.summary || {};

  const missionItems = arr(data.mission?.mission_items);
  const threats = arr(data.warRoom?.threats);
  const queue = arr(data.warRoom?.queue);
  const recommendations = arr(data.advisor?.recommendations);
  const workspaceHealth = arr(data.mission?.workspace_health || data.warRoom?.command_cards);
  const reports = arr(data.reports);
  const exportsList = arr(data.exports);
  const clients = arr(data.clients);

  const topCommandItems = useMemo(() => {
    return [
      ...missionItems.slice(0, 5),
      ...threats.slice(0, 5).map((item) => ({
        id: `threat-${item.id}`,
        title: item.title,
        description: item.recommendation,
        priority: item.severity || item.risk,
        state: item.state,
        source: item.source || "War Room",
        type: "Threat",
      })),
      ...recommendations.slice(0, 5).map((item) => ({
        id: `advisor-${item.id}`,
        title: item.title,
        description: item.why || item.expected_impact,
        priority: item.priority,
        state: item.state,
        source: "Strategic Advisor",
        type: item.category || "Recommendation",
      })),
    ].slice(0, 14);
  }, [missionItems, threats, recommendations]);

  const activeClients = clients.filter((item) => item.status === "active").length;

  const pressureScore =
    missionSummary.pressure_score ??
    warSummary.pressure_score ??
    advisorSummary.pressure_score ??
    0;

  const missionRisk =
    missionSummary.mission_risk ||
    warSummary.mission_risk ||
    advisorSummary.strategic_risk ||
    "Stable";

  return (
    <PageShell
      eyebrow="National Election Command Center"
      title="National Election Command Center"
      description="The flagship executive command screen combining Mission Control, Election War Room, Strategic Advisor, Reports, Client Portal, and campaign deliverables."
      tickerItems={[
        {
          label: "Mission Risk",
          value: missionRisk,
          dotClass: ["Critical", "High"].includes(missionRisk) ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Pressure",
          value: pct(pressureScore),
          dotClass: Number(pressureScore || 0) >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Command Items",
          value: `${topCommandItems.length}`,
          dotClass: topCommandItems.length ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Client Portals",
          value: `${activeClients} active`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .necc-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
          gap: 18px;
          align-items: start;
        }

        .necc-stack {
          display: grid;
          gap: 14px;
        }

        .necc-hero {
          border-radius: 32px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.26), transparent 34%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.86));
          padding: 24px;
        }

        .necc-hero-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .necc-hero h2 {
          margin: 0;
          color: white;
          font-size: 36px;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .necc-hero p {
          margin: 10px 0 0;
          color: rgba(203, 213, 225, 0.74);
          font-size: 13px;
          line-height: 1.6;
        }

        .necc-pressure {
          margin-top: 18px;
          color: white;
          font-size: 76px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.08em;
        }

        .necc-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .necc-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .necc-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .necc-critical,
        .necc-high,
        .necc-p1 {
          border-color: rgba(248, 113, 113, 0.38);
        }

        .necc-elevated,
        .necc-medium,
        .necc-p2 {
          border-color: rgba(251, 191, 36, 0.32);
        }

        .necc-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .necc-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 34%),
            rgba(15, 23, 42, 0.62);
          padding: 16px;
        }

        .necc-card-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .necc-card strong {
          display: block;
          color: white;
          font-size: 14px;
          font-weight: 900;
        }

        .necc-card span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.66);
          font-size: 12px;
        }

        .necc-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .necc-mini-grid div {
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.38);
          border: 1px solid rgba(148, 163, 184, 0.12);
          padding: 10px;
        }

        .necc-mini-grid span {
          color: rgba(203, 213, 225, 0.62);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .necc-mini-grid b {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 18px;
        }

        @media (max-width: 1100px) {
          .necc-grid,
          .necc-card-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Mission Pressure" value={pct(pressureScore)} delta={missionRisk} tone={Number(pressureScore || 0) >= 65 ? "down" : "up"} />
        <StatCard label="Threats" value={fmt(threats.length)} delta="War Room" tone={threats.length ? "down" : "up"} />
        <StatCard label="Advisor Actions" value={fmt(recommendations.length)} delta="Strategic queue" tone="up" />
        <StatCard label="Client Portals" value={fmt(activeClients)} delta="Active access" tone="up" />
      </div>

      {loading ? (
        <EmptyState text="Loading National Election Command Center..." />
      ) : (
        <div className="necc-grid">
          <div className="necc-stack">
            <div className="necc-hero">
              <div className="necc-hero-top">
                <div>
                  <h2>National Command View</h2>
                  <p>
                    A single executive view of your firm’s live political operating environment:
                    Mission Control, War Room, Strategic Advisor, Reports, Client Portals, and deliverables.
                  </p>
                </div>
                <Badge tone={tone(missionRisk)}>{missionRisk}</Badge>
              </div>

              <div className="necc-pressure">{pct(pressureScore)}</div>

              <div className="necc-actions">
                <Link className="vs-button" to="/war-room">War Room</Link>
                <Link className="vs-button vs-button-secondary" to="/mission-control">Mission Control</Link>
                <Link className="vs-button vs-button-secondary" to="/strategic-advisor">Strategic Advisor</Link>
                <Link className="vs-button vs-button-secondary" to="/campaign-copilot">Co-Pilot</Link>
                <Link className="vs-button vs-button-secondary" to="/intelligence-reports">Reports</Link>
                <button className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                  Refresh
                </button>
              </div>
            </div>

            <SectionCard
              title="National Command Queue"
              subtitle="Highest priority items from Mission Control, War Room, and Strategic Advisor."
              right={<Badge tone={topCommandItems.length ? "demo" : "active"}>{topCommandItems.length} items</Badge>}
            >
              <div className="necc-stack">
                {!topCommandItems.length ? (
                  <EmptyState text="No national command items detected." />
                ) : (
                  topCommandItems.map((item) => (
                    <CommandRow key={item.id || item.title} item={item} />
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Workspace Pressure"
              subtitle="Campaign workspace operating pressure."
              right={<Badge tone="accent">{workspaceHealth.length} workspaces</Badge>}
            >
              {!workspaceHealth.length ? (
                <EmptyState text="No workspace pressure available." />
              ) : (
                <div className="necc-card-grid">
                  {workspaceHealth.slice(0, 8).map((item) => (
                    <WorkspaceCard key={item.id || item.title} item={item} />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="necc-stack">
            <SectionCard
              title="Strategic Advisor"
              subtitle="AI-ranked strategic recommendations."
              right={<Badge tone="demo">{recommendations.length}</Badge>}
            >
              <div className="necc-stack">
                {!recommendations.length ? (
                  <EmptyState text="No strategic recommendations available." />
                ) : (
                  recommendations.slice(0, 5).map((item) => (
                    <CommandRow
                      key={item.id || item.title}
                      item={{
                        ...item,
                        type: item.category || "Advisor",
                        description: item.why || item.expected_impact,
                        source: "Strategic Advisor",
                      }}
                    />
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Response Queue"
              subtitle="Live War Room queue."
              right={<Badge tone={queue.length ? "demo" : "active"}>{queue.length}</Badge>}
            >
              <div className="necc-stack">
                {!queue.length ? (
                  <EmptyState text="No response queue items available." />
                ) : (
                  queue.slice(0, 5).map((item) => (
                    <CommandRow
                      key={item.id || item.item}
                      item={{
                        title: item.item,
                        description: item.action,
                        priority: item.priority,
                        state: item.state,
                        source: item.owner || "War Room",
                        type: "Queue",
                      }}
                    />
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Reports & Deliverables"
              subtitle="Latest reports and export-ready deliverables."
              right={<Badge tone="active">{reports.length + exportsList.length}</Badge>}
            >
              <div className="necc-stack">
                {[...reports.slice(0, 3), ...exportsList.slice(0, 3)].length ? (
                  [...reports.slice(0, 3), ...exportsList.slice(0, 3)].map((item) => (
                    <ReportRow key={`${item.report_type || item.export_type}-${item.id}`} item={item} />
                  ))
                ) : (
                  <EmptyState text="No reports or exports available." />
                )}

                <Link className="vs-button vs-button-secondary" to="/report-exports">
                  Open Report Export Center
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              title="Client Portal Status"
              subtitle="Client-facing access and report delivery."
              right={<Badge tone="active">{activeClients} active</Badge>}
            >
              <div className="necc-stack">
                {!clients.length ? (
                  <EmptyState text="No client portals created yet." />
                ) : (
                  clients.slice(0, 5).map((client) => (
                    <CommandRow
                      key={client.id}
                      item={{
                        title: client.client_name,
                        description: `${client.organization || "Client"} • ${client.email || "No email"}`,
                        priority: client.status,
                        state: client.workspace_id ? `Workspace ${client.workspace_id}` : "Firmwide",
                        source: "Client Portal",
                        type: client.access_level || "Client",
                      }}
                    />
                  ))
                )}

                <Link className="vs-button vs-button-secondary" to="/client-portal-admin">
                  Manage Client Portals
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );

}



