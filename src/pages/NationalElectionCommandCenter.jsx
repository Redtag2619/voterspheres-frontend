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

    ...(Array.isArray(item.sources) ? item.sources : []),

  ]

    .filter(Boolean)

    .join(" ")

    .toLowerCase()

    .includes(q);

}

 

function matchesFilters(item, filters) {

  if (filters.state && String(item.state || "") !== filters.state) return false;

  if (

    filters.risk &&

    String(item.priority || item.risk || "").toLowerCase() !== filters.risk.toLowerCase()

  ) {

    return false;

  }

 

  if (filters.source) {

    const requested = filters.source.toLowerCase();

    const sources = [

      item.source,

      ...(Array.isArray(item.sources) ? item.sources : []),

    ]

      .filter(Boolean)

      .map((value) => String(value).toLowerCase());

 

    if (!sources.includes(requested)) return false;

  }

 

  return true;

}

 

function sourceLink(item) {

  const backendRoute = String(

    item?.route ||

      item?.action_route ||

      item?.metadata?.route ||

      item?.metadata?.action_route ||

      ""

  ).trim();

 

  if (backendRoute.startsWith("/")) return backendRoute;

 

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

  const provenance = arr(item.sources);

 

  return (

    <div className={`necc-row necc-${String(priority).toLowerCase()}`}>

      <ResponsiveRow

        expanded

        title={clean(item.title || item.item || "Command item")}

        subtitle={clean(item.description || item.recommendation || item.action || "Review item.")}

        meta={[

          { label: "Type", value: item.type || item.category || "Command" },

          { label: "Priority", value: priority },

          { label: "State", value: item.state || "National" },

          { label: "Source", value: item.source || "VoterSpheres" },

          ...(item.materiality_score != null

            ? [{ label: "Materiality", value: `${item.materiality_score}/100` }]

            : []),

          ...(provenance.length > 1

            ? [{ label: "Evidence", value: `${provenance.length} sources` }]

            : []),

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

          <span>

            {item.state || "National"} / {item.office || "Campaign"} / {item.cycle || "2026"}

          </span>

        </div>

        <Badge tone={tone(item.risk)}>{item.risk || "Stable"}</Badge>

      </div>

 

      <div className="necc-pressure-small">{pct(item.pressure_score || 0)}</div>

 

      <div className="necc-mini-grid">

        <div>

          <span>Tasks</span>

          <b>{fmt(item.open_tasks)}</b>

        </div>

        <div>

          <span>Signals</span>

          <b>{fmt(item.signals)}</b>

        </div>

      </div>

 

      <div className="necc-card-actions">

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

    </div>

  );

}

 

function ReportRow({ item }) {

  const type = item.report_type || item.export_type || "report";

 

  return (

    <div className="necc-row">

      <ResponsiveRow

        expanded

        title={item.title || "Report"}

        subtitle={clean(

          item.executive_summary ||

            item.metadata?.source_report_title ||

            "Generated intelligence deliverable."

        )}

        meta={[

          { label: "Type", value: String(type).replace(/_/g, " ") },

          { label: "State", value: item.state || item.metadata?.source_report_state || "National" },

          { label: "Status", value: item.status || "generated" },

          {

            label: "Created",

            value: item.created_at ? new Date(item.created_at).toLocaleDateString() : "-",

          },

        ]}

        right={

          <Link

            className="vs-button vs-button-secondary"

            to={item.export_type ? "/report-exports" : "/intelligence-reports"}

          >

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

    commandItems: [],

    authoritativeCommand: false,

    summary: null,

    safeguards: null,

    build: "",

    mode: "",

    reports: [],

    exports: [],

    clients: [],

  });

 

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState("");

  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState({ state: "", risk: "", source: "" });

 

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

          commandItems: arr(result?.command_items),

          authoritativeCommand: true,

          summary: result?.summary || null,

          safeguards: result?.safeguards || null,

          build: result?.build || "",

          mode: result?.mode || "",

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

          commandItems: [],

          authoritativeCommand: false,

          summary: null,

          safeguards: null,

          build: "legacy-compatibility",

          mode: "legacy-compatibility",

          reports: reportsResult.status === "fulfilled" ? arr(reportsResult.value) : [],

          exports: exportsResult.status === "fulfilled" ? arr(exportsResult.value) : [],

          clients: clientsResult.status === "fulfilled" ? arr(clientsResult.value) : [],

        });

      }

 

      setLastUpdated(

        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      );

    } catch (err) {

      setError(

        err?.response?.data?.error ||

          err?.response?.data?.detail ||

          err?.message ||

          "Failed to load National Election Command Center."

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

 

  const missionSummary = data.mission?.summary || {};

  const warSummary = data.warRoom?.summary || {};

  const advisorSummary = data.advisor?.summary || {};

  const nationalSummary = data.summary || {};

 

  const missionItems = arr(data.mission?.mission_items);

  const threats = arr(data.warRoom?.threats);

  const queue = arr(data.warRoom?.queue);

  const recommendations = arr(data.advisor?.recommendations);

  const workspaceHealth = arr(data.mission?.workspace_health || data.warRoom?.command_cards);

  const reports = arr(data.reports);

  const exportsList = arr(data.exports);

  const clients = arr(data.clients);

 

  const rawCommandItems = useMemo(() => {

    const authoritativeItems = arr(data.commandItems);

 

    // The dedicated National Command endpoint owns command identity.

    // Preserve an authoritative empty array as a legitimate zero state.

    if (data.authoritativeCommand) {

      return authoritativeItems.map((item) => ({

        ...item,

        source:

          item.source ||

          item.authoritative_origin ||

          "National Command",

      }));

    }

 

    // Legacy compatibility only when the dedicated National Command

    // endpoint is genuinely unavailable.

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

  }, [

    data.authoritativeCommand,

    data.commandItems,

    missionItems,

    threats,

    queue,

    recommendations,

  ]);

 

  const states = useMemo(

    () => Array.from(new Set(rawCommandItems.map((item) => item.state).filter(Boolean))).sort(),

    [rawCommandItems]

  );

 

  const sources = useMemo(() => {

    return Array.from(

      new Set(

        rawCommandItems.flatMap((item) => [

          item.source,

          ...(Array.isArray(item.sources) ? item.sources : []),

        ]).filter(Boolean)

      )

    ).sort();

  }, [rawCommandItems]);

 

  const commandItems = useMemo(() => {

    return rawCommandItems

      .filter((item) => matchesSearch(item, query))

      .filter((item) => matchesFilters(item, filters))

      .sort((a, b) => {

        const riskDifference = riskRank(b.priority || b.risk) - riskRank(a.priority || a.risk);

        if (riskDifference !== 0) return riskDifference;

        return Number(b.materiality_score || 0) - Number(a.materiality_score || 0);

      })

      .slice(0, 18);

  }, [rawCommandItems, query, filters]);

 

  const activeClients = clients.filter((item) => item.status === "active").length;

 

  const pressureScore =

    nationalSummary.pressure_score ??

    missionSummary.pressure_score ??

    warSummary.pressure_score ??

    advisorSummary.pressure_score ??

    0;

 

  const missionRisk =

    nationalSummary.mission_risk ||

    missionSummary.mission_risk ||

    warSummary.mission_risk ||

    advisorSummary.strategic_risk ||

    "Stable";

 

  const commandCount = nationalSummary.command_items ?? rawCommandItems.length;

 

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

          dotClass: ["Critical", "High"].includes(missionRisk)

            ? "vs-live-dot-warning"

            : "vs-live-dot-success",

        },

        { label: "Pressure", value: pct(pressureScore), dotClass: "vs-live-dot-success" },

        { label: "Command Items", value: fmt(commandCount), dotClass: "vs-live-dot-success" },

        { label: "Client Portals", value: `${activeClients} active`, dotClass: "vs-live-dot-success" },

      ]}

    >

      <style>{`

        .necc-toolbar {

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 12px;

          flex-wrap: wrap;

          margin-bottom: 16px;

        }

        .necc-toolbar-actions,

        .necc-row-actions,

        .necc-card-actions {

          display: flex;

          gap: 8px;

          flex-wrap: wrap;

          align-items: center;

        }

        .necc-grid {

          display: grid;

          grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);

          gap: 18px;

          align-items: start;

        }

        .necc-stack {

          display: grid;

          gap: 14px;

        }

        .necc-row {

          border: 1px solid rgba(148, 163, 184, 0.18);

          border-radius: 16px;

          padding: 14px;

          background: rgba(15, 23, 42, 0.42);

        }

        .necc-critical { border-color: rgba(248, 113, 113, 0.4); }

        .necc-high { border-color: rgba(251, 146, 60, 0.35); }

        .necc-card-grid {

          display: grid;

          grid-template-columns: repeat(2, minmax(0, 1fr));

          gap: 14px;

        }

        .necc-card {

          border: 1px solid rgba(148, 163, 184, 0.18);

          border-radius: 18px;

          padding: 16px;

          background: rgba(15, 23, 42, 0.42);

        }

        .necc-card-top {

          display: flex;

          justify-content: space-between;

          gap: 12px;

          align-items: flex-start;

        }

        .necc-card-top strong,

        .necc-card-top span { display: block; }

        .necc-card-top span {

          margin-top: 4px;

          opacity: 0.72;

          font-size: 0.86rem;

        }

        .necc-pressure-small {

          font-size: 2rem;

          font-weight: 800;

          margin: 16px 0;

        }

        .necc-mini-grid {

          display: grid;

          grid-template-columns: repeat(2, minmax(0, 1fr));

          gap: 10px;

          margin-bottom: 14px;

        }

        .necc-mini-grid div {

          border: 1px solid rgba(148, 163, 184, 0.14);

          border-radius: 12px;

          padding: 10px;

        }

        .necc-mini-grid span,

        .necc-mini-grid b { display: block; }

        .necc-mini-grid span { opacity: 0.68; font-size: 0.78rem; }

        .necc-mini-grid b { margin-top: 4px; font-size: 1.15rem; }

        .necc-filter-grid {

          display: grid;

          grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(150px, 0.45fr));

          gap: 10px;

        }

        .necc-filter-grid input,

        .necc-filter-grid select {

          width: 100%;

          min-height: 42px;

          border-radius: 10px;

          border: 1px solid rgba(148, 163, 184, 0.22);

          background: rgba(15, 23, 42, 0.7);

          color: inherit;

          padding: 0 11px;

        }

        .necc-status-row {

          display: flex;

          flex-wrap: wrap;

          gap: 8px;

          margin-bottom: 16px;

        }

        .necc-kpi-trend {

          display: grid;

          grid-template-columns: repeat(4, minmax(0, 1fr));

          gap: 10px;

        }

        .necc-kpi-trend div {

          border-radius: 14px;

          border: 1px solid rgba(148, 163, 184, 0.14);

          padding: 12px;

        }

        .necc-kpi-trend span,

        .necc-kpi-trend strong { display: block; }

        .necc-kpi-trend span { opacity: 0.68; font-size: 0.8rem; }

        .necc-kpi-trend strong { margin-top: 5px; font-size: 1.35rem; }

        @media (max-width: 1100px) {

          .necc-grid { grid-template-columns: 1fr; }

          .necc-filter-grid { grid-template-columns: 1fr 1fr; }

        }

        @media (max-width: 760px) {

          .necc-card-grid,

          .necc-kpi-trend,

          .necc-filter-grid { grid-template-columns: 1fr; }

        }

      `}</style>

 

      <div className="necc-toolbar">

        <div className="necc-status-row">

          <Badge tone="active">

            {data.mode === "authoritative-national-command"

              ? "Authoritative National Command"

              : "National Command"}

          </Badge>

          {data.build ? <Badge tone="accent">Build {data.build}</Badge> : null}

          {data.safeguards?.canonical_deduplication ? (

            <Badge tone="active">Deduplication Active</Badge>

          ) : null}

          {data.safeguards?.legacy_launch_seed_excluded ? (

            <Badge tone="active">Legacy Seed Excluded</Badge>

          ) : null}

        </div>

 

        <div className="necc-toolbar-actions">

          <span>{refreshing ? "Refreshing..." : `Updated ${lastUpdated || "ready"}`}</span>

          <button

            type="button"

            className="vs-button vs-button-secondary"

            disabled={loading || refreshing}

            onClick={() => load({ quiet: true })}

          >

            Refresh

          </button>

        </div>

      </div>

 

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

 

      <div className="vs-grid-4">

        <StatCard label="Mission Pressure" value={pct(pressureScore)} delta={missionRisk} tone="neutral" />

        <StatCard label="Command Items" value={fmt(commandCount)} delta="Authoritative queue" tone="up" />

        <StatCard label="Threats" value={fmt(threats.length)} delta="War Room" tone={threats.length ? "neutral" : "up"} />

        <StatCard label="Advisor Actions" value={fmt(recommendations.length)} delta="Strategic queue" tone="up" />

      </div>

 

      <SectionCard

        title="National Command Filters"

        subtitle="Filter the authoritative national/race execution queue without rebuilding or duplicating backend command objects."

      >

        <div className="necc-filter-grid">

          <input

            value={query}

            onChange={(event) => setQuery(event.target.value)}

            placeholder="Search command items..."

          />

          <select

            value={filters.state}

            onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value }))}

          >

            <option value="">All States</option>

            {states.map((state) => (

              <option key={state} value={state}>{state}</option>

            ))}

          </select>

          <select

            value={filters.risk}

            onChange={(event) => setFilters((current) => ({ ...current, risk: event.target.value }))}

          >

            <option value="">All Risks</option>

            <option value="critical">Critical</option>

            <option value="high">High</option>

            <option value="elevated">Elevated</option>

            <option value="medium">Medium</option>

            <option value="p1">P1</option>

            <option value="p2">P2</option>

          </select>

          <select

            value={filters.source}

            onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}

          >

            <option value="">All Sources</option>

            {sources.map((source) => (

              <option key={source} value={source}>{source}</option>

            ))}

          </select>

        </div>

      </SectionCard>

 

      <div className="necc-grid">

        <div className="necc-stack">

          <SectionCard

            title="National Command Queue"

            subtitle="Canonical national and race execution priorities. Mission Control owns identity; War Room and Strategic Advisor enrich the same authoritative items."

            right={<Badge tone="accent">{commandItems.length} items</Badge>}

          >

            {loading ? (

              <EmptyState text="Loading National Command..." />

            ) : commandItems.length ? (

              <div className="necc-stack">

                {commandItems.map((item) => (

                  <CommandRow key={item.id || `${item.title}-${item.state}`} item={item} />

                ))}

              </div>

            ) : (

              <EmptyState text="No authoritative command items match the current filters." />

            )}

          </SectionCard>

 

          <SectionCard

            title="Workspace Pressure"

            subtitle="Firm-wide workspace pressure remains sourced from Mission Control and is not reconstructed by National Command."

            right={<Badge tone="info">{workspaceHealth.length} workspaces</Badge>}

          >

            {workspaceHealth.length ? (

              <div className="necc-card-grid">

                {workspaceHealth.map((item) => (

                  <WorkspaceCard key={item.id || item.workspace_id || item.name || item.title} item={item} />

                ))}

              </div>

            ) : (

              <EmptyState text="No workspace pressure records available." />

            )}

          </SectionCard>

 

          <SectionCard

            title="Intelligence Deliverables"

            subtitle="Recent intelligence reports and exported campaign deliverables."

            right={<Badge tone="accent">{reports.length + exportsList.length} deliverables</Badge>}

          >

            {reports.length || exportsList.length ? (

              <div className="necc-stack">

                {[...reports, ...exportsList].slice(0, 12).map((item) => (

                  <ReportRow key={`${item.export_type ? "export" : "report"}-${item.id}`} item={item} />

                ))}

              </div>

            ) : (

              <EmptyState text="No reports or exports available." />

            )}

          </SectionCard>

        </div>

 

        <div className="necc-stack">

          <SectionCard

            title="Executive Command Posture"

            subtitle="Live synthesis of Mission Control, War Room, and Strategic Advisor operating pressure."

          >

            <div className="necc-kpi-trend">

              {kpiTrend.map((item) => (

                <div key={item.label}>

                  <span>{item.label}</span>

                  <strong>{pct(item.value)}</strong>

                </div>

              ))}

            </div>

          </SectionCard>

 

          <SectionCard

            title="Aggregation Safeguards"

            subtitle="Backend controls protecting National Command from duplicate or legacy/demo queue contamination."

          >

            <div className="necc-status-row">

              <Badge tone={data.safeguards?.mission_control_primary_identity ? "active" : "demo"}>

                Mission Control Primary

              </Badge>

              <Badge tone={data.safeguards?.advisor_enrichment_only ? "active" : "demo"}>

                Advisor Enrichment

              </Badge>

              <Badge tone={data.safeguards?.war_room_threat_enrichment ? "active" : "demo"}>

                Threat Enrichment

              </Badge>

              <Badge tone={data.safeguards?.canonical_deduplication ? "active" : "demo"}>

                Canonical Dedupe

              </Badge>

              <Badge tone={data.safeguards?.semantic_routing ? "active" : "demo"}>

                Semantic Routing

              </Badge>

              <Badge tone={data.safeguards?.legacy_launch_seed_excluded ? "active" : "demo"}>

                Launch Seed Excluded

              </Badge>

            </div>

 

            <div className="necc-mini-grid">

              <div>

                <span>Raw Candidates</span>

                <b>{fmt(nationalSummary.raw_command_candidates)}</b>

              </div>

              <div>

                <span>Duplicates Collapsed</span>

                <b>{fmt(nationalSummary.duplicates_collapsed)}</b>

              </div>

              <div>

                <span>Authoritative Sources</span>

                <b>{fmt(nationalSummary.authoritative_sources)}</b>

              </div>

              <div>

                <span>Legacy Seed Queue</span>

                <b>{fmt(nationalSummary.legacy_seed_items_in_command_queue)}</b>

              </div>

            </div>

          </SectionCard>

 

          <SectionCard

            title="Response Queue"

            subtitle="War Room response planning remains visible as supporting operational context, not duplicate National Command rows."

            right={<Badge tone="demo">{queue.length} items</Badge>}

          >

            {queue.length ? (

              <div className="necc-stack">

                {queue.slice(0, 8).map((item) => (

                  <div className="necc-row" key={item.id || item.item}>

                    <ResponsiveRow

                      expanded

                      title={clean(item.item || "Response item")}

                      subtitle={clean(item.action || "Review and assign owner.")}

                      meta={[

                        { label: "Priority", value: item.priority || "P2" },

                        { label: "Owner", value: item.owner || "Command Team" },

                        { label: "State", value: item.state || "National" },

                        { label: "Risk", value: item.risk || "Watch" },

                      ]}

                      right={<Link className="vs-button vs-button-secondary" to="/war-room">War Room</Link>}

                    />

                  </div>

                ))}

              </div>

            ) : (

              <EmptyState text="No War Room response items available." />

            )}

          </SectionCard>

 

          <SectionCard

            title="Strategic Advisor"

            subtitle="Advisor recommendations remain available for context; duplicates of Mission Control items are enrichment, not separate National Command rows."

            right={<Badge tone="info">{recommendations.length} recommendations</Badge>}

          >

            {recommendations.length ? (

              <div className="necc-stack">

                {recommendations.slice(0, 8).map((item) => (

                  <div className="necc-row" key={item.id || item.title}>

                    <ResponsiveRow

                      expanded

                      title={clean(item.title || "Strategic recommendation")}

                      subtitle={clean(item.why || item.expected_impact || "Review recommendation.")}

                      meta={[

                        { label: "Category", value: item.category || "Advisor" },

                        { label: "Priority", value: item.priority || "Medium" },

                        { label: "State", value: item.state || "National" },

                        { label: "Confidence", value: pct(item.confidence || 0) },

                      ]}

                      right={<Link className="vs-button vs-button-secondary" to="/strategic-advisor">Advisor</Link>}

                    />

                  </div>

                ))}

              </div>

            ) : (

              <EmptyState text="No Strategic Advisor recommendations available." />

            )}

          </SectionCard>

 

          <SectionCard

            title="Client Portals"

            subtitle="Client-facing access remains a separate delivery surface."

            right={<Badge tone="active">{activeClients} active</Badge>}

          >

            {clients.length ? (

              <div className="necc-stack">

                {clients.slice(0, 8).map((client) => (

                  <div className="necc-row" key={client.id}>

                    <ResponsiveRow

                      expanded

                      title={client.client_name || client.organization || "Client portal"}

                      subtitle={client.organization || client.email || "Client portal access"}

                      meta={[

                        { label: "Status", value: client.status || "active" },

                        { label: "Access", value: client.access_level || "client" },

                        { label: "Workspace", value: client.workspace_id || "Portfolio" },

                      ]}

                      right={<Link className="vs-button vs-button-secondary" to="/client-portal-admin">Open</Link>}

                    />

                  </div>

                ))}

              </div>

            ) : (

              <EmptyState text="No client portals configured." />

            )}

          </SectionCard>

        </div>

      </div>

    </PageShell>

  );

}
