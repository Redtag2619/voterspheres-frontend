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

 

function number(value = 0) {

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;

}

 

function fmt(value) {

  return number(value).toLocaleString();

}

 

function pct(value) {

  return `${Math.round(number(value))}%`;

}

 

function clean(value = "", fallback = "") {

  const normalized = String(value ?? "")

    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")

    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")

    .replace(/<[^>]+>/g, " ")

    .replace(/&nbsp;/gi, " ")

    .replace(/&amp;/gi, "&")

    .replace(/&quot;/gi, '"')

    .replace(/&#39;|&apos;/gi, "'")

    .replace(/\s+/g, " ")

    .trim();

 

  return normalized || fallback;

}

 

function tone(value = "") {

  const normalized = String(value || "").toLowerCase();

 

  if (["critical", "high", "danger", "overdue"].some((item) => normalized.includes(item))) {

    return "danger";

  }

 

  if (["elevated", "medium", "watch", "gap", "open"].some((item) => normalized.includes(item))) {

    return "demo";

  }

 

  if (["stable", "ready", "active", "complete", "resolved"].some((item) => normalized.includes(item))) {

    return "active";

  }

 

  return "accent";

}

 

function priorityRank(item = {}) {

  const priority = String(item.priority || item.risk || item.severity || "").toLowerCase();

  if (priority.includes("critical")) return 5;

  if (priority.includes("high")) return 4;

  if (priority.includes("elevated")) return 3;

  if (priority.includes("medium")) return 2;

  return 1;

}

 

function formatTime(value) {

  if (!value) return "Ready";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Ready";

  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

}

 

function routeForType(type = "") {

  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("signal")) return "/political-signals";

  if (normalized.includes("rapid") || normalized.includes("narrative")) return "/narrative-response";

  if (normalized.includes("crm") || normalized.includes("follow")) return "/campaign-crm";

  if (normalized.includes("vendor")) return "/vendors";

  return "/command-center";

}

 

function MissionQueueRow({ item, index }) {

  const itemType = clean(item.type, "Mission item");

 

  return (

    <div className="emc-row">

      <ResponsiveRow

        title={clean(item.title, "Mission item")}

        subtitle={clean(item.description || item.action, "Review the operating evidence and coordinate the response.")}

        meta={[

          { label: "Rank", value: index + 1 },

          { label: "Priority", value: clean(item.priority, "Monitor") },

          { label: "State", value: clean(item.state, "National") },

          { label: "Source", value: clean(item.source, itemType) },

        ]}

        right={

          <Link className="vs-button vs-button-secondary" to={routeForType(itemType)}>

            Open

          </Link>

        }

      />

    </div>

  );

}

 

