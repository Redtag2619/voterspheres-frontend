

import { Link } from "react-router-dom";

 

import PageShell from "../components/ui/PageShell";

import SectionCard from "../components/ui/SectionCard";

import Badge from "../components/ui/Badge";

import EmptyState from "../components/ui/EmptyState";

 

import { useWorkspace } from "../context/WorkspaceContext";

import { useExecutiveFilters } from "../context/ExecutiveFiltersContext";

import { useUnifiedExecutiveIntelligence } from "../context/UnifiedExecutiveIntelligenceContext";

 

function arr(value) {

  return Array.isArray(value) ? value : [];

}

 

function number(value) {

  const next = Number(value);

  return Number.isFinite(next) ? next : 0;

}

 

function pct(value) {

  return `${Math.round(number(value))}%`;

}

 

function tone(value = "") {

  const next = String(value || "").toLowerCase();

 

  if (["critical", "high", "danger", "intervention"].some((item) => next.includes(item))) {

    return "danger";

  }

 

  if (["elevated", "watch", "medium", "degraded"].some((item) => next.includes(item))) {

    return "demo";

  }

 

  if (["stable", "operational", "available", "active", "live", "fresh"].some((item) => next.includes(item))) {

    return "active";

  }

 

  return "accent";

}

 

function decodeHtmlEntities(value = "") {

  if (!value) return "";

  if (typeof document === "undefined") return String(value);

 

  const textarea = document.createElement("textarea");

  textarea.innerHTML = String(value);

  return textarea.value;

}

 

function cleanText(value = "") {

  const decoded = decodeHtmlEntities(value);

 

  if (typeof document === "undefined") {

    return decoded.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

  }

 

  const container = document.createElement("div");

  container.innerHTML = decoded;

 

  const anchor = container.querySelector("a");

  const publisher = container.querySelector("font")?.textContent?.trim() || "";

  const headline = (anchor?.textContent || container.textContent || "").replace(/\s+/g, " ").trim();

 

  return publisher && !headline.includes(publisher) ? `${headline} — ${publisher}` : headline;

}

 

function cleanTitle(value = "") {

  return cleanText(value)

    .replace(/^Narrative signal:\s*/i, "")

    .replace(/^Political signal:\s*/i, "")

    .replace(/^Election signal:\s*/i, "")

    .trim();

}

 

function firstText(...values) {

  return values.map(cleanText).find(Boolean) || "No additional context is available.";

}

 

function safeRoute(value, fallback) {

  const route = String(value || "").trim();

  return route.startsWith("/") && !route.startsWith("//") ? route : fallback;

}

 


const GENERIC_EXECUTIVE_ROUTES = new Set([
  "/command-center",
  "/executive-workspace",
  "/executive-decision-intelligence",
  "/strategy-recommendations",
]);

function executiveRoute(item = {}, fallback = "/executive-decision-intelligence") {
  const explicitRoute = safeRoute(item.route, "");

  if (explicitRoute && !GENERIC_EXECUTIVE_ROUTES.has(explicitRoute)) {
    return explicitRoute;
  }

  const context = cleanText([
    item.title,
    item.name,
    item.headline,
    item.detail,
    item.description,
    item.summary,
    item.message,
    item.category,
    item.type,
    item.signal_type,
    item.recommendation_type,
    item.action_type,
    item.source,
    item.provider,
  ].filter(Boolean).join(" ")).toLowerCase();

  if (/relationship|network|influence graph|connection/.test(context)) return "/relationship-graph";
  if (/dark money|fec|committee finance|independent expenditure|pac|super pac/.test(context)) return "/dark-money-exposure";
  if (/consultant|consulting firm|strategist/.test(context)) return "/consultant-intel";
  if (/vendor|media buy|direct mail|production vendor|capacity gap/.test(context)) return "/vendors";
  if (/fundrais|receipt|donor|contribution|finance|cash on hand|burn rate/.test(context)) return "/fundraising-dashboard";
  if (/crm|client update|follow[- ]?up|opportunity|contact/.test(context)) return "/campaign-crm";
  if (/county|field|gotv|early vote|volunteer|turnout|state operation|operations/.test(context)) return "/operations-map";
  if (/coalition|strategy|strategic plan|path to victory/.test(context)) return "/strategy";
  if (/battleground|race pressure|national race|competitive race/.test(context)) return "/national-command";
  if (/political signal|narrative|news|reporting|media narrative|public narrative/.test(context)) return "/political-signals";
  if (/candidate|opponent|incumbent|challenger/.test(context)) return "/candidates";

  return explicitRoute || fallback;
}

