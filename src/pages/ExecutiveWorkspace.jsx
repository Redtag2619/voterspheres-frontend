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

 

function text(value, fallback = "") {

  const normalized = String(value ?? "").trim();

  return normalized || fallback;

}

 

function cleanDisplayText(value, fallback = "") {

  const normalized = String(value ?? "")

    .replace(/&nbsp;/gi, " ")

    .replace(/&amp;/gi, "&")

    .replace(/&quot;/gi, '"')

    .replace(/&#39;|&apos;/gi, "'")

    .replace(/<[^>]*>/g, " ")

    .replace(/\s+/g, " ")

    .trim();

 

  return normalized || fallback;

}

 

function formatDateTime(value) {

  if (!value) return "Not provided";

 

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Not provided";

 

  return parsed.toLocaleString([], {

    month: "short",

    day: "numeric",

    hour: "numeric",

    minute: "2-digit",

  });

}

 

const GENERIC_EXECUTIVE_ROUTES = new Set([

  "/command-center",

  "/executive-workspace",

  "/executive-decision-intelligence",

]);

 

function routingText(item) {

  return [

    item?.title,

    item?.name,

    item?.subject,

    item?.detail,

    item?.description,

    item?.summary,

    item?.source,

    item?.source_label,

    item?.source_system,

    item?.type,

    item?.category,

    item?.alert_type,

    item?.evidence_type,

    item?.signal_type,

  ]

    .map((value) => text(value).toLowerCase())

    .filter(Boolean)

    .join(" ");

}

 

function inferredRouteFor(item) {

  const haystack = routingText(item);

 

  if (/relationship|political graph|network connection|donor network/.test(haystack)) {

    return "/relationship-graph";

  }

  if (/dark money|political money|fec|committee activity|exposure/.test(haystack)) {

    return "/dark-money-exposure";

  }

  if (/consultant|vendor advisor|strategist/.test(haystack)) {

    return "/consultant-intel";

  }

  if (/vendor|procurement|media buy|inventory|direct mail/.test(haystack)) {

    return "/vendors";

  }

  if (/fundrais|receipt|cash on hand|donor|contribution|finance/.test(haystack)) {

    return "/fundraising-dashboard";

  }

  if (/crm|client update|prospect|follow-up|follow up|opportunity/.test(haystack)) {

    return "/campaign-crm";

  }

  if (/county|field|gotv|early vote|volunteer|operations|turnout/.test(haystack)) {

    return "/operations-map";

  }

  if (/coalition|strategy|strategic|message plan|recommendation/.test(haystack)) {

    return "/strategy";

  }

  if (/battleground|race pressure|national command|state risk/.test(haystack)) {

    return "/national-command";

  }

  if (/political signal|narrative|news|reporting|public narrative/.test(haystack)) {

    return "/political-signals";

  }

  if (/candidate|office|race candidate/.test(haystack)) {

    return "/candidates";

  }

 

  return "/executive-decision-intelligence";

}

 

function routeFor(item, fallback = "/executive-decision-intelligence") {

  const candidate = text(item?.path || item?.route || item?.href);

 

  if (candidate.startsWith("/") && !GENERIC_EXECUTIVE_ROUTES.has(candidate)) {

    return candidate;

  }

 

  const inferred = inferredRouteFor(item);

  if (inferred) return inferred;

 

  return candidate.startsWith("/") ? candidate : fallback;

}

 

function routeLabel(route) {

  const labels = {

    "/relationship-graph": "Relationship Graph",

    "/dark-money-exposure": "Political Money Exposure",

    "/consultant-intel": "Consultant Intelligence",

    "/vendors": "Vendor Network",

    "/fundraising-dashboard": "Fundraising",

    "/campaign-crm": "Campaign CRM",

    "/operations-map": "Operations",

    "/strategy": "Strategy",

    "/national-command": "National Command",

    "/political-signals": "Political Signals",

    "/candidates": "Candidates",

    "/command-center": "Command Center",

    "/executive-decision-intelligence": "Decision Intelligence",

  };

 

  return labels[route] || "Authoritative System";

}

 

function normalizedPriorityIdentity(item) {

  const title = itemTitle(item, "")

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, " ")

    .trim();

 

  if (title) return title;

 

  return [item?.id, item?.key, item?.slug, item?.source]

    .map((value) => text(value).toLowerCase())

    .filter(Boolean)

    .join("|");

}

 