function ExceptionRow({ title, description, label, value, route, badgeTone = "demo" }) {

  return (

    <div className="emc-exception">

      <div className="emc-exception-copy">

        <span>{label}</span>

        <strong>{clean(title, "Operational exception")}</strong>

        <p>{clean(description, "Review the authoritative record for details.")}</p>

      </div>

      <div className="emc-exception-action">

        <Badge tone={badgeTone}>{value}</Badge>

        <Link to={route}>Review</Link>

      </div>

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

    updated_at: "",

  });

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

 

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

        updated_at: result?.updated_at || new Date().toISOString(),

      });

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

    const interval = window.setInterval(() => load({ quiet: true }), 30000);

    return () => window.clearInterval(interval);

  }, [load]);

 

  const summary = data.summary || {};

  const missionItems = arr(data.mission_items);

  const criticalSignals = arr(data.critical_signals);

  const openTasks = arr(data.open_tasks);

  const rapidResponses = arr(data.rapid_responses);

  const crmFollowups = arr(data.crm_followups);

  const workspaceHealth = arr(data.workspace_health);

  const vendorGaps = arr(data.vendor_gaps);

 

  const rankedMissionItems = useMemo(

    () =>

      missionItems

        .slice()

        .sort((a, b) => priorityRank(b) - priorityRank(a))

        .slice(0, 6),

    [missionItems]

  );

 

  const atRiskWorkspaces = useMemo(

    () =>

      workspaceHealth

        .filter((item) => ["critical", "high", "elevated"].includes(String(item.risk || "").toLowerCase()))

        .sort((a, b) => number(b.pressure_score) - number(a.pressure_score))

        .slice(0, 3),

    [workspaceHealth]

  );

 

  const riskDrivingSignals = useMemo(

    () => criticalSignals.slice().sort((a, b) => number(b.signal_score) - number(a.signal_score)).slice(0, 3),

    [criticalSignals]

  );

 

  const activeEscalations = useMemo(() => rapidResponses.slice(0, 3), [rapidResponses]);

  const criticalVendorGaps = useMemo(() => vendorGaps.slice(0, 3), [vendorGaps]);

 

  const pressureScore = number(summary.pressure_score);

  const missionRisk = clean(summary.mission_risk, "Stable");

  const exceptionCount =

    atRiskWorkspaces.length +

    riskDrivingSignals.length +

    activeEscalations.length +

    criticalVendorGaps.length;

 

  const handoffs = [

    { label: "Command Center", detail: "Execution ownership and completion", count: number(summary.open_tasks || openTasks.length), route: "/command-center", countLabel: "open tasks" },

    { label: "Political Signals", detail: "Evidence and signal investigation", count: number(summary.critical_signals || criticalSignals.length), route: "/political-signals", countLabel: "critical signals" },

    { label: "Rapid Response", detail: "Narrative response development", count: number(summary.rapid_responses || rapidResponses.length), route: "/narrative-response", countLabel: "active responses" },

    { label: "Campaign CRM", detail: "Stakeholder follow-up records", count: number(summary.crm_followups || crmFollowups.length), route: "/campaign-crm", countLabel: "follow-ups" },

    { label: "Vendor Network", detail: "Capacity and coverage management", count: number(summary.vendor_gaps || vendorGaps.length), route: "/vendors", countLabel: "coverage gaps" },

  ];

 

  return (

    <PageShell

      eyebrow="Executive Mission Control"

      title="Mission Control"

      description="The next-24-hours operating center for mission readiness, ranked interventions and exceptions requiring coordinated action."

      tickerItems={[

        { label: "Mission Risk", value: missionRisk, dotClass: ["Critical", "High"].includes(missionRisk) ? "vs-live-dot-warning" : "vs-live-dot-success" },

        { label: "Pressure", value: pct(pressureScore), dotClass: pressureScore >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success" },

        { label: "Exceptions", value: String(exceptionCount), dotClass: exceptionCount ? "vs-live-dot-warning" : "vs-live-dot-success" },

        { label: "Updated", value: refreshing ? "Refreshing" : formatTime(data.updated_at), dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },

      ]}

    >

      <style>{`

        .emc-command {

          display: grid;

          grid-template-columns: minmax(0, 1fr) auto;

          gap: 22px;

          align-items: center;

          margin-bottom: 18px;

          padding: 24px;

          border: 1px solid rgba(251, 146, 60, 0.28);

          border-radius: 24px;

          background:

            radial-gradient(circle at top right, rgba(251, 146, 60, 0.15), transparent 34%),

            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.84));

        }

        .emc-command span,

        .emc-exception-copy span,

        .emc-handoff-copy span {

          color: var(--vs-brand-orange, #fb923c);

          font-size: 10px;

          font-weight: 950;

          letter-spacing: 0.12em;

          text-transform: uppercase;

        }

        .emc-command h2 { margin: 7px 0 8px; color: var(--vs-text, #f8fafc); font-size: clamp(24px, 3vw, 38px); line-height: 1.12; }

        .emc-command p { margin: 0; max-width: 760px; color: var(--vs-text-muted, #94a3b8); line-height: 1.65; }

        .emc-command-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

        .emc-metrics { margin-bottom: 18px; }

        .emc-layout { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 18px; align-items: start; }

        .emc-stack { display: grid; gap: 14px; }

        .emc-row { min-width: 0; border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 18px; overflow: hidden; }

        .emc-row .vs-card-muted { border: 0; background: rgba(15, 23, 42, 0.44); }

        .emc-exception { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 15px; border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 17px; background: rgba(15, 23, 42, 0.52); }

        .emc-exception-copy { min-width: 0; }

        .emc-exception-copy strong { display: block; margin-top: 5px; color: var(--vs-text, #f8fafc); font-size: 14px; line-height: 1.35; overflow-wrap: anywhere; }

        .emc-exception-copy p { margin: 5px 0 0; color: var(--vs-text-muted, #94a3b8); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }

        .emc-exception-action { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }

        .emc-exception-action a { color: #bfdbfe; font-size: 11px; font-weight: 900; text-decoration: none; }

        .emc-exception-action a:hover { color: white; }

        .emc-handoffs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }

        .emc-handoff { display: flex; min-width: 0; min-height: 150px; flex-direction: column; justify-content: space-between; gap: 14px; padding: 16px; border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 18px; background: rgba(15, 23, 42, 0.52); }

        .emc-handoff-copy strong { display: block; margin-top: 6px; color: var(--vs-text, #f8fafc); font-size: 15px; }

        .emc-handoff-copy p { margin: 6px 0 0; color: var(--vs-text-muted, #94a3b8); font-size: 11px; line-height: 1.45; }

        .emc-handoff strong.emc-handoff-count { color: white; font-size: 24px; }

        .emc-handoff a { align-self: flex-start; color: #bfdbfe; font-size: 11px; font-weight: 900; text-decoration: none; }

        .emc-source-note { margin: 14px 0 0; color: var(--vs-text-muted, #94a3b8); font-size: 11px; line-height: 1.55; }

        @media (max-width: 1180px) { .emc-handoffs { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        @media (max-width: 900px) { .emc-layout, .emc-command { grid-template-columns: 1fr; } .emc-command-actions { justify-content: flex-start; } }

        @media (max-width: 720px) { .emc-handoffs { grid-template-columns: 1fr; } .emc-exception { grid-template-columns: 1fr; } .emc-exception-action { align-items: flex-start; flex-direction: row; } }

      `}</style>

 

      {error ? (

        <div className="vs-banner vs-banner-danger">

          {error}

          <button className="vs-button vs-button-secondary" type="button" onClick={() => load()}>

            Try Again

          </button>

        </div>

      ) : null}

 

      <section className="emc-command" aria-labelledby="mission-command-title">

        <div>

          <span>Next 24 Hours</span>

          <h2 id="mission-command-title">

            {missionRisk === "Stable" ? "Operating posture is stable" : `${missionRisk} mission conditions require coordination`}

          </h2>

          <p>

            Mission Control ranks cross-system exceptions for coordinated response. Execution ownership and completion remain authoritative in Command Center.

          </p>

        </div>

        <div className="emc-command-actions">

          <Link className="vs-button" to="/command-center">Open Command Center</Link>

          <button className="vs-button vs-button-secondary" type="button" onClick={() => load({ quiet: true })} disabled={refreshing || loading}>

            {refreshing ? "Refreshing..." : "Refresh"}

          </button>

        </div>

      </section>

 

      <div className="emc-metrics vs-grid-4">

        <StatCard label="Mission Pressure" value={pct(pressureScore)} delta={missionRisk} tone={pressureScore >= 65 ? "down" : "up"} />

        <StatCard label="Ranked Interventions" value={fmt(missionItems.length)} delta="Next 24 hours" tone={missionItems.length ? "neutral" : "up"} />

        <StatCard label="At-Risk Workspaces" value={fmt(atRiskWorkspaces.length)} delta={`${workspaceHealth.length} monitored`} tone={atRiskWorkspaces.length ? "down" : "up"} />

        <StatCard label="Active Escalations" value={fmt(activeEscalations.length)} delta={`${exceptionCount} exceptions shown`} tone={activeEscalations.length ? "down" : "up"} />

      </div>

 

      {loading ? (

        <EmptyState text="Loading Mission Control..." />

      ) : (

        <div className="emc-layout">

          <SectionCard

            title="Next 24 Hours Mission Queue"

            subtitle="The six highest-ranked interventions requiring coordinated leadership attention."

            right={<Badge tone={rankedMissionItems.length ? "demo" : "active"}>{rankedMissionItems.length} shown</Badge>}

          >

            <div className="emc-stack">

              {!rankedMissionItems.length ? (

                <EmptyState text="No urgent mission interventions are currently ranked." />

              ) : (

                rankedMissionItems.map((item, index) => (

                  <MissionQueueRow key={item.id || `${item.type}-${index}`} item={item} index={index} />

                ))

              )}

            </div>

          </SectionCard>

 

          <div className="emc-stack">

            <SectionCard

              title="Operational Exceptions"

              subtitle="Only conditions materially contributing to mission pressure."

              right={<Badge tone={exceptionCount ? "danger" : "active"}>{exceptionCount}</Badge>}

            >

              <div className="emc-stack">

                {riskDrivingSignals.map((signal, index) => (

                  <ExceptionRow

                    key={signal.id || `signal-${index}`}

                    label="Risk-Driving Signal"

                    title={signal.title}

                    description={signal.summary || signal.source}

                    value={clean(signal.risk || signal.severity, "Elevated")}

                    route="/political-signals"

                    badgeTone="danger"

                  />

                ))}

 

                {atRiskWorkspaces.map((workspace, index) => (

                  <ExceptionRow

                    key={workspace.id || `workspace-${index}`}

                    label="At-Risk Workspace"

                    title={workspace.name}

                    description={`${workspace.state || "National"} | ${workspace.office || "Campaign"} | ${workspace.cycle || "2026"}`}

                    value={workspace.risk || "Elevated"}

                    route="/command-center"

                    badgeTone={tone(workspace.risk)}

                  />

                ))}

 

                {activeEscalations.map((response, index) => (

                  <ExceptionRow

                    key={response.id || `response-${index}`}

                    label="Rapid-Response Escalation"

                    title={response.title}

                    description={response.response_strategy || response.narrative_summary}

                    value={clean(response.threat_level || response.status, "Open")}

                    route="/narrative-response"

                    badgeTone={tone(response.threat_level || response.status)}

                  />

                ))}

 

                {criticalVendorGaps.map((vendor, index) => (

                  <ExceptionRow

                    key={vendor.id || `vendor-${index}`}

                    label="Vendor Capacity Gap"

                    title={vendor.name || vendor.vendor_name}

                    description={vendor.category || vendor.notes}

                    value={clean(vendor.risk || vendor.coverage_tier, "Gap")}

                    route="/vendors"

                    badgeTone="demo"

                  />

                ))}

 

                {!exceptionCount ? <EmptyState text="No material operational exceptions are active." /> : null}

              </div>

            </SectionCard>

          </div>

        </div>

      )}

 

      <SectionCard

        title="Authoritative Operating Systems"

        subtitle="Mission Control summarizes operating pressure; detailed investigation and execution remain in the connected system of record."

      >

        <div className="emc-handoffs">

          {handoffs.map((item) => (

            <article className="emc-handoff" key={item.label}>

              <div className="emc-handoff-copy">

                <span>{item.label}</span>

                <strong className="emc-handoff-count">{fmt(item.count)}</strong>

                <p>{item.countLabel} | {item.detail}</p>

              </div>

              <Link to={item.route}>Open authoritative page</Link>

            </article>

          ))}

        </div>

        <p className="emc-source-note">

          Political Signals owns signal evidence. Command Center owns tasks and execution. Campaign CRM owns stakeholder follow-ups. Vendor Network owns capacity records. Rapid Response owns narrative-response workflows.

        </p>

      </SectionCard>

    </PageShell>

  );

}
