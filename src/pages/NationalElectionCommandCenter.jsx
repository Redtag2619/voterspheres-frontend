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
  if (["critical", "high", "danger", "p1", "revoked"].includes(v)) return "danger";
  if (["elevated", "medium", "p2", "open", "pending"].includes(v)) return "demo";
  if (["stable", "active", "complete", "completed", "resolved", "generated"].includes(v)) return "active";
  return "accent";
}

function riskRank(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("critical") || v === "p1") return 5;
  if (v.includes("high")) return 4;
  if (v.includes("elevated") || v === "p2") return 3;
  if (v.includes("medium") || v.includes("open")) return 2;
  return 1;
}

function matchesSearch(item, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [
    item.title,
    item.item,
    item.description,
    item.recommendation,
    item.action,
    item.state,
    item.source,
    item.type,
    item.category,
    item.priority,
    item.risk,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function matchesFilters(item, filters) {
  if (filters.state && String(item.state || "") !== filters.state) return false;
  if (filters.risk && String(item.priority || item.risk || "").toLowerCase() !== filters.risk.toLowerCase()) return false;
  if (filters.source && String(item.source || "").toLowerCase() !== filters.source.toLowerCase()) return false;
  return true;
}

function sourceLink(item) {
  const source = String(item.source || item.type || "").toLowerCase();

  if (source.includes("war")) return "/war-room";
  if (source.includes("mission")) return "/mission-control";
  if (source.includes("advisor")) return "/strategic-advisor";
  if (source.includes("crm")) return "/campaign-crm";
  if (source.includes("report")) return "/intelligence-reports";
  if (source.includes("export")) return "/report-exports";
  if (source.includes("client")) return "/client-portal-admin";
  if (source.includes("signal")) return "/political-signals";
  if (source.includes("task") || source.includes("command")) return "/command-center";

  return "/mission-control";
}

function CommandRow({ item }) {
  const priority = item.priority || item.risk || "Live";

  return (
    <div className={`necc-row necc-${String(priority).toLowerCase()}`}>
      <ResponsiveRow
        title={clean(item.title || item.item || "Command item")}
        subtitle={clean(item.description || item.recommendation || item.action || "Review item.")}
        meta={[
          { label: "Type", value: item.type || item.category || "Command" },
          { label: "Priority", value: priority },
          { label: "State", value: item.state || "National" },
          { label: "Source", value: item.source || "VoterSpheres" },
        ]}
        right={
          <div className="necc-row-actions">
            <Badge tone={tone(priority)}>{priority}</Badge>
            <Link className="vs-button vs-button-secondary" to={sourceLink(item)}>
              Open
            </Link>
          </div>
        }
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

      <div className="necc-pressure-small">{pct(item.pressure_score || 0)}</div>

      <div className="necc-mini-grid">
        <div><span>Tasks</span><b>{fmt(item.open_tasks)}</b></div>
        <div><span>Signals</span><b>{fmt(item.signals)}</b></div>
      </div>

      <Link className="vs-button vs-button-secondary" to="/notifications">
        Notifications
      </Link>

      <Link className="vs-button vs-button-secondary" to="/revenue-intelligence">
        Revenue Intelligence
      </Link>

      <Link className="vs-button vs-button-secondary necc-card-link" to="/mission-control">
        View Workspace
      </Link>
    </div>
  );
}

function ReportRow({ item }) {
  const type = item.report_type || item.export_type || "report";

  return (
    <div className="necc-row">
      <ResponsiveRow
        title={item.title || "Report"}
        subtitle={clean(item.executive_summary || item.metadata?.source_report_title || "Generated intelligence deliverable.")}
        meta={[
          { label: "Type", value: String(type).replace(/_/g, " ") },
          { label: "State", value: item.state || item.metadata?.source_report_state || "National" },
          { label: "Status", value: item.status || "generated" },
          { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleDateString() : "—" },
        ]}
        right={
          <Link className="vs-button vs-button-secondary" to={item.export_type ? "/report-exports" : "/intelligence-reports"}>
            Open
          </Link>
        }
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
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    state: "",
    risk: "",
    source: "",
  });

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (typeof api.nationalElectionCommandCenter === "function") {
        const result = await api.nationalElectionCommandCenter();

        setData({
          mission: result?.mission || null,
          warRoom: result?.war_room || null,
          advisor: result?.advisor || null,
          reports: arr(result?.reports),
          exports: arr(result?.exports),
          clients: arr(result?.clients),
        });
      } else {
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
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load National Election Command Center.");
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

  const rawCommandItems = useMemo(() => {
    return [
      ...missionItems.slice(0, 8).map((item) => ({
        ...item,
        source: item.source || "Mission Control",
      })),
      ...threats.slice(0, 8).map((item) => ({
        id: `threat-${item.id}`,
        title: item.title,
        description: item.recommendation,
        priority: item.severity || item.risk,
        state: item.state,
        source: item.source || "Election War Room",
        type: "Threat",
      })),
      ...queue.slice(0, 6).map((item) => ({
        id: `queue-${item.id}`,
        title: item.item,
        description: item.action,
        priority: item.priority,
        state: item.state,
        source: item.owner || "War Room Queue",
        type: "Queue",
      })),
      ...recommendations.slice(0, 8).map((item) => ({
        id: `advisor-${item.id}`,
        title: item.title,
        description: item.why || item.expected_impact,
        priority: item.priority,
        state: item.state,
        source: "AI Strategic Advisor",
        type: item.category || "Recommendation",
      })),
    ];
  }, [missionItems, threats, queue, recommendations]);

  const states = useMemo(() => {
    return Array.from(
      new Set(rawCommandItems.map((item) => item.state).filter(Boolean))
    ).sort();
  }, [rawCommandItems]);

  const sources = useMemo(() => {
    return Array.from(
      new Set(rawCommandItems.map((item) => item.source).filter(Boolean))
    ).sort();
  }, [rawCommandItems]);

  const commandItems = useMemo(() => {
    return rawCommandItems
      .filter((item) => matchesSearch(item, query))
      .filter((item) => matchesFilters(item, filters))
      .sort((a, b) => riskRank(b.priority || b.risk) - riskRank(a.priority || a.risk))
      .slice(0, 18);
  }, [rawCommandItems, query, filters]);

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

  const kpiTrend = useMemo(() => {
    const score = Number(pressureScore || 0);
    return [
      { label: "Mission", value: score },
      { label: "Threats", value: Math.min(100, threats.length * 12) },
      { label: "Queue", value: Math.min(100, queue.length * 8) },
      { label: "Advisor", value: Math.min(100, recommendations.length * 6) },
    ];
  }, [pressureScore, threats.length, queue.length, recommendations.length]);

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
          value: `${commandItems.length}`,
          dotClass: commandItems.length ? "vs-live-dot-warning" : "vs-live-dot-success",
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

        .necc-actions,
        .necc-filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .necc-filters input,
        .necc-filters select {
          min-width: 180px;
          flex: 1;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
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

        .necc-row-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
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

        .necc-pressure-small {
          margin-top: 14px;
          color: white;
          font-size: 44px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
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

        .necc-card-link {
          margin-top: 12px;
          width: 100%;
        }

        .necc-trend {
          display: grid;
          gap: 12px;
        }

        .necc-trend-row {
          display: grid;
          grid-template-columns: 88px minmax(0, 1fr) 48px;
          gap: 10px;
          align-items: center;
          color: rgba(226, 232, 240, 0.9);
          font-size: 12px;
        }

        .necc-trend-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          border: 1px solid rgba(148, 163, 184, 0.12);
          overflow: hidden;
        }

        .necc-trend-fill {
          height: 100%;
          border-radius: 999px;
          background: rgba(96, 165, 250, 0.76);
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
                <Link className="vs-button vs-button-secondary" to="/political-intelligence">
                  Intelligence Graph
                </Link>
                <Link className="vs-button vs-button-secondary" to="/intelligence-reports">Reports</Link>
                <button className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="necc-filters">
                <input
                  placeholder="Search command center..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })}>
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>

                <select value={filters.risk} onChange={(e) => setFilters({ ...filters, risk: e.target.value })}>
                  <option value="">All Risk</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Elevated">Elevated</option>
                  <option value="Medium">Medium</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                </select>

                <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
                  <option value="">All Sources</option>
                  {sources.map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>

            <SectionCard
              title="National Command Queue"
              subtitle="Filtered and ranked items from Mission Control, War Room, and Strategic Advisor."
              right={<Badge tone={commandItems.length ? "demo" : "active"}>{commandItems.length} items</Badge>}
            >
              <div className="necc-stack">
                {!commandItems.length ? (
                  <EmptyState text="No national command items match the current filters." />
                ) : (
                  commandItems.map((item) => (
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
            <SectionCard title="Executive KPI Trends" subtitle="Operating pressure indicators.">
              <div className="necc-trend">
                {kpiTrend.map((item) => (
                  <div key={item.label} className="necc-trend-row">
                    <span>{item.label}</span>
                    <div className="necc-trend-track">
                      <div className="necc-trend-fill" style={{ width: `${Math.min(100, Number(item.value || 0))}%` }} />
                    </div>
                    <strong>{pct(item.value)}</strong>
                  </div>
                ))}
              </div>
            </SectionCard>

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
                        source: "AI Strategic Advisor",
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