function priorityRank(item) {

  const priority = text(item?.priority || item?.severity || item?.risk, "normal").toLowerCase();

 

  if (["critical", "urgent", "immediate", "severe"].some((value) => priority.includes(value))) {

    return 4;

  }

  if (["high", "elevated", "overdue", "blocked"].some((value) => priority.includes(value))) {

    return 3;

  }

  if (["medium", "watch", "review", "pending"].some((value) => priority.includes(value))) {

    return 2;

  }

  return 1;

}

 

function toneFor(item) {

  const rank = priorityRank(item);

  if (rank >= 4) return "danger";

  if (rank >= 3) return "demo";

  if (rank === 2) return "info";

  return "accent";

}

 

function labelFor(item) {

  return text(item?.priority || item?.severity || item?.risk || item?.status, "Review");

}

 

function itemTitle(item, fallback) {

  return text(item?.title || item?.name || item?.subject, fallback);

}

 

function itemDetail(item, fallback) {

  return text(item?.detail || item?.description || item?.summary, fallback);

}

 

function itemKey(item, prefix, index) {

  return `${prefix}-${item?.id || item?.key || item?.slug || index}`;

}

 

const EMPTY_DATA = {

  selected_workspace: null,

  workspaces: [],

  summary: {},

  executive_actions: [],

  material_alerts: [],

  material_alerts_summary: {},

  signals: [],

  tasks: [],

  activities: [],

};

 