function findingScore(item = {}) {

  return Math.max(

    number(item.score),

    number(item.priority_score),

    number(item.severity_score),

    number(item.confidence),

    number(item.confidence_percentage)

  );

}

 

function formatTime(value) {

  if (!value) return "Awaiting refresh";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Awaiting refresh";

  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

}

 

export default function CrossWorkspaceExecutiveDashboard() {

  const {

    health,

    briefing,

    summary,

    signals,

    alerts,

    recommendations,

    sourceStatus,

    loading,

    refreshing,

    error,

    lastUpdated,

    refresh,

    createAction,

  } = useUnifiedExecutiveIntelligence();

 

  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();

  const { filters, setFilters, clearFilters } = useExecutiveFilters();

 

  const [creatingActionId, setCreatingActionId] = useState("");

  const [actionMessage, setActionMessage] = useState("");

 

  const states = useMemo(

    () => [...new Set(arr(workspaces).map((item) => item.state).filter(Boolean))].sort(),

    [workspaces]

  );


  const activeWorkspace = useMemo(
    () => arr(workspaces).find((workspace) => String(workspace.id) === String(activeWorkspaceId)) || null,
    [workspaces, activeWorkspaceId]
  );

  const scopeLabel = useMemo(() => {
    const parts = [
      activeWorkspace?.name || "All workspaces",
      filters.state || (activeWorkspace?.state && activeWorkspace.state !== "National" ? activeWorkspace.state : ""),
      filters.office || "",
      filters.risk ? `${filters.risk} risk` : "All risk levels",
    ].filter(Boolean);

    return parts.join(" • ");
  }, [activeWorkspace, filters.office, filters.risk, filters.state]);

 

  const findings = useMemo(() => {

    const alertFindings = arr(alerts).map((item, index) => ({

      ...item,

      findingId: `alert-${item.id || index}`,

      kind: "Executive Alert",

      title: cleanTitle(item.title || item.name || item.headline || "Executive alert"),

      detail: firstText(item.detail, item.description, item.summary, item.message),

      route: executiveRoute(item, "/notifications"),

      level: item.severity || item.priority || item.risk || "Alert",

      score: findingScore(item),

    }));

 

    const signalFindings = arr(signals).map((item, index) => ({

      ...item,

      findingId: `signal-${item.id || index}`,

      kind: "Political Signal",

      title: cleanTitle(item.title || item.name || item.headline || "Political signal"),

      detail: firstText(item.detail, item.description, item.summary, item.explanation),

      route: executiveRoute(item, "/political-signals"),

      level: item.severity || item.priority || item.risk || item.signal_type || "Signal",

      score: findingScore(item),

    }));

 

    return [...alertFindings, ...signalFindings]

      .sort((a, b) => b.score - a.score)

      .slice(0, 5);

  }, [alerts, signals]);

 

  const executiveImplications = useMemo(

    () =>

      arr(recommendations)

        .filter((item) => item?.title || item?.detail || item?.description)

        .slice(0, 3),

    [recommendations]

  );

 

  const evidence = useMemo(() => {

    const sources = arr(sourceStatus);

    const available = sources.filter((item) =>

      ["available", "active", "live", "fresh", "operational"].includes(

        String(item.status || "").toLowerCase()

      )

    ).length;

    const degraded = sources.filter((item) =>

      ["degraded", "offline", "unavailable", "error"].includes(

        String(item.status || "").toLowerCase()

      )

    ).length;

 

    return { sources, available, degraded };

  }, [sourceStatus]);

 

  async function handleCreateAction(item, index) {

    const actionId = String(item.id || index);

 

    try {

      setCreatingActionId(actionId);

      setActionMessage("");

 

      await createAction({

        recommendation_id: item.id || null,

        title: cleanTitle(item.title || "Executive intelligence action"),

        description: firstText(item.detail, item.description, item.summary),

        priority: item.priority || "high",

        workspace_id: item.workspace_id || activeWorkspaceId || null,

        route: executiveRoute(item, "/executive-decision-intelligence"),

      });

 

      setActionMessage("Executive action created in Command Center.");

    } catch (actionError) {

      setActionMessage(

        actionError?.response?.data?.error || actionError?.message || "Failed to create executive action."

      );

    } finally {

      setCreatingActionId("");

    }

  }

 

  return (

    <PageShell

      eyebrow="Unified Executive Intelligence Layer"

      title="Unified Executive Intelligence"

      description="A concise, evidence-backed executive briefing that explains what matters now, why it matters, and what leadership should do next."

    >

      <style>{`

        .uei-page { display: grid; gap: 18px; }

        .uei-scope, .uei-actions, .uei-meta, .uei-evidence, .uei-finding-meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

        .uei-scope { justify-content: space-between; padding: 14px; border: 1px solid rgba(148,163,184,.14); border-radius: 18px; background: rgba(15,23,42,.42); }

        .uei-scope-fields { display: flex; flex-wrap: wrap; gap: 10px; }

        .uei-scope select { min-width: 170px; border: 1px solid rgba(148,163,184,.18); border-radius: 12px; padding: 10px 12px; background: rgba(2,6,23,.74); color: white; }

        .uei-brief { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0,1fr) minmax(250px,.34fr); gap: 22px; padding: 26px; border: 1px solid rgba(96,165,250,.24); border-radius: 28px; background: radial-gradient(circle at top right,rgba(59,130,246,.22),transparent 36%),linear-gradient(135deg,rgba(15,23,42,.96),rgba(2,6,23,.82)); box-shadow: 0 24px 70px rgba(2,6,23,.28); }

        .uei-brief h2 { max-width: 920px; margin: 8px 0 12px; color: white; font-size: clamp(29px,4.5vw,52px); line-height: 1; letter-spacing: -.055em; }

        .uei-brief p { max-width: 900px; margin: 0; color: rgba(203,213,225,.8); line-height: 1.72; }

        .uei-scope-summary { display: inline-flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; padding: 7px 10px; border: 1px solid rgba(96,165,250,.2); border-radius: 999px; background: rgba(59,130,246,.08); color: rgba(191,219,254,.9); font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }

        .uei-recommendation { margin-top: 18px; padding: 16px 18px; border-left: 3px solid #fb923c; border-radius: 0 16px 16px 0; background: rgba(251,146,60,.09); }

        .uei-recommendation span, .uei-side-label { display: block; color: #fdba74; font-size: 10px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }

        .uei-recommendation strong { display: block; margin-top: 6px; color: white; font-size: 18px; line-height: 1.35; }

        .uei-brief-side { display: grid; align-content: start; gap: 10px; }

        .uei-fact { padding: 14px; border: 1px solid rgba(148,163,184,.13); border-radius: 16px; background: rgba(2,6,23,.34); }

        .uei-fact strong { display: block; margin-top: 6px; color: white; font-size: 18px; }

        .uei-grid { display: grid; grid-template-columns: minmax(0,1.2fr) minmax(330px,.8fr); gap: 18px; align-items: start; }

        .uei-stack { display: grid; gap: 12px; }

        .uei-finding, .uei-implication { padding: 16px; border: 1px solid rgba(148,163,184,.14); border-radius: 18px; background: rgba(15,23,42,.45); }

        .uei-finding h3, .uei-implication h3 { margin: 8px 0 7px; color: white; font-size: 16px; line-height: 1.35; }

        .uei-finding p, .uei-implication p { margin: 0; color: rgba(203,213,225,.74); font-size: 12px; line-height: 1.6; }

        .uei-finding-top, .uei-implication-footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; }

        .uei-finding-meta { margin-top: 12px; color: rgba(148,163,184,.74); font-size: 10px; }

        .uei-evidence { align-items: stretch; }

        .uei-evidence-card { flex: 1 1 120px; padding: 13px; border: 1px solid rgba(148,163,184,.13); border-radius: 15px; background: rgba(15,23,42,.42); }

        .uei-evidence-card span { display: block; color: rgba(148,163,184,.76); font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }

        .uei-evidence-card strong { display: block; margin-top: 5px; color: white; font-size: 20px; }

        .uei-source-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }

        .uei-context-note { color: rgba(148,163,184,.72); font-size: 11px; line-height: 1.55; }

        @media (max-width: 1000px) { .uei-brief, .uei-grid { grid-template-columns: 1fr; } }

        @media (max-width: 700px) { .uei-scope { align-items: stretch; } .uei-scope-fields, .uei-scope-fields select, .uei-actions { width: 100%; } .uei-scope-fields select, .uei-actions .vs-button { flex: 1 1 100%; } .uei-brief { padding: 20px; } .uei-finding-top, .uei-implication-footer { align-items: flex-start; flex-direction: column; } }

      `}</style>

 

      <div className="uei-page">

        {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

        {actionMessage ? <div className="vs-banner">{actionMessage}</div> : null}

 

        <div className="uei-scope">

          <div className="uei-scope-fields">

            <select value={activeWorkspaceId || ""} onChange={(event) => setActiveWorkspaceId(event.target.value)} aria-label="Executive workspace">

              <option value="">All workspaces</option>

              {arr(workspaces).map((workspace) => (

                <option key={workspace.id} value={workspace.id}>{workspace.name} • {workspace.state || "National"}</option>

              ))}

            </select>

 

            <select value={filters.state || ""} onChange={(event) => setFilters({ state: event.target.value })} aria-label="State filter">

              <option value="">All states</option>

              {states.map((state) => <option key={state} value={state}>{state}</option>)}

            </select>

 

            <select value={filters.risk || ""} onChange={(event) => setFilters({ risk: event.target.value })} aria-label="Risk filter">

              <option value="">All risk levels</option>

              <option value="Critical">Critical</option>

              <option value="High">High</option>

              <option value="Elevated">Elevated</option>

              <option value="Stable">Stable</option>

            </select>

          </div>

 

          <div className="uei-actions">

            <button className="vs-button vs-button-secondary" type="button" onClick={clearFilters}>Clear Scope</button>

            <button className="vs-button" type="button" onClick={refresh} disabled={refreshing}>

              {refreshing ? "Refreshing Briefing..." : "Refresh Executive Briefing"}

            </button>

          </div>

        </div>

 

        {loading ? (

          <EmptyState text="Building the Unified Executive Intelligence briefing..." />

        ) : (

          <>

            <section className="uei-brief" aria-labelledby="uei-brief-title">

              <div>

                <div className="vs-page-eyebrow">Executive Assessment</div>

                <div className="uei-scope-summary">Scope: {scopeLabel}</div>

                <h2 id="uei-brief-title">{briefing.headline || health.status || "Executive intelligence is ready"}</h2>

                <p>{briefing.strategic_summary || "The unified intelligence layer is consolidating operational, political, and strategic evidence into one leadership briefing."}</p>

 

                <div className="uei-recommendation">

                  <span>Recommended leadership response</span>

                  <strong>{briefing.recommended_action || "Maintain executive oversight and review the highest-ranked findings."}</strong>

                </div>

              </div>

 

              <aside className="uei-brief-side" aria-label="Briefing facts">

                <div className="uei-fact"><span className="uei-side-label">Decision window</span><strong>{briefing.decision_window || "Next review cycle"}</strong></div>

                <div className="uei-fact"><span className="uei-side-label">Confidence</span><strong>{pct(briefing.confidence_percentage || health.intelligence_confidence)}</strong></div>

                <div className="uei-fact"><span className="uei-side-label">Executive posture</span><strong>{health.status || "Operational"}</strong></div>

                <div className="uei-fact"><span className="uei-side-label">Updated</span><strong>{formatTime(lastUpdated)}</strong></div>

              </aside>

            </section>

 

            <div className="uei-grid">

              <SectionCard title="Material Findings" subtitle="The five highest-ranked alerts and political signals requiring leadership awareness." right={<Link className="vs-button vs-button-secondary" to="/political-signals">Political Signals</Link>}>

                {findings.length ? (

                  <div className="uei-stack">

                    {findings.map((item) => (

                      <article className="uei-finding" key={item.findingId}>

                        <div className="uei-finding-top"><Badge tone={tone(item.level)}>{item.kind}</Badge><Badge tone={tone(item.level)}>{item.level}</Badge></div>

                        <h3>{item.title}</h3>

                        <p>{item.detail}</p>

                        <div className="uei-finding-meta"><span>{item.source || item.provider || "Unified intelligence"}</span>{item.score > 0 ? <span>Rank {Math.round(item.score)}</span> : null}<Link to={item.route}>Review evidence</Link></div>

                      </article>

                    ))}

                  </div>

                ) : <EmptyState text="No material findings match the current executive scope." />}

              </SectionCard>

 

              <div className="uei-stack">

                <SectionCard title="Executive Implications" subtitle="The three most important leadership responses supported by the current briefing.">

                  {executiveImplications.length ? (

                    <div className="uei-stack">

                      {executiveImplications.map((item, index) => {

                        const actionId = String(item.id || index);

                        return (

                          <article className="uei-implication" key={actionId}>

                            <Badge tone={tone(item.priority)}>{item.priority || "Recommended"}</Badge>

                            <h3>{cleanTitle(item.title || "Executive recommendation")}</h3>

                            <p>{firstText(item.detail, item.description, item.summary)}</p>

                            <div className="uei-implication-footer" style={{ marginTop: 12 }}>

                              <Link className="vs-button vs-button-secondary" to={executiveRoute(item, "/executive-decision-intelligence")}>Review</Link>

                              <button className="vs-button vs-button-secondary" type="button" onClick={() => handleCreateAction(item, index)} disabled={creatingActionId === actionId}>{creatingActionId === actionId ? "Creating..." : "Create Action"}</button>

                            </div>

                          </article>

                        );

                      })}

                    </div>

                  ) : <EmptyState text="No executive implications match the current scope." />}

                </SectionCard>

 

                <SectionCard title="Evidence Coverage" subtitle="A concise confidence check for this briefing—not a source-administration dashboard.">

                  <div className="uei-evidence">

                    <div className="uei-evidence-card"><span>Sources reporting</span><strong>{evidence.available}/{evidence.sources.length}</strong></div>

                    <div className="uei-evidence-card"><span>Degraded</span><strong>{evidence.degraded}</strong></div>

                    <div className="uei-evidence-card"><span>Workspaces in scope</span><strong>{number(summary.total_workspaces)}</strong></div>

                  </div>

                  <div className="uei-source-list">

                    {evidence.sources.slice(0, 8).map((item, index) => <Badge key={item.key || item.name || index} tone={tone(item.status)}>{item.label || item.name || item.key || "Source"}: {item.status || "unknown"}</Badge>)}

                  </div>

                  <p className="uei-context-note">Detailed provider diagnostics remain in the authorized data-health tools. Operational tasks, notifications, political signals, and strategy workflows remain authoritative on their dedicated pages.</p>

                </SectionCard>

              </div>

            </div>

          </>

        )}

      </div>

    </PageShell>

  );

}