export default function ExecutiveWorkspace() {

  const [workspaceId, setWorkspaceId] = useState(

    () => localStorage.getItem("vs_active_workspace") || ""

  );

  const [data, setData] = useState(EMPTY_DATA);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState("");

 

  const load = useCallback(

    async ({ quiet = false } = {}) => {

      try {

        if (quiet) setRefreshing(true);

        else setLoading(true);

 

        setError("");

 

        const result = await api.executiveWorkspaceDashboard(workspaceId || undefined);

 

        const nextData = {

          selected_workspace: result?.selected_workspace || null,

          workspaces: arr(result?.workspaces),

          summary: result?.summary || {},

          executive_actions: arr(result?.executive_actions),

          material_alerts: arr(result?.material_alerts),

          material_alerts_summary: result?.material_alerts_summary || {},

          signals: arr(result?.signals),

          tasks: arr(result?.tasks),

          activities: arr(result?.activities),

        };

 

        setData(nextData);

 

        if (nextData.selected_workspace?.id) {

          const nextWorkspaceId = String(nextData.selected_workspace.id);

          localStorage.setItem("vs_active_workspace", nextWorkspaceId);

          setWorkspaceId(nextWorkspaceId);

        }

 

        setLastUpdated(new Date().toISOString());

      } catch (err) {

        setError(

          err?.response?.data?.error ||

            err?.response?.data?.detail ||

            err?.message ||

            "Executive priorities could not be loaded."

        );

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },

    [workspaceId]

  );

 

  useEffect(() => {

    load();

  }, [load]);

 

  const selected = data.selected_workspace;

  const summary = data.summary || {};

  const workspaceOptions = useMemo(() => arr(data.workspaces), [data.workspaces]);

 

  const priorities = useMemo(() => {

    const actions = arr(data.executive_actions).map((item) => ({

      ...item,

      _kind: "Executive action",

      _priority_sources: ["Executive action"],

    }));

 

    const urgentTasks = arr(data.tasks)

      .filter((item) => priorityRank(item) >= 3)

      .map((item) => ({

        ...item,

        _kind: "Assigned task",

        _priority_sources: ["Assigned task"],

      }));

 

    const deduped = new Map();

 

    [...actions, ...urgentTasks].forEach((item) => {

      const identity = normalizedPriorityIdentity(item);

      const existing = deduped.get(identity);

 

      if (!existing) {

        deduped.set(identity, item);

        return;

      }

 

      const mergedSources = Array.from(

        new Set([...(existing._priority_sources || []), ...(item._priority_sources || [])])

      );

      const preferred = priorityRank(item) > priorityRank(existing) ? item : existing;

      const secondary = preferred === item ? existing : item;

 

      deduped.set(identity, {

        ...secondary,

        ...preferred,

        owner_name: preferred.owner_name || secondary.owner_name,

        owner: preferred.owner || secondary.owner,

        due_at: preferred.due_at || secondary.due_at,

        due_date: preferred.due_date || secondary.due_date,

        route: preferred.route || secondary.route,

        path: preferred.path || secondary.path,

        href: preferred.href || secondary.href,

        _priority_sources: mergedSources,

        _kind:

          mergedSources.length > 1

            ? "Executive action + assigned task"

            : mergedSources[0] || preferred._kind,

      });

    });

 

    return Array.from(deduped.values())

      .sort((a, b) => {

        const rankDifference = priorityRank(b) - priorityRank(a);

        if (rankDifference) return rankDifference;

        return itemTitle(a, "").localeCompare(itemTitle(b, ""));

      })

      .slice(0, 6);

  }, [data.executive_actions, data.tasks]);

 

  const materialAlerts = useMemo(() => {

    const normalized = arr(data.material_alerts);

    if (normalized.length) return normalized.slice(0, 4);

 

    return arr(data.signals)

      .slice()

      .sort((a, b) => {

        const riskDifference = priorityRank(b) - priorityRank(a);

        if (riskDifference) return riskDifference;

        return number(b?.signal_score || b?.score) - number(a?.signal_score || a?.score);

      })

      .slice(0, 4)

      .map((signal) => ({

        ...signal,

        alert_type: "narrative",

        category: signal.signal_type || "Political narrative",

        headline: cleanDisplayText(signal.title, "Political signal"),

        summary: cleanDisplayText(signal.summary, "Review the source record for evidence."),

        source_label: "Political Signals",

        evidence_type: "Narrative reporting",

        score: number(signal.signal_score || signal.score),

        route: "/political-signals",

      }));

  }, [data.material_alerts, data.signals]);

 

  const activities = useMemo(

    () => arr(data.activities).slice(0, 6),

    [data.activities]

  );

 

  const primaryPriority = priorities[0] || null;

  const criticalSignalCount = materialAlerts.filter((item) => priorityRank(item) >= 4).length;

  const urgentTaskCount = arr(data.tasks).filter((item) => priorityRank(item) >= 3).length;

  const openTaskCount = number(summary.open_tasks || arr(data.tasks).length);

  const readinessScore = number(summary.workspace_readiness_score);

  const pressureScore = number(summary.pressure_score);

 

  function handleWorkspaceChange(nextId) {

    setWorkspaceId(nextId);

 

    if (nextId) localStorage.setItem("vs_active_workspace", String(nextId));

    else localStorage.removeItem("vs_active_workspace");

  }

 

  const primaryRoute = routeFor(primaryPriority);

  const primaryRouteLabel = routeLabel(primaryRoute);

  const selectedWorkspaceContext = [

    selected?.candidate_name,

    selected?.state,

    selected?.office,

    selected?.cycle,

  ]

    .filter(Boolean)

    .join(" · ");

 

  return (

    <PageShell

      eyebrow="Executive"

      title={selected?.name || "Executive Workspace"}

      description="Leadership's daily starting point for urgent priorities, assigned work, and material political alerts."

      tickerItems={[

        {

          label: "Priority",

          value: primaryPriority ? labelFor(primaryPriority) : "Clear",

          dotClass: primaryPriority ? "vs-live-dot-warning" : "vs-live-dot-success",

        },

        {

          label: "Open tasks",

          value: String(openTaskCount),

          dotClass: openTaskCount ? "vs-live-dot-warning" : "vs-live-dot-success",

        },

        {

          label: "Critical alerts",

          value: String(criticalSignalCount),

          dotClass: criticalSignalCount ? "vs-live-dot" : "vs-live-dot-success",

        },

        {

          label: "Material alerts",

          value: String(materialAlerts.length),

          dotClass: materialAlerts.length ? "vs-live-dot-warning" : "vs-live-dot-success",

        },

        {

          label: "Updated",

          value: refreshing ? "Refreshing" : formatDateTime(lastUpdated),

          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",

        },

      ]}

    >

      <style>{`

        .executive-workspace-toolbar {

          display: grid;

          grid-template-columns: minmax(0, 1fr) auto;

          gap: 14px;

          align-items: end;

        }

 

        .executive-workspace-field {

          display: grid;

          gap: 7px;

        }

 

        .executive-workspace-field label,

        .executive-workspace-kicker {

          color: rgba(148, 163, 184, .9);

          font-size: 11px;

          font-weight: 900;

          letter-spacing: .12em;

          text-transform: uppercase;

        }

 

        .executive-workspace-field select {

          width: 100%;

          min-height: 44px;

          border: 1px solid rgba(148, 163, 184, .18);

          border-radius: 13px;

          background: rgba(15, 23, 42, .82);

          color: #f8fafc;

          padding: 0 13px;

        }

 

        .executive-workspace-context {

          margin-top: 14px;

          display: grid;

          grid-template-columns: repeat(2, minmax(0, 1fr));

          gap: 10px;

        }

 

        .executive-workspace-context-card {

          padding: 13px 14px;

          border: 1px solid rgba(148, 163, 184, .14);

          border-radius: 13px;

          background: rgba(15, 23, 42, .48);

        }

 

        .executive-workspace-context-card span {

          display: block;

          margin-bottom: 4px;

          color: rgba(148, 163, 184, .86);

          font-size: 10px;

          font-weight: 900;

          letter-spacing: .1em;

          text-transform: uppercase;

        }

 

        .executive-workspace-context-card strong {

          color: #f8fafc;

          font-size: 14px;

        }

 

        .executive-workspace-focus {

          display: grid;

          grid-template-columns: minmax(0, 1fr) auto;

          gap: 24px;

          align-items: center;

          padding: 24px;

          border: 1px solid rgba(249, 115, 22, .28);

          border-radius: 20px;

          background: linear-gradient(135deg, rgba(249, 115, 22, .13), rgba(15, 23, 42, .88));

          box-shadow: 0 18px 50px rgba(2, 6, 23, .22);

        }

 

        .executive-workspace-focus h2 {

          margin: 7px 0 8px;

          color: #f8fafc;

          font-size: clamp(23px, 3vw, 34px);

          line-height: 1.1;

        }

 

        .executive-workspace-focus p {

          max-width: 760px;

          margin: 0;

          color: rgba(226, 232, 240, .82);

          line-height: 1.65;

        }

 

        .executive-workspace-grid {

          display: grid;

          grid-template-columns: minmax(0, 1.45fr) minmax(300px, .75fr);

          gap: 18px;

          align-items: start;

        }

 

        .executive-workspace-stack {

          display: grid;

          gap: 12px;

        }

 

        .executive-workspace-row {

          padding: 14px;

          border: 1px solid rgba(148, 163, 184, .13);

          border-radius: 14px;

          background: rgba(15, 23, 42, .45);

        }

 

        .executive-workspace-links {

          display: flex;

          flex-wrap: wrap;

          gap: 10px;

        }

 

        .executive-workspace-source {

          margin: 8px 0 0;

          color: rgba(148, 163, 184, .78);

          font-size: 12px;

          line-height: 1.5;

        }

 

        .executive-material-alert {

          display: grid;

          gap: 10px;

          padding: 16px;

          border: 1px solid rgba(148, 163, 184, .14);

          border-radius: 15px;

          background: rgba(15, 23, 42, .48);

        }

 

        .executive-material-alert-top,

        .executive-material-alert-meta,

        .executive-material-alert-actions {

          display: flex;

          flex-wrap: wrap;

          gap: 8px;

          align-items: center;

        }

 

        .executive-material-alert h3 {

          margin: 0;

          color: #f8fafc;

          font-size: 16px;

          line-height: 1.35;

        }

 

        .executive-material-alert p {

          margin: 0;

          color: rgba(203, 213, 225, .82);

          font-size: 13px;

          line-height: 1.6;

        }

 

        .executive-material-alert-meta span {

          color: rgba(148, 163, 184, .82);

          font-size: 11px;

          font-weight: 800;

        }

 

        @media (max-width: 900px) {

          .executive-workspace-grid,

          .executive-workspace-context {

          margin-top: 14px;

          display: grid;

          grid-template-columns: repeat(2, minmax(0, 1fr));

          gap: 10px;

        }

 

        .executive-workspace-context-card {

          padding: 13px 14px;

          border: 1px solid rgba(148, 163, 184, .14);

          border-radius: 13px;

          background: rgba(15, 23, 42, .48);

        }

 

        .executive-workspace-context-card span {

          display: block;

          margin-bottom: 4px;

          color: rgba(148, 163, 184, .86);

          font-size: 10px;

          font-weight: 900;

          letter-spacing: .1em;

          text-transform: uppercase;

        }

 

        .executive-workspace-context-card strong {

          color: #f8fafc;

          font-size: 14px;

        }

 

        .executive-workspace-focus {

            grid-template-columns: 1fr;

          }

 

          .executive-workspace-focus .vs-button {

            width: 100%;

            justify-content: center;

          }

        }

 

        @media (max-width: 640px) {

          .executive-workspace-toolbar {

            grid-template-columns: 1fr;

          }

        }

      `}</style>

 

      {error ? (

        <div className="vs-banner vs-banner-danger" role="alert">

          {error}

          <button

            className="vs-button vs-button-secondary"

            type="button"

            onClick={() => load()}

          >

            Try Again

          </button>

        </div>

      ) : null}

 

      <SectionCard

        title="Active Workspace"

        subtitle="Choose the campaign or organization that should drive today's executive priorities."

      >

        <div className="executive-workspace-toolbar">

          <div className="executive-workspace-field">

            <label htmlFor="executive-workspace-select">Workspace</label>

            <select

              id="executive-workspace-select"

              value={workspaceId}

              onChange={(event) => handleWorkspaceChange(event.target.value)}

            >

              <option value="">Most recent workspace</option>

              {workspaceOptions.map((workspace) => (

                <option key={workspace.id} value={workspace.id}>

                  {[workspace.name, workspace.state, workspace.office, workspace.cycle]

                    .filter(Boolean)

                    .join(" - ")}

                </option>

              ))}

            </select>

          </div>

 

          <button

            className="vs-button vs-button-secondary"

            type="button"

            disabled={loading || refreshing}

            onClick={() => load({ quiet: true })}

          >

            {refreshing ? "Refreshing..." : "Refresh"}

          </button>

        </div>

 

        <div className="executive-workspace-context">

          <div className="executive-workspace-context-card">

            <span>Active workspace</span>

            <strong>{selected?.name || "Most recent workspace"}</strong>

          </div>

          <div className="executive-workspace-context-card">

            <span>Campaign context</span>

            <strong>{selectedWorkspaceContext || "Workspace metadata not provided"}</strong>

          </div>

        </div>

      </SectionCard>

 

      {loading ? (

        <EmptyState text="Loading today's executive priorities..." />

      ) : (

        <>

          <div className="vs-grid-4">

            <StatCard

              label="Priority items"

              value={String(priorities.length)}

              delta={primaryPriority ? labelFor(primaryPriority) : "No urgent action"}

              tone={priorities.length ? "neutral" : "up"}

            />

            <StatCard

              label="Urgent tasks"

              value={String(urgentTaskCount)}

              delta={`${openTaskCount} total open`}

              tone={urgentTaskCount ? "down" : "up"}

            />

            <StatCard

              label="Alert posture"

              value={`${criticalSignalCount} critical`}

              delta={`${materialAlerts.length} material alerts shown`}

              tone={criticalSignalCount ? "down" : materialAlerts.length ? "neutral" : "up"}

            />

            <StatCard

              label="Operating pressure"

              value={`${pressureScore}%`}

              delta={`${readinessScore}% workspace readiness`}

              tone={pressureScore >= 70 ? "down" : pressureScore >= 40 ? "neutral" : "up"}

            />

          </div>

 

          {primaryPriority ? (

            <div className="executive-workspace-focus">

              <div>

                <span className="executive-workspace-kicker">Highest-priority item</span>

                <h2>{itemTitle(primaryPriority, "Executive review required")}</h2>

                <p>{itemDetail(primaryPriority, "Open this item to review the evidence and determine the next action.")}</p>

              </div>

 

              <div className="executive-workspace-links">

                <Link className="vs-button" to={primaryRoute}>

                  Open {primaryRouteLabel}

                </Link>

                <Link className="vs-button vs-button-secondary" to="/command-center">

                  Open Command Center

                </Link>

              </div>

            </div>

          ) : (

            <SectionCard title="Today's Priority" subtitle="No urgent executive intervention is currently required.">

              <EmptyState text="The current workspace has no ranked priority action. Continue monitoring alerts and assigned work." />

            </SectionCard>

          )}

 

          <div className="executive-workspace-grid">

            <SectionCard

              title="Priority Queue"

              subtitle="The six highest-ranked unique executive priorities, deduplicated across actions and assigned tasks."

              right={<Badge tone={priorities.length ? "demo" : "active"}>{priorities.length}</Badge>}

            >

              <div className="executive-workspace-stack">

                {!priorities.length ? (

                  <EmptyState text="No priority actions are waiting for executive review." />

                ) : (

                  priorities.map((item, index) => (

                    <div className="executive-workspace-row" key={itemKey(item, "priority", index)}>

                      <ResponsiveRow

                        title={itemTitle(item, "Executive action")}

                        subtitle={itemDetail(item, "Review the source record for details.")}

                        meta={[

                          { label: "Type", value: item._kind },

                          { label: "Priority", value: labelFor(item) },

                          { label: "Owner", value: text(item.owner_name || item.owner, "Unassigned") },

                          { label: "Due", value: formatDateTime(item.due_at || item.due_date) },

                        ]}

                        right={(() => {

                          const route = routeFor(item);

                          return (

                            <Link className="vs-button vs-button-secondary" to={route}>

                              Open {routeLabel(route)}

                            </Link>

                          );

                        })()}

                      />

                    </div>

                  ))

                )}

              </div>

            </SectionCard>

 

            <div className="executive-workspace-stack">

              <SectionCard

                title="Material Alerts"

                subtitle="A concise mix of FEC-linked political-finance evidence and material political developments."

                right={

                  <Badge tone={criticalSignalCount ? "danger" : "active"}>

                    {materialAlerts.length} shown

                  </Badge>

                }

              >

                <div className="executive-workspace-stack">

                  {!materialAlerts.length ? (

                    <EmptyState text="No FEC-linked or narrative material alerts are available for this workspace." />

                  ) : (

                    materialAlerts.map((alert, index) => (

                      <article className="executive-material-alert" key={itemKey(alert, "material-alert", index)}>

                        <div className="executive-material-alert-top">

                          <Badge tone={alert.alert_type === "fec" ? "accent" : "info"}>

                            {cleanDisplayText(alert.category, alert.alert_type === "fec" ? "Political finance" : "Narrative")}

                          </Badge>

                          <Badge tone={toneFor(alert)}>{labelFor(alert)}</Badge>

                        </div>

 

                        <h3>{cleanDisplayText(alert.headline || alert.title, "Material alert")}</h3>

                        <p>{cleanDisplayText(alert.summary, "Review the authoritative record for supporting evidence.")}</p>

 

                        <div className="executive-material-alert-meta">

                          <span>Source: {cleanDisplayText(alert.source_label, "Public records")}</span>

                          <span>Evidence: {cleanDisplayText(alert.evidence_type, "Review required")}</span>

                          <span>Score: {number(alert.score || alert.signal_score) || "Not scored"}</span>

                          <span>Updated: {formatDateTime(alert.published_at || alert.created_at)}</span>

                        </div>

 

                        <div className="executive-material-alert-actions">

                          {(() => {

                            const alertRoute = routeFor(alert, "/political-signals");

                            return (

                              <Link className="vs-button vs-button-secondary" to={alertRoute}>

                                Review in {routeLabel(alertRoute)}

                              </Link>

                            );

                          })()}

                          {alert.external_url ? (

                            <a

                              className="vs-button vs-button-secondary"

                              href={alert.external_url}

                              target="_blank"

                              rel="noreferrer"

                            >

                              Open Source

                            </a>

                          ) : null}

                        </div>

                      </article>

                    ))

                  )}

                </div>

 

                <p className="executive-workspace-source">

                  FEC-linked financial records remain authoritative on Political Money Exposure. Narrative evidence remains authoritative on Political Signals.

                </p>

                <div className="executive-workspace-links">

                  <Link className="vs-button vs-button-secondary" to="/dark-money-exposure">

                    View Political Money

                  </Link>

                  <Link className="vs-button vs-button-secondary" to="/political-signals">

                    View Political Signals

                  </Link>

                </div>

              </SectionCard>

 

              <SectionCard

                title="Recent Activity"

                subtitle="Latest workspace changes, shown for context rather than task management."

              >

                <div className="executive-workspace-stack">

                  {!activities.length ? (

                    <EmptyState text="No recent workspace activity was returned." />

                  ) : (

                    activities.map((activity, index) => (

                      <div className="executive-workspace-row" key={itemKey(activity, "activity", index)}>

                        <ResponsiveRow

                          title={itemTitle(activity, "Workspace activity")}

                          subtitle={itemDetail(activity, text(activity.type, "Activity"))}

                          meta={[

                            { label: "Type", value: text(activity.type, "Activity") },

                            { label: "Updated", value: formatDateTime(activity.activity_time || activity.updated_at || activity.created_at) },

                          ]}

                          right={(() => {

                            const activityRoute = routeFor(activity);

                            return (

                              <Link className="vs-button vs-button-secondary" to={activityRoute}>

                                Open {routeLabel(activityRoute)}

                              </Link>

                            );

                          })()}

                        />

                      </div>

                    ))

                  )}

                </div>

              </SectionCard>

            </div>

          </div>

 

          <SectionCard

            title="Continue in the Authoritative Workspace"

            subtitle="Open the full destination only when deeper analysis or execution is required."

          >

            <div className="executive-workspace-links">

              <Link className="vs-button vs-button-secondary" to="/command-center">

                Command Center

              </Link>

              <Link className="vs-button vs-button-secondary" to="/unified-executive-intelligence">

                Unified Intelligence

              </Link>

              <Link className="vs-button vs-button-secondary" to="/executive-decision-intelligence">

                Decision Intelligence

              </Link>

              <Link className="vs-button vs-button-secondary" to="/mission-control">

                Mission Control

              </Link>

              <Link className="vs-button vs-button-secondary" to="/strategy">

                Strategy

              </Link>

              <Link className="vs-button vs-button-secondary" to="/operations-map">

                Operations

              </Link>

              <Link className="vs-button vs-button-secondary" to="/relationship-graph">

                Relationship Graph

              </Link>

            </div>

          </SectionCard>

        </>

      )}

    </PageShell>

  );

}
